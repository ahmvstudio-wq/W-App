'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { 
  User, Settings as SettingsIcon, LogOut, Bell, Calendar, 
  Video, Sparkles, Copy, Check, ExternalLink, RefreshCw, CheckCircle2, AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'integrations' | 'preferences'>('integrations')
  const [copiedFeed, setCopiedFeed] = useState(false)
  const [syncingGoogle, setSyncingGoogle] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const googleConnected = searchParams.get('google_connected') === 'true'
  const googleError = searchParams.get('google_error')
  const googleMissingSecret = searchParams.get('google_status') === 'missing_secret'

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
    return `${window.location.origin}/api/calendar/feed.ics`
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
            { id: 'workspace', label: 'Workspace', icon: SettingsIcon },
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
                <h2 className="text-lg font-normal text-black">Connected Services &amp; Calendars</h2>
                <p className="text-xs text-[#6b7280] font-light mt-0.5">
                  Manage two-way sync with Google Calendar, Fathom Video AI, and LLM providers.
                </p>
              </div>

              {/* Google Calendar Box */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center shadow-xs">
                      <Calendar size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-normal text-black">Google Calendar</h3>
                      <p className="text-xs text-[#6b7280] font-light">
                        Two-way sync and live subscription for all your tasks &amp; deadlines.
                      </p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-medium border border-emerald-200">
                    <CheckCircle2 size={12} />
                    <span>Client ID Active</span>
                  </span>
                </div>

                {googleMissingSecret && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Client Secret Needed for OAuth</span>
                      <span className="font-light">
                        Add your `GOOGLE_CLIENT_SECRET` in `.env.local` to complete the full 2-way OAuth flow. Alternatively, use the 1-Click Live Feed below!
                      </span>
                    </div>
                  </div>
                )}

                {/* Option A: 1-Click Calendar Feed URL */}
                <div className="p-4 rounded-xl bg-white border border-black/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-black font-medium uppercase">
                      1-Click Live Calendar Feed (Recommended)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Live iCal (.ics)
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7280] font-light leading-relaxed">
                    Subscribe from Google Calendar, Apple Calendar, or Outlook. Automatically pulls all scheduled tasks and deadlines.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={getCalendarFeedUrl()}
                      className="flex-1 px-3.5 py-2 bg-[#f8f9fc] border border-black/[0.08] rounded-xl text-xs font-mono text-black outline-none select-all"
                    />
                    <button
                      onClick={copyFeedUrl}
                      className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs"
                    >
                      {copiedFeed ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedFeed ? 'Copied' : 'Copy Feed URL'}</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-[#9ca3af] font-light pt-1">
                    💡 In Google Calendar: Click <strong>&quot;Other calendars (+)&quot;</strong> ➔ <strong>&quot;From URL&quot;</strong> ➔ Paste this URL.
                  </div>
                </div>

                {/* Option B: Direct OAuth & Push */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <a
                    href="/api/auth/google"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#f5f5f7] border border-black/[0.1] rounded-xl text-xs font-normal text-black transition-all shadow-xs cursor-pointer"
                  >
                    <ExternalLink size={13} className="text-indigo-600" />
                    <span>Authorize with Google Account</span>
                  </a>

                  <button
                    onClick={handleSyncToGoogle}
                    disabled={syncingGoogle}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={cn(syncingGoogle && 'animate-spin')} />
                    <span>{syncingGoogle ? 'Syncing...' : 'Sync Tasks to Google Calendar'}</span>
                  </button>
                </div>
              </div>

              {/* Fathom Video AI Integration */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center shadow-xs">
                    <Video size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-normal text-black">Fathom Video AI</h3>
                    <p className="text-xs text-[#6b7280] font-light">
                      Live meeting sync, action item synthesis, and transcript extraction.
                    </p>
                  </div>
                </div>

                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-medium border border-emerald-200">
                  <CheckCircle2 size={12} />
                  <span>Connected</span>
                </span>
              </div>

              {/* Groq AI Engine */}
              <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center shadow-xs">
                    <Sparkles size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-normal text-black">Groq AI Engine</h3>
                    <p className="text-xs text-[#6b7280] font-light">
                      Low-latency project synthesizer, task decomposition, and scope intelligence.
                    </p>
                  </div>
                </div>

                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-medium border border-emerald-200">
                  <CheckCircle2 size={12} />
                  <span>Active</span>
                </span>
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

          {/* Workspace Tab */}
          {activeTab === 'workspace' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-light text-black">Workspace Configuration</h2>
              <div>
                <label className="text-[11px] font-mono text-[#6b7280] block mb-1">WORKSPACE NAME</label>
                <input
                  type="text"
                  defaultValue="CallMy Mgmt Main"
                  className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                />
              </div>
              <div className="pt-4 border-t border-black/[0.06]">
                <button
                  onClick={() => toast.success('Workspace updated')}
                  className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-sm"
                >
                  Save Workspace
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-light text-black">System Preferences</h2>
              <div>
                <label className="text-[11px] font-mono text-[#6b7280] block mb-1">AI OUTPUT STYLE</label>
                <select className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light">
                  <option value="direct">Direct &amp; High Output (Recommended)</option>
                  <option value="detailed">Detailed &amp; Exploratory</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
