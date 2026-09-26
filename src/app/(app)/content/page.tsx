'use client'

import { useState, useEffect } from 'react'
import type { ContentItem, ContentPlatform, ContentType, ContentStatus } from '@/types'
import {
  Film,
  Video,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Send,
  Eye,
  ThumbsUp,
  Repeat,
  X,
  Loader2,
  Layers,
  HardDrive,
  ArrowRight,
  SlidersHorizontal,
  CalendarDays,
  Inbox,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { getCached, setCached } from '@/lib/cache/swrCache'
import { CardSkeleton } from '@/components/ui/SkeletonPulse'
import { cn } from '@/lib/utils'
import { DriveImportModal } from './DriveImportModal'
import { CreateContentModal } from './CreateContentModal'
import { AssetInspectorModal } from './AssetInspectorModal'
import { ContentCalendarView } from './ContentCalendarView'
import { CreatorAnalyticsView } from '../create/CreatorAnalyticsView'

export default function ContentVaultPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // View Mode: 'inbox' | 'vault' | 'calendar' | 'analytics'
  const [activeTab, setActiveTab] = useState<'inbox' | 'vault' | 'calendar' | 'analytics'>('inbox')

  // Filters for Vault View
  const [platformFilter, setPlatformFilter] = useState<'all' | ContentPlatform>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [inspectingItem, setInspectingItem] = useState<ContentItem | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  // Connected accounts
  const [ytChannel, setYtChannel] = useState<{
    id: string
    title: string
    customUrl?: string | null
    thumbnail: string
    subscriberCount: string
    videoCount: string
    viewCount: string
  } | null>(null)
  const [igAccount, setIgAccount] = useState<{
    id: string
    username: string
    account_type: string
    media_count?: number
  } | null>(null)
  const [syncingYt, setSyncingYt] = useState(false)
  const [isAutoPlanning, setIsAutoPlanning] = useState(false)
  const [isDriveConnected, setIsDriveConnected] = useState<boolean | null>(null)

  // Fetch Items from Database and Social Feeds
  async function fetchItems(silent = false) {
    if (!silent && (!items || items.length === 0)) setLoading(true)
    try {
      let wsId =
        typeof window !== 'undefined'
          ? localStorage.getItem('focus_active_workspace_id')
          : null

      const queryParams = new URLSearchParams()
      if (wsId) queryParams.set('workspace_id', wsId)

      // Fetch staged database items, live YouTube uploads, live Instagram feed, and Drive status in parallel
      const [dbRes, ytRes, igRes, driveRes] = await Promise.allSettled([
        fetch(`/api/content?${queryParams.toString()}`).then((r) => r.json()),
        fetch('/api/social/youtube/feed').then((r) => r.json()),
        fetch('/api/social/instagram/feed').then((r) => r.json()),
        fetch('/api/content/drive/files?limit=1').then((r) => r.json()),
      ])

      if (driveRes.status === 'fulfilled' && driveRes.value) {
        setIsDriveConnected(driveRes.value.connected === true)
      } else {
        setIsDriveConnected(false)
      }

      let dbItems: ContentItem[] = []
      if (dbRes.status === 'fulfilled' && dbRes.value?.success && Array.isArray(dbRes.value?.items)) {
        dbItems = dbRes.value.items
      }

      let liveVideos: ContentItem[] = []
      if (ytRes.status === 'fulfilled' && ytRes.value?.success && ytRes.value?.connected) {
        if (ytRes.value.channel) setYtChannel(ytRes.value.channel)
        if (Array.isArray(ytRes.value.videos)) liveVideos = ytRes.value.videos
      }

      let liveInstagram: ContentItem[] = []
      if (igRes.status === 'fulfilled' && igRes.value?.success && igRes.value?.connected) {
        if (igRes.value.account) setIgAccount(igRes.value.account)
        if (Array.isArray(igRes.value.reels)) liveInstagram = igRes.value.reels
      }

      // Merge: real YouTube videos + real Instagram Reels + staged drafts/inbox items
      let combined = [...dbItems]
      for (const item of [...liveVideos, ...liveInstagram]) {
        if (!combined.some((i) => i.external_post_id === item.external_post_id || i.id === item.id)) {
          combined.push(item)
        }
      }

      // Sort: inbox items first, then by publish/schedule/creation desc
      combined.sort((a, b) => {
        const dateA = new Date(a.published_at || a.scheduled_at || a.created_at).getTime()
        const dateB = new Date(b.published_at || b.scheduled_at || b.created_at).getTime()
        return dateB - dateA
      })

      setItems(combined)
      setCached('content_items', combined)

      // Automatically switch to inbox if there are inbox items
      const hasInbox = combined.some((i) => i.status === 'inbox')
      if (hasInbox && !silent) {
        setActiveTab('inbox')
      }
    } catch (err) {
      console.error('Error fetching content items:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleManualYtSync = async () => {
    setSyncingYt(true)
    try {
      await fetchItems(true)
      toast.success('Synced live YouTube channel uploads & analytics!')
    } finally {
      setSyncingYt(false)
    }
  }

  useEffect(() => {
    const cached = getCached<ContentItem[]>('content_items')
    if (cached && cached.length > 0) {
      setItems(cached)
      setLoading(false)
    }

    fetchItems(Boolean(cached && cached.length > 0))

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('google_connected') === 'true') {
        toast.success('Google Drive connected successfully! Opening Video Explorer...')
        setIsDriveModalOpen(true)
        window.history.replaceState({}, '', window.location.pathname)
      } else if (urlParams.get('open_drive') === 'true') {
        setIsDriveModalOpen(true)
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])



  // Auto-Plan 14-Day Sprint with AI
  const handleAutoPlanSprint = async () => {
    setIsAutoPlanning(true)
    toast.info('Auto-distributing inbox deliverables across a 14-day publishing sprint...')
    try {
      const wsId =
        typeof window !== 'undefined'
          ? localStorage.getItem('focus_active_workspace_id')
          : null

      const res = await fetch('/api/chatgpt/content/plan-sprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY || 'cult_executive_key'}`,
        },
        body: JSON.stringify({
          workspace_id: wsId,
          sprint_days: 14,
          items_per_day: 1,
          platforms: ['instagram', 'youtube'],
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.message || '14-Day Sprint scheduled!')
        await fetchItems(true)
        setActiveTab('calendar')
      } else {
        toast.error(data.error || 'Failed to plan sprint')
      }
    } catch (err: any) {
      console.error('Plan sprint error:', err)
      toast.error('Sprint planning error')
    } finally {
      setIsAutoPlanning(false)
    }
  }

  // Handle Updates
  const handleUpdateItem = async (updates: Partial<ContentItem>) => {
    if (!updates.id) return
    try {
      const res = await fetch(`/api/content/${updates.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        setItems((prev) => {
          const updated = prev.map((i) => (i.id === updates.id ? { ...i, ...updates } : i))
          setCached('content_items', updated)
          return updated
        })
        setInspectingItem((prev) => (prev && prev.id === updates.id ? { ...prev, ...updates } : prev))
      }
    } catch (err) {
      console.error('Update item error:', err)
    }
  }

  // Trigger Immediate Publishing via Social Engine
  const handlePublishNow = async (item: ContentItem) => {
    setPublishingId(item.id)
    toast.info(`Dispatching ${item.title} to ${item.platform.toUpperCase()}...`)

    try {
      const endpoint =
        item.platform === 'youtube'
          ? '/api/social/youtube/publish'
          : '/api/social/instagram/publish'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_item_id: item.id }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Shipped to ${item.platform.toUpperCase()}!`)
        fetchItems(true)
      } else {
        toast.error(data.error || `Publishing to ${item.platform} failed.`)
      }
    } catch {
      toast.error('Publishing request failed.')
    } finally {
      setPublishingId(null)
    }
  }

  // Delete Content Item
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/content/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id))
        toast.success('Content item removed.')
      }
    } catch {
      toast.error('Failed to delete content item.')
    }
  }

  // Segment Items
  const inboxItems = items.filter((i) => i.status === 'inbox')
  const scheduledItems = items.filter((i) => i.status === 'scheduled')
  const publishedItems = items.filter((i) => i.status === 'published')

  const filteredVaultItems = items.filter((item) => {
    if (platformFilter !== 'all' && item.platform !== platformFilter) return false
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchTitle = item.title?.toLowerCase().includes(q)
      const matchCaption = item.caption?.toLowerCase().includes(q)
      const matchHook = item.hook?.toLowerCase().includes(q)
      if (!matchTitle && !matchCaption && !matchHook) return false
    }
    return true
  })

  const totalViews = items.reduce((acc, i) => acc + (i.metrics?.views || 0), 0)

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16 font-body relative">
      {/* Ambient Lighting Glows */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-gradient-to-br from-indigo-500/[0.07] via-purple-500/[0.04] to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 left-0 w-80 h-80 bg-gradient-to-tr from-sky-500/[0.05] via-emerald-500/[0.03] to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.06] pb-6">
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 tracking-[0.14em] uppercase block">
            Creator Studio
          </span>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
              Content Vault
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-900 border border-black/[0.08] text-[10px] font-mono flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
              <span>{items.length} items</span>
            </span>
          </div>
          <p className="text-sm text-neutral-500 font-normal mt-1">
            Google Drive video files, multi-platform releases, and scheduled posts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-black/[0.08] rounded-xl text-xs font-normal flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Batch Import Video Files from Google Drive"
          >
            <HardDrive size={13} className="text-neutral-500" />
            <span className="hidden sm:inline">Import from Drive</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} className="text-white" />
            <span>New Content</span>
          </button>
        </div>
      </div>

      {/* Connected Channels & Accounts Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Google Drive Video Storage */}
        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-black/[0.04]">
              <HardDrive size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-black">Google Drive</h4>
                {isDriveConnected ? (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-900 border border-black/[0.08] text-[9px] font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
                    Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-50 text-neutral-400 border border-black/[0.06] text-[9px] font-mono">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 font-normal truncate mt-0.5">
                {isDriveConnected ? 'Finished Video Scanner Ready' : 'Authorize to scan finished clips'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isDriveConnected ? (
              <button
                onClick={() => setIsDriveModalOpen(true)}
                className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-black/[0.08] rounded-xl text-xs font-normal transition-colors shadow-xs cursor-pointer"
              >
                Browse
              </button>
            ) : (
              <a
                href="/api/auth/google?service=workspace&return_to=/content"
                className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs whitespace-nowrap"
              >
                Connect
              </a>
            )}
          </div>
        </div>

        {/* Live Instagram Account Banner */}
        {igAccount ? (
          <div className="p-4 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-black/[0.04]">
                IG
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-black truncate">@{igAccount.username}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-900 border border-black/[0.08] text-[9px] font-mono flex items-center gap-1 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 font-normal truncate mt-0.5">
                  Reels Dispatch &bull; {igAccount.account_type}
                </p>
              </div>
            </div>
            <a
              href={`https://instagram.com/${igAccount.username}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-neutral-400 hover:text-black rounded-xl hover:bg-neutral-50 transition-colors flex-shrink-0"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-between shadow-xs">
            <div>
              <h4 className="text-xs font-semibold text-black">Instagram Professional</h4>
              <p className="text-[11px] text-neutral-500 font-normal mt-0.5">Direct Reels publishing</p>
            </div>
            <Link
              href="/settings?tab=integrations"
              className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
            >
              Connect
            </Link>
          </div>
        )}

        {/* Live YouTube Channel Banner */}
        {ytChannel ? (
          <div className="p-4 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              {ytChannel.thumbnail ? (
                <img
                  src={ytChannel.thumbnail}
                  alt={ytChannel.title}
                  className="w-9 h-9 rounded-xl border border-black/[0.08] object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-black/[0.04]">
                  YT
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-black truncate">{ytChannel.title}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-900 border border-black/[0.08] text-[9px] font-mono flex items-center gap-1 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 font-normal truncate mt-0.5">
                  {parseInt(ytChannel.subscriberCount || '0').toLocaleString()} subscribers
                </p>
              </div>
            </div>
            <button
              onClick={handleManualYtSync}
              disabled={syncingYt}
              className="p-2 text-neutral-400 hover:text-black rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer flex-shrink-0"
              title="Refresh YouTube uploads"
            >
              <Repeat size={13} className={cn(syncingYt && 'animate-spin')} />
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-between shadow-xs">
            <div>
              <h4 className="text-xs font-semibold text-black">YouTube Channel</h4>
              <p className="text-[11px] text-neutral-500 font-normal mt-0.5">Shorts &amp; video telemetry</p>
            </div>
            <Link
              href="/settings?tab=integrations"
              className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
            >
              Connect
            </Link>
          </div>
        )}
      </div>

      {/* Main Studio View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
        <div className="flex items-center gap-2">
          {/* Unscheduled Inbox Tab */}
          <button
            onClick={() => setActiveTab('inbox')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'inbox'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-500 hover:text-black hover:bg-black/[0.03]'
            )}
          >
            <Inbox size={14} className={activeTab === 'inbox' ? 'text-white' : ''} />
            <span>Unscheduled Inbox</span>
            {inboxItems.length > 0 && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono",
                activeTab === 'inbox' ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-700"
              )}>
                {inboxItems.length}
              </span>
            )}
          </button>

          {/* Publishing Calendar Tab */}
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'calendar'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-500 hover:text-black hover:bg-black/[0.03]'
            )}
          >
            <CalendarDays size={14} className={activeTab === 'calendar' ? 'text-white' : ''} />
            <span>Publishing Timeline</span>
            {scheduledItems.length > 0 && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono",
                activeTab === 'calendar' ? "bg-neutral-800 text-white" : "bg-neutral-100 text-neutral-700"
              )}>
                {scheduledItems.length}
              </span>
            )}
          </button>

          {/* Vault Assets Tab */}
          <button
            onClick={() => setActiveTab('vault')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'vault'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-500 hover:text-black hover:bg-black/[0.03]'
            )}
          >
            <Layers size={14} />
            <span>All Deliverables</span>
            <span className="text-[10px] font-mono opacity-80">({items.length})</span>
          </button>

          {/* Creator Analytics Tab */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'analytics'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-500 hover:text-black hover:bg-black/[0.03]'
            )}
          >
            <BarChart3 size={14} className={activeTab === 'analytics' ? 'text-white' : ''} />
            <span>Creator Analytics</span>
          </button>
        </div>

        {/* Global Stats Counter */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-neutral-500">
          <span>
            Scheduled: <strong className="text-black font-semibold">{scheduledItems.length}</strong>
          </span>
          <span>
            Live Published: <strong className="text-black font-semibold">{publishedItems.length}</strong>
          </span>
          <span>
            Total Views: <strong className="text-black font-semibold">{totalViews.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {/* TAB 1: UNSCHEDULED INBOX */}
      {activeTab === 'inbox' && (
        <div className="space-y-6">
          {/* Drive Connection Callout if Disconnected */}
          {isDriveConnected === false && (
            <div className="p-4 sm:p-5 rounded-3xl bg-[#fafafa] border border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center flex-shrink-0">
                  <HardDrive size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-black">Connect Google Drive to Ingest Video Deliverables</h4>
                  <p className="text-xs text-[#6b7280] font-light mt-0.5">
                    Link your Google Drive account with 1 click to pull finished video deliverables directly into this Unscheduled Inbox.
                  </p>
                </div>
              </div>
              <a
                href="/api/auth/google?service=workspace&return_to=/content"
                className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap shadow-sm transition-all"
              >
                <ExternalLink size={13} />
                <span>Connect Google Drive</span>
              </a>
            </div>
          )}

          {/* Inbox Mission Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#fafafa] border border-black/[0.08] backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center flex-shrink-0">
                <HardDrive size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-black">
                    Unscheduled Video Deliverables Inbox
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800 text-[10px] font-mono font-medium">
                    {inboxItems.length} Videos Staged
                  </span>
                </div>
                <p className="text-xs text-[#6b7280] font-light mt-0.5">
                  Import finished video files from Google Drive and schedule them across your channels.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {inboxItems.length > 0 && (
                <button
                  onClick={handleAutoPlanSprint}
                  disabled={isAutoPlanning}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  {isAutoPlanning ? (
                    <Loader2 size={13} className="animate-spin text-white" />
                  ) : (
                    <Calendar size={13} className="text-white" />
                  )}
                  <span>Auto-Plan 14-Day Sprint</span>
                </button>
              )}

              <button
                onClick={() => setIsDriveModalOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-black border border-black/[0.08] rounded-xl text-xs font-normal flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={13} />
                <span>Import More from Drive</span>
              </button>
            </div>
          </div>

          {/* Inbox Platform Filter Pills */}
          {inboxItems.length > 0 && (
            <div className="flex items-center gap-1 bg-[#f5f5f7] p-1 rounded-2xl border border-black/[0.04] overflow-x-auto text-xs w-fit">
              <button
                onClick={() => setPlatformFilter('all')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-normal whitespace-nowrap',
                  platformFilter === 'all'
                    ? 'bg-white text-black font-medium shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                )}
              >
                All Platforms ({inboxItems.length})
              </button>
              <button
                onClick={() => setPlatformFilter('youtube')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-normal whitespace-nowrap',
                  platformFilter === 'youtube'
                    ? 'bg-white text-black font-medium shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                )}
              >
                YouTube Shorts ({inboxItems.filter((i) => i.platform === 'youtube').length})
              </button>
              <button
                onClick={() => setPlatformFilter('instagram')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-normal whitespace-nowrap',
                  platformFilter === 'instagram'
                    ? 'bg-white text-black font-medium shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                )}
              >
                Instagram Reels ({inboxItems.filter((i) => i.platform === 'instagram').length})
              </button>
            </div>
          )}

          {/* Inbox Grid */}
          {loading ? (
            <CardSkeleton count={4} />
          ) : inboxItems.length === 0 ? (
            <div className="py-20 text-center bg-white border border-black/[0.06] rounded-3xl p-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center mx-auto">
                <Inbox size={28} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-normal text-black">Your Unscheduled Inbox is Clear</h3>
                <p className="text-xs text-[#6b7280] font-light mt-1">
                  Connect your Google Drive and import finished video files to start dispatch schedules.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setIsDriveModalOpen(true)}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium inline-flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <HardDrive size={14} />
                  <span>Import Videos from Google Drive</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inboxItems
                .filter((i) => platformFilter === 'all' || i.platform === platformFilter)
                .map((item) => {
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-black/[0.08] hover:border-black/[0.2] hover:shadow-md hover:-translate-y-0.5 rounded-3xl overflow-hidden transition-all duration-200 shadow-xs flex flex-col group"
                  >
                    {/* Thumbnail / Video Preview */}
                    <div
                      onClick={() => setInspectingItem(item)}
                      className="aspect-video bg-[#111214] relative overflow-hidden flex items-center justify-center cursor-pointer"
                    >
                      {item.thumbnail_url || (item.media_urls && item.media_urls[0]) ? (
                        <img
                          src={item.thumbnail_url || item.media_urls[0]}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-neutral-500">
                          <Film size={26} className="opacity-60" />
                          <span className="text-[9px] font-mono uppercase tracking-wider">
                            Raw Deliverable
                          </span>
                        </div>
                      )}

                      {/* Gradient vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Platform & Format Tag */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-xs flex items-center gap-1',
                            item.platform === 'instagram'
                              ? 'bg-white/95 text-fuchsia-600'
                              : 'bg-white/95 text-rose-600'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              item.platform === 'instagram' ? 'bg-fuchsia-500' : 'bg-rose-500'
                            )}
                          />
                          {item.platform} {item.content_type}
                        </span>
                      </div>

                      {/* Source Tag */}
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-neutral-900 text-white font-medium shadow-xs">
                          Inbox
                        </span>
                      </div>

                      {/* Duration */}
                      {item.duration_seconds && (
                        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-white px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
                          <Clock size={10} />
                          <span>
                            {Math.floor(item.duration_seconds / 60)}:
                            {item.duration_seconds % 60 < 10 ? '0' : ''}
                            {item.duration_seconds % 60}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h4
                          onClick={() => setInspectingItem(item)}
                          className="text-sm font-medium text-black line-clamp-1 group-hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          {item.title}
                        </h4>

                        {/* Hook or Caption Preview */}
                        {item.hook ? (
                          <div className="p-2.5 rounded-xl bg-neutral-50 border border-black/[0.06]">
                            <div className="text-[10px] font-mono uppercase text-neutral-500 font-semibold mb-0.5">
                              Hook:
                            </div>
                            <p className="text-xs font-medium text-black line-clamp-2">
                              "{item.hook}"
                            </p>
                          </div>
                        ) : item.caption ? (
                          <p className="text-xs text-[#6b7280] line-clamp-2 font-light">
                            {item.caption}
                          </p>
                        ) : null}
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between gap-2">
                        <button
                          onClick={() => setInspectingItem(item)}
                          className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                        >
                          <SlidersHorizontal size={12} />
                          <span>Inspect &amp; Schedule</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePublishNow(item)}
                            disabled={publishingId === item.id}
                            className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            title="Instant Publish"
                          >
                            {publishingId === item.id ? (
                              <Loader2 size={13} className="animate-spin text-black" />
                            ) : (
                              <Send size={13} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PUBLISHING CALENDAR */}
      {activeTab === 'calendar' && (
        <ContentCalendarView
          items={items}
          inboxItems={inboxItems}
          onInspectItem={(item) => setInspectingItem(item)}
          onAutoPlanSprint={handleAutoPlanSprint}
        />
      )}

      {/* TAB 3: ALL VAULT DELIVERABLES */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-black/[0.08] shadow-xs">
            {/* Platform tabs */}
            <div className="flex items-center gap-1 bg-[#f5f5f7] p-1 rounded-2xl border border-black/[0.04] overflow-x-auto text-xs">
              <button
                onClick={() => setPlatformFilter('all')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-normal whitespace-nowrap',
                  platformFilter === 'all'
                    ? 'bg-white text-black font-medium shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                )}
              >
                All Platforms
              </button>
              <button
                onClick={() => setPlatformFilter('youtube')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-normal whitespace-nowrap',
                  platformFilter === 'youtube'
                    ? 'bg-white text-black font-medium shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                )}
              >
                YouTube
              </button>
              <button
                onClick={() => setPlatformFilter('instagram')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-normal whitespace-nowrap',
                  platformFilter === 'instagram'
                    ? 'bg-white text-black font-medium shadow-xs'
                    : 'text-neutral-500 hover:text-black'
                )}
              >
                Instagram
              </button>
            </div>

            {/* Status filter & search */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-black font-light outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="inbox">Vault Inbox</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>

              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type="text"
                  placeholder="Search title or hook..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-black font-light outline-none w-44 focus:w-60 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Grid of Filtered Items */}
          {loading ? (
            <CardSkeleton count={6} />
          ) : filteredVaultItems.length === 0 ? (
            <div className="py-20 text-center bg-white border border-black/[0.06] rounded-3xl p-10">
              <Film size={32} className="mx-auto text-[#9ca3af] mb-2 opacity-60" />
              <h3 className="text-base font-normal text-black">No deliverables matched your filter</h3>
              <p className="text-xs text-[#6b7280] font-light mt-1">
                Try switching platforms or import new finished clips from Google Drive.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVaultItems.map((item) => {
                const isScheduled = item.status === 'scheduled'
                const isPublished = item.status === 'published'

                return (
                  <div
                    key={item.id}
                    className="bg-white/90 backdrop-blur-sm border border-black/[0.06] hover:border-black/[0.16] hover:shadow-lg hover:-translate-y-0.5 rounded-3xl overflow-hidden transition-all duration-200 shadow-xs flex flex-col group"
                  >
                    {/* Visual Preview */}
                    <div
                      onClick={() => setInspectingItem(item)}
                      className="aspect-video bg-[#111214] relative overflow-hidden flex items-center justify-center cursor-pointer"
                    >
                      {item.thumbnail_url || (item.media_urls && item.media_urls[0]) ? (
                        <img
                          src={item.thumbnail_url || item.media_urls[0]}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-neutral-500">
                          <Film size={28} className="opacity-60" />
                          <span className="text-[10px] font-mono uppercase tracking-wider font-light">
                            Vault Asset
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Platform badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-xs flex items-center gap-1',
                            item.platform === 'youtube'
                              ? 'bg-white/95 text-rose-600'
                              : 'bg-white/95 text-fuchsia-600'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              item.platform === 'youtube' ? 'bg-rose-500' : 'bg-fuchsia-500'
                            )}
                          />
                          {item.platform}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-black/75 backdrop-blur-xs text-white">
                          {item.content_type}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-medium backdrop-blur-md shadow-xs flex items-center gap-1.5',
                            isPublished
                              ? 'bg-emerald-500/90 text-white'
                              : isScheduled
                              ? 'bg-black/85 text-white'
                              : item.status === 'inbox'
                              ? 'bg-neutral-800/90 text-neutral-200'
                              : 'bg-black/60 text-neutral-200'
                          )}
                        >
                          {isPublished && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          {isScheduled && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3
                          onClick={() => setInspectingItem(item)}
                          className="text-sm font-medium text-black line-clamp-1 group-hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          {item.title}
                        </h3>
                        {item.hook ? (
                          <p className="text-xs text-black bg-neutral-100 border border-black/[0.04] p-2.5 rounded-xl font-medium mt-2 line-clamp-2">
                            "{item.hook}"
                          </p>
                        ) : item.caption ? (
                          <p className="text-xs text-[#6b7280] font-light mt-1.5 line-clamp-2 leading-relaxed">
                            {item.caption}
                          </p>
                        ) : null}
                      </div>

                      {/* Schedule / Metadata Details */}
                      <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-[#9ca3af] font-light">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Clock size={12} className={isScheduled ? 'text-black' : ''} />
                          <span className={isScheduled ? 'text-black font-medium' : ''}>
                            {item.scheduled_at
                              ? `Scheduled: ${new Date(item.scheduled_at).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}`
                              : isPublished && item.published_at
                              ? `Published: ${new Date(item.published_at).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}`
                              : item.status === 'inbox'
                              ? 'Vault Inbox'
                              : 'Draft'}
                          </span>
                        </div>

                        {isPublished && item.metrics && (
                          <div className="flex items-center gap-3 font-mono text-black font-normal">
                            <span className="flex items-center gap-1 text-sky-600">
                              <Eye size={11} className="text-sky-500" />
                              {(item.metrics.views || 0).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-rose-600">
                              <ThumbsUp size={11} className="text-rose-500" />
                              {(item.metrics.likes || 0).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setInspectingItem(item)}
                            className="px-3 py-1.5 bg-[#f5f5f7] hover:bg-neutral-200 text-black rounded-xl text-xs font-normal flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <SlidersHorizontal size={12} />
                            <span>Inspect</span>
                          </button>

                          {item.status !== 'published' && (
                            <button
                              onClick={() => handlePublishNow(item)}
                              disabled={publishingId === item.id}
                              className="px-3 py-1.5 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                            >
                              {publishingId === item.id ? (
                                <Loader2 size={12} className="animate-spin text-white" />
                              ) : (
                                <Send size={11} className="text-white" />
                              )}
                              <span>Publish</span>
                            </button>
                          )}

                          {isPublished && item.external_post_url && (
                            <a
                              href={item.external_post_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 rounded-xl text-xs font-normal flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <ExternalLink size={12} />
                              <span>View Live</span>
                            </a>
                          )}
                        </div>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-[#9ca3af] hover:text-black rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Delete Content Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CREATOR INTELLIGENCE & ADVANCED ANALYTICS */}
      {activeTab === 'analytics' && (
        <CreatorAnalyticsView
          ytChannel={ytChannel}
          ytVideos={items.filter((i) => i.platform === 'youtube')}
          igAccount={igAccount}
          igReels={items.filter((i) => i.platform === 'instagram')}
          vaultItems={items}
          onRefresh={() => fetchItems(true)}
        />
      )}

      {/* NEW CONTENT CREATION MODAL (100% GOOGLE DRIVE SOURCED) */}
      <CreateContentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchItems(true)
          setActiveTab('inbox')
        }}
        isDriveConnected={isDriveConnected}
      />

      {/* GOOGLE DRIVE BATCH INGESTION MODAL */}
      <DriveImportModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onImportSuccess={() => {
          fetchItems(true)
          setActiveTab('inbox')
        }}
      />

      {/* DEEP ASSET INSPECTOR & STRATEGY MODAL */}
      <AssetInspectorModal
        item={inspectingItem}
        isOpen={Boolean(inspectingItem)}
        onClose={() => setInspectingItem(null)}
        onUpdate={async (updates) => {
          await handleUpdateItem(updates)
          await fetchItems(true)
        }}
        onPublishNow={handlePublishNow}
      />
    </div>
  )
}
