'use client'

import { useState, useEffect } from 'react'
import {
  HardDrive,
  Video,
  Folder,
  Search,
  X,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Film,
  Sparkles,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import type { DriveVideoFile, DriveFolder } from '@/lib/google/drive'
import { cn } from '@/lib/utils'

interface DriveImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: () => void
}

export function DriveImportModal({ isOpen, onClose, onImportSuccess }: DriveImportModalProps) {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const [authUrl, setAuthUrl] = useState('/api/auth/google?service=workspace&return_to=/content')
  const [videos, setVideos] = useState<DriveVideoFile[]>([])
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'My Drive' },
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [importing, setImporting] = useState(false)
  const [targetPlatform, setTargetPlatform] = useState<'instagram' | 'youtube'>('instagram')

  const currentFolder = folderHistory[folderHistory.length - 1]

  async function loadDriveFiles(folderId?: string, query?: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (folderId && folderId !== 'root') params.set('folder_id', folderId)
      if (query && query.trim()) params.set('q', query.trim())

      const res = await fetch(`/api/content/drive/files?${params.toString()}`)
      const data = await res.json()

      if (data.connected === false) {
        setConnected(false)
        if (data.authUrl) setAuthUrl(data.authUrl)
        setVideos([])
        setFolders([])
      } else {
        setConnected(true)
        setVideos(data.videos || [])
        setFolders(data.folders || [])
      }
    } catch (err: any) {
      console.error('Failed to load drive files:', err)
      toast.error('Unable to fetch Google Drive files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set())
      loadDriveFiles(currentFolder.id === 'root' ? undefined : currentFolder.id)
    }
  }, [isOpen])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === videos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(videos.map((v) => v.id)))
    }
  }

  const navigateToFolder = (folder: { id: string; name: string }) => {
    setFolderHistory((prev) => [...prev, folder])
    setSelectedIds(new Set())
    loadDriveFiles(folder.id)
  }

  const navigateBreadcrumb = (index: number) => {
    const target = folderHistory[index]
    setFolderHistory((prev) => prev.slice(0, index + 1))
    setSelectedIds(new Set())
    loadDriveFiles(target.id === 'root' ? undefined : target.id)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadDriveFiles(currentFolder.id === 'root' ? undefined : currentFolder.id, searchQuery)
  }

  const handleBatchImport = async () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one video to import.')
      return
    }

    setImporting(true)
    try {
      const selectedVideos = videos.filter((v) => selectedIds.has(v.id))
      const itemsToImport = selectedVideos.map((v) => ({
        id: v.id,
        drive_file_id: v.id,
        title: v.name,
        webViewLink: v.webViewLink,
        webContentLink: v.webContentLink,
        thumbnailUrl: v.thumbnailUrl,
        duration_seconds: v.durationSeconds,
        file_size_bytes: v.size,
        aspectRatio: v.aspectRatio,
        platform: targetPlatform,
        content_type: targetPlatform === 'instagram' ? 'reel' : 'short',
      }))

      const wsId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null

      const res = await fetch('/api/content/drive/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToImport,
          workspace_id: wsId,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(
          `Imported ${data.count} finished video deliverable(s) into your Unscheduled Inbox!`
        )
        onImportSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Failed to import deliverables')
      }
    } catch (err: any) {
      console.error('Import error:', err)
      toast.error('Error importing videos from Google Drive')
    } finally {
      setImporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-black/[0.08] max-h-[90vh] flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
              <HardDrive size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-light text-black">Google Drive Video Explorer</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono border border-emerald-200">
                  Direct Ingestion
                </span>
              </div>
              <p className="text-xs text-[#6b7280] font-light">
                Select your finished clips, Reels, and Shorts to stage into the Cultlike Vault Inbox
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9ca3af] hover:text-black rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Not connected state */}
        {!connected ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <HardDrive size={28} />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-base font-normal text-black">Connect Your Google Drive</h4>
              <p className="text-xs text-[#6b7280] font-light mt-1">
                Authorize Cultlike OS to read finished video exports from your Google Drive folder.
                Your files remain securely on Drive while Cultlike organizes hooks and scheduling.
              </p>
            </div>
            <div className="pt-2">
              <a
                href={authUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium shadow-sm transition-all"
              >
                <span>Authorize Google Drive</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Folder Breadcrumbs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fbfbfd] p-3 rounded-2xl border border-black/[0.06]">
              {/* Breadcrumb path */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-light text-black">
                {folderHistory.map((f, idx) => (
                  <div key={f.id} className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => navigateBreadcrumb(idx)}
                      className={cn(
                        'px-2 py-1 rounded-lg transition-colors cursor-pointer hover:bg-neutral-200/60',
                        idx === folderHistory.length - 1 ? 'font-medium text-black bg-white shadow-xs' : 'text-[#6b7280]'
                      )}
                    >
                      {f.name}
                    </button>
                    {idx < folderHistory.length - 1 && <span className="text-[#9ca3af]">/</span>}
                  </div>
                ))}
              </div>

              {/* Search & Refresh */}
              <div className="flex items-center gap-2">
                <form onSubmit={handleSearch} className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  <input
                    type="text"
                    placeholder="Search video name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 pr-2.5 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-black font-light outline-none w-40 sm:w-48 focus:border-black"
                  />
                </form>

                <button
                  onClick={() => loadDriveFiles(currentFolder.id === 'root' ? undefined : currentFolder.id, searchQuery)}
                  disabled={loading}
                  className="p-1.5 bg-white border border-black/[0.08] rounded-xl text-[#6b7280] hover:text-black cursor-pointer disabled:opacity-50"
                  title="Refresh Drive files"
                >
                  <RefreshCw size={13} className={cn(loading && 'animate-spin')} />
                </button>
              </div>
            </div>

            {/* Folder Grid (if any) */}
            {folders.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#6b7280]">Folders</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => navigateToFolder(folder)}
                      className="p-2.5 bg-white hover:bg-neutral-50 border border-black/[0.06] hover:border-black/[0.15] rounded-xl text-left flex items-center gap-2.5 transition-all group cursor-pointer shadow-xs"
                    >
                      <Folder size={15} className="text-amber-500 flex-shrink-0 group-hover:scale-105 transition-transform" />
                      <span className="text-xs font-light text-black truncate">{folder.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Video Deliverables List */}
            <div className="flex-1 overflow-y-auto space-y-3 min-h-[260px] pr-1">
              <div className="flex items-center justify-between text-xs text-[#6b7280]">
                <span>
                  Found <strong className="text-black font-medium">{videos.length}</strong> video file(s)
                </span>
                {videos.length > 0 && (
                  <button
                    onClick={selectAll}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    {selectedIds.size === videos.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#6b7280]">
                  <Loader2 size={24} className="animate-spin text-black" />
                  <span className="text-xs font-light">Scanning Google Drive for video deliverables...</span>
                </div>
              ) : videos.length === 0 ? (
                <div className="py-16 text-center bg-[#fbfbfd] border border-black/[0.06] rounded-2xl p-6">
                  <Film size={28} className="mx-auto text-[#9ca3af] mb-2 opacity-60" />
                  <p className="text-xs font-normal text-black">No video files found in this folder</p>
                  <p className="text-[11px] text-[#6b7280] font-light mt-0.5">
                    Upload MP4/MOV videos into this Google Drive folder or select another folder.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {videos.map((video) => {
                    const isSelected = selectedIds.has(video.id)
                    const isVertical = video.aspectRatio === '9:16'

                    return (
                      <div
                        key={video.id}
                        onClick={() => toggleSelect(video.id)}
                        className={cn(
                          'p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between group shadow-xs',
                          isSelected
                            ? 'bg-indigo-500/[0.04] border-indigo-500 shadow-xs ring-1 ring-indigo-500/30'
                            : 'bg-white hover:bg-neutral-50/80 border-black/[0.06] hover:border-black/[0.14]'
                        )}
                      >
                        {/* Thumbnail or Video Placeholder */}
                        <div className="aspect-video bg-[#111214] rounded-xl overflow-hidden relative flex items-center justify-center mb-2.5">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.name}
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-neutral-500">
                              <Video size={22} className="opacity-60" />
                              <span className="text-[9px] font-mono uppercase">Video Master</span>
                            </div>
                          )}

                          {/* Aspect ratio badge */}
                          <div className="absolute top-2 left-2 flex items-center gap-1">
                            <span
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-medium backdrop-blur-md shadow-xs',
                                isVertical ? 'bg-fuchsia-600/90 text-white' : 'bg-black/75 text-neutral-200'
                              )}
                            >
                              {isVertical ? '9:16 Reel' : '16:9 Video'}
                            </span>
                          </div>

                          {/* Duration badge */}
                          {video.durationFormatted && (
                            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-white px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
                              <Clock size={10} />
                              <span>{video.durationFormatted}</span>
                            </div>
                          )}

                          {/* Checkbox indicator */}
                          <div
                            className={cn(
                              'absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center transition-all',
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-black/50 text-white/50 group-hover:bg-black/70'
                            )}
                          >
                            <CheckCircle2 size={14} className={isSelected ? 'block' : 'opacity-40'} />
                          </div>
                        </div>

                        {/* Title & metadata */}
                        <div>
                          <h4 className="text-xs font-medium text-black line-clamp-1 group-hover:text-neutral-800">
                            {video.name}
                          </h4>
                          <div className="flex items-center justify-between text-[10px] text-[#6b7280] font-light mt-1">
                            <span className="font-mono">{video.sizeFormatted || 'MP4'}</span>
                            {video.webViewLink && (
                              <a
                                href={video.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-neutral-400 hover:text-black flex items-center gap-0.5"
                                title="Preview on Drive"
                              >
                                <span>Preview</span>
                                <ExternalLink size={9} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-black/[0.06]">
              {/* Target platform selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6b7280] font-light">Target Pipeline:</span>
                <button
                  type="button"
                  onClick={() => setTargetPlatform('instagram')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1',
                    targetPlatform === 'instagram'
                      ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'
                      : 'text-[#6b7280] hover:text-black'
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                  <span>Instagram Reels</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetPlatform('youtube')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1',
                    targetPlatform === 'youtube'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'text-[#6b7280] hover:text-black'
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>YouTube Shorts</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-black/[0.08] hover:bg-neutral-100 rounded-xl text-xs text-[#6b7280] font-light cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBatchImport}
                  disabled={importing || selectedIds.size === 0}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  {importing ? (
                    <Loader2 size={13} className="animate-spin text-white" />
                  ) : (
                    <Sparkles size={13} className="text-amber-400" />
                  )}
                  <span>
                    Import {selectedIds.size > 0 ? `${selectedIds.size} Video(s)` : ''} to Vault Inbox
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
