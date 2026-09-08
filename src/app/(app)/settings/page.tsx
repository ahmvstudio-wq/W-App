'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { 
  User, Settings as SettingsIcon, LogOut, Bell, Calendar, 
  Video, Copy, Check, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, Bot, Target
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
    refreshWorkspaces,
  } = useWorkspace()

  const initialTab = (searchParams.get('tab') as any) || 'integrations'
  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'preferences'>(
    ['profile', 'integrations', 'preferences'].includes(initialTab) ? initialTab : 'integrations'
  )

  const [copiedFeed, setCopiedFeed] = useState(false)
  const [syncingGoogle, setSyncingGoogle] = useState(false)
  const [showAdvancedOAuth, setShowAdvancedOAuth] = useState(false)

  const [fathomKey, setFathomKey] = useState('')
  const [savingFathomKey, setSavingFathomKey] = useState(false)
  const [testingFathom, setTestingFathom] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [copiedOpenApi, setCopiedOpenApi] = useState(false)

  const getOpenApiUrl = () => {
    if (typeof window === 'undefined') return '/api/chatgpt/openapi.json'
    return `${window.location.origin}/api/chatgpt/openapi.json`
  }

  const copyOpenApiUrl = () => {
    navigator.clipboard.writeText(getOpenApiUrl())
    setCopiedOpenApi(true)
    toast.success('OpenAPI 3.1 Spec URL copied to clipboard!')
    setTimeout(() => setCopiedOpenApi(false), 2500)
  }

  useEffect(() => {
    if (currentWorkspace?.settings?.fathom_api_key) {
      setFathomKey(currentWorkspace.settings.fathom_api_key)
    } else {
      setFathomKey('')
    }
  }, [currentWorkspace?.settings?.fathom_api_key])

  const googleConnected = searchParams.get('google_connected') === 'true'
  const googleError = searchParams.get('google_error')
  const googleMissingSecret = searchParams.get('google_status') === 'missing_secret'

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['profile', 'integrations', 'preferences'].includes(tabParam)) {
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
          FOCUS • SOLO OS
        </div>
        <h1 className="text-3xl font-light tracking-tight text-black">Settings &amp; Integrations</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 font-body">
        {/* Settings Navigation */}
        <div className="md:col-span-4 space-y-1">
          {[
            { id: 'integrations', label: 'Integrations & AI', icon: Calendar },
            { id: 'profile', label: 'Personal Profile', icon: User },
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

              {/* AI Chief of Staff (ChatGPT & Claude Connectors) */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center shadow-xs">
                      <Bot size={20} className="text-black" />
                    </div>
                    <div>
                      <h3 className="text-sm font-normal text-black">AI Chief of Staff (ChatGPT &amp; Claude)</h3>
                      <p className="text-xs text-[#6b7280] font-light">
                        Connect ChatGPT Custom GPTs and Claude Projects to manage your entire workspace with live context.
                      </p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-normal border bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 size={12} />
                    <span>OpenAPI 3.1 Ready</span>
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black">
                      Live OpenAPI 3.1 Endpoint
                    </span>
                    <span className="text-[11px] text-[#8a8d95]">
                      Direct ChatGPT Action &amp; Claude Schema
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7280] font-light leading-relaxed">
                    Import this URL directly into your ChatGPT Custom Action or Claude Project instructions. ChatGPT and Claude can query active P0 tasks, inspect projects, convert meeting takeaways, and log Pomodoro deep work sessions without manual copy-pasting.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={getOpenApiUrl()}
                      className="flex-1 min-w-[220px] px-3.5 py-2 bg-[#f8f9fc] border border-black/[0.08] rounded-xl text-xs font-mono text-black outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={copyOpenApiUrl}
                      className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {copiedOpenApi ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedOpenApi ? 'Copied' : 'Copy Spec URL'}</span>
                    </button>
                    <a
                      href="/api/chatgpt/openapi.json"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-neutral-50 text-black border border-black/[0.08] rounded-xl text-xs font-normal transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      <ExternalLink size={13} />
                      <span>View Raw Spec</span>
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-neutral-50 border border-black/[0.04] text-[11px] text-[#6b7280] space-y-1">
                      <strong className="text-black font-medium block">ChatGPT Setup:</strong>
                      <span>Create GPT &rarr; Configure &rarr; Actions &rarr; &quot;Import from URL&quot; &rarr; Paste your OpenAPI Spec URL.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-50 border border-black/[0.04] text-[11px] text-[#6b7280] space-y-1">
                      <strong className="text-black font-medium block">Claude Setup:</strong>
                      <span>Claude Projects &rarr; Set instructions to query this endpoint for real-time task and project context.</span>
                    </div>
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

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => toast.success('Preferences saved')}
                    className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs"
                  >
                    Save Preferences
                  </button>
                </div>

                {/* Restart Tutorial / System Guide */}
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.08] space-y-2.5 mt-4">
                  <div className="flex items-center gap-2">
                    <Target size={15} className="text-amber-500" />
                    <span className="text-xs font-medium text-black">Interactive Game Tutorial</span>
                  </div>
                  <p className="text-[11px] text-[#6b7280] font-light leading-relaxed">
                    Replay the 60-second video game guide explaining Master Campaigns, Missions, and how Tasks are assigned and shipped.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.removeItem('focus_game_tutorial_completed')
                      } catch (e) {}
                      window.dispatchEvent(new CustomEvent('open-game-tutorial'))
                      toast.success('Tutorial launched!')
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs"
                  >
                    <Target size={13} className="text-amber-400" />
                    <span>Restart Tutorial</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
