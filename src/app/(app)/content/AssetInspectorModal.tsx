'use client'

import { useState } from 'react'
import type { ContentItem, ContentPlatform, ContentType, ContentStatus } from '@/types'
import {
  X,
  Send,
  Calendar,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Film,
  Video,
  Loader2,
  HardDrive,
  FileText,
  Sliders,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AssetInspectorModalProps {
  item: ContentItem | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedItem: Partial<ContentItem>) => Promise<void>
  onPublishNow: (item: ContentItem) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function AssetInspectorModal({
  item,
  isOpen,
  onClose,
  onUpdate,
  onPublishNow,
  onDelete,
}: AssetInspectorModalProps) {
  if (!isOpen || !item) return null

  const [title, setTitle] = useState(item.title || '')
  const [platform, setPlatform] = useState<ContentPlatform>(item.platform || 'instagram')
  const [contentType, setContentType] = useState<ContentType>(item.content_type || 'reel')
  const [status, setStatus] = useState<ContentStatus>(item.status || 'inbox')
  const [scheduledAt, setScheduledAt] = useState(
    item.scheduled_at ? new Date(item.scheduled_at).toISOString().slice(0, 16) : ''
  )
  const [caption, setCaption] = useState(item.caption || '')
  const [hook, setHook] = useState(item.hook || '')
  const [angle, setAngle] = useState(item.angle || '')
  const [cta, setCta] = useState(item.cta || '')
  const [transcript, setTranscript] = useState(item.transcript || '')
  const [tags, setTags] = useState<string[]>(item.tags || [])
  const [tagInput, setTagInput] = useState('')

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
    toast.success('Copied to clipboard!')
  }



  // Quick schedule presets
  const applySchedulePreset = (offsetDays: number, hour: number = 18, minute: number = 30) => {
    const target = new Date()
    target.setDate(target.getDate() + offsetDays)
    target.setHours(hour, minute, 0, 0)
    setScheduledAt(target.toISOString().slice(0, 16))
    setStatus('scheduled')
    toast.info(`Set to ${target.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${hour}:${minute < 10 ? '0' : ''}${minute}`)
  }

  // Save changes
  const handleSave = async (newStatus?: ContentStatus) => {
    setSaving(true)
    try {
      const targetStatus = newStatus || (scheduledAt ? 'scheduled' : status)
      await onUpdate({
        id: item.id,
        title,
        platform,
        content_type: contentType,
        status: targetStatus,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        caption,
        hook,
        angle,
        cta,
        transcript,
        tags,
      })
      toast.success('Deliverable updated successfully!')
      onClose()
    } catch (err: any) {
      console.error('Save error:', err)
      toast.error('Failed to update deliverable')
    } finally {
      setSaving(false)
    }
  }

  // Instant Publish
  const handleInstantPublish = async () => {
    setPublishing(true)
    try {
      const updatedItem: ContentItem = {
        ...item,
        title,
        platform,
        content_type: contentType,
        status: 'publishing',
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        caption,
        hook,
        angle,
        cta,
        transcript,
        tags,
      }

      await onUpdate(updatedItem)
      await onPublishNow(updatedItem)
      onClose()
    } catch (err: any) {
      console.error('Instant publish error:', err)
      toast.error('Publishing failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-black/[0.08] max-h-[92vh] flex flex-col space-y-6 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-mono uppercase font-semibold flex items-center gap-1.5 shadow-xs',
                platform === 'instagram'
                  ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  platform === 'instagram' ? 'bg-fuchsia-500' : 'bg-rose-500'
                )}
              />
              {platform} {contentType}
            </span>

            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-medium border',
                item.status === 'inbox'
                  ? 'bg-neutral-100 text-neutral-800 border-black/[0.08]'
                  : item.status === 'scheduled'
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : item.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-neutral-100 text-neutral-600 border-neutral-200'
              )}
            >
              {item.status === 'inbox' ? 'Vault Inbox (Unscheduled)' : item.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this deliverable from vault?')) {
                    onDelete(item.id)
                    onClose()
                  }
                }}
                className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Delete deliverable"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-[#9ca3af] hover:text-black rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2-Column Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-1">
          {/* Left Column: Video & Media Metadata (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Video Player or Thumbnail Preview */}
            <div className="aspect-[9/16] max-h-[340px] w-full mx-auto bg-black rounded-2xl overflow-hidden relative shadow-md flex items-center justify-center group">
              {item.drive_file_id ? (
                <iframe
                  src={`https://drive.google.com/file/d/${item.drive_file_id}/preview`}
                  className="w-full h-full border-0 pointer-events-auto"
                  allow="autoplay"
                />
              ) : item.thumbnail_url || (item.media_urls && item.media_urls[0]) ? (
                <img
                  src={item.thumbnail_url || item.media_urls[0]}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-500">
                  <Film size={36} className="opacity-50" />
                  <span className="text-xs font-mono">No Preview Available</span>
                </div>
              )}

              {item.drive_web_view_link && (
                <a
                  href={item.drive_web_view_link}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/80 hover:bg-black text-white text-[10px] font-medium rounded-lg backdrop-blur-md flex items-center gap-1 shadow-sm transition-all"
                >
                  <HardDrive size={11} />
                  <span>Open Drive Master</span>
                  <ExternalLink size={9} />
                </a>
              )}
            </div>

            {/* Video File Specifications */}
            <div className="bg-[#fbfbfd] p-3.5 rounded-2xl border border-black/[0.06] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#6b7280]">
                <span>Video Duration</span>
                <span className="font-mono text-black font-medium">
                  {item.duration_seconds ? `${Math.floor(item.duration_seconds / 60)}m ${item.duration_seconds % 60}s` : 'Short Reel (<60s)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#6b7280]">
                <span>Pipeline Format</span>
                <span className="font-mono text-black">9:16 Vertical High-Retention</span>
              </div>
              {item.drive_file_id && (
                <div className="flex items-center justify-between text-[#6b7280]">
                  <span>Source Ingestion</span>
                  <span className="font-mono text-neutral-800 bg-neutral-100 border border-black/[0.06] px-1.5 py-0.5 rounded text-[10px]">
                    Google Drive Connected
                  </span>
                </div>
              )}
            </div>

            {/* Transcript & Script Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-black flex items-center gap-1.5">
                  <FileText size={13} className="text-neutral-500" />
                  <span>Transcript / Script Notes</span>
                </label>
                <span className="text-[10px] text-[#9ca3af] font-mono">For AI analysis</span>
              </div>
              <textarea
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste talking points, captions, or script outline here to power the AI hook generator..."
                className="w-full px-3 py-2 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none focus:border-black font-light leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Right Column: AI Hook Architecture & Schedule Dispatch (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-black mb-1">Deliverable Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black font-normal outline-none focus:border-black"
              />
            </div>

            {/* Active Hook Input */}
            <div>
              <label className="block text-xs font-medium text-black mb-1">3-Second Hook</label>
              <input
                type="text"
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                placeholder="The scroll-stopping line that viewers hear in the first 3 seconds..."
                className="w-full px-3.5 py-2 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black font-medium outline-none focus:border-black"
              />
            </div>

            {/* Caption & Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-black">Caption & Post Copy</label>
              </div>
              <textarea
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write caption or use the AI generated copy..."
                className="w-full px-3 py-2 bg-[#fbfbfd] border border-black/[0.08] rounded-xl text-xs text-black outline-none focus:border-black font-light leading-relaxed resize-none"
              />
            </div>

            {/* Scheduling & Publication Dispatch */}
            <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-black">
                  <Calendar size={13} className="text-indigo-600" />
                  <span>Timeline Dispatch Scheduler</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => applySchedulePreset(0, 18, 30)}
                    className="px-2 py-0.5 bg-white hover:bg-neutral-100 border border-black/[0.08] rounded-md text-[10px] text-black cursor-pointer shadow-xs"
                  >
                    Today 18:30
                  </button>
                  <button
                    type="button"
                    onClick={() => applySchedulePreset(1, 18, 30)}
                    className="px-2 py-0.5 bg-white hover:bg-neutral-100 border border-black/[0.08] rounded-md text-[10px] text-black cursor-pointer shadow-xs"
                  >
                    Tomorrow 18:30
                  </button>
                  <button
                    type="button"
                    onClick={() => applySchedulePreset(2, 18, 30)}
                    className="px-2 py-0.5 bg-white hover:bg-neutral-100 border border-black/[0.08] rounded-md text-[10px] text-black cursor-pointer shadow-xs"
                  >
                    +2 Days
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#6b7280] font-light mb-1">
                    Scheduled Release Datetime
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => {
                      setScheduledAt(e.target.value)
                      if (e.target.value) setStatus('scheduled')
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#6b7280] font-light mb-1">
                    Pipeline Target
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPlatform('instagram')
                        setContentType('reel')
                      }}
                      className={cn(
                        'py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                        platform === 'instagram'
                          ? 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-700'
                          : 'bg-white border-black/[0.08] text-[#6b7280]'
                      )}
                    >
                      IG Reel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlatform('youtube')
                        setContentType('short')
                      }}
                      className={cn(
                        'py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                        platform === 'youtube'
                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                          : 'bg-white border-black/[0.08] text-[#6b7280]'
                      )}
                    >
                      YT Short
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-black/[0.06]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave('inbox')}
              disabled={saving}
              className="px-3.5 py-2 bg-[#f5f5f7] hover:bg-neutral-200 text-black rounded-xl text-xs font-normal cursor-pointer transition-colors"
            >
              Keep in Inbox
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-black/[0.08] hover:bg-neutral-100 rounded-xl text-xs text-[#6b7280] font-light cursor-pointer"
            >
              Cancel
            </button>

            {/* Instant publish button */}
            <button
              type="button"
              onClick={handleInstantPublish}
              disabled={publishing}
              className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              {publishing ? (
                <Loader2 size={12} className="animate-spin text-white" />
              ) : (
                <Send size={12} className="text-white" />
              )}
              <span>Publish Now to {platform === 'youtube' ? 'YouTube' : 'Instagram'}</span>
            </button>

            {/* Save & Schedule */}
            <button
              type="button"
              onClick={() => handleSave(scheduledAt ? 'scheduled' : 'draft')}
              disabled={saving}
              className="px-5 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin text-white" />
              ) : (
                <CheckCircle2 size={13} className="text-emerald-400" />
              )}
              <span>{scheduledAt ? 'Confirm & Schedule' : 'Save Deliverable'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
