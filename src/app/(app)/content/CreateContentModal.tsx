'use client'

import { useState, useEffect } from 'react'
import {
  X,
  HardDrive,
  Video,
  Folder,
  Search,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Film,
  Calendar,
  Clock,
  ArrowLeft,
  RefreshCw,
  Link as LinkIcon,
  Tag,
  AlignLeft,
  Type,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import type { DriveVideoFile, DriveFolder } from '@/lib/google/drive'
import { formatBytes, formatDuration } from '@/lib/google/drive'
import type { ContentPlatform, ContentType } from '@/types'
import { cn } from '@/lib/utils'

interface CreateContentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  isDriveConnected?: boolean | null
}

export function CreateContentModal({
  isOpen,
  onClose,
  onSuccess,
  isDriveConnected = true,
}: CreateContentModalProps) {
  // Form State
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState<ContentPlatform>('youtube')
  const [contentType, setContentType] = useState<ContentType>('short')
  const [caption, setCaption] = useState('')
  const [hook, setHook] = useState('')
  const [tags, setTags] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [creating, setCreating] = useState(false)

  // Drive Asset State
  const [selectedFile, setSelectedFile] = useState<DriveVideoFile | null>(null)
  const [customDriveUrl, setCustomDriveUrl] = useState('')
  const [isBrowsingDrive, setIsBrowsingDrive] = useState(false)

  // Drive Explorer State
  const [loadingDrive, setLoadingDrive] = useState(false)
  const [driveConnected, setDriveConnected] = useState(isDriveConnected ?? true)
  const [authUrl, setAuthUrl] = useState('/api/auth/google?service=workspace&return_to=/content')
  const [driveVideos, setDriveVideos] = useState<DriveVideoFile[]>([])
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([])
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'My Drive' },
  ])
  const [driveSearch, setDriveSearch] = useState('')

  const currentFolder = folderHistory[folderHistory.length - 1]

  // Reset or load initial drive status when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isDriveConnected !== null && isDriveConnected !== undefined) {
        setDriveConnected(isDriveConnected)
      }
    } else {
      // Reset state on close
      setTitle('')
      setCaption('')
      setHook('')
      setTags('')
      setScheduledAt('')
      setSelectedFile(null)
      setCustomDriveUrl('')
      setIsBrowsingDrive(false)
    }
  }, [isOpen, isDriveConnected])

  // Fetch Drive videos/folders when browsing
  async function fetchDriveAssets(folderId?: string, query?: string) {
    setLoadingDrive(true)
    try {
      const params = new URLSearchParams()
      if (folderId && folderId !== 'root') params.set('folder_id', folderId)
      if (query && query.trim()) params.set('q', query.trim())

      const res = await fetch(`/api/content/drive/files?${params.toString()}`)
      const data = await res.json()

      if (data.connected === false) {
        setDriveConnected(false)
        if (data.authUrl) setAuthUrl(data.authUrl)
        setDriveVideos([])
        setDriveFolders([])
      } else {
        setDriveConnected(true)
        setDriveVideos(data.videos || [])
        setDriveFolders(data.folders || [])
      }
    } catch (err) {
      console.error('Failed to load drive files:', err)
      toast.error('Unable to fetch Google Drive files')
    } finally {
      setLoadingDrive(false)
    }
  }

  // Open Drive browser
  const handleOpenDriveBrowser = () => {
    setIsBrowsingDrive(true)
    fetchDriveAssets(currentFolder.id === 'root' ? undefined : currentFolder.id)
  }

  // Navigate folders in Drive browser
  const handleFolderClick = (folder: { id: string; name: string }) => {
    setFolderHistory((prev) => [...prev, folder])
    fetchDriveAssets(folder.id)
  }

  const handleBreadcrumbClick = (index: number) => {
    const target = folderHistory[index]
    setFolderHistory((prev) => prev.slice(0, index + 1))
    fetchDriveAssets(target.id === 'root' ? undefined : target.id)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDriveAssets(currentFolder.id === 'root' ? undefined : currentFolder.id, driveSearch)
  }

  // Select video from browser
  const handleSelectDriveVideo = (video: DriveVideoFile) => {
    setSelectedFile(video)
    setIsBrowsingDrive(false)
    // If title is empty, auto-populate with clean filename
    if (!title.trim()) {
      const clean = video.name
        .replace(/\.(mp4|mov|m4v|avi|mkv|webm)$/i, '')
        .replace(/[-_]/g, ' ')
        .trim()
      setTitle(clean)
    }
    // Auto adapt format if vertical
    if (video.aspectRatio === '9:16') {
      if (platform === 'youtube') setContentType('short')
      else if (platform === 'instagram') setContentType('reel')
    }
    toast.success(`Attached "${video.name}" from Google Drive`)
  }

  // Parse direct pasted Drive URL or ID
  const handleApplyDriveUrl = () => {
    if (!customDriveUrl.trim()) return
    const input = customDriveUrl.trim()
    const matchD = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    const matchId = input.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    const rawMatch = /^[a-zA-Z0-9_-]{25,50}$/.test(input) ? input : null

    const fileId = matchD ? matchD[1] : matchId ? matchId[1] : rawMatch

    if (!fileId) {
      toast.error('Could not detect a valid Google Drive file ID from this link.')
      return
    }

    const constructed: DriveVideoFile = {
      id: fileId,
      name: `Drive Video (${fileId.substring(0, 8)}...)`,
      mimeType: 'video/mp4',
      webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink: `https://drive.google.com/uc?id=${fileId}&export=download`,
    }

    setSelectedFile(constructed)
    setCustomDriveUrl('')
    if (!title.trim()) {
      setTitle(`Drive Video (${fileId.substring(0, 8)})`)
    }
    toast.success('Attached video via Google Drive URL')
  }

  // Submit Content Item
  const handleSave = async (destinationStatus: 'inbox' | 'scheduled') => {
    if (!title.trim()) {
      toast.error('Please enter a deliverable title.')
      return
    }

    if (!selectedFile) {
      toast.error('Please select or attach a video asset from Google Drive.')
      return
    }

    setCreating(true)
    try {
      const wsId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null

      const directStreamUrl =
        selectedFile.webContentLink ||
        `https://drive.google.com/uc?id=${selectedFile.id}&export=download`

      const payload = {
        title: title.trim(),
        caption: caption.trim(),
        platform,
        content_type: contentType,
        status: destinationStatus === 'scheduled' && scheduledAt ? 'scheduled' : 'inbox',
        scheduled_at: destinationStatus === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        hook: hook.trim() || null,
        tags: tags
          ? tags
              .split(/[,#\s]+/)
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        media_urls: [directStreamUrl],
        thumbnail_url: selectedFile.thumbnailUrl || null,
        drive_file_id: selectedFile.id,
        drive_web_view_link:
          selectedFile.webViewLink || `https://drive.google.com/file/d/${selectedFile.id}/view`,
        drive_download_link: directStreamUrl,
        duration_seconds: selectedFile.durationSeconds || null,
        file_size_bytes: selectedFile.size || null,
        workspace_id: wsId,
      }

      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(
          destinationStatus === 'scheduled' && scheduledAt
            ? `Deliverable scheduled for ${new Date(scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
            : 'Deliverable added to Unscheduled Inbox!'
        )
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Failed to save deliverable.')
      }
    } catch (err: any) {
      console.error('Create error:', err)
      toast.error('Error creating content item.')
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden font-body text-black">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06] bg-[#fafafa]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Film size={15} />
            </div>
            <div>
              <h3 className="text-base font-medium text-black tracking-tight">New Deliverable</h3>
              <p className="text-[11px] text-[#6b7280] font-light">
                Configure deliverable copy and source video directly from Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9ca3af] hover:text-black rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* VIEW A: DRIVE BROWSER EXPLORER */}
          {isBrowsingDrive ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsBrowsingDrive(false)}
                  className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-black transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Deliverable Details</span>
                </button>
                <div className="flex items-center gap-1.5 text-[11px] text-[#6b7280]">
                  <HardDrive size={13} className="text-black" />
                  <span>Google Drive Browser</span>
                </div>
              </div>

              {!driveConnected ? (
                <div className="p-6 rounded-2xl bg-[#fbfbfd] border border-black/[0.08] text-center space-y-3">
                  <HardDrive size={32} className="mx-auto text-[#9ca3af]" />
                  <h4 className="text-sm font-medium text-black">Google Drive Not Connected</h4>
                  <p className="text-xs text-[#6b7280] max-w-sm mx-auto font-light">
                    Connect your Google Drive account with 1 click to browse finished exports and raw video files.
                  </p>
                  <a
                    href={authUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium shadow-xs"
                  >
                    <span>Connect Google Drive</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Search and Refresh */}
                  <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                      <input
                        type="text"
                        value={driveSearch}
                        onChange={(e) => setDriveSearch(e.target.value)}
                        placeholder="Search video deliverables in Drive..."
                        className="w-full pl-9 pr-3 py-2 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none focus:border-black font-light"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-black rounded-xl text-xs font-medium cursor-pointer"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={() => fetchDriveAssets(currentFolder.id === 'root' ? undefined : currentFolder.id)}
                      className="p-2 text-[#6b7280] hover:text-black rounded-xl hover:bg-neutral-100 cursor-pointer"
                      title="Refresh"
                    >
                      <RefreshCw size={14} className={loadingDrive ? 'animate-spin' : ''} />
                    </button>
                  </form>

                  {/* Breadcrumb Path */}
                  <div className="flex items-center gap-1.5 text-xs text-[#6b7280] overflow-x-auto py-1 font-light">
                    {folderHistory.map((f, idx) => (
                      <div key={f.id} className="flex items-center gap-1.5 flex-shrink-0">
                        {idx > 0 && <span className="text-[#9ca3af]">/</span>}
                        <button
                          type="button"
                          onClick={() => handleBreadcrumbClick(idx)}
                          className={cn(
                            'hover:text-black cursor-pointer truncate max-w-[140px]',
                            idx === folderHistory.length - 1 ? 'font-medium text-black' : ''
                          )}
                        >
                          {f.name}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Drive Files / Folders List */}
                  {loadingDrive ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#9ca3af]">
                      <Loader2 size={24} className="animate-spin text-black" />
                      <span className="text-xs font-light">Scanning Drive videos...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {/* Sub-Folders */}
                      {driveFolders.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {driveFolders.map((folder) => (
                            <button
                              key={folder.id}
                              type="button"
                              onClick={() => handleFolderClick(folder)}
                              className="p-2.5 rounded-xl border border-black/[0.06] bg-[#fbfbfd] hover:bg-neutral-100 flex items-center gap-2 text-left transition-colors cursor-pointer"
                            >
                              <Folder size={15} className="text-[#6b7280] flex-shrink-0" />
                              <span className="text-xs text-black font-light truncate">{folder.name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Video Files */}
                      {driveVideos.length === 0 && driveFolders.length === 0 ? (
                        <div className="py-10 text-center text-[#9ca3af] text-xs font-light">
                          No video files found in this folder.
                        </div>
                      ) : (
                        driveVideos.map((video) => (
                          <div
                            key={video.id}
                            className="p-3 rounded-2xl border border-black/[0.06] bg-[#fbfbfd] hover:border-black/[0.2] flex items-center justify-between gap-3 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 text-black">
                                <Video size={18} />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-medium text-black truncate">{video.name}</h5>
                                <div className="flex items-center gap-2 text-[10px] text-[#6b7280] font-light mt-0.5 font-mono">
                                  {video.durationSeconds && <span>{formatDuration(video.durationSeconds)}</span>}
                                  {video.size && <span>• {formatBytes(video.size)}</span>}
                                  {video.aspectRatio && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-neutral-200/60 text-neutral-800">
                                      {video.aspectRatio}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectDriveVideo(video)}
                              className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer flex-shrink-0 shadow-xs"
                            >
                              Select
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* VIEW B: MAIN CONTENT DETAILS FORM */
            <div className="space-y-5">
              {/* Target Platform & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-black mb-1.5">Target Platform</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPlatform('youtube')
                        if (contentType === 'reel' || contentType === 'carousel' || contentType === 'post') {
                          setContentType('short')
                        }
                      }}
                      className={cn(
                        'py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                        platform === 'youtube'
                          ? 'border-black bg-black text-white shadow-xs'
                          : 'border-black/[0.08] bg-[#fbfbfd] text-[#6b7280] hover:text-black'
                      )}
                    >
                      <Film size={13} />
                      <span>YouTube</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlatform('instagram')
                        if (contentType === 'short' || contentType === 'video') {
                          setContentType('reel')
                        }
                      }}
                      className={cn(
                        'py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                        platform === 'instagram'
                          ? 'border-black bg-black text-white shadow-xs'
                          : 'border-black/[0.08] bg-[#fbfbfd] text-[#6b7280] hover:text-black'
                      )}
                    >
                      <Video size={13} />
                      <span>Instagram</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1.5">Deliverable Format</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="w-full px-3.5 py-2.2 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light cursor-pointer"
                  >
                    {platform === 'youtube' ? (
                      <>
                        <option value="short">YouTube Short (Vertical 9:16)</option>
                        <option value="video">Standard Video (Landscape 16:9)</option>
                      </>
                    ) : (
                      <>
                        <option value="reel">Instagram Reel (Vertical 9:16)</option>
                        <option value="post">Single Image Post</option>
                        <option value="carousel">Carousel (Multi-slide)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-black mb-1.5">Deliverable Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scaling From Zero to 10k MRR Without Capital"
                  className="w-full px-3.5 py-2.5 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none focus:border-black font-light"
                />
              </div>

              {/* ASSET SOURCING: 100% GOOGLE DRIVE ONLY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-black flex items-center gap-1.5">
                    <HardDrive size={13} />
                    <span>Video Asset Sourcing</span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 size={9} /> Google Drive Direct Stream
                  </span>
                </div>

                {selectedFile ? (
                  /* Attached Drive Asset Card */
                  <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.08] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center flex-shrink-0">
                        <Video size={18} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-medium text-black truncate">{selectedFile.name}</h5>
                        <div className="flex items-center gap-2 text-[10px] text-[#6b7280] font-light mt-0.5 font-mono">
                          <span>Google Drive Asset</span>
                          {selectedFile.size && <span>• {formatBytes(selectedFile.size)}</span>}
                          {selectedFile.durationSeconds && (
                            <span>• {formatDuration(selectedFile.durationSeconds)}</span>
                          )}
                          {selectedFile.aspectRatio && (
                            <span className="px-1.5 py-0.2 rounded-md bg-neutral-200/60 text-neutral-800">
                              {selectedFile.aspectRatio}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {selectedFile.webViewLink && (
                        <a
                          href={selectedFile.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-[#6b7280] hover:text-black rounded-lg hover:bg-neutral-200/50 transition-colors"
                          title="Preview in Drive"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleOpenDriveBrowser}
                        className="px-2.5 py-1 text-xs text-neutral-700 hover:text-black hover:bg-neutral-200/50 rounded-lg cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Asset Selection Trigger Box */
                  <div className="border border-black/[0.08] rounded-2xl p-4 bg-[#fbfbfd] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h5 className="text-xs font-medium text-black">Source Deliverable from Google Drive</h5>
                        <p className="text-[11px] text-[#6b7280] font-light mt-0.5">
                          Direct cloud stream. Zero heavy file uploads to local storage or servers.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenDriveBrowser}
                        className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer flex-shrink-0"
                      >
                        <HardDrive size={13} />
                        <span>Browse Google Drive</span>
                      </button>
                    </div>

                    {/* Quick Link Input Alternative */}
                    <div className="pt-2 border-t border-black/[0.04] flex items-center gap-2">
                      <div className="relative flex-1">
                        <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                        <input
                          type="text"
                          value={customDriveUrl}
                          onChange={(e) => setCustomDriveUrl(e.target.value)}
                          placeholder="Or paste Google Drive share URL / File ID..."
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-black/[0.08] rounded-xl text-[11px] text-black outline-none focus:border-black font-light"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyDriveUrl}
                        disabled={!customDriveUrl.trim()}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 text-black rounded-xl text-xs font-medium cursor-pointer transition-colors"
                      >
                        Attach Link
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hook / Opening Headline */}
              <div>
                <label className="block text-xs font-medium text-black mb-1.5 flex items-center gap-1">
                  <Sparkles size={12} className="text-neutral-500" />
                  <span>Opening Hook / 3-Second Headline (Optional)</span>
                </label>
                <input
                  type="text"
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  placeholder="e.g. Stop burning months on code before you test this one metric..."
                  className="w-full px-3.5 py-2.2 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none focus:border-black font-light"
                />
              </div>

              {/* Caption & Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-black flex items-center gap-1">
                    <AlignLeft size={12} className="text-neutral-500" />
                    <span>Caption &amp; Copy</span>
                  </label>
                  <span className="text-[10px] text-[#9ca3af] font-mono">{caption.length} chars</span>
                </div>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write your deliverable description, transcript highlights, and CTA..."
                  className="w-full px-3.5 py-2.5 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none focus:border-black font-light resize-none leading-relaxed"
                />
              </div>

              {/* Tags & Schedule Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-black mb-1.5 flex items-center gap-1">
                    <Tag size={12} className="text-neutral-500" />
                    <span>Tags &amp; Keywords</span>
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. #startup, #growth, #systems"
                    className="w-full px-3.5 py-2.2 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none focus:border-black font-light"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1.5 flex items-center gap-1">
                    <Calendar size={12} className="text-neutral-500" />
                    <span>Schedule Dispatch Time (Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3.5 py-2.2 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!isBrowsingDrive && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-black/[0.06] bg-[#fafafa]/80">
            <p className="text-[11px] text-[#6b7280] font-light">
              {scheduledAt ? 'Will queue to Publishing Timeline' : 'Will save to Unscheduled Inbox'}
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-black/[0.08] rounded-xl text-xs text-[#6b7280] hover:text-black font-light cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSave('inbox')}
                disabled={creating}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-black rounded-xl text-xs font-medium cursor-pointer transition-colors"
              >
                Save to Inbox
              </button>
              <button
                type="button"
                onClick={() => handleSave(scheduledAt ? 'scheduled' : 'inbox')}
                disabled={creating}
                className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                {creating && <Loader2 size={12} className="animate-spin text-white" />}
                <span>{scheduledAt ? 'Schedule Dispatch' : 'Create Deliverable'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
