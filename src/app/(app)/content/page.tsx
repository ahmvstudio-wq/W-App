'use client'

import { useState, useEffect, useRef } from 'react'
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
  Upload,
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
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { getCached, setCached } from '@/lib/cache/swrCache'
import { CardSkeleton } from '@/components/ui/SkeletonPulse'
import { cn } from '@/lib/utils'
import { DriveImportModal } from './DriveImportModal'
import { AssetInspectorModal } from './AssetInspectorModal'
import { ContentCalendarView } from './ContentCalendarView'

export default function ContentVaultPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // View Mode: 'inbox' | 'vault' | 'calendar'
  const [activeTab, setActiveTab] = useState<'inbox' | 'vault' | 'calendar'>('inbox')

  // Filters for Vault View
  const [platformFilter, setPlatformFilter] = useState<'all' | ContentPlatform>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [inspectingItem, setInspectingItem] = useState<ContentItem | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  // Manual create form state
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [platform, setPlatform] = useState<ContentPlatform>('instagram')
  const [contentType, setContentType] = useState<ContentType>('reel')
  const [scheduledAt, setScheduledAt] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setItems((prev) =>
          prev.map((i) => (i.id === updates.id ? { ...i, ...updates } : i))
        )
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

  // Manual Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'content-vault')

        const res = await fetch('/api/content/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()

        if (data.success && data.url) {
          setMediaUrls((prev) => [...prev, data.url])
          if (!thumbnailUrl && file.type.startsWith('image/')) {
            setThumbnailUrl(data.url)
          }
          toast.success(`Uploaded ${file.name}`)
        } else {
          toast.error(data.error || 'Upload failed')
        }
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Upload encountered an error')
    } finally {
      setUploading(false)
    }
  }

  // Manual Create
  const handleCreate = async (submitStatus: ContentStatus = 'inbox') => {
    if (!title.trim()) {
      toast.error('Please enter a content title.')
      return
    }

    setCreating(true)
    try {
      const wsId =
        typeof window !== 'undefined'
          ? localStorage.getItem('focus_active_workspace_id')
          : null

      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          caption,
          platform,
          content_type: contentType,
          status: submitStatus,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          media_urls: mediaUrls,
          thumbnail_url: thumbnailUrl || mediaUrls[0] || null,
          workspace_id: wsId,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Content item staged successfully!')
        setIsCreateModalOpen(false)
        resetForm()
        fetchItems(true)
      } else {
        toast.error(data.error || 'Failed to save content item.')
      }
    } catch (err) {
      console.error('Create error:', err)
      toast.error('Failed to create content item.')
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setCaption('')
    setPlatform('instagram')
    setContentType('reel')
    setScheduledAt('')
    setMediaUrls([])
    setThumbnailUrl('')
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
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-neutral-100 border border-black/[0.08] text-neutral-800 font-mono text-[10px] font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              OMNICHANNEL PIPELINE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-black tracking-tight">
            Content Studio &amp; Dispatch OS
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] font-light mt-1">
            Google Drive video ingestion, multi-platform publishing, and automated timeline scheduling.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <HardDrive size={15} />
            <span>Import from Google Drive</span>
          </button>

          <button
            onClick={() => {
              resetForm()
              setIsCreateModalOpen(true)
            }}
            className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-black border border-black/[0.1] rounded-xl text-xs font-medium flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Content</span>
          </button>
        </div>
      </div>

      {/* Connected Channels & Accounts Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Google Drive Video Storage */}
        <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] backdrop-blur-sm flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
              <HardDrive size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-medium text-black">Google Drive</h4>
                {isDriveConnected ? (
                  <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-mono border border-emerald-200">
                    <CheckCircle2 size={8} /> Connected
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-600 text-[9px] font-mono border border-neutral-200">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6b7280] font-light truncate">
                {isDriveConnected ? 'Finished Video Scanner Ready' : 'Authorize to scan finished clips'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isDriveConnected ? (
              <button
                onClick={() => setIsDriveModalOpen(true)}
                className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white rounded-lg text-[11px] font-medium transition-all shadow-xs cursor-pointer"
              >
                Browse
              </button>
            ) : (
              <a
                href="/api/auth/google?service=workspace&return_to=/content"
                className="px-3 py-1 bg-black hover:bg-neutral-800 text-white rounded-lg text-[11px] font-medium transition-all shadow-xs whitespace-nowrap"
              >
                Connect
              </a>
            )}
          </div>
        </div>

        {/* Live Instagram Account Banner */}
        {igAccount ? (
          <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] backdrop-blur-sm flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                IG
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-medium text-black truncate">@{igAccount.username}</h4>
                  <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-mono border border-emerald-200 flex-shrink-0">
                    <CheckCircle2 size={8} /> Live
                  </span>
                </div>
                <p className="text-[11px] text-[#6b7280] font-light truncate">
                  Reels Dispatch • {igAccount.account_type}
                </p>
              </div>
            </div>
            <a
              href={`https://instagram.com/${igAccount.username}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-[#6b7280] hover:text-black rounded-xl hover:bg-neutral-100 transition-colors flex-shrink-0"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex items-center justify-between">
            <span className="text-xs text-[#6b7280]">Instagram Disconnected</span>
            <Link
              href="/settings?tab=integrations"
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Connect
            </Link>
          </div>
        )}

        {/* Live YouTube Channel Banner */}
        {ytChannel ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/[0.04] via-rose-500/[0.02] to-transparent border border-rose-500/20 backdrop-blur-sm flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              {ytChannel.thumbnail ? (
                <img
                  src={ytChannel.thumbnail}
                  alt={ytChannel.title}
                  className="w-10 h-10 rounded-full border border-black/[0.08] object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  YT
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-medium text-black truncate">{ytChannel.title}</h4>
                  <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-mono border border-emerald-200 flex-shrink-0">
                    <CheckCircle2 size={8} /> Live
                  </span>
                </div>
                <p className="text-[11px] text-[#6b7280] font-light truncate">
                  {parseInt(ytChannel.subscriberCount || '0').toLocaleString()} subs
                </p>
              </div>
            </div>
            <button
              onClick={handleManualYtSync}
              disabled={syncingYt}
              className="p-2 text-[#6b7280] hover:text-black rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer flex-shrink-0"
              title="Refresh YouTube uploads"
            >
              <Repeat size={13} className={cn(syncingYt && 'animate-spin')} />
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.06] flex items-center justify-between">
            <span className="text-xs text-[#6b7280]">YouTube Disconnected</span>
            <Link
              href="/settings?tab=integrations"
              className="text-xs text-rose-600 hover:underline font-medium"
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
              'px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'inbox'
                ? 'bg-black text-white shadow-xs'
                : 'text-[#6b7280] hover:text-black hover:bg-neutral-100'
            )}
          >
            <Inbox size={14} className={activeTab === 'inbox' ? 'text-white' : ''} />
            <span>Unscheduled Inbox</span>
            {inboxItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-800 text-white text-[10px] font-mono font-medium">
                {inboxItems.length}
              </span>
            )}
          </button>

          {/* Publishing Calendar Tab */}
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'calendar'
                ? 'bg-indigo-50 text-indigo-900 border border-indigo-300 shadow-xs'
                : 'text-[#6b7280] hover:text-black hover:bg-neutral-100'
            )}
          >
            <CalendarDays size={14} className={activeTab === 'calendar' ? 'text-indigo-600' : ''} />
            <span>Publishing Timeline</span>
            {scheduledItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-mono">
                {scheduledItems.length}
              </span>
            )}
          </button>

          {/* Vault Assets Tab */}
          <button
            onClick={() => setActiveTab('vault')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'vault'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-[#6b7280] hover:text-black hover:bg-neutral-100'
            )}
          >
            <Layers size={14} />
            <span>Vault All Deliverables</span>
            <span className="text-[10px] font-mono opacity-80">({items.length})</span>
          </button>
        </div>

        {/* Global Stats Counter */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-[#6b7280]">
          <span>
            Scheduled: <strong className="text-black font-semibold">{scheduledItems.length}</strong>
          </span>
          <span>
            Live Published: <strong className="text-emerald-700 font-semibold">{publishedItems.length}</strong>
          </span>
          <span>
            Reach: <strong className="text-sky-700 font-semibold">{totalViews.toLocaleString()}</strong>
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
              {inboxItems.map((item) => {
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-2 rounded-2xl border border-black/[0.06] shadow-xs">
            {/* Platform tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPlatformFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-light transition-all cursor-pointer',
                  platformFilter === 'all'
                    ? 'bg-white text-black font-normal shadow-xs border border-black/[0.06]'
                    : 'text-[#6b7280] hover:text-black'
                )}
              >
                All Platforms
              </button>
              <button
                onClick={() => setPlatformFilter('youtube')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-light transition-all cursor-pointer flex items-center gap-1.5',
                  platformFilter === 'youtube'
                    ? 'bg-rose-50 text-rose-700 font-medium shadow-xs border border-rose-200/60'
                    : 'text-[#6b7280] hover:text-rose-600'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>YouTube</span>
              </button>
              <button
                onClick={() => setPlatformFilter('instagram')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-light transition-all cursor-pointer flex items-center gap-1.5',
                  platformFilter === 'instagram'
                    ? 'bg-fuchsia-50 text-fuchsia-700 font-medium shadow-xs border border-fuchsia-200/60'
                    : 'text-[#6b7280] hover:text-fuchsia-600'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                <span>Instagram</span>
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

      {/* GOOGLE DRIVE INGESTION MODAL */}
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
        onDelete={handleDelete}
      />

      {/* MANUAL CREATE CONTENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-black/[0.08] max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div>
                <h3 className="text-lg font-light text-black">Stage Content Asset</h3>
                <p className="text-xs text-[#6b7280] font-light">
                  Set metadata, media files, and schedule automated dispatch
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-[#9ca3af] hover:text-black rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-black mb-1.5">Deliverable Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., How to Scale Systems with Cultlike OS [4K Master]"
                  className="w-full px-3.5 py-2.5 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none focus:border-black font-light"
                />
              </div>

              {/* Platform & Content Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-black mb-1.5">Target Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as ContentPlatform)}
                    className="w-full px-3.5 py-2.5 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1.5">Format Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="w-full px-3.5 py-2.5 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light"
                  >
                    <option value="reel">Instagram Reel</option>
                    <option value="short">YouTube Short</option>
                    <option value="video">Long-form Video</option>
                    <option value="carousel">Carousel (Multi-image)</option>
                    <option value="post">Single Image Post</option>
                  </select>
                </div>
              </div>

              {/* Media File Upload Area */}
              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  Media Assets (Video / Images)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-black/[0.1] hover:border-black/[0.3] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#fbfbfd]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="video/*,image/*"
                    multiple
                    className="hidden"
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-[#9ca3af]">
                      <Loader2 size={24} className="animate-spin text-black" />
                      <span className="text-xs font-light">Uploading asset to storage...</span>
                    </div>
                  ) : mediaUrls.length > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-black font-medium text-xs">
                      <CheckCircle2 size={16} />
                      <span>{mediaUrls.length} file(s) attached to deliverable</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-[#6b7280]">
                      <Upload size={22} className="text-[#9ca3af]" />
                      <span className="text-xs font-medium text-black">
                        Click or drag media files here
                      </span>
                      <span className="text-[11px] text-[#9ca3af] font-light">
                        Supports MP4, MOV, WEBM, JPG, PNG (up to 500MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-black">Caption &amp; Description</label>
                  <span className="text-[10px] text-[#9ca3af] font-mono">
                    {caption.length} characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Craft your description, hook, and hashtags..."
                  className="w-full px-3.5 py-2.5 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none focus:border-black font-light resize-none leading-relaxed"
                />
              </div>

              {/* Schedule Date & Time */}
              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  Schedule Publication Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-black/[0.08] rounded-xl text-xs text-[#6b7280] hover:text-black font-light cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreate('inbox')}
                disabled={creating}
                className="px-4 py-2 bg-[#f5f5f7] hover:bg-neutral-200 text-black rounded-xl text-xs font-medium cursor-pointer transition-colors"
              >
                Add to Inbox
              </button>
              <button
                type="button"
                onClick={() => handleCreate(scheduledAt ? 'scheduled' : 'inbox')}
                disabled={creating}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {creating && <Loader2 size={12} className="animate-spin text-white" />}
                <span>{scheduledAt ? 'Schedule Dispatch' : 'Create Deliverable'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
