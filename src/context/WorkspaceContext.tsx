'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Workspace, WorkspaceMember, WorkspaceRole } from '@/types'
import { toast } from 'sonner'
import { getCached, setCached } from '@/lib/cache/swrCache'
import { triggerSyncStart, triggerSyncDone } from '@/components/NavigationProgressBar'

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  setCurrentWorkspace: (workspace: Workspace) => void
  userRole: WorkspaceRole | null
  members: WorkspaceMember[]
  loading: boolean
  isRevalidating: boolean
  refreshWorkspaces: () => Promise<void>
  refreshMembers: () => Promise<void>
  createWorkspace: (name: string) => Promise<Workspace | null>
  inviteMember: (email: string, role?: WorkspaceRole) => Promise<boolean>
  updateMemberRole: (userId: string, role: WorkspaceRole) => Promise<boolean>
  removeMember: (userId: string) => Promise<boolean>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

const ACTIVE_WS_STORAGE_KEY = 'focus_active_workspace_id'

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [userRole, setUserRole] = useState<WorkspaceRole | null>('owner')
  const [loading, setLoading] = useState<boolean>(true)
  const [isRevalidating, setIsRevalidating] = useState(false)
  const isFetchingRef = useRef(false)

  // Switch workspace and persist to localStorage + cookie
  const setCurrentWorkspace = useCallback((ws: Workspace) => {
    setCurrentWorkspaceState(ws)
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_WS_STORAGE_KEY, ws.id)
      document.cookie = `${ACTIVE_WS_STORAGE_KEY}=${ws.id}; path=/; max-age=31536000; SameSite=Lax`
      window.dispatchEvent(new CustomEvent('workspace-changed', { detail: ws }))
    }
  }, [])

  // Fetch all members for current workspace with local memory cache
  const refreshMembers = useCallback(async () => {
    if (!currentWorkspace?.id) return
    const cacheKey = `members_${currentWorkspace.id}`

    try {
      // 1. Direct Supabase query (bypasses cold start API route)
      const { data: memberRows, error } = await supabase
        .from('workspace_members')
        .select('id, workspace_id, user_id, role, created_at, profile:profiles(id, name, avatar_url)')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: true })

      let memberList: WorkspaceMember[] = []
      if (!error && Array.isArray(memberRows) && memberRows.length > 0) {
        memberList = memberRows as any
      } else {
        // Fallback: Owner as single member
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .eq('id', currentWorkspace.owner_id)
          .single()

        memberList = [{
          id: `owner-${currentWorkspace.id}`,
          workspace_id: currentWorkspace.id,
          user_id: currentWorkspace.owner_id,
          role: 'owner',
          created_at: new Date().toISOString(),
          profile: prof || null,
        } as any]
      }

      setMembers(memberList)
      setCached(cacheKey, memberList)

      // Determine current user's role
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        if (currentWorkspace.owner_id === session.user.id) {
          setUserRole('owner')
        } else {
          const currentMember = memberList.find((m) => m.user_id === session.user.id)
          setUserRole(currentMember?.role || 'member')
        }
      }
    } catch (err) {
      console.error('[WorkspaceContext] refreshMembers error:', err)
    }
  }, [currentWorkspace?.id, currentWorkspace?.owner_id])

  // Fast direct client query for workspaces with SWR persistence
  const refreshWorkspaces = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsRevalidating(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        setIsRevalidating(false)
        isFetchingRef.current = false
        return
      }

      // Parallel direct queries via Supabase client (sub-50ms)
      const [ownedRes, memberRes] = await Promise.all([
        supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('workspace_members')
          .select('role, workspace:workspaces(*)')
          .eq('user_id', session.user.id)
      ])

      const rawUserName = session.user.user_metadata?.name || session.user.email?.split('@')[0]?.replace(/[._]/g, ' ') || 'User'
      const formattedUserName = rawUserName.charAt(0).toUpperCase() + rawUserName.slice(1)

      const formatWsName = (name: string | undefined | null) => {
        if (!name || name === 'My Workspace' || name === 'Workspace') {
          return `${formattedUserName}'s Workspace`
        }
        return name
      }

      const ownedList = (ownedRes.data || []).map((ws) => ({
        ...ws,
        name: formatWsName(ws.name),
        role: 'owner' as WorkspaceRole,
      }))

      const memberList = (memberRes.data || [])
        .filter((r: any) => r.workspace)
        .map((r: any) => ({
          ...r.workspace,
          name: formatWsName(r.workspace.name),
          role: r.role || 'member',
        }))

      const wsMap = new Map<string, Workspace>()
      ownedList.forEach((w) => wsMap.set(w.id, w))
      memberList.forEach((w: any) => {
        if (!wsMap.has(w.id)) wsMap.set(w.id, w)
      })

      let list = Array.from(wsMap.values())

      // Auto-provision default workspace if completely empty
      if (list.length === 0) {
        const { data: newWs } = await supabase
          .from('workspaces')
          .insert({
            name: `${formattedUserName}'s Workspace`,
            owner_id: session.user.id,
            settings: {},
          })
          .select()
          .single()

        if (newWs) {
          list = [{ ...newWs, role: 'owner' }]
        }
      }

      setWorkspaces(list)
      setCached('workspaces', list)

      // Resolve active workspace
      const savedId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_WS_STORAGE_KEY) : null
      const matched = list.find((w) => w.id === savedId)

      if (matched) {
        setCurrentWorkspace(matched)
      } else if (list.length > 0) {
        setCurrentWorkspace(list[0])
      } else {
        setCurrentWorkspaceState(null)
      }
    } catch (err) {
      console.error('[WorkspaceContext] refreshWorkspaces error:', err)
    } finally {
      setLoading(false)
      setIsRevalidating(false)
      isFetchingRef.current = false
    }
  }, [setCurrentWorkspace])

  // Initial load on mount
  useEffect(() => {
    // Immediate synchronous cache hydration after mount
    const cachedWs = getCached<Workspace[]>('workspaces')
    if (cachedWs && cachedWs.length > 0) {
      setWorkspaces(cachedWs)
      const savedId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_WS_STORAGE_KEY) : null
      const matched = cachedWs.find((w) => w.id === savedId) || cachedWs[0]
      setCurrentWorkspaceState(matched)
      setLoading(false)

      if (matched?.id) {
        const cachedMembers = getCached<WorkspaceMember[]>(`members_${matched.id}`)
        if (cachedMembers) setMembers(cachedMembers)
      }
    }

    refreshWorkspaces()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        refreshWorkspaces()
      } else if (event === 'SIGNED_OUT') {
        setWorkspaces([])
        setCurrentWorkspaceState(null)
        setMembers([])
        setCached('workspaces', [])
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshWorkspaces])

  // Refresh members whenever current workspace changes
  useEffect(() => {
    if (currentWorkspace?.id) {
      refreshMembers()
    }
  }, [currentWorkspace?.id, refreshMembers])

  // Create new workspace
  const createWorkspace = async (name: string): Promise<Workspace | null> => {
    try {
      triggerSyncStart()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const { data: newWs, error } = await supabase
        .from('workspaces')
        .insert({
          name,
          owner_id: session.user.id,
          settings: {},
        })
        .select()
        .single()

      if (error || !newWs) {
        toast.error(error?.message || 'Failed to create workspace')
        return null
      }

      try {
        await supabase.from('workspace_members').insert({
          workspace_id: newWs.id,
          user_id: session.user.id,
          role: 'owner',
        })
      } catch {}

      toast.success(`Workspace "${name}" created!`)
      await refreshWorkspaces()
      setCurrentWorkspace({ ...newWs, role: 'owner' })
      return newWs
    } catch (err: any) {
      toast.error(err.message || 'Error creating workspace')
      return null
    } finally {
      triggerSyncDone()
    }
  }

  // Invite member
  const inviteMember = async (email: string, role: WorkspaceRole = 'member'): Promise<boolean> => {
    if (!currentWorkspace?.id) return false
    try {
      triggerSyncStart()
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.invited ? `Invite created for ${email}` : `${email} joined workspace!`)
        await refreshMembers()
        return true
      } else {
        toast.error(data.error || 'Failed to add member')
        return false
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inviting member')
      return false
    } finally {
      triggerSyncDone()
    }
  }

  // Update member role
  const updateMemberRole = async (userId: string, role: WorkspaceRole): Promise<boolean> => {
    if (!currentWorkspace?.id) return false
    try {
      triggerSyncStart()
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Role updated to ${role}`)
        await refreshMembers()
        return true
      } else {
        toast.error(data.error || 'Failed to update role')
        return false
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating role')
      return false
    } finally {
      triggerSyncDone()
    }
  }

  // Remove member
  const removeMember = async (userId: string): Promise<boolean> => {
    if (!currentWorkspace?.id) return false
    try {
      triggerSyncStart()
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/members?user_id=${userId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Member removed from workspace')
        await refreshMembers()
        return true
      } else {
        toast.error(data.error || 'Failed to remove member')
        return false
      }
    } catch (err: any) {
      toast.error(err.message || 'Error removing member')
      return false
    } finally {
      triggerSyncDone()
    }
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        userRole,
        members,
        loading,
        isRevalidating,
        refreshWorkspaces,
        refreshMembers,
        createWorkspace,
        inviteMember,
        updateMemberRole,
        removeMember,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
