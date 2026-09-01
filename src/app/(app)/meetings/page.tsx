'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Video, Play, Sparkles, Clock, Calendar as CalendarIcon, Users, 
  CheckSquare, ArrowRight, RefreshCw, Search, 
  ExternalLink, FileText, Check, Plus, MessageSquare, ChevronRight, X,
  ChevronLeft, Filter, AlertCircle, CheckCircle2, Copy
} from 'lucide-react'
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  addWeeks, subWeeks, addDays, subDays, startOfDay
} from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'
import type { FathomMeeting, FathomActionItem } from '@/lib/fathom/client'
import type { Task, Priority } from '@/types'
import Link from 'next/link'

type CalendarView = 'month' | 'week' | 'day'
type EventFilter = 'all' | 'meetings' | 'tasks'

interface UnifiedCalendarEvent {
  id: string
  title: string
  date: Date
  time: string
  durationMinutes: number
  type: 'meeting' | 'task'
  priority?: 'p0' | 'p1' | 'p2' | 'p3'
  status?: string
  project?: string
  attendees?: string[]
  meetingData?: FathomMeeting
  taskData?: Task
}

export default function MeetingsPage() {
  const [activeMainTab, setActiveMainTab] = useState<'calendar' | 'fathom'>('calendar')
  
  // Fathom State
  const [meetings, setMeetings] = useState<FathomMeeting[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingFathom, setSyncingFathom] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMeeting, setSelectedMeeting] = useState<FathomMeeting | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeModalTab, setActiveModalTab] = useState<'summary' | 'transcript' | 'actions'>('summary')
  const [convertedActionIds, setConvertedActionIds] = useState<Record<string, boolean>>({})

  // Master Calendar State
  const [calendarView, setCalendarView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [eventFilter, setEventFilter] = useState<EventFilter>('all')
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventType, setNewEventType] = useState<'meeting' | 'task'>('meeting')
  const [newEventTime, setNewEventTime] = useState('10:00')
  const [newEventDuration, setNewEventDuration] = useState(30)
  const [creatingEvent, setCreatingEvent] = useState(false)

  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      // 1. Fetch real tasks from Supabase
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*, project:projects(id, name)')
        .neq('status', 'killed')
        .order('created_at', { ascending: false })

      if (tasksData) setTasks(tasksData as Task[])

      // 2. Fetch Fathom meetings
      const res = await fetch('/api/fathom/meetings')
      const data = await res.json()
      if (data.success && Array.isArray(data.meetings)) {
        setMeetings(data.meetings)
      }
    } catch {
      toast.error('Failed to load calendar and meetings data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData(false)
  }, [fetchAllData])

  async function handleSyncFathom() {
    setSyncingFathom(true)
    try {
      await fetchAllData(true)
      toast.success('Live synced all meetings and tasks!')
    } finally {
      setSyncingFathom(false)
    }
  }

  async function handleOpenMeeting(meeting: FathomMeeting) {
    setSelectedMeeting(meeting)
    setActiveModalTab('summary')
    
    if (meeting.recording_id) {
      setLoadingDetail(true)
      try {
        const res = await fetch(`/api/fathom/recording/${meeting.recording_id}`)
        const data = await res.json()
        if (data.success && data.detail) {
          setSelectedMeeting(prev => {
            if (!prev) return null
            return {
              ...prev,
              summary: data.detail.summary || prev.summary,
              transcript: data.detail.transcript?.length > 0 ? data.detail.transcript : prev.transcript,
              action_items: data.detail.action_items?.length > 0 ? data.detail.action_items : prev.action_items
            }
          })
        }
      } catch (e) {
        console.warn('Could not fetch additional recording details:', e)
      } finally {
        setLoadingDetail(false)
      }
    }
  }

  async function convertActionToTask(item: FathomActionItem, meetingTitle: string) {
    try {
      const res = await fetch('/api/fathom/convert-to-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.text,
          description: `Extracted from Fathom meeting: "${meetingTitle}" (Assignee: ${item.assignee || 'Unassigned'})`,
          priority: 'p1'
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Task added to workspace: "${item.text.slice(0, 30)}..."`)
        setConvertedActionIds(prev => ({ ...prev, [item.id]: true }))
        fetchAllData(true)
      } else {
        toast.error(data.error || 'Failed to create task')
      }
    } catch (err: any) {
      toast.error(`Error converting to task: ${err.message}`)
    }
  }

  async function handleCreateNewEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!newEventTitle.trim()) return

    setCreatingEvent(true)
    try {
      const targetDate = selectedCalendarDay || currentDate
      const [hours, mins] = newEventTime.split(':').map(Number)
      const scheduledDate = new Date(targetDate)
      scheduledDate.setHours(hours || 10, mins || 0, 0, 0)

      const { error } = await supabase.from('tasks').insert({
        title: newEventTitle.trim(),
        description: newEventType === 'meeting' ? 'Scheduled discussion / call' : 'Scheduled task session',
        priority: 'p1',
        status: 'todo',
        due_date: scheduledDate.toISOString(),
        time_box_minutes: newEventDuration
      })

      if (error) throw error

      toast.success(newEventType === 'meeting' ? 'Meeting added to calendar!' : 'Task scheduled on calendar!')
      setShowCreateEventModal(false)
      setNewEventTitle('')
      fetchAllData(true)
    } catch (err: any) {
      toast.error(`Error scheduling: ${err.message}`)
    } finally {
      setCreatingEvent(false)
    }
  }

  // Unified Calendar Events List
  const unifiedEvents: UnifiedCalendarEvent[] = useMemo(() => {
    const list: UnifiedCalendarEvent[] = []

    // Map Fathom Meetings
    meetings.forEach((m) => {
      const date = new Date(m.recorded_at || Date.now())
      list.push({
        id: `meet-${m.id}`,
        title: m.title,
        date,
        time: format(date, 'hh:mm a'),
        durationMinutes: m.duration_minutes || 30,
        type: 'meeting',
        attendees: m.attendees.map(a => a.name),
        meetingData: m
      })
    })

    // Map Real Tasks & Deadlines
    tasks.forEach((t) => {
      const date = t.due_date ? new Date(t.due_date) : new Date(t.created_at)
      list.push({
        id: `task-${t.id}`,
        title: t.title,
        date,
        time: t.due_date ? format(new Date(t.due_date), 'hh:mm a') : 'Due Today',
        durationMinutes: t.time_box_minutes || 45,
        type: 'task',
        priority: t.priority as any,
        status: t.status,
        project: t.project?.name,
        taskData: t
      })
    })

    return list
  }, [meetings, tasks])

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'meetings') return unifiedEvents.filter(e => e.type === 'meeting')
    if (eventFilter === 'tasks') return unifiedEvents.filter(e => e.type === 'task')
    return unifiedEvents
  }, [unifiedEvents, eventFilter])

  // Month Calendar Days Generator
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Today's Agenda items
  const todayAgenda = useMemo(() => {
    const today = startOfDay(new Date())
    return unifiedEvents.filter(e => isSameDay(e.date, today))
  }, [unifiedEvents])

  // Fathom Analytics
  const totalMinutes = meetings.reduce((acc, m) => acc + m.duration_minutes, 0)
  const totalAttendees = new Set(meetings.flatMap(m => m.attendees.map(a => a.name))).size

  const filteredFathomMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.attendees.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const navigateCalendar = (dir: 'prev' | 'next') => {
    if (calendarView === 'month') {
      setCurrentDate(prev => dir === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
    } else if (calendarView === 'week') {
      setCurrentDate(prev => dir === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1))
    } else {
      setCurrentDate(prev => dir === 'prev' ? subDays(prev, 1) : addDays(prev, 1))
    }
  }

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Top Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#6b7280] uppercase tracking-wider mb-1 font-light">
            <span>CALLMY</span>
            <span>•</span>
            <span className="text-black font-normal">CALENDAR &amp; MEETINGS</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-black">
            {activeMainTab === 'calendar' ? 'Master Schedule & Calendar' : 'Fathom Meeting Recordings'}
          </h1>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 font-body">
          {/* Main Segmented Toggle */}
          <div className="p-1 bg-[#f5f5f7] rounded-2xl flex items-center gap-1 border border-black/[0.04]">
            <button
              onClick={() => setActiveMainTab('calendar')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer font-normal',
                activeMainTab === 'calendar'
                  ? 'bg-white text-black shadow-xs font-medium'
                  : 'text-[#6b7280] hover:text-black'
              )}
            >
              <CalendarIcon size={14} className={activeMainTab === 'calendar' ? 'text-indigo-600' : ''} />
              <span>Master Calendar</span>
            </button>

            <button
              onClick={() => setActiveMainTab('fathom')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer font-normal',
                activeMainTab === 'fathom'
                  ? 'bg-white text-black shadow-xs font-medium'
                  : 'text-[#6b7280] hover:text-black'
              )}
            >
              <Video size={14} className={activeMainTab === 'fathom' ? 'text-purple-600' : ''} />
              <span>Fathom AI Calls</span>
              <span className="px-1.5 py-0.2 bg-black/[0.05] rounded-full text-[10px] font-mono">
                {meetings.length}
              </span>
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSyncFathom}
            disabled={syncingFathom}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#f5f5f7] border border-black/[0.08] rounded-xl text-xs font-normal text-black transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={13} className={cn(syncingFathom && 'animate-spin')} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MASTER CALENDAR & SCHEDULE (DEFAULT)                                */}
      {/* ========================================================================= */}
      {activeMainTab === 'calendar' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Calendar Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 px-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm font-body">
            {/* Left: Navigation & Current Month */}
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-normal text-black min-w-[170px]">
                {format(currentDate, calendarView === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
              </h2>

              <div className="flex items-center gap-1 bg-[#f5f5f7] p-1 rounded-xl border border-black/[0.04]">
                <button
                  onClick={() => navigateCalendar('prev')}
                  className="p-1.5 hover:bg-white rounded-lg text-black transition-colors cursor-pointer"
                  title="Previous"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2.5 py-1 text-[11px] font-mono font-medium hover:bg-white rounded-lg text-black transition-colors cursor-pointer uppercase"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateCalendar('next')}
                  className="p-1.5 hover:bg-white rounded-lg text-black transition-colors cursor-pointer"
                  title="Next"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Right: Filters, Views & New Event Button */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Event Type Filter */}
              <div className="flex items-center gap-1 bg-[#f5f5f7] p-1 rounded-xl text-xs">
                {(['all', 'meetings', 'tasks'] as EventFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setEventFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer capitalize font-normal',
                      eventFilter === f ? 'bg-white text-black font-medium shadow-xs' : 'text-[#6b7280] hover:text-black'
                    )}
                  >
                    {f === 'all' ? 'All Events' : f === 'meetings' ? 'Meetings' : 'Tasks'}
                  </button>
                ))}
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 bg-[#f5f5f7] p-1 rounded-xl text-xs">
                {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setCalendarView(v)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer capitalize font-normal',
                      calendarView === v ? 'bg-white text-black font-medium shadow-xs' : 'text-[#6b7280] hover:text-black'
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Add New Event Button */}
              <button
                onClick={() => {
                  setSelectedCalendarDay(new Date())
                  setShowCreateEventModal(true)
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Add Event</span>
              </button>
            </div>
          </div>

          {/* Main Grid: 2-Column (Calendar + Today's Agenda) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left / Main Column: Month/Week Calendar Canvas */}
            <div className="lg:col-span-8 bg-white border border-black/[0.08] rounded-3xl p-6 shadow-sm space-y-4">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 text-center text-xs font-mono text-[#9ca3af] pb-2 border-b border-black/[0.04]">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Month Grid Cells */}
              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isTodayDate = isSameDay(day, new Date())
                  const isSelected = selectedCalendarDay ? isSameDay(day, selectedCalendarDay) : false

                  const dayEvents = filteredEvents.filter(e => isSameDay(e.date, day))

                  return (
                    <div
                      key={day.toISOString() || idx}
                      onClick={() => setSelectedCalendarDay(day)}
                      className={cn(
                        'min-h-[105px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group',
                        !isCurrentMonth && 'opacity-35 bg-[#fafafa]/50 border-transparent',
                        isCurrentMonth && 'bg-white hover:bg-[#fafbff] border-black/[0.05]',
                        isTodayDate && 'ring-2 ring-black font-semibold',
                        isSelected && 'border-indigo-600 ring-2 ring-indigo-600/30'
                      )}
                    >
                      {/* Day Number Header */}
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'text-xs font-mono w-5 h-5 flex items-center justify-center rounded-full',
                          isTodayDate ? 'bg-black text-white' : 'text-[#6b7280]'
                        )}>
                          {format(day, 'd')}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-mono text-[#9ca3af]">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event Chips */}
                      <div className="space-y-1 my-1 flex-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (event.meetingData) handleOpenMeeting(event.meetingData)
                            }}
                            className={cn(
                              'px-1.5 py-0.5 rounded-md text-[10px] font-normal truncate transition-all',
                              event.type === 'meeting'
                                ? 'bg-purple-50 text-purple-900 border border-purple-200/80 hover:bg-purple-100'
                                : 'bg-black/[0.05] text-black hover:bg-black/10'
                            )}
                            title={`${event.time} - ${event.title}`}
                          >
                            <span className="font-mono text-[9px] mr-1 opacity-70">
                              {event.type === 'meeting' ? '📹' : '✓'}
                            </span>
                            {event.title}
                          </div>
                        ))}

                        {dayEvents.length > 3 && (
                          <div className="text-[9px] font-mono text-[#9ca3af] pl-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column: Selected Day Details & Today's Agenda */}
            <div className="lg:col-span-4 space-y-6 font-body">
              {/* Selected Day Agenda Box */}
              <div className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                  <div>
                    <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block">
                      SCHEDULE FOR
                    </span>
                    <h3 className="text-base font-normal text-black">
                      {selectedCalendarDay ? format(selectedCalendarDay, 'EEEE, MMM d') : 'Today'}
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowCreateEventModal(true)}
                    className="p-1.5 text-black hover:bg-black/[0.05] rounded-xl transition-colors cursor-pointer"
                    title="Add Event"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Day's Event List */}
                {(() => {
                  const targetDay = selectedCalendarDay || new Date()
                  const dayEvents = filteredEvents.filter(e => isSameDay(e.date, targetDay))

                  if (dayEvents.length === 0) {
                    return (
                      <div className="py-10 text-center text-xs text-[#9ca3af] border border-dashed border-black/[0.08] rounded-2xl space-y-1 font-light">
                        <p className="text-black font-medium">No events scheduled</p>
                        <p>Click &quot;Add Event&quot; or sync with Google Calendar.</p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {dayEvents.map((e) => (
                        <div
                          key={e.id}
                          onClick={() => {
                            if (e.meetingData) handleOpenMeeting(e.meetingData)
                          }}
                          className={cn(
                            'p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 cursor-pointer shadow-xs',
                            e.type === 'meeting'
                              ? 'bg-purple-50/40 hover:bg-purple-50 border-purple-200/80'
                              : 'bg-[#fafafa] hover:bg-[#f5f5f7] border-black/[0.06]'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[#6b7280] flex items-center gap-1">
                              <Clock size={11} className={e.type === 'meeting' ? 'text-purple-600' : 'text-indigo-600'} />
                              <span>{e.time}</span>
                              <span>•</span>
                              <span>{e.durationMinutes}m</span>
                            </span>

                            <span className={cn(
                              'px-2 py-0.5 rounded-md text-[9px] font-mono uppercase font-semibold',
                              e.type === 'meeting' ? 'bg-purple-100 text-purple-900' : 'bg-black text-white'
                            )}>
                              {e.type === 'meeting' ? 'Meeting' : 'Task'}
                            </span>
                          </div>

                          <h4 className="text-xs font-normal text-black truncate">
                            {e.title}
                          </h4>

                          {e.attendees && e.attendees.length > 0 && (
                            <div className="text-[10px] text-[#9ca3af] font-light truncate">
                              With: {e.attendees.slice(0, 3).join(', ')}
                            </div>
                          )}

                          {e.project && (
                            <div className="text-[10px] font-mono text-[#6b7280]">
                              Project: {e.project}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Google Calendar Quick Sync Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-950 font-medium text-xs">
                    <CalendarIcon size={14} className="text-indigo-600" />
                    <span>Google Calendar Sync</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-medium">
                    Active
                  </span>
                </div>
                <p className="text-xs text-[#4b5563] font-light leading-relaxed">
                  Subscribe to your live 1-Click calendar feed or sync tasks directly with your Google account.
                </p>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline font-mono"
                >
                  <span>Manage in Settings</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FATHOM VIDEO AI CALLS & TRANSCRIPTS                                  */}
      {/* ========================================================================= */}
      {activeMainTab === 'fathom' && (
        <div className="space-y-6 animate-fadeIn font-body">
          {/* Fathom Overview Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-1">
              <span className="text-[10px] font-mono text-[#9ca3af] uppercase block">TOTAL CALLS</span>
              <span className="text-2xl font-light text-black">{meetings.length}</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-1">
              <span className="text-[10px] font-mono text-[#9ca3af] uppercase block">RECORDED MINUTES</span>
              <span className="text-2xl font-light text-black">{totalMinutes}m</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-1">
              <span className="text-[10px] font-mono text-[#9ca3af] uppercase block">ACTIVE PARTICIPANTS</span>
              <span className="text-2xl font-light text-black">{totalAttendees}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings by title, attendee, or AI summary..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-black/[0.08] focus:border-black rounded-2xl text-xs text-black outline-none font-light shadow-xs"
            />
          </div>

          {/* Meeting Cards List */}
          {loading ? (
            <div className="py-20 text-center text-xs text-[#9ca3af] font-light">
              Loading Fathom AI recordings...
            </div>
          ) : filteredFathomMeetings.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#9ca3af] border border-dashed border-black/[0.08] rounded-3xl space-y-2 font-light bg-white">
              <p className="text-black font-medium">No matching calls found</p>
              <p>Check your search query or sync new calls from Fathom.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFathomMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  onClick={() => handleOpenMeeting(meeting)}
                  className="p-6 rounded-3xl bg-white hover:bg-[#fafbff] border border-black/[0.08] transition-all cursor-pointer space-y-4 shadow-sm group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#6b7280]">
                        <Clock size={12} className="text-purple-600" />
                        <span>{format(new Date(meeting.recorded_at || Date.now()), 'dd MMM yyyy • hh:mm a')}</span>
                        <span>•</span>
                        <span>{meeting.duration_minutes}m</span>
                      </div>
                      <h3 className="text-base font-normal text-black truncate group-hover:underline">
                        {meeting.title}
                      </h3>
                    </div>

                    <span className="p-2 rounded-xl bg-purple-50 text-purple-700 flex-shrink-0">
                      <Play size={14} />
                    </span>
                  </div>

                  <p className="text-xs text-[#4b5563] font-light line-clamp-2 leading-relaxed">
                    {meeting.summary}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-black/[0.04] text-xs">
                    <div className="flex items-center gap-1.5">
                      <Users size={13} className="text-[#9ca3af]" />
                      <span className="text-[11px] text-[#6b7280] font-light">
                        {meeting.attendees.map(a => a.name).join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-indigo-600 font-mono text-[11px] group-hover:translate-x-0.5 transition-transform">
                      <span>Inspect</span>
                      <ChevronRight size={13} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE CALENDAR EVENT / TASK MODAL                                */}
      {/* ========================================================================= */}
      {showCreateEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn font-body">
          <div className="w-full max-w-md bg-white border border-black/[0.1] rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block">
                  NEW CALENDAR ENTRY
                </span>
                <h3 className="text-base font-normal text-black">Schedule Event or Task</h3>
              </div>
              <button
                onClick={() => setShowCreateEventModal(false)}
                className="p-1.5 text-[#9ca3af] hover:text-black rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewEvent} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">
                  EVENT TYPE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewEventType('meeting')}
                    className={cn(
                      'py-2 px-3 rounded-xl border text-xs font-normal cursor-pointer flex items-center justify-center gap-2',
                      newEventType === 'meeting'
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-medium'
                        : 'bg-[#fafafa] border-black/[0.06] text-[#6b7280]'
                    )}
                  >
                    <Video size={13} />
                    <span>Meeting / Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewEventType('task')}
                    className={cn(
                      'py-2 px-3 rounded-xl border text-xs font-normal cursor-pointer flex items-center justify-center gap-2',
                      newEventType === 'task'
                        ? 'bg-black text-white border-black font-medium'
                        : 'bg-[#fafafa] border-black/[0.06] text-[#6b7280]'
                    )}
                  >
                    <CheckSquare size={13} />
                    <span>Task / Focus</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">
                  TITLE
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Weekly Strategy Sync with Team"
                  className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">
                    START TIME
                  </label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">
                    DURATION (MINS)
                  </label>
                  <input
                    type="number"
                    value={newEventDuration}
                    onChange={(e) => setNewEventDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-black font-light cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs rounded-xl font-normal transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {creatingEvent ? 'Scheduling...' : 'Save to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FATHOM RECORDING & AI TRANSCRIPT MODAL                            */}
      {/* ========================================================================= */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn font-body">
          <div className="w-full max-w-3xl bg-white border border-black/[0.1] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 border-b border-black/[0.06] flex items-center justify-between bg-gradient-to-r from-neutral-50 to-white">
              <div className="space-y-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 text-xs font-mono text-[#6b7280]">
                  <Video size={13} className="text-purple-600" />
                  <span>FATHOM RECORDING</span>
                  <span>•</span>
                  <span>{format(new Date(selectedMeeting.recorded_at || Date.now()), 'dd MMM yyyy')}</span>
                </div>
                <h2 className="text-lg font-normal text-black truncate">{selectedMeeting.title}</h2>
              </div>

              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-2 text-[#9ca3af] hover:text-black hover:bg-black/[0.05] rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Segmented Tab Header */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-black/[0.04] bg-[#fafafa]">
              {[
                { id: 'summary', label: 'AI Executive Summary', icon: Sparkles },
                { id: 'transcript', label: 'Full Transcript', icon: FileText },
                { id: 'actions', label: 'Action Items & Deliverables', icon: CheckSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveModalTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer font-normal',
                    activeModalTab === tab.id
                      ? 'bg-black text-white font-medium shadow-xs'
                      : 'text-[#6b7280] hover:text-black'
                  )}
                >
                  <tab.icon size={13} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {loadingDetail && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
                  <RefreshCw size={13} className="animate-spin text-purple-600" />
                  <span>Loading full video transcript and AI intelligence...</span>
                </div>
              )}

              {/* Summary View */}
              {activeModalTab === 'summary' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.04] space-y-2">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#6b7280]">
                      Key Discussion Points
                    </h4>
                    <p className="text-xs text-[#374151] font-light leading-relaxed whitespace-pre-line">
                      {selectedMeeting.summary}
                    </p>
                  </div>

                  {(selectedMeeting.share_url || selectedMeeting.video_url || selectedMeeting.meeting_url) && (
                    <a
                      href={selectedMeeting.share_url || selectedMeeting.video_url || selectedMeeting.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-normal transition-all shadow-xs cursor-pointer"
                    >
                      <Play size={13} />
                      <span>Watch Full Fathom Recording</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}

              {/* Transcript View */}
              {activeModalTab === 'transcript' && (
                <div className="space-y-3">
                  {!selectedMeeting.transcript || selectedMeeting.transcript.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#9ca3af] font-light">
                      No timestamped transcript available for this call.
                    </div>
                  ) : (
                    selectedMeeting.transcript.map((line, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.03] space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#9ca3af]">
                          <span className="text-black font-semibold">{line.speaker}</span>
                          <span>{line.timestamp}</span>
                        </div>
                        <p className="text-xs text-[#4b5563] font-light leading-relaxed">{line.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Actions View */}
              {activeModalTab === 'actions' && (
                <div className="space-y-3">
                  {!selectedMeeting.action_items || selectedMeeting.action_items.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#9ca3af] font-light">
                      No automated action items were generated from this call.
                    </div>
                  ) : (
                    selectedMeeting.action_items.map((item) => {
                      const isConverted = convertedActionIds[item.id]

                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-between gap-4 shadow-xs"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-xs text-black font-light">{item.text}</p>
                            {item.assignee && (
                              <span className="text-[10px] font-mono text-[#9ca3af]">
                                Assignee: {item.assignee}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => convertActionToTask(item, selectedMeeting.title)}
                            disabled={isConverted}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex-shrink-0 font-normal',
                              isConverted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-black hover:bg-neutral-800 text-white shadow-xs'
                            )}
                          >
                            {isConverted ? (
                              <>
                                <Check size={13} />
                                <span>Added to Tasks</span>
                              </>
                            ) : (
                              <>
                                <Plus size={13} />
                                <span>Convert to Task</span>
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-black/[0.06] bg-[#fafafa] flex items-center justify-between">
              <span className="text-xs text-[#6b7280] font-mono">
                Fathom AI Intelligence Engine
              </span>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
