'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { 
  User, Settings as SettingsIcon, LogOut, Bell, Calendar, 
  Video, Copy, Check, ExternalLink, RefreshCw, CheckCircle2, AlertCircle,
  Building2, Users, UserPlus, Trash2, Shield, Key
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useWorkspace } from '@/context/WorkspaceContext'

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    currentWorkspace,
    members,
    userRole,
    inviteMember,
    updateMemberRole,
    removeMember,
    refreshWorkspaces,
  } = useWorkspace()

  const initialTab = (searchParams.get('tab') as any) || 'integrations'
  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'integrations' | 'preferences'>(
    ['profile', 'workspace', 'integrations', 'preferences'].includes(initialTab) ? initialTab : 'integrations'
  )

  const [copiedFeed, setCopiedFeed] = useState(false)
  const [copiedWsId, setCopiedWsId] = useState(false)
  const [syncingGoogle, setSyncingGoogle] = useState(false)
  const [wsName, setWsName] = useState('')
  const [savingWsName, setSavingWsName] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [inviting, setInviting] = useState(false)
  const [showAdvancedOAuth, setShowAdvancedOAuth] = useState(false)

  const [fathomKey, setFathomKey] = useState('')
  const [savingFathomKey, setSavingFathomKey] = useState(false)
  const [testingFathom, setTestingFathom] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  useEffect(() => {
    if (currentWorkspace?.name) {
      setWsName(currentWorkspace.name)
    }
    if (currentWorkspace?.settings?.fathom_api_key) {
      setFathomKey(currentWorkspace.settings.fathom_api_key)
    } else {
      setFathomKey('')
    }
  }, [currentWorkspace?.name, currentWorkspace?.settings?.fathom_api_key])

  const googleConnected = searchParams.get('google_connected') === 'true'
  const googleError = searchParams.get('google_error')
  const googleMissingSecret = searchParams.get('google_status') === 'missing_secret'

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['profile', 'workspace', 'integrations', 'preferences'].includes(tabParam)) {
      setActiveTab(tabParam as any)
    }
  }, [searchParams])

  useEffect(() => {
    if (googleConnected) {
      toast.success('Google Calendar connected successfully!')
    }
    if (googleError) {
      toast.error(`Google Calendar connection: ${googleError}`)
    }
  }, [googleConnected, googleError])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getCalendarFeedUrl = () => {
    if (typeof window === 'undefined') return '/api/calendar/feed.ics'
    const wsParam = currentWorkspace?.id ? `?workspace_id=${currentWorkspace.id}` : ''
    return `${window.location.origin}/api/calendar/feed.ics${wsParam}`
  }

  const copyFeedUrl = () => {
    const url = getCalendarFeedUrl()
    navigator.clipboard.writeText(url)
    setCopiedFeed(true)
    toast.success('Calendar feed URL copied to clipboard!')
    setTimeout(() => setCopiedFeed(false), 2500)
  }

  const handleSyncToGoogle = async () => {
    setSyncingGoogle(true)
    try {
      const res = await fetch('/api/calendar/google/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(`Synced ${data.syncedCount} tasks to Google Calendar!`)
      } else {
        toast.error(data.error || 'Failed to sync. Please reconnect Google Calendar.')
      }
    } catch (err: any) {
      toast.error(`Sync error: ${err.message}`)
    } finally {
      setSyncingGoogle(false)
    }
  }

  const handleSaveWorkspaceName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWorkspace?.id || !wsName.trim() || savingWsName) return
    setSavingWsName(true)
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: wsName.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Workspace name updated!')
        await refreshWorkspaces()
      } else {
        toast.error(data.error || 'Failed to update workspace name')
      }
    } catch {
      toast.error('Error updating workspace')
    } finally {
      setSavingWsName(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || inviting) return
    setInviting(true)
    try {
      const ok = await inviteMember(inviteEmail.trim(), inviteRole)
      if (ok) {
        setInviteEmail('')
      }
    } finally {
      setInviting(false)
    }
  }

  const copyWsId = () => {
    if (!currentWorkspace?.id) return
    navigator.clipboard.writeText(currentWorkspace.id)
    setCopiedWsId(true)
    toast.success('Workspace ID copied!')
    setTimeout(() => setCopiedWsId(false), 2000)
  }

  const handleSaveFathomKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWorkspace?.id || savingFathomKey) return
    setSavingFathomKey(true)
    try {
      const updatedSettings = {
        ...(currentWorkspace.settings || {}),
        fathom_api_key: fathomKey.trim() || undefined,
      }
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(fathomKey.trim() ? 'Custom Fathom API Key saved for this workspace!' : 'Reset to default Fathom integration.')
        await refreshWorkspaces()
      } else {
        toast.error(data.error || 'Failed to save Fathom key')
      }
    } catch {
      toast.error('Error saving Fathom settings')
    } finally {
      setSavingFathomKey(false)
    }
  }

  const handleTestFathom = async () => {
    if (!fathomKey.trim() || testingFathom) return
    setTestingFathom(true)
    try {
      const res = await fetch('/api/fathom/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: fathomKey.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Fathom connection verified!')
      } else {
        toast.error(data.error || 'Connection failed. Please check the key.')
      }
    } catch {
      toast.error('Could not connect to Fathom')
    } finally {
      setTestingFathom(false)
    }
  }

  const getWebhookUrl = () => {
    if (typeof window === 'undefined') return '/api/fathom/webhook'
    return `${window.location.origin}/api/fathom/webhook`
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(getWebhookUrl())
    setCopiedWebhook(true)
    toast.success('Webhook URL copied to clipboard!')
    setTimeout(() => setCopiedWebhook(false), 2500)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans">
      <header>
        <div className="text-xs font-mono text-[#6b7280] uppercase tracking-wider mb-1 font-light">
          CALLMY • SYSTEM
        </div>
        <h1 className="text-3xl font-light tracking-tight text-black">Settings &amp; Integrations</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 font-body">
        {/* Settings Navigation */}
        <div className="md:col-span-4 space-y-1">
          {[
            { id: 'integrations', label: 'Integrations & Calendar', icon: Calendar },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'workspace', label: 'Workspace & Team', icon: Building2 },
            { id: 'preferences', label: 'Preferences', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer font-light text-left',
                activeTab === tab.id
                  ? 'bg-black text-white font-normal shadow-sm'
                  : 'text-[#6b7280] hover:text-black hover:bg-black/[0.03]'
              )}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-black/[0.06]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left font-light"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-8 bg-white border border-black/[0.08] rounded-3xl p-8 shadow-sm min-h-[450px]">
          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-normal text-black">Calendar &amp; Meeting Sync</h2>
                <p className="text-xs text-[#6b7280] font-light mt-0.5">
                  Connect your calendar and meeting tools to keep tasks and notes updated automatically.
                </p>
              </div>

              {/* Calendar Sync Box */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center shadow-xs">
                      <Calendar size={20} className="text-black" />
                    </div>
                    <div>
                      <h3 className="text-sm font-normal text-black">Calendar Subscription</h3>
                      <p className="text-xs text-[#6b7280] font-light">
                        Subscribe from Google Calendar, Apple Calendar, or Outlook to see your task deadlines.
                      </p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-normal border border-emerald-200">
                    <CheckCircle2 size={12} />
                    <span>Active</span>
                  </span>
                </div>

                {/* 1-Click Calendar Subscription */}
                <div className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black">
                      Your Calendar Feed URL
                    </span>
                    <span className="text-[11px] text-[#8a8d95]">
                      Works with any calendar app
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7280] font-light leading-relaxed">
                    Tasks with due dates and deadlines will automatically show up on your schedule.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={getCalendarFeedUrl()}
                      className="flex-1 min-w-[220px] px-3.5 py-2 bg-[#f8f9fc] border border-black/[0.08] rounded-xl text-xs font-mono text-black outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={copyFeedUrl}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-neutral-50 text-black border border-black/[0.08] rounded-xl text-xs font-normal transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      {copiedFeed ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedFeed ? 'Copied' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(getCalendarFeedUrl())}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <Calendar size={13} />
                      <span>Add to Google Calendar ↗</span>
                    </a>
                  </div>
                </div>

                {/* Optional Direct Sync */}
                <div className="p-3.5 rounded-xl border border-black/[0.05] bg-black/[0.01] space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedOAuth(!showAdvancedOAuth)}
                      className="text-xs text-[#6b7280] hover:text-black flex items-center gap-2 cursor-pointer font-light"
                    >
                      <span>{showAdvancedOAuth ? '▾ Hide' : '▸ Optional:'} Direct Google Account Sync</span>
                    </button>
                  </div>

                  {showAdvancedOAuth && (
                    <div className="space-y-3 pt-2 border-t border-black/[0.05] animate-in fade-in duration-150">
                      <p className="text-xs text-[#6b7280] font-light leading-relaxed">
                        Authorize directly with your Google account to enable two-way event push. (The calendar feed above is already active and works with no setup required).
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <a
                          href="/api/auth/google"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#f5f5f7] border border-black/[0.1] rounded-xl text-xs font-normal text-black transition-all shadow-xs cursor-pointer"
                        >
                          <ExternalLink size={13} />
                          <span>Connect Google Account</span>
                        </a>

                        <button
                          type="button"
                          onClick={handleSyncToGoogle}
                          disabled={syncingGoogle}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw size={13} className={cn(syncingGoogle && 'animate-spin')} />
                          <span>{syncingGoogle ? 'Syncing...' : 'Sync Tasks to Google Calendar'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fathom Meeting Sync */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center shadow-xs">
                      <Video size={20} className="text-black" />
                    </div>
                    <div>
                      <h3 className="text-sm font-normal text-black">Fathom Meeting Notes</h3>
                      <p className="text-xs text-[#6b7280] font-light">
                        Automatically import call recordings, transcripts, and action items.
                      </p>
                    </div>
                  </div>

                  <span className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-normal border",
                    currentWorkspace?.settings?.fathom_api_key
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  )}>
                    <CheckCircle2 size={12} />
                    <span>{currentWorkspace?.settings?.fathom_api_key ? 'Workspace Key' : 'Connected'}</span>
                  </span>
                </div>

                {/* API Key Configuration Form */}
                <form onSubmit={handleSaveFathomKey} className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-black">
                      Fathom API Key (Optional)
                    </label>
                    <a
                      href="https://fathom.video/settings/api"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#6b7280] hover:text-black hover:underline flex items-center gap-1"
                    >
                      <span>Find your key</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  <p className="text-xs text-[#6b7280] font-light leading-relaxed">
                    Add a dedicated API key if you want calls isolated strictly to this workspace.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="Paste your Fathom API key"
                      value={fathomKey}
                      onChange={(e) => setFathomKey(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-[#f8f9fc] border border-black/[0.08] rounded-xl text-xs font-mono text-black outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={handleTestFathom}
                      disabled={testingFathom || !fathomKey.trim()}
                      className="px-3.5 py-2 border border-black/[0.08] bg-white hover:bg-neutral-50 disabled:opacity-40 text-black rounded-xl text-xs font-normal transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                    >
                      {testingFathom ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      type="submit"
                      disabled={savingFathomKey}
                      className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white rounded-xl text-xs font-normal transition-all cursor-pointer whitespace-nowrap shadow-xs"
                    >
                      {savingFathomKey ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>

                {/* Webhook Configuration */}
                <div className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black">
                      Automatic Call Import (Webhook)
                    </span>
                    <span className="text-[10px] text-[#6b7280] bg-black/[0.04] px-2 py-0.5 rounded">
                      Instant Sync
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7280] font-light leading-relaxed">
                    Paste this URL in your Fathom settings under <strong>Webhooks</strong> to import calls automatically as soon as they end.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={getWebhookUrl()}
                      className="flex-1 px-3.5 py-2 bg-[#f8f9fc] border border-black/[0.08] rounded-xl text-xs font-mono text-black outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={copyWebhookUrl}
                      className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {copiedWebhook ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedWebhook ? 'Copied' : 'Copy Webhook'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-light text-black">Personal Profile</h2>
              <div>
                <label className="text-[11px] font-mono text-[#6b7280] block mb-1">ACCOUNT NAME</label>
                <input
                  type="text"
                  defaultValue="Mohammed Rehan"
                  className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-[#6b7280] block mb-1">EMAIL ADDRESS</label>
                <input
                  type="email"
                  defaultValue="founder@company.com"
                  disabled
                  className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-black/[0.06] rounded-xl text-xs text-[#9ca3af] outline-none font-light cursor-not-allowed"
                />
              </div>
              <button
                onClick={() => toast.success('Profile preferences updated')}
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-sm"
              >
                Save Changes
              </button>
            </div>
          )}

          {/* Workspace & Team Tab */}
          {activeTab === 'workspace' && (
            <div className="space-y-8">
              {/* Workspace Header */}
              <div>
                <h2 className="text-lg font-normal text-black">Workspace &amp; Team Management</h2>
                <p className="text-xs text-[#6b7280] font-light mt-0.5">
                  Manage workspace identity, team member roles, and multi-tenant security.
                </p>
              </div>

              {/* 1. Workspace Identity */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-mono text-xs shadow-xs">
                      {currentWorkspace?.name ? currentWorkspace.name.substring(0, 2).toUpperCase() : 'WS'}
                    </div>
                    <div>
                      <h3 className="text-sm font-normal text-black">{currentWorkspace?.name || 'My Workspace'}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono uppercase bg-black text-white px-2 py-0.5 rounded-full">
                          Your Role: {userRole?.toUpperCase() || 'MEMBER'}
                        </span>
                        <span className="text-[10px] font-mono text-[#8a8d95]">
                          Created {currentWorkspace?.created_at ? new Date(currentWorkspace.created_at).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyWsId}
                      className="px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.02] text-xs font-mono text-[#6b7280] hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy Workspace ID"
                    >
                      {copiedWsId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedWsId ? 'Copied' : 'Copy ID'}</span>
                    </button>
                  </div>
                </div>

                {/* Rename Workspace Form */}
                <form onSubmit={handleSaveWorkspaceName} className="space-y-3 pt-3 border-t border-black/[0.05]">
                  <label className="text-[11px] font-mono text-[#6b7280] block uppercase tracking-wider">
                    Rename Workspace
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="text"
                      value={wsName}
                      onChange={(e) => setWsName(e.target.value)}
                      placeholder="Workspace name..."
                      className="flex-1 px-4 py-2.5 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                    />
                    <button
                      type="submit"
                      disabled={savingWsName || !wsName.trim() || wsName === currentWorkspace?.name}
                      className="px-4 py-2.5 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {savingWsName ? 'Saving...' : 'Update Name'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 2. Team Members List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-normal text-black flex items-center gap-2">
                      <Users size={15} />
                      <span>Workspace Members ({members.length})</span>
                    </h3>
                    <p className="text-xs text-[#6b7280] font-light mt-0.5">
                      Collaborators with access to projects, tasks, and documents in this workspace.
                    </p>
                  </div>
                </div>

                <div className="border border-black/[0.06] rounded-2xl overflow-hidden divide-y divide-black/[0.04] bg-white">
                  {members.map((m) => {
                    const profile = m.profile
                    const displayName = profile?.name || 'Team Member'
                    const isOwner = m.role === 'owner' || m.user_id === currentWorkspace?.owner_id
                    const canManage = (userRole === 'owner' || userRole === 'admin') && !isOwner

                    return (
                      <div key={m.id || m.user_id} className="p-3.5 sm:p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-black/[0.06] flex items-center justify-center text-xs font-mono text-black shrink-0 font-medium">
                            {displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-normal text-black truncate flex items-center gap-2">
                              <span>{displayName}</span>
                              {isOwner && (
                                <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  Owner
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-[#8a8d95] truncate">
                              Joined {new Date(m.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {canManage ? (
                            <select
                              value={m.role}
                              onChange={(e) => updateMemberRole(m.user_id, e.target.value as any)}
                              className="px-2.5 py-1 bg-[#fafafa] border border-black/[0.08] rounded-lg text-xs font-mono text-black outline-none cursor-pointer"
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <span className="text-xs font-mono text-[#6b7280] uppercase px-2 py-0.5 bg-black/[0.03] rounded">
                              {m.role}
                            </span>
                          )}

                          {canManage && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${displayName} from workspace?`)) {
                                  removeMember(m.user_id)
                                }
                              }}
                              className="p-1.5 text-[#9ca3af] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Remove Member"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 3. Invite Member Form */}
              <div className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-3">
                <div className="flex items-center gap-2 text-xs font-normal text-black">
                  <UserPlus size={15} />
                  <span>Invite Collaborator</span>
                </div>
                <form onSubmit={handleInviteMember} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-7">
                    <input
                      type="email"
                      required
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs font-mono text-black outline-none cursor-pointer"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={inviting || !inviteEmail.trim()}
                      className="w-full py-2 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs"
                    >
                      {inviting ? 'Inviting...' : 'Invite'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 max-w-md">
              <div>
                <h2 className="text-lg font-normal text-black">App Preferences</h2>
                <p className="text-xs text-[#6b7280] font-light mt-0.5">
                  Customize how your workspace looks and behaves.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-black block mb-1.5">Default Start Page</label>
                  <select className="w-full px-3.5 py-2 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light cursor-pointer">
                    <option value="dashboard">Dashboard (Overview)</option>
                    <option value="tasks">Task Board</option>
                    <option value="projects">Projects</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-black block mb-1.5">First Day of the Week</label>
                  <select className="w-full px-3.5 py-2 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light cursor-pointer">
                    <option value="monday">Monday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-black block mb-1.5">Email Notifications</label>
                  <select className="w-full px-3.5 py-2 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light cursor-pointer">
                    <option value="all">Task assignments &amp; deadline reminders</option>
                    <option value="mentions">Only direct mentions</option>
                    <option value="none">Mute all notifications</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => toast.success('Preferences saved')}
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
