'use client'

import { useState, useEffect } from 'react'
import { 
  User, Settings as SettingsIcon, LogOut, Bell, Calendar, 
  Video, Copy, Check, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, Bot, Target,
  Share2, Globe, HardDrive, X, Film
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
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
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [copiedOpenApi, setCopiedOpenApi] = useState(false)
  const [syncingGoogle, setSyncingGoogle] = useState(false)
  const [showAdvancedOAuth, setShowAdvancedOAuth] = useState(false)

  const [fathomKey, setFathomKey] = useState('')
  const [isFathomConnected, setIsFathomConnected] = useState(false)
  const [savingFathomKey, setSavingFathomKey] = useState(false)
  const [testingFathom, setTestingFathom] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; name?: string } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const rawName = session.user.user_metadata?.name || 
          session.user.email?.split('@')[0]?.replace(/[._]/g, ' ') || 
          'Creator'
        const name = rawName.charAt(0).toUpperCase() + rawName.slice(1)
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name,
        })
      }
    })
  }, [])

  const resolvedWorkspaceName = (() => {
    if (currentWorkspace?.name && currentWorkspace.name !== 'My Workspace' && currentWorkspace.name !== 'Workspace') {
      return currentWorkspace.name
    }
    if (currentUser?.name) {
      return `${currentUser.name}'s Workspace`
    }
    return "Studio Workspace"
  })()

  const [copiedClaudeMcp, setCopiedClaudeMcp] = useState(false)

  const getClaudeMcpUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cultlike.ahmvsystems.com'
    const key = currentWorkspace?.id || currentUser?.id || 'focus_sk_live_9a7d3f82e1c4b6e5'
    return `${origin}/api/mcp?key=${key}`
  }

  const copyClaudeMcpUrl = () => {
    navigator.clipboard.writeText(getClaudeMcpUrl())
    setCopiedClaudeMcp(true)
    toast.success('Personal Claude Connector URL copied!')
    setTimeout(() => setCopiedClaudeMcp(false), 2500)
  }

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
    async function loadUserFathomKey() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userKey = session?.user?.user_metadata?.fathom_api_key || 
          (typeof window !== 'undefined' ? localStorage.getItem('focus_user_fathom_api_key') : null)
        
        if (userKey) {
          setFathomKey(userKey)
          setIsFathomConnected(true)
        } else if (currentWorkspace?.settings?.fathom_api_key) {
          setFathomKey(currentWorkspace.settings.fathom_api_key)
          setIsFathomConnected(true)
        } else {
          setFathomKey('')
          setIsFathomConnected(false)
        }
      } catch {
        setFathomKey('')
        setIsFathomConnected(false)
      }
    }
    loadUserFathomKey()
  }, [currentWorkspace?.settings?.fathom_api_key])

  const googleConnected = searchParams.get('google_connected') === 'true'
  const youtubeConnected = searchParams.get('youtube_connected') === 'true'
  const metaConnected = searchParams.get('meta_connected') === 'true'
  const googleError = searchParams.get('google_error')
  const metaError = searchParams.get('meta_error')
  const igUserParam = searchParams.get('ig_user')
  const googleMissingSecret = searchParams.get('google_status') === 'missing_secret'
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false)
  const [isMetaConnected, setIsMetaConnected] = useState(false)
  const [instagramUser, setInstagramUser] = useState<string>('')
  const [checkingGoogle, setCheckingGoogle] = useState(true)

  useEffect(() => {
    async function checkGoogleStatus() {
      try {
        const driveRes = await fetch('/api/content/drive/files?limit=1')
        const driveData = await driveRes.json()
        if (driveData.connected) {
          setIsGoogleConnected(true)
        } else {
          const calRes = await fetch('/api/calendar/google/events')
          const calData = await calRes.json()
          if (calData.connected) {
            setIsGoogleConnected(true)
          }
        }
      } catch {
        // ignore
      } finally {
        setCheckingGoogle(false)
      }
    }
    checkGoogleStatus()

    async function checkYouTubeStatus() {
      try {
        const ytRes = await fetch('/api/social/youtube/feed')
        const ytData = await ytRes.json()
        if (ytData.connected) {
          setIsYouTubeConnected(true)
          if (typeof window !== 'undefined') {
            localStorage.setItem('focus_youtube_connected', 'true')
          }
        }
      } catch {
        // ignore
      }
    }
    checkYouTubeStatus()

    if (typeof window !== 'undefined') {
      if (localStorage.getItem('focus_youtube_connected') === 'true') {
        setIsYouTubeConnected(true)
      }
      if (localStorage.getItem('cultlike_meta_connected') === 'true') {
        setIsMetaConnected(true)
        setInstagramUser(localStorage.getItem('cultlike_ig_user') || '')
      }
    }
  }, [googleConnected, youtubeConnected])

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['profile', 'integrations', 'preferences'].includes(tabParam)) {
      setActiveTab(tabParam as any)
    }
  }, [searchParams])

  useEffect(() => {
    if (googleConnected) {
      setIsGoogleConnected(true)
      toast.success('Google Calendar & Workspace connected successfully! (Calendar, Docs, Drive)')
    }
    if (youtubeConnected) {
      setIsYouTubeConnected(true)
      if (typeof window !== 'undefined') {
        localStorage.setItem('focus_youtube_connected', 'true')
      }
      toast.success('YouTube Channel & Analytics connected successfully!')
    }
    if (metaConnected) {
      setIsMetaConnected(true)
      if (igUserParam) {
        setInstagramUser(igUserParam)
        if (typeof window !== 'undefined') {
          localStorage.setItem('cultlike_ig_user', igUserParam)
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('cultlike_meta_connected', 'true')
      }
      toast.success(igUserParam ? `Instagram account @${igUserParam} connected successfully!` : 'Meta & Instagram connected successfully!')
    }
    if (googleError) {
      toast.error(`Google connection: ${googleError}`)
    }
    if (metaError) {
      toast.error(`Meta connection: ${metaError}`)
    }
  }, [googleConnected, youtubeConnected, metaConnected, googleError, metaError, igUserParam])

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
    if (savingFathomKey) return
    setSavingFathomKey(true)
    try {
      const trimmedKey = fathomKey.trim()

      // 1. Update user_metadata for this authenticated user (strictly private to this user)
      const { error: authError } = await supabase.auth.updateUser({
        data: { fathom_api_key: trimmedKey || null }
      })
      if (authError) throw authError

      // 2. Persist locally for immediate client access
      if (trimmedKey) {
        localStorage.setItem('focus_user_fathom_api_key', trimmedKey)
        setIsFathomConnected(true)
        toast.success('Your personal Fathom account has been connected!')
      } else {
        localStorage.removeItem('focus_user_fathom_api_key')
        setIsFathomConnected(false)
        toast.success('Fathom account disconnected.')
      }

      // Also sync to workspace settings if user is owner/admin
      if (currentWorkspace?.id) {
        try {
          const updatedSettings = {
            ...(currentWorkspace.settings || {}),
            fathom_api_key: trimmedKey || undefined,
          }
          await fetch(`/api/workspaces/${currentWorkspace.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: updatedSettings }),
          })
          await refreshWorkspaces()
        } catch {}
      }

      window.dispatchEvent(new CustomEvent('fathom-key-updated', { detail: trimmedKey }))
    } catch (err: any) {
      toast.error(`Error saving Fathom settings: ${err.message}`)
    } finally {
      setSavingFathomKey(false)
    }
  }

  const handleDisconnectFathom = async () => {
    if (savingFathomKey) return
    setSavingFathomKey(true)
    try {
      await supabase.auth.updateUser({
        data: { fathom_api_key: null }
      })
      localStorage.removeItem('focus_user_fathom_api_key')
      setFathomKey('')
      setIsFathomConnected(false)

      if (currentWorkspace?.id) {
        try {
          const updatedSettings = {
            ...(currentWorkspace.settings || {}),
            fathom_api_key: undefined,
          }
          await fetch(`/api/workspaces/${currentWorkspace.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: updatedSettings }),
          })
          await refreshWorkspaces()
        } catch {}
      }

      window.dispatchEvent(new CustomEvent('fathom-key-updated', { detail: '' }))
      toast.success('Your personal Fathom account was disconnected.')
    } catch (err: any) {
      toast.error(`Disconnect error: ${err.message}`)
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
    <div className="max-w-6xl mx-auto py-2 sm:py-6 font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-black/[0.08] p-6 sm:p-10 relative overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 tracking-[0.14em] uppercase block">
              Preferences &amp; Accounts
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black mt-1">
              Settings
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            title="Return to Dashboard"
          >
            <X size={18} />
          </Link>
        </div>

        {/* Categories Horizontal Navigation Bar */}
        <div className="border-b border-neutral-100 pt-6 pb-4 mb-8">
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
            {[
              { id: 'integrations', label: 'Integrations & Accounts' },
              { id: 'profile', label: 'Profile' },
              { id: 'preferences', label: 'Preferences' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'text-xl sm:text-2xl font-bold tracking-tight transition-all relative pb-3 cursor-pointer select-none shrink-0',
                  activeTab === tab.id
                    ? 'text-black'
                    : 'text-neutral-300 hover:text-neutral-500'
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[460px] pb-6">
          {/* Integrations Tab: Symmetrical 2-Column Grid */}
          {activeTab === 'integrations' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Google Drive & Video Repository */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Motion Blur Ambient Halo & Minimal Frosted Container */}
                      <div className="relative group shrink-0">
                        <div className="absolute -inset-1.5 rounded-2xl bg-neutral-900/[0.07] blur-md group-hover:blur-lg group-hover:bg-neutral-900/[0.12] transition-all duration-300 pointer-events-none" />
                        <div className="relative w-12 h-12 rounded-2xl bg-white border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-center text-neutral-900 transition-all duration-200 group-hover:border-black/[0.16] group-hover:scale-[1.02]">
                          {/* Official Google Drive Mark */}
                          <svg className="w-5 h-5 text-neutral-900 fill-current" viewBox="0 0 24 24">
                            <path d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.861 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a423.93 423.948 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.734 1.85-3.23 1.906-3.323l.104-.167h-7.249z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-black">Google Drive &amp; Workspace</h3>
                          {isGoogleConnected ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-900 text-[10px] font-mono border border-black/[0.08]">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" /> Connected
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-50 text-neutral-400 text-[10px] font-mono border border-neutral-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0" /> Not Connected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6b7280] font-light mt-1">
                          Direct video ingestion for Content Studio, two-way task calendar sync, and meeting docs drafting.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#6b7280] font-light">
                    {isGoogleConnected 
                      ? 'Google Drive is authorized. Finished video deliverables can be browsed and staged into your inbox.'
                      : 'Authorize Cultlike OS with 1 click to read finished video exports from your Google Drive folder.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-black/[0.06] flex flex-wrap items-center justify-between gap-2.5">
                  <a
                    href="/api/auth/google?service=workspace&return_to=/settings"
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer",
                      isGoogleConnected
                        ? "bg-white hover:bg-neutral-50 text-black border border-black/[0.1]"
                        : "bg-black hover:bg-neutral-800 text-white"
                    )}
                  >
                    <ExternalLink size={13} />
                    <span>{isGoogleConnected ? 'Reconnect Google Drive' : 'Connect Google Drive'}</span>
                  </a>

                  {isGoogleConnected && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSyncToGoogle}
                        disabled={syncingGoogle}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-50 text-black border border-black/[0.08] rounded-xl text-xs font-normal transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={cn(syncingGoogle && 'animate-spin')} />
                        <span>{syncingGoogle ? 'Syncing...' : 'Sync Tasks'}</span>
                      </button>
                      <Link
                        href="/content"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-black border border-black/[0.08] rounded-xl text-xs font-medium transition-all cursor-pointer"
                      >
                        <Film size={13} />
                        <span>Vault &rarr;</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: YouTube Channel & Shorts */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Motion Blur Ambient Halo & Minimal Frosted Container */}
                      <div className="relative group shrink-0">
                        <div className="absolute -inset-1.5 rounded-2xl bg-neutral-900/[0.07] blur-md group-hover:blur-lg group-hover:bg-neutral-900/[0.12] transition-all duration-300 pointer-events-none" />
                        <div className="relative w-12 h-12 rounded-2xl bg-white border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-center text-neutral-900 transition-all duration-200 group-hover:border-black/[0.16] group-hover:scale-[1.02]">
                          {/* Official YouTube Mark */}
                          <svg className="w-5 h-5 fill-current text-neutral-900" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-black">YouTube Channel &amp; Shorts</h3>
                          {isYouTubeConnected ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-900 text-[10px] font-mono border border-black/[0.08]">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" /> Live
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-50 text-neutral-400 text-[10px] font-mono border border-neutral-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0" /> Disconnected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6b7280] font-light mt-1">
                          Publish video deliverables and YouTube Shorts directly, plus monitor real-time subscribers and view count.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#6b7280] font-light">
                    {isYouTubeConnected
                      ? 'Connected with your YouTube creator channel. Ready for 1-click Shorts export and performance metrics.'
                      : 'Connect your YouTube creator channel to stream performance data and dispatch scheduled Shorts.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-black/[0.06] flex items-center justify-between gap-3">
                  <a
                    href="/api/auth/google?service=youtube&return_to=/settings"
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer",
                      isYouTubeConnected
                        ? "bg-white hover:bg-neutral-50 border border-black/[0.1] text-black"
                        : "bg-black hover:bg-neutral-800 text-white"
                    )}
                  >
                    <ExternalLink size={13} />
                    <span>{isYouTubeConnected ? 'Reconnect YouTube' : 'Connect YouTube Channel'}</span>
                  </a>
                </div>
              </div>

              {/* Card 3: Instagram Professional & Meta */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Motion Blur Ambient Halo & Minimal Frosted Container */}
                      <div className="relative group shrink-0">
                        <div className="absolute -inset-1.5 rounded-2xl bg-neutral-900/[0.07] blur-md group-hover:blur-lg group-hover:bg-neutral-900/[0.12] transition-all duration-300 pointer-events-none" />
                        <div className="relative w-12 h-12 rounded-2xl bg-white border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-center text-neutral-900 transition-all duration-200 group-hover:border-black/[0.16] group-hover:scale-[1.02]">
                          {/* Official Instagram Camera Glyph Mark */}
                          <svg className="w-5 h-5 text-neutral-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                          </svg>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-black">Instagram &amp; Meta Professional</h3>
                          {isMetaConnected ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-900 text-[10px] font-mono border border-black/[0.08]">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" /> {instagramUser ? `@${instagramUser}` : 'Live'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-50 text-neutral-400 text-[10px] font-mono border border-neutral-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0" /> Disconnected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6b7280] font-light mt-1">
                          Publish Instagram Reels, Carousels, and view analytics directly from the Content Vault.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#8a8d95] font-light">
                    Requirements: Your Instagram account must be a Creator or Business account linked to a Facebook Page you manage.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-black/[0.06] flex flex-wrap items-center justify-between gap-3">
                  <a
                    href="/api/auth/meta?returnTo=/settings"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>{isMetaConnected ? 'Reconnect Instagram' : 'Connect with Facebook & Instagram'}</span>
                  </a>

                  {isMetaConnected && (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('cultlike_meta_connected')
                          localStorage.removeItem('cultlike_ig_user')
                          document.cookie = 'meta_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
                          document.cookie = 'meta_page_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
                          document.cookie = 'instagram_account_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
                          document.cookie = 'instagram_username=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
                        }
                        setIsMetaConnected(false)
                        setInstagramUser('')
                        toast.success('Instagram account disconnected.')
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-normal transition-all shadow-xs cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>

              {/* Card 4: Universal Calendar Subscription */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Motion Blur Ambient Halo & Minimal Frosted Container */}
                      <div className="relative group shrink-0">
                        <div className="absolute -inset-1.5 rounded-2xl bg-neutral-900/[0.07] blur-md group-hover:blur-lg group-hover:bg-neutral-900/[0.12] transition-all duration-300 pointer-events-none" />
                        <div className="relative w-12 h-12 rounded-2xl bg-white border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-center text-neutral-900 transition-all duration-200 group-hover:border-black/[0.16] group-hover:scale-[1.02]">
                          {/* Official Calendar Mark */}
                          <svg className="w-5 h-5 text-neutral-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth="2.2" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-black">Universal Calendar Subscription</h3>
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-900 text-[10px] font-mono border border-black/[0.08]">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" /> Active
                          </span>
                        </div>
                        <p className="text-xs text-[#6b7280] font-light mt-1">
                          Subscribe from Google Calendar, Apple Calendar, or Outlook to see your task deadlines.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#6b7280] font-light">
                    Syncs deliverables and calendar milestones automatically with your personal devices.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[#8a8d95]">
                    <span className="font-medium text-black">Calendar Feed URL</span>
                    <span>Works with any calendar</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getCalendarFeedUrl()}
                      className="flex-1 min-w-[180px] px-3 py-1.5 bg-[#f8f9fc] border border-black/[0.08] rounded-xl text-[11px] font-mono text-black outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={copyFeedUrl}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 text-black border border-black/[0.08] rounded-xl text-xs font-normal transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      {copiedFeed ? <Check size={12} className="text-neutral-900" /> : <Copy size={12} />}
                      <span>{copiedFeed ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(getCalendarFeedUrl())}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <Calendar size={12} />
                      <span>Add to Google</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Card 5: Fathom Meeting Notes */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Motion Blur Ambient Halo & Minimal Frosted Container */}
                      <div className="relative group shrink-0">
                        <div className="absolute -inset-1.5 rounded-2xl bg-neutral-900/[0.07] blur-md group-hover:blur-lg group-hover:bg-neutral-900/[0.12] transition-all duration-300 pointer-events-none" />
                        <div className="relative w-12 h-12 rounded-2xl bg-white border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-center text-neutral-900 transition-all duration-200 group-hover:border-black/[0.16] group-hover:scale-[1.02]">
                          {/* Official Fathom Audio & Meeting Mark */}
                          <svg className="w-5 h-5 text-neutral-900" viewBox="141 0 25 25" fill="none">
                            <path d="M141.836 16.4481V21.3875C141.836 22.6831 142.645 23.8563 143.861 24.2456C145.927 24.9052 147.825 23.3578 147.825 21.3606V19.501L141.836 16.4481Z" fill="currentColor" fillOpacity="0.45"/>
                            <path d="M162.465 15.4261C162.015 15.4261 161.559 15.3237 161.128 15.1055L143.553 6.19528C142.097 5.45682 141.42 3.67948 142.099 2.17906C142.807 0.60815 144.65 -0.0430392 146.16 0.722275L163.733 9.63081C165.207 10.3777 165.882 12.249 165.144 13.7444C164.619 14.8101 163.562 15.4261 162.462 15.4261H162.465Z" fill="currentColor"/>
                            <path d="M153.644 19.9273C153.194 19.9273 152.737 19.8249 152.307 19.6068L143.553 15.1693C142.097 14.4308 141.42 12.6535 142.099 11.153C142.807 9.58214 144.65 8.93095 146.162 9.69626L154.913 14.1321C156.387 14.8789 157.062 16.7502 156.324 18.2456C155.799 19.3114 154.742 19.9273 153.644 19.9273H153.644Z" fill="currentColor" fillOpacity="0.75"/>
                          </svg>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-black">Fathom Meeting Notes</h3>
                          <span className={cn(
                            "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border",
                            isFathomConnected
                              ? "bg-neutral-100 text-neutral-900 border-black/[0.08]"
                              : "bg-neutral-50 text-neutral-400 border-neutral-200"
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", isFathomConnected ? "bg-neutral-900" : "bg-neutral-300")} />
                            <span>{isFathomConnected ? 'Connected' : 'Not Connected'}</span>
                          </span>
                        </div>
                        <p className="text-xs text-[#6b7280] font-light mt-1">
                          Sync meeting recordings, transcripts, and action items directly into client notes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveFathomKey} className="p-3.5 rounded-xl bg-white border border-black/[0.06] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-black">Personal API Key</label>
                      <a
                        href="https://fathom.video/settings/api"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#6b7280] hover:text-black hover:underline flex items-center gap-1"
                      >
                        <span>Find in Fathom</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="password"
                        placeholder="Paste Fathom API key"
                        value={fathomKey}
                        onChange={(e) => setFathomKey(e.target.value)}
                        className="flex-1 min-w-[150px] px-3 py-1.5 bg-[#f8f9fc] border border-black/[0.08] rounded-xl text-xs font-mono text-black outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={handleTestFathom}
                        disabled={testingFathom || !fathomKey.trim()}
                        className="px-3 py-1.5 border border-black/[0.08] bg-white hover:bg-neutral-50 disabled:opacity-40 text-black rounded-xl text-xs font-normal transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        {testingFathom ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        type="submit"
                        disabled={savingFathomKey}
                        className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white rounded-xl text-xs font-normal transition-all cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        {savingFathomKey ? 'Saving...' : isFathomConnected ? 'Update' : 'Connect'}
                      </button>
                      {isFathomConnected && (
                        <button
                          type="button"
                          onClick={handleDisconnectFathom}
                          disabled={savingFathomKey}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-normal transition-all cursor-pointer whitespace-nowrap"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Webhook Configuration */}
                <div className="p-3.5 rounded-xl bg-white border border-black/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black">Automatic Call Webhook</span>
                    <span className="text-[10px] text-neutral-800 bg-neutral-100 border border-black/[0.08] px-2 py-0.5 rounded-full font-mono">
                      Instant Sync
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getWebhookUrl()}
                      className="flex-1 px-3 py-1.5 bg-[#f8f9fc] border border-black/[0.08] rounded-xl text-[11px] font-mono text-black outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={copyWebhookUrl}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {copiedWebhook ? <Check size={12} className="text-neutral-900" /> : <Copy size={12} />}
                      <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 6: AI Chief of Staff (ChatGPT & Claude) */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Motion Blur Ambient Halo & Minimal Frosted Container */}
                      <div className="relative group shrink-0">
                        <div className="absolute -inset-1.5 rounded-2xl bg-neutral-900/[0.07] blur-md group-hover:blur-lg group-hover:bg-neutral-900/[0.12] transition-all duration-300 pointer-events-none" />
                        <div className="relative w-12 h-12 rounded-2xl bg-white border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-center text-neutral-900 transition-all duration-200 group-hover:border-black/[0.16] group-hover:scale-[1.02]">
                          {/* Official OpenAI / ChatGPT Spiral Mark */}
                          <svg className="w-5 h-5 text-neutral-900 fill-current" viewBox="0 0 24 24">
                            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5973 8.3829l2.02-1.1635a.0804.0804 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.402-.6863zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1635a.0804.0804 0 0 1-.038-.0567V6.0748a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.4598a.7948.7948 0 0 0-.3927.6813v6.7219h-.0048zm1.0977-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.6069 1.4997-2.602-1.4997v-2.9994z"/>
                          </svg>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-black">AI Chief of Staff</h3>
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border bg-neutral-100 text-neutral-900 border-black/[0.08]">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" /> OpenAPI 3.1
                          </span>
                        </div>
                        <p className="text-xs text-[#6b7280] font-light mt-1">
                          Connect ChatGPT Custom GPTs and Claude Projects to inspect projects, tasks, and notes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#6b7280] font-light">
                    ChatGPT and Claude can query active P0 tasks, inspect projects, convert meeting takeaways, and log deep work sessions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-black/[0.06] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-black">Live OpenAPI Endpoint</span>
                    <a
                      href="/api/chatgpt/openapi.json"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#6b7280] hover:text-black flex items-center gap-1 underline"
                    >
                      <span>View Spec</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getOpenApiUrl()}
                      className="flex-1 px-3 py-1.5 bg-[#f8f9fc] border border-black/[0.08] rounded-xl text-[11px] font-mono text-black outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={copyOpenApiUrl}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {copiedOpenApi ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedOpenApi ? 'Copied' : 'Copy Spec'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-[#6b7280]">
                    <div className="p-2 rounded-lg bg-neutral-50 border border-black/[0.04]">
                      <strong className="text-black block mb-0.5">ChatGPT:</strong>
                      <span>GPT Actions &rarr; Import from URL</span>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-50 border border-black/[0.04]">
                      <strong className="text-black block mb-0.5">Claude Projects:</strong>
                      <span>Add to Project &rarr; Custom Endpoint</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 7: Claude Custom Connector (Remote MCP) */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative group shrink-0">
                        <div className="absolute -inset-1.5 rounded-2xl bg-[#d97757]/[0.12] blur-md group-hover:blur-lg transition-all duration-300 pointer-events-none" />
                        <div className="relative w-12 h-12 rounded-2xl bg-white border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-center text-[#d97757] transition-all duration-200 group-hover:border-black/[0.16] group-hover:scale-[1.02]">
                          {/* Anthropic Claude Icon */}
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z"/>
                          </svg>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-black">Claude Custom Connector</h3>
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border bg-neutral-100 text-neutral-900 border-black/[0.08]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d97757] shrink-0" /> Remote MCP
                          </span>
                        </div>
                        <p className="text-xs text-[#6b7280] font-light mt-1">
                          Connect Claude Web and Claude Desktop to orchestrate tasks, roadmap, and content deliverables.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#6b7280] font-light">
                    Your unique personal connector link with isolated workspace access. No client IDs or secrets needed.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-black/[0.06] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-black">Personal Connector URL</span>
                    <span className="text-[11px] text-[#8a8d95]">Streamable HTTP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getClaudeMcpUrl()}
                      className="flex-1 px-3 py-1.5 bg-[#f8f9fc] border border-black/[0.08] rounded-xl text-[11px] font-mono text-black outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={copyClaudeMcpUrl}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      {copiedClaudeMcp ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedClaudeMcp ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-50 border border-black/[0.04] text-[11px] text-[#6b7280] space-y-1">
                    <p className="font-medium text-black">How to connect in Claude:</p>
                    <p>1. Open Claude &rarr; <strong>Settings &rarr; Connectors &rarr; Add custom connector</strong></p>
                    <p>2. Paste your Personal Connector URL</p>
                    <p>3. Select <strong>No sign-in (Detected)</strong> &rarr; Click <strong>Add connector</strong>. Done!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-xl mx-auto py-4">
              <div className="p-6 sm:p-8 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-black">Personal Profile</h2>
                  <p className="text-xs text-[#6b7280] font-light mt-0.5">
                    Your personal identity across workspaces and studio sessions.
                  </p>
                </div>
                <div className="space-y-4" key={currentUser?.id || 'profile'}>
                  <div>
                    <label className="text-[11px] font-mono text-[#6b7280] block mb-1">ACCOUNT NAME</label>
                    <input
                      type="text"
                      defaultValue={currentUser?.name || 'Mohammed Rehan'}
                      className="w-full px-4 py-2.5 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-[#6b7280] block mb-1">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      defaultValue={currentUser?.email || ''}
                      disabled
                      className="w-full px-4 py-2.5 bg-neutral-100 border border-black/[0.06] rounded-xl text-xs text-[#9ca3af] outline-none font-light cursor-not-allowed"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Profile preferences updated')}
                  className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="max-w-xl mx-auto py-4">
              <div className="p-6 sm:p-8 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-black">App Preferences</h2>
                  <p className="text-xs text-[#6b7280] font-light mt-0.5">
                    Customize how your workspace looks and behaves.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-black block mb-1.5">Default Start Page</label>
                    <select className="w-full px-3.5 py-2 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light cursor-pointer">
                      <option value="dashboard">Dashboard (Overview)</option>
                      <option value="tasks">Task Board</option>
                      <option value="projects">Projects</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-black block mb-1.5">First Day of the Week</label>
                    <select className="w-full px-3.5 py-2 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light cursor-pointer">
                      <option value="monday">Monday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-black block mb-1.5">Email Notifications</label>
                    <select className="w-full px-3.5 py-2 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light cursor-pointer">
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

                  {/* System Operating Manual */}
                  <div className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-2 mt-4">
                    <div>
                      <span className="text-xs font-medium text-black block">System Operating Manual</span>
                      <p className="text-[11px] text-[#6b7280] font-light leading-relaxed mt-0.5">
                        Open the architectural guide covering Master Projects, deliverable scopes, and execution workflows.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.removeItem('focus_game_tutorial_completed')
                        } catch (e) {}
                        window.dispatchEvent(new CustomEvent('open-game-tutorial'))
                        toast.success('Operating Manual opened')
                      }}
                      className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-2xs"
                    >
                      Open Operating Manual
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Crisp Divider Line & User Bar matching Menu Modal */}
        <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black text-white font-medium text-xs flex items-center justify-center shrink-0">
              {getInitials(currentUser?.name || resolvedWorkspaceName)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-neutral-900 truncate">{resolvedWorkspaceName}</div>
              <div className="text-[11px] text-neutral-400 font-mono truncate">{currentUser?.email || (currentWorkspace?.id ? `ID: ${currentWorkspace.id.slice(0, 8)}` : 'active')}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded-full transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
