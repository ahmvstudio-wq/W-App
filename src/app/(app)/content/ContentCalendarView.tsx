'use client'

import { useState } from 'react'
import type { ContentItem } from '@/types'
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  Video,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContentCalendarViewProps {
  items: ContentItem[]
  inboxItems: ContentItem[]
  onInspectItem: (item: ContentItem) => void
  onAutoPlanSprint?: () => void
}

export function ContentCalendarView({
  items,
  inboxItems,
  onInspectItem,
  onAutoPlanSprint,
}: ContentCalendarViewProps) {
  const [daysCount, setDaysCount] = useState<14 | 30>(14)
  const [startDateOffset, setStartDateOffset] = useState<number>(0)

  // Generate date array
  const today = new Date()
  const days: Date[] = []
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + startDateOffset + i)
    days.push(d)
  }

  // Format date helper: YYYY-MM-DD
  const formatDateKey = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
  }

  // Group scheduled items by date key
  const scheduledMap = new Map<string, ContentItem[]>()
  for (const item of items) {
    if (item.scheduled_at) {
      const dateKey = item.scheduled_at.split('T')[0]
      const existing = scheduledMap.get(dateKey) || []
      existing.push(item)
      scheduledMap.set(dateKey, existing)
    }
  }

  const scheduledCount = Array.from(scheduledMap.values()).reduce(
    (acc, list) => acc + list.length,
    0
  )

  return (
    <div className="space-y-5">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-black/[0.06] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center">
            <CalendarIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-black">Content Schedule</h3>
            <p className="text-xs text-[#6b7280] font-light">
              Visual schedule for Instagram Reels and YouTube Shorts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 14 / 30 day toggle */}
          <div className="flex items-center bg-[#f5f5f7] p-1 rounded-xl border border-black/[0.04]">
            <button
              onClick={() => setDaysCount(14)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                daysCount === 14 ? 'bg-white text-black shadow-xs font-normal' : 'text-[#6b7280]'
              )}
            >
              14-Day Sprint
            </button>
            <button
              onClick={() => setDaysCount(30)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                daysCount === 30 ? 'bg-white text-black shadow-xs font-normal' : 'text-[#6b7280]'
              )}
            >
              30-Day Sprint
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStartDateOffset((prev) => prev - 7)}
              className="p-1.5 bg-white border border-black/[0.08] hover:bg-neutral-50 rounded-xl text-black transition-colors cursor-pointer shadow-xs"
              title="Previous Week"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setStartDateOffset(0)}
              className="px-2.5 py-1 bg-white border border-black/[0.08] hover:bg-neutral-50 rounded-xl text-xs text-black font-light transition-colors cursor-pointer shadow-xs"
            >
              Today
            </button>
            <button
              onClick={() => setStartDateOffset((prev) => prev + 7)}
              className="p-1.5 bg-white border border-black/[0.08] hover:bg-neutral-50 rounded-xl text-black transition-colors cursor-pointer shadow-xs"
              title="Next Week"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Auto-Plan Sprint */}
          {onAutoPlanSprint && inboxItems.length > 0 && (
            <button
              onClick={onAutoPlanSprint}
              className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Clock size={12} className="text-white" />
              <span>Auto-Plan Sprint ({inboxItems.length} Inbox)</span>
            </button>
          )}
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {days.map((day, idx) => {
          const key = formatDateKey(day)
          const dayItems = scheduledMap.get(key) || []
          const isToday =
            day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear()

          const dayOfWeek = day.toLocaleDateString([], { weekday: 'short' })
          const monthDay = day.toLocaleDateString([], { month: 'short', day: 'numeric' })

          return (
            <div
              key={key}
              className={cn(
                'min-h-[190px] rounded-2xl p-3 border flex flex-col justify-between transition-all group',
                isToday
                  ? 'bg-indigo-500/[0.03] border-indigo-500/40 shadow-xs'
                  : 'bg-white/80 border-black/[0.06] hover:border-black/[0.14]'
              )}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-black/[0.04] pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono uppercase font-semibold text-black">
                    {dayOfWeek}
                  </span>
                  <span className="text-[11px] text-[#6b7280] font-light">{monthDay}</span>
                </div>
                {isToday && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" title="Today" />
                )}
              </div>

              {/* Day Deliverables */}
              <div className="flex-1 py-2 space-y-2 overflow-y-auto max-h-[220px]">
                {dayItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-2 text-neutral-400 opacity-60">
                    <span className="text-[10px] font-mono">Open Slot</span>
                  </div>
                ) : (
                  dayItems.map((item) => {
                    const isInstagram = item.platform === 'instagram'
                    const timeStr = item.scheduled_at
                      ? new Date(item.scheduled_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '18:30'

                    return (
                      <div
                        key={item.id}
                        onClick={() => onInspectItem(item)}
                        className={cn(
                          'p-2 rounded-xl border transition-all cursor-pointer shadow-xs relative overflow-hidden group/card',
                          isInstagram
                            ? 'bg-fuchsia-500/[0.04] border-fuchsia-200/80 hover:border-fuchsia-400'
                            : 'bg-rose-500/[0.04] border-rose-200/80 hover:border-rose-400'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {/* Thumbnail */}
                          <div className="w-8 h-8 rounded-lg bg-black overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {item.thumbnail_url || (item.media_urls && item.media_urls[0]) ? (
                              <img
                                src={item.thumbnail_url || item.media_urls[0]}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Film size={12} className="text-neutral-500" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span
                                className={cn(
                                  'text-[9px] font-mono uppercase font-semibold',
                                  isInstagram ? 'text-fuchsia-700' : 'text-rose-700'
                                )}
                              >
                                {isInstagram ? 'IG Reel' : 'YT Short'}
                              </span>
                              <span className="text-[9px] font-mono text-[#6b7280]">{timeStr}</span>
                            </div>
                            <h5 className="text-[11px] font-medium text-black truncate">
                              {item.title}
                            </h5>
                          </div>
                        </div>

                        {item.hook && (
                          <div className="mt-1 text-[9px] text-[#6b7280] italic truncate">
                            "{item.hook}"
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Day Bottom Count / Add button */}
              <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[10px] text-[#6b7280] font-mono">
                <span>{dayItems.length > 0 ? `${dayItems.length} post(s)` : 'No posts'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
