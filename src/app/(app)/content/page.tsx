'use client'

export const runtime = 'edge'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { ContentItem, ContentPlatform, ContentType, ContentStatus } from '@/types'
import { 
  Film, Video, Image as ImageIcon, Plus, Search, Filter, 
  Calendar, Clock, CheckCircle2, AlertCircle, Share2, 
  Trash2, ExternalLink, Play, Sparkles, Send, Upload,
  Eye, ThumbsUp, MessageSquare, Repeat, X, Loader2, Layers
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ContentVaultPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [platformFilter, setPlatformFilter] = useState<'all' | ContentPlatform>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ContentStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [platform, setPlatform] = useState<ContentPlatform>('youtube')
  const [contentType, setContentType] = useState<ContentType>('video')
  const [scheduledAt, setScheduledAt] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch Items
  async function fetchItems() {
    setLoading(true)
    try {
      let wsId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null
      
      const queryParams = new URLSearchParams()
      if (wsId) queryParams.set('workspace_id', wsId)
      if (platformFilter !== 'all') queryParams.set('platform', platformFilter)
      if (statusFilter !== 'all') queryParams.set('status', statusFilter)

      const res = await fetch(`/api/content?${queryParams.toString()}`)
      const data = await res.json()
      if (data.success && data.items) {
        setItems(data.items)
      }
    } catch (err) {
      console.error('Error fetching content items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [platformFilter, statusFilter])

  // Handle Media File Upload
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
          body: formData
        })
        const data = await res.json()

        if (data.success && data.url) {
          setMediaUrls(prev => [...prev, data.url])
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

  // Handle Create Content Item
  const handleCreate = async (submitStatus: ContentStatus = 'draft') => {
    if (!title.trim()) {
      toast.error('Please enter a content title.')
      return
    }

    setCreating(true)
    try {
      const wsId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null

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
          workspace_id: wsId
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(submitStatus === 'scheduled' ? 'Content scheduled successfully!' : 'Content item created!')
        setIsModalOpen(false)
        resetForm()
        fetchItems()
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

  // Trigger Immediate Publishing via Social Engine
  const handlePublishNow = async (item: ContentItem) => {
    setPublishingId(item.id)
    toast.info(`Dispatching ${item.title} to ${item.platform.toUpperCase()}...`)

    try {
      const endpoint = item.platform === 'youtube' ? '/api/social/youtube/publish' : '/api/social/instagram/publish'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_item_id: item.id })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Shipped to ${item.platform.toUpperCase()}!`)
        fetchItems()
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
    if (!confirm('Are you sure you want to delete this content item?')) return

    try {
      const res = await fetch(`/api/content/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id))
        toast.success('Content item deleted.')
      }
    } catch {
      toast.error('Failed to delete content item.')
    }
  }

  const resetForm = () => {
    setTitle('')
    setCaption('')
    setPlatform('youtube')
    setContentType('video')
    setScheduledAt('')
    setMediaUrls([])
    setThumbnailUrl('')
  }

  // Filtered Items
  const filteredItems = items.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchTitle = item.title?.toLowerCase().includes(q)
      const matchCaption = item.caption?.toLowerCase().includes(q)
      if (!matchTitle && !matchCaption) return false
    }
    return true
  })

  // Aggregated Stats
  const totalCount = items.length
  const scheduledCount = items.filter(i => i.status === 'scheduled').length
  const publishedCount = items.filter(i => i.status === 'published').length
  const totalViews = items.reduce((acc, i) => acc + (i.metrics?.views || 0), 0)

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-body relative">
      {/* Subtle Ambient Lighting Blooms (Executive & Modern) */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-gradient-to-br from-indigo-500/[0.07] via-purple-500/[0.04] to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 left-0 w-80 h-80 bg-gradient-to-tr from-sky-500/[0.05] via-emerald-500/[0.03] to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 font-mono text-[10px] font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              OMNICHANNEL PIPELINE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-black tracking-tight">
            Content Vault
          </h1>
          <p className="text-sm text-[#6b7280] font-light mt-1">
            Visual pipeline for high-production distribution, scheduling, and multi-platform asset management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { resetForm(); setIsModalOpen(true) }}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={14} className="text-white" />
            <span>Create Content</span>
          </button>
        </div>
      </div>

      {/* Metrics Row - Refined Ambient Tints */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/80 backdrop-blur-sm border border-black/[0.06] hover:border-violet-500/20 hover:shadow-xs rounded-2xl transition-all shadow-xs relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-violet-500/[0.05] rounded-full blur-xl group-hover:bg-violet-500/[0.1] transition-all" />
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-light">
            <span className="text-[#6b7280]">VAULT ASSETS</span>
            <span className="w-5 h-5 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Layers size={11} />
            </span>
          </div>
          <div className="text-2xl font-light text-black mt-1.5">{totalCount}</div>
          <div className="text-[11px] text-[#6b7280] mt-0.5">Media items staged</div>
        </div>

        <div className="p-4 bg-white/80 backdrop-blur-sm border border-black/[0.06] hover:border-amber-500/20 hover:shadow-xs rounded-2xl transition-all shadow-xs relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/[0.05] rounded-full blur-xl group-hover:bg-amber-500/[0.1] transition-all" />
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-light">
            <span className="text-[#6b7280]">SCHEDULED</span>
            <span className="w-5 h-5 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={11} />
            </span>
          </div>
          <div className="text-2xl font-light text-black mt-1.5">{scheduledCount}</div>
          <div className="text-[11px] text-amber-700/80 mt-0.5">Awaiting dispatch</div>
        </div>

        <div className="p-4 bg-white/80 backdrop-blur-sm border border-black/[0.06] hover:border-emerald-500/20 hover:shadow-xs rounded-2xl transition-all shadow-xs relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/[0.05] rounded-full blur-xl group-hover:bg-emerald-500/[0.1] transition-all" />
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-light">
            <span className="text-[#6b7280]">PUBLISHED</span>
            <span className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={11} />
            </span>
          </div>
          <div className="text-2xl font-light text-black mt-1.5">{publishedCount}</div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">Live on social platforms</div>
        </div>

        <div className="p-4 bg-white/80 backdrop-blur-sm border border-black/[0.06] hover:border-sky-500/20 hover:shadow-xs rounded-2xl transition-all shadow-xs relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-sky-500/[0.05] rounded-full blur-xl group-hover:bg-sky-500/[0.1] transition-all" />
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-light">
            <span className="text-[#6b7280]">TOTAL REACH</span>
            <span className="w-5 h-5 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Eye size={11} />
            </span>
          </div>
          <div className="text-2xl font-light text-black mt-1.5 font-mono">{totalViews.toLocaleString()}</div>
          <div className="text-[11px] text-sky-700/80 mt-0.5">Aggregated audience reach</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-2 rounded-2xl border border-black/[0.06] shadow-xs">
        {/* Platform tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPlatformFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-light transition-all cursor-pointer ${
              platformFilter === 'all' 
                ? 'bg-white text-black font-normal shadow-xs border border-black/[0.06]' 
                : 'text-[#6b7280] hover:text-black'
            }`}
          >
            All Platforms
          </button>
          <button
            onClick={() => setPlatformFilter('youtube')}
            className={`px-3 py-1.5 rounded-xl text-xs font-light transition-all cursor-pointer flex items-center gap-1.5 ${
              platformFilter === 'youtube' 
                ? 'bg-rose-50 text-rose-700 font-medium shadow-xs border border-rose-200/60' 
                : 'text-[#6b7280] hover:text-rose-600'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>YouTube</span>
          </button>
          <button
            onClick={() => setPlatformFilter('instagram')}
            className={`px-3 py-1.5 rounded-xl text-xs font-light transition-all cursor-pointer flex items-center gap-1.5 ${
              platformFilter === 'instagram' 
                ? 'bg-fuchsia-50 text-fuchsia-700 font-medium shadow-xs border border-fuchsia-200/60' 
                : 'text-[#6b7280] hover:text-fuchsia-600'
            }`}
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
            <option value="draft">Drafts</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-black font-light outline-none w-44 focus:w-60 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="py-24 text-center text-[#9ca3af] flex flex-col items-center gap-2">
          <Loader2 size={24} className="animate-spin text-black" />
          <span className="text-xs font-light">Loading content vault...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-24 text-center bg-white border border-black/[0.06] rounded-3xl p-12">
          <Film size={36} className="mx-auto text-[#9ca3af] mb-3 opacity-60" />
          <h3 className="text-base font-normal text-black">No content deliverables found</h3>
          <p className="text-xs text-[#6b7280] font-light mt-1 max-w-sm mx-auto">
            Stage your YouTube videos, Shorts, Instagram Reels, and Carousels here for seamless scheduling and auto-publishing.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 px-4 py-2 bg-black text-white rounded-xl text-xs font-medium cursor-pointer"
          >
            Create First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const isScheduled = item.status === 'scheduled'
            const isPublished = item.status === 'published'

            return (
              <div 
                key={item.id} 
                className="bg-white/90 backdrop-blur-sm border border-black/[0.06] hover:border-black/[0.16] hover:shadow-lg hover:shadow-black/[0.04] hover:-translate-y-0.5 rounded-3xl overflow-hidden transition-all duration-200 shadow-xs flex flex-col group"
              >
                {/* Visual Preview / Thumbnail */}
                <div className="aspect-video bg-[#111214] relative overflow-hidden flex items-center justify-center">
                  {item.thumbnail_url || (item.media_urls && item.media_urls[0]) ? (
                    <img 
                      src={item.thumbnail_url || item.media_urls[0]} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-neutral-500">
                      <Film size={28} className="opacity-60" />
                      <span className="text-[10px] font-mono uppercase tracking-wider font-light">No Media Uploaded</span>
                    </div>
                  )}

                  {/* Gradient vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Platform & Type Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-xs flex items-center gap-1 ${
                      item.platform === 'youtube'
                        ? 'bg-white/95 text-rose-600'
                        : item.platform === 'instagram'
                        ? 'bg-white/95 text-fuchsia-600'
                        : 'bg-white/95 text-black'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.platform === 'youtube' ? 'bg-rose-500' : item.platform === 'instagram' ? 'bg-fuchsia-500' : 'bg-black'
                      }`} />
                      {item.platform}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider bg-black/75 backdrop-blur-xs text-white">
                      {item.content_type}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-medium backdrop-blur-md shadow-xs flex items-center gap-1.5 ${
                      isPublished 
                        ? 'bg-emerald-500/90 text-white' 
                        : isScheduled 
                        ? 'bg-amber-500/90 text-white' 
                        : 'bg-black/60 text-neutral-200'
                    }`}>
                      {isPublished && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      {isScheduled && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-black line-clamp-1 group-hover:text-neutral-700 transition-colors">
                      {item.title}
                    </h3>
                    {item.caption && (
                      <p className="text-xs text-[#6b7280] font-light mt-1.5 line-clamp-2 leading-relaxed">
                        {item.caption}
                      </p>
                    )}
                  </div>

                  {/* Schedule / Metadata Details */}
                  <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-[#9ca3af] font-light">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Clock size={12} className={isScheduled ? 'text-amber-500' : ''} />
                      <span className={isScheduled ? 'text-amber-700 font-medium' : ''}>
                        {item.scheduled_at 
                          ? `Scheduled: ${new Date(item.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                          : isPublished && item.published_at
                          ? `Published: ${new Date(item.published_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
                          : 'Draft'
                        }
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
                      {item.status !== 'published' && (
                        <button
                          onClick={() => handlePublishNow(item)}
                          disabled={publishingId === item.id}
                          className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                        >
                          {publishingId === item.id ? (
                            <Loader2 size={12} className="animate-spin text-white" />
                          ) : (
                            <Send size={11} className="text-white" />
                          )}
                          <span>Publish Now</span>
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

      {/* CREATE / SCHEDULE CONTENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-black/[0.08] max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <div>
                <h3 className="text-lg font-light text-black">Stage Content Asset</h3>
                <p className="text-xs text-[#6b7280] font-light">Set metadata, media files, and schedule automated dispatch</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
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
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1.5">Format Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="w-full px-3.5 py-2.5 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light"
                  >
                    <option value="video">Long-form Video</option>
                    <option value="short">YouTube Short</option>
                    <option value="reel">Instagram Reel</option>
                    <option value="carousel">Carousel (Multi-image)</option>
                    <option value="post">Single Image Post</option>
                  </select>
                </div>
              </div>

              {/* Media File Upload Area */}
              <div>
                <label className="block text-xs font-medium text-black mb-1.5">Media Assets (Video / Images)</label>
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
                      <span>{mediaUrls.length} file(s) attached to vault deliverable</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-[#6b7280]">
                      <Upload size={22} className="text-[#9ca3af]" />
                      <span className="text-xs font-medium text-black">Click or drag media files here</span>
                      <span className="text-[11px] text-[#9ca3af] font-light">Supports MP4, MOV, WEBM, JPG, PNG (up to 500MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Caption / Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-black">Caption & Description</label>
                  <span className="text-[10px] text-[#9ca3af] font-mono">{caption.length} characters</span>
                </div>
                <textarea
                  rows={4}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Craft your description, hook, timestamps, and hashtags..."
                  className="w-full px-3.5 py-2.5 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none focus:border-black font-light resize-none leading-relaxed"
                />
              </div>

              {/* Schedule Date & Time */}
              <div>
                <label className="block text-xs font-medium text-black mb-1.5">Schedule Publication Time (Optional)</label>
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
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-black/[0.08] rounded-xl text-xs text-[#6b7280] hover:text-black font-light cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreate('draft')}
                disabled={creating}
                className="px-4 py-2 bg-[#f5f5f7] hover:bg-neutral-200 text-black rounded-xl text-xs font-medium cursor-pointer transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleCreate(scheduledAt ? 'scheduled' : 'draft')}
                disabled={creating}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {creating && <Loader2 size={12} className="animate-spin text-white" />}
                <span>{scheduledAt ? 'Schedule Dispatch' : 'Create Asset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
