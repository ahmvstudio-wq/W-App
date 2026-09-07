'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Workspace, WorkspaceMember, WorkspaceRole } from '@/types'
import { toast } from 'sonner'

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  setCurrentWorkspace: (workspace: Workspace) => void
  userRole: WorkspaceRole | null
  members: WorkspaceMember[]
  loading: boolean
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
  const [loading, setLoading] = useState(true)

  // Switch workspace and persist to localStorage + cookie
  const setCurrentWorkspace = useCallback((ws: Workspace) => {
    setCurrentWorkspaceState(ws)
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_WS_STORAGE_KEY, ws.id)
      document.cookie = `${ACTIVE_WS_STORAGE_KEY}=${ws.id}; path=/; max-age=31536000; SameSite=Lax`
      window.dispatchEvent(new CustomEvent('workspace-changed', { detail: ws }))
    }
  }, [])

  // Fetch all members for current workspace
  const refreshMembers = useCallback(async () => {
    if (!currentWorkspace?.id) return
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/members`)
      const data = await res.json()
      if (data.success && data.members) {
        setMembers(data.members)

        // Determine current user's role
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id) {
          if (currentWorkspace.owner_id === session.user.id) {
            setUserRole('owner')
          } else {
            const currentMember = data.members.find((m: WorkspaceMember) => m.user_id === session.user.id)
            setUserRole(currentMember?.role || 'member')
          }
        }
      }
    } catch (err) {
      console.error('[WorkspaceContext] refreshMembers error:', err)
    }
  }, [currentWorkspace?.id, currentWorkspace?.owner_id])

  // Fetch workspaces list
  const refreshWorkspaces = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const res = await fetch('/api/workspaces', {
        headers: {
          'x-user-id': session.user.id,
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      const data = await res.json()

      let list: Workspace[] = []
      if (data.success && Array.isArray(data.workspaces) && data.workspaces.length > 0) {
        list = data.workspaces
      } else {
        // Direct Supabase query fallback
        const { data: fallbackWs } = await supabase
          .from('workspaces')
          .select('*')
          .order('created_at', { ascending: false })

        if (fallbackWs && fallbackWs.length > 0) {
          list = fallbackWs.map((ws) => ({
            ...ws,
            role: ws.owner_id === session.user.id ? 'owner' : 'member',
          }))
        }
      }

      // If still empty, create default workspace on the fly
      if (list.length === 0) {
        const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'My'
        const { data: newWs } = await supabase
          .from('workspaces')
          .insert({
            name: `${userName} Workspace`,
            owner_id: session.user.id,
          })
          .select()
          .single()

        if (newWs) {
          list = [{ ...newWs, role: 'owner' }]
        }
      }

      setWorkspaces(list)

      // Select active workspace: check saved preference first
      const savedId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_WS_STORAGE_KEY) : null
      const matched = list.find((w) => w.id === savedId)

      if (matched) {
        setCurrentWorkspace(matched)
      } else if (list.length > 0) {
        setCurrentWorkspace(list[0])
      }
    } catch (err) {
      console.error('[WorkspaceContext] refreshWorkspaces error:', err)
    } finally {
      setLoading(false)
    }
  }, [setCurrentWorkspace])

  // Initial load on mount
  useEffect(() => {
    refreshWorkspaces()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        refreshWorkspaces()
      } else if (event === 'SIGNED_OUT') {
        setWorkspaces([])
        setCurrentWorkspaceState(null)
        setMembers([])
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name,
          user_id: session.user.id,
        }),
      })

      const data = await res.json()
      if (data.success && data.workspace) {
        toast.success(`Workspace "${name}" created!`)
        await refreshWorkspaces()
        setCurrentWorkspace(data.workspace)
        return data.workspace
      } else {
        toast.error(data.error || 'Failed to create workspace')
        return null
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating workspace')
      return null
    }
  }

  // Invite member
  const inviteMember = async (email: string, role: WorkspaceRole = 'member'): Promise<boolean> => {
    if (!currentWorkspace?.id) return false
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })

      const data = await res.json()
      if (data.success) {
        if (data.invited) {
          toast.success(`Invite created for ${email}`)
        } else {
          toast.success(`${email} joined workspace!`)
        }
        await refreshMembers()
        return true
      } else {
        toast.error(data.error || 'Failed to add member')
        return false
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inviting member')
      return false
    }
  }

  // Update member role
  const updateMemberRole = async (userId: string, role: WorkspaceRole): Promise<boolean> => {
    if (!currentWorkspace?.id) return false
    try {
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
    }
  }

  // Remove member
  const removeMember = async (userId: string): Promise<boolean> => {
    if (!currentWorkspace?.id) return false
    try {
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
