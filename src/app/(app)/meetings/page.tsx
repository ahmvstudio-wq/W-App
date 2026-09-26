'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Video, Play, Sparkles, Clock, Calendar as CalendarIcon, Users, 
  CheckSquare, ArrowRight, RefreshCw, Search, 
  ExternalLink, FileText, Check, Plus, MessageSquare, ChevronRight, X,
  ChevronLeft, Filter, AlertCircle, CheckCircle2, Copy,
  BarChart3, PieChart, SlidersHorizontal, Timer, TrendingUp, UserCheck, Layers, ArrowUpDown
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
import type { GoogleCalendarEvent } from '@/lib/google/calendar'
import type { Task, Priority } from '@/types'
import Link from 'next/link'

type CalendarView = 'month' | 'week' | 'day'
type EventFilter = 'all' | 'meetings' | 'tasks'

type FathomDateRange = 'all' | '7d' | '30d' | '90d' | 'ytd' | 'custom'
type FathomSortBy = 'newest' | 'oldest' | 'longest' | 'shortest'
type FathomDurationFilter = 'all' | 'short' | 'medium' | 'long'

interface UnifiedCalendarEvent {
  id: string
  title: string
  date: Date
  time: string
  durationMinutes: number
  type: 'meeting' | 'task' | 'google'
  priority?: 'p0' | 'p1' | 'p2' | 'p3'
  status?: string
  project?: string
  attendees?: string[]
  meetingData?: FathomMeeting
  taskData?: Task
  googleData?: GoogleCalendarEvent
}

export default function MeetingsPage() {
  const [activeMainTab, setActiveMainTab] = useState<'calendar' | 'fathom'>('calendar')
  
  // Data State
  const [meetings, setMeetings] = useState<FathomMeeting[]>([])
  const [fathomConnected, setFathomConnected] = useState(false)
  const [quickFathomKey, setQuickFathomKey] = useState('')
  const [connectingQuickFathom, setConnectingQuickFathom] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([])
  const [googleConnected, setGoogleConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncingAll, setSyncingAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMeeting, setSelectedMeeting] = useState<FathomMeeting | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeModalTab, setActiveModalTab] = useState<'summary' | 'transcript' | 'actions'>('summary')
  const [convertedActionIds, setConvertedActionIds] = useState<Record<string, boolean>>({})
  const [copiedType, setCopiedType] = useState<'summary' | 'transcript' | null>(null)

  // Fathom Enhanced Filters & Analytics State
  const [fathomDateRange, setFathomDateRange] = useState<FathomDateRange>('all')
  const [fathomCustomStart, setFathomCustomStart] = useState<string>(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [fathomCustomEnd, setFathomCustomEnd] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'))
  const [fathomSelectedAttendee, setFathomSelectedAttendee] = useState<string>('all')
  const [fathomDurationFilter, setFathomDurationFilter] = useState<FathomDurationFilter>('all')
  const [fathomSortBy, setFathomSortBy] = useState<FathomSortBy>('newest')
  const [showFathomAnalytics, setShowFathomAnalytics] = useState<boolean>(true)

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

  const fetchAllData = useCallback(async (silent = false, forceRefresh = false) => {
    if (!silent) setLoading(true)
    try {
      // 1. Fetch real tasks from Supabase strictly scoped to active workspace
      const activeWsId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null
      let tasksQuery = supabase
        .from('tasks')
        .select('*, project:projects(id, name)')
        .neq('status', 'killed')
        .order('created_at', { ascending: false })

      if (activeWsId) {
        tasksQuery = tasksQuery.eq('workspace_id', activeWsId)
      }

      const { data: tasksData } = await tasksQuery
      if (tasksData) setTasks(tasksData as Task[])

      // 2. Fetch Fathom meetings (strictly scoped to current user's personal Fathom connection)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userFathomKey = session?.user?.user_metadata?.fathom_api_key || 
          (typeof window !== 'undefined' ? localStorage.getItem('focus_user_fathom_api_key') : null)

        if (!userFathomKey) {
          setMeetings([])
          setFathomConnected(false)
        } else {
          const headers: Record<string, string> = {
            'x-fathom-key': userFathomKey
          }
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`
          }
          if (activeWsId) {
            headers['x-workspace-id'] = activeWsId
          }

          const res = await fetch('/api/fathom/meetings' + (forceRefresh ? '?refresh=true' : ''), { headers })
          const data = await res.json()
          if (data.success && Array.isArray(data.meetings)) {
            setMeetings(data.meetings)
            setFathomConnected(Boolean(data.connected ?? true))
          } else {
            setMeetings([])
            setFathomConnected(false)
          }
        }
      } catch (e) {
        console.warn('Fathom fetch error:', e)
        setMeetings([])
        setFathomConnected(false)
      }

      // 3. Fetch Google Calendar events
      try {
        const gRes = await fetch('/api/calendar/google/events')
        const gData = await gRes.json()
        if (gData.success) {
          setGoogleConnected(Boolean(gData.connected))
          if (Array.isArray(gData.events)) {
            setGoogleEvents(gData.events)
          }
        }
      } catch (e) {
        console.warn('Google Calendar fetch error:', e)
      }
    } catch {
      toast.error('Failed to refresh calendar and meetings data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData(false)

    const onKeyUpdated = () => {
      fetchAllData(false, true)
    }
    window.addEventListener('fathom-key-updated', onKeyUpdated)
    return () => window.removeEventListener('fathom-key-updated', onKeyUpdated)
  }, [fetchAllData])

  async function handleQuickConnectFathom(e: React.FormEvent) {
    e.preventDefault()
    const key = quickFathomKey.trim()
    if (!key || connectingQuickFathom) return
    setConnectingQuickFathom(true)
    try {
      const testRes = await fetch('/api/fathom/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key })
      })
      const testData = await testRes.json()
      if (!testData.success) {
        toast.error(testData.error || 'Invalid Fathom API Key. Please verify in Fathom settings.')
        return
      }

      await supabase.auth.updateUser({
        data: { fathom_api_key: key }
      })
      localStorage.setItem('focus_user_fathom_api_key', key)
      setFathomConnected(true)
      setQuickFathomKey('')
      window.dispatchEvent(new CustomEvent('fathom-key-updated', { detail: key }))
      toast.success('Your personal Fathom account connected successfully!')
      await fetchAllData(false, true)
    } catch (err: any) {
      toast.error(`Connection error: ${err.message}`)
    } finally {
      setConnectingQuickFathom(false)
    }
  }

  async function handleSyncAll() {
    setSyncingAll(true)
    try {
      await fetchAllData(true, true)
      toast.success('Live synced Google Calendar, Fathom AI, and Tasks!')
    } finally {
      setSyncingAll(false)
    }
  }

  async function handleOpenMeeting(meeting: FathomMeeting) {
    setSelectedMeeting(meeting)
    setActiveModalTab('summary')
    
    if (meeting.recording_id) {
      setLoadingDetail(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userFathomKey = session?.user?.user_metadata?.fathom_api_key || 
          (typeof window !== 'undefined' ? localStorage.getItem('focus_user_fathom_api_key') : null)

        const headers: Record<string, string> = {}
        if (userFathomKey) headers['x-fathom-key'] = userFathomKey
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

        const res = await fetch(`/api/fathom/recording/${meeting.recording_id}`, { headers })
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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      toast.success(`${label} copied to clipboard!`)
      return true
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      toast.error('Failed to copy to clipboard')
      return false
    }
  }

  const handleCopySummary = async (meeting: FathomMeeting) => {
    const formattedSummary = [
      `Meeting: ${meeting.title}`,
      `Date: ${format(new Date(meeting.recorded_at || Date.now()), 'dd MMM yyyy, hh:mm a')}`,
      meeting.duration_minutes ? `Duration: ${meeting.duration_minutes}m` : '',
      meeting.attendees?.length ? `Attendees: ${meeting.attendees.map(a => a.name).join(', ')}` : '',
      '',
      '=== EXECUTIVE SUMMARY ===',
      meeting.summary || 'No summary available.',
      '',
      ...(meeting.key_takeaways?.length ? [
        '=== KEY TAKEAWAYS ===',
        ...meeting.key_takeaways.map((t, i) => `${i + 1}. ${t}`),
        ''
      ] : []),
      ...(meeting.action_items?.length ? [
        '=== ACTION ITEMS ===',
        ...meeting.action_items.map((a, i) => `[ ] ${a.text}${a.assignee ? ` (@${a.assignee})` : ''}`),
        ''
      ] : []),
      meeting.share_url || meeting.video_url || meeting.meeting_url 
        ? `Recording Link: ${meeting.share_url || meeting.video_url || meeting.meeting_url}` 
        : ''
    ].filter(Boolean).join('\n')

    const success = await copyToClipboard(formattedSummary, 'Meeting summary')
    if (success) {
      setCopiedType('summary')
      setTimeout(() => setCopiedType((c) => c === 'summary' ? null : c), 2500)
    }
  }

  const handleCopyTranscript = async (meeting: FathomMeeting) => {
    if (!meeting.transcript || meeting.transcript.length === 0) {
      toast.error('No transcript available to copy')
      return
    }

    const formattedTranscript = [
      `Meeting: ${meeting.title}`,
      `Date: ${format(new Date(meeting.recorded_at || Date.now()), 'dd MMM yyyy, hh:mm a')}`,
      `Total Dialogue Turns: ${meeting.transcript.length}`,
      '',
      '=== FULL TRANSCRIPT ===',
      '',
      ...meeting.transcript.map(line => {
        const time = line.timestamp ? `[${line.timestamp}] ` : ''
        const speaker = line.speaker ? `${line.speaker}: ` : ''
        return `${time}${speaker}${line.text}`
      })
    ].join('\n')

    const success = await copyToClipboard(formattedTranscript, 'Full transcript')
    if (success) {
      setCopiedType('transcript')
      setTimeout(() => setCopiedType((c) => c === 'transcript' ? null : c), 2500)
    }
  }

  async function convertActionToTask(item: FathomActionItem, meetingTitle: string) {
    try {
      const activeWsId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const res = await fetch('/api/fathom/convert-to-task', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: item.text,
          description: `Extracted from personal Fathom meeting: "${meetingTitle}" (Assignee: ${item.assignee || 'Unassigned'})`,
          priority: 'p1',
          workspaceId: activeWsId
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

    // 1. Map Fathom Meetings
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

    // 2. Map Google Calendar Events
    googleEvents.forEach((g) => {
      const date = new Date(g.start)
      const duration = Math.max(15, Math.round((new Date(g.end).getTime() - date.getTime()) / 60000))
      list.push({
        id: `gcal-${g.id}`,
        title: g.title,
        date,
        time: format(date, 'hh:mm a'),
        durationMinutes: duration || 30,
        type: 'google',
        attendees: g.attendees,
        googleData: g
      })
    })

    // 3. Map Real Tasks & Deadlines (ONLY if due_date is explicitly assigned OR task was shipped on that date)
    tasks.forEach((t) => {
      if (!t.due_date && (!t.completed_at || t.status !== 'shipped')) {
        // Skip unassigned backlog tasks from cluttering the calendar
        return
      }

      const taskDate = t.due_date ? new Date(t.due_date) : new Date(t.completed_at!)
      list.push({
        id: `task-${t.id}`,
        title: t.title,
        date: taskDate,
        time: t.due_date ? format(new Date(t.due_date), 'hh:mm a') : format(new Date(t.completed_at!), 'hh:mm a'),
        durationMinutes: t.time_box_minutes || 45,
        type: 'task',
        priority: t.priority as any,
        status: t.status,
        project: t.project?.name,
        taskData: t
      })
    })

    return list
  }, [meetings, googleEvents, tasks])

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'meetings') return unifiedEvents.filter(e => e.type === 'meeting' || e.type === 'google')
    if (eventFilter === 'tasks') return unifiedEvents.filter(e => e.type === 'task')
    return unifiedEvents
  }, [unifiedEvents, eventFilter])

  // Month Calendar Days Generator
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Unique attendees across all meetings
  const allUniqueAttendees = useMemo(() => {
    const counts: Record<string, number> = {}
    meetings.forEach(m => {
      const names = new Set(m.attendees.map(a => a.name.trim()).filter(Boolean))
      names.forEach(name => {
        counts[name] = (counts[name] || 0) + 1
      })
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [meetings])

  // Filtered Fathom Meetings based on Date Range, Attendee, Duration, Search, and Sort
  const filteredFathomMeetings = useMemo(() => {
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = null

    if (fathomDateRange === '7d') startDate = subDays(now, 7)
    else if (fathomDateRange === '30d') startDate = subDays(now, 30)
    else if (fathomDateRange === '90d') startDate = subDays(now, 90)
    else if (fathomDateRange === 'ytd') startDate = new Date(now.getFullYear(), 0, 1)
    else if (fathomDateRange === 'custom') {
      if (fathomCustomStart) startDate = startOfDay(new Date(fathomCustomStart))
      if (fathomCustomEnd) endDate = new Date(new Date(fathomCustomEnd).setHours(23, 59, 59, 999))
    }

    let list = meetings.filter(m => {
      const mDate = new Date(m.recorded_at)

      // Date range filter
      if (startDate && mDate < startDate) return false
      if (endDate && mDate > endDate) return false

      // Attendee filter
      if (fathomSelectedAttendee !== 'all') {
        const hasAttendee = m.attendees.some(a => a.name.toLowerCase() === fathomSelectedAttendee.toLowerCase())
        if (!hasAttendee) return false
      }

      // Duration filter
      if (fathomDurationFilter === 'short' && m.duration_minutes >= 15) return false
      if (fathomDurationFilter === 'medium' && (m.duration_minutes < 15 || m.duration_minutes > 45)) return false
      if (fathomDurationFilter === 'long' && m.duration_minutes <= 45) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = m.title.toLowerCase().includes(q)
        const matchSummary = m.summary.toLowerCase().includes(q)
        const matchAttendee = m.attendees.some(a => a.name.toLowerCase().includes(q))
        if (!matchTitle && !matchSummary && !matchAttendee) return false
      }

      return true
    })

    // Sort
    list.sort((a, b) => {
      const timeA = new Date(a.recorded_at).getTime()
      const timeB = new Date(b.recorded_at).getTime()
      if (fathomSortBy === 'newest') return timeB - timeA
      if (fathomSortBy === 'oldest') return timeA - timeB
      if (fathomSortBy === 'longest') return (b.duration_minutes || 0) - (a.duration_minutes || 0)
      if (fathomSortBy === 'shortest') return (a.duration_minutes || 0) - (b.duration_minutes || 0)
      return 0
    })

    return list
  }, [meetings, fathomDateRange, fathomCustomStart, fathomCustomEnd, fathomSelectedAttendee, fathomDurationFilter, fathomSortBy, searchQuery])

  // Fathom Analytics & Aggregations
  const fathomStats = useMemo(() => {
    const totalCalls = filteredFathomMeetings.length
    const totalMins = filteredFathomMeetings.reduce((acc, m) => acc + (m.duration_minutes || 0), 0)
    const totalHrs = Math.round((totalMins / 60) * 10) / 10
    const avgMins = totalCalls > 0 ? Math.round(totalMins / totalCalls) : 0
    const participantCounts: Record<string, number> = {}
    filteredFathomMeetings.forEach(m => {
      m.attendees.forEach(a => {
        const n = a.name.trim()
        if (n) participantCounts[n] = (participantCounts[n] || 0) + 1
      })
    })
    const uniqueParticipantsCount = Object.keys(participantCounts).length
    const topSpeaker = Object.entries(participantCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    // Monthly breakdown for bar graph
    const monthMap: Record<string, { monthLabel: string; callCount: number; minutes: number; order: number }> = {}
    filteredFathomMeetings.forEach(m => {
      const d = new Date(m.recorded_at)
      const key = format(d, 'yyyy-MM')
      const label = format(d, 'MMM yy')
      if (!monthMap[key]) {
        monthMap[key] = { monthLabel: label, callCount: 0, minutes: 0, order: d.getTime() }
      }
      monthMap[key].callCount++
      monthMap[key].minutes += m.duration_minutes || 0
    })

    const monthlyTrend = Object.values(monthMap).sort((a, b) => a.order - b.order)

    // Duration distribution
    const shortCalls = filteredFathomMeetings.filter(m => (m.duration_minutes || 0) < 15).length
    const mediumCalls = filteredFathomMeetings.filter(m => (m.duration_minutes || 0) >= 15 && (m.duration_minutes || 0) <= 45).length
    const longCalls = filteredFathomMeetings.filter(m => (m.duration_minutes || 0) > 45).length

    return {
      totalCalls,
      totalMins,
      totalHrs,
      avgMins,
      uniqueParticipantsCount,
      topSpeaker,
      monthlyTrend,
      durationDistribution: {
        short: shortCalls,
        medium: mediumCalls,
        long: longCalls
      },
      topParticipants: Object.entries(participantCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    }
  }, [filteredFathomMeetings])

  const totalMinutes = meetings.reduce((acc, m) => acc + m.duration_minutes, 0)
  const totalAttendees = new Set(meetings.flatMap(m => m.attendees.map(a => a.name))).size

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-6">
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 tracking-[0.14em] uppercase block">
            Product
          </span>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
              Meetings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-900 border border-black/[0.08] text-[10px] font-mono flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
              <span>{activeMainTab === 'calendar' ? `${unifiedEvents.length} events` : `${meetings.length} calls`}</span>
            </span>
          </div>
          <p className="text-sm text-neutral-500 font-normal mt-1">
            Master schedule, Google Calendar sync, and Fathom AI meeting notes.
          </p>
        </div>

        {/* Tab Switcher & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 font-body">
          {/* Main Segmented Toggle */}
          <div className="p-1 bg-[#f5f5f7] rounded-2xl flex items-center gap-1 border border-black/[0.04]">
            <button
              onClick={() => setActiveMainTab('calendar')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer font-normal',
                activeMainTab === 'calendar'
                  ? 'bg-white text-black shadow-xs font-medium'
                  : 'text-neutral-500 hover:text-black'
              )}
            >
              <CalendarIcon size={14} className={activeMainTab === 'calendar' ? 'text-black' : ''} />
              <span>Master Calendar</span>
              <span className="px-1.5 py-0.2 bg-black/[0.05] rounded-full text-[10px] font-mono">
                {unifiedEvents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveMainTab('fathom')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer font-normal',
                activeMainTab === 'fathom'
                  ? 'bg-white text-black shadow-xs font-medium'
                  : 'text-neutral-500 hover:text-black'
              )}
            >
              <Video size={14} className={activeMainTab === 'fathom' ? 'text-black' : ''} />
              <span>Fathom AI Calls</span>
              <span className="px-1.5 py-0.2 bg-black/[0.05] rounded-full text-[10px] font-mono">
                {meetings.length}
              </span>
            </button>
          </div>

          {/* Sync All Button */}
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-50 border border-black/[0.08] rounded-xl text-xs font-normal text-neutral-800 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={13} className={cn(syncingAll && 'animate-spin')} />
            <span>{syncingAll ? 'Syncing...' : 'Sync All'}</span>
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
                  onClick={() => {
                    const now = new Date()
                    setCurrentDate(now)
                    setSelectedCalendarDay(now)
                  }}
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
                    {f === 'all' ? 'All' : f === 'meetings' ? 'Meetings & Calls' : 'Tasks'}
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
                  setSelectedCalendarDay(selectedCalendarDay || new Date())
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
                          <span className="text-[10px] font-mono text-black font-semibold bg-black/[0.04] px-1.5 py-0.2 rounded-md">
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
                                ? 'bg-purple-50 text-purple-900 border border-purple-200/80 hover:bg-purple-100 font-medium'
                                : event.type === 'google'
                                ? 'bg-blue-50 text-blue-900 border border-blue-200/80 hover:bg-blue-100 font-medium'
                                : 'bg-black/[0.05] text-black hover:bg-black/10'
                            )}
                            title={`${event.time} - ${event.title}`}
                          >
                            <span className="font-mono text-[9px] mr-1 opacity-80">
                              {event.type === 'meeting' ? '📹' : event.type === 'google' ? '📅' : '✓'}
                            </span>
                            {event.title}
                          </div>
                        ))}

                        {dayEvents.length > 3 && (
                          <div className="text-[9px] font-mono text-[#9ca3af] pl-1 font-medium">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column: Selected Day Details & Connections */}
            <div className="lg:col-span-4 space-y-6 font-body">
              {/* Selected Day Agenda Box */}
              <div className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                  <div>
                    <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block">
                      SCHEDULE FOR
                    </span>
                    <h3 className="text-base font-normal text-black">
                      {selectedCalendarDay ? format(selectedCalendarDay, 'EEEE, MMM d') : format(new Date(), 'EEEE, MMM d')}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCalendarDay(selectedCalendarDay || new Date())
                      setShowCreateEventModal(true)
                    }}
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
                        <p className="text-black font-medium">No events for this date</p>
                        <p>Click &quot;Add Event&quot; or check adjacent days.</p>
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
                              ? 'bg-purple-50/50 hover:bg-purple-50 border-purple-200/80'
                              : e.type === 'google'
                              ? 'bg-blue-50/50 hover:bg-blue-50 border-blue-200/80'
                              : 'bg-[#fafafa] hover:bg-[#f5f5f7] border-black/[0.06]'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[#6b7280] flex items-center gap-1">
                              <Clock size={11} className={e.type === 'meeting' ? 'text-purple-600' : e.type === 'google' ? 'text-blue-600' : 'text-indigo-600'} />
                              <span>{e.time}</span>
                              <span>•</span>
                              <span>{e.durationMinutes}m</span>
                            </span>

                            <span className={cn(
                              'px-2 py-0.5 rounded-md text-[9px] font-mono uppercase font-semibold',
                              e.type === 'meeting' ? 'bg-purple-100 text-purple-900' : e.type === 'google' ? 'bg-blue-100 text-blue-900' : 'bg-black text-white'
                            )}>
                              {e.type === 'meeting' ? 'Fathom Call' : e.type === 'google' ? 'Google Cal' : 'Task'}
                            </span>
                          </div>

                          <h4 className="text-xs font-normal text-black truncate">
                            {e.title}
                          </h4>

                          {e.attendees && e.attendees.length > 0 && (
                            <div className="text-[10px] text-[#6b7280] font-light truncate">
                              Attendees: {e.attendees.slice(0, 3).join(', ')}
                            </div>
                          )}

                          {e.type === 'meeting' && (
                            <span className="text-[10px] font-mono text-purple-700 font-medium">
                              ✦ Click to inspect AI summary &amp; transcript
                            </span>
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

              {/* Connected Services Status Box */}
              <div className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm space-y-4">
                <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block">
                  CALENDAR &amp; MEETING CONNECTIONS
                </span>

                <div className="space-y-3 text-xs">
                  {/* Fathom Status */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#fafafa] border border-black/[0.04]">
                    <div className="flex items-center gap-2.5">
                      <Video size={15} className="text-purple-600" />
                      <div>
                        <span className="text-black font-medium block">Fathom Video AI</span>
                        <span className="text-[10px] text-[#9ca3af] font-mono">
                          {fathomConnected ? `${meetings.length} calls synced` : 'Personal account'}
                        </span>
                      </div>
                    </div>
                    {fathomConnected ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-[10px] rounded-md font-medium border border-emerald-200">
                        Connected
                      </span>
                    ) : (
                      <Link
                        href="/settings?tab=integrations"
                        className="px-2.5 py-1 bg-black text-white hover:bg-neutral-800 rounded-lg text-[10px] font-normal transition-colors"
                      >
                        Connect
                      </Link>
                    )}
                  </div>

                  {/* Google Calendar Status */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#fafafa] border border-black/[0.04]">
                    <div className="flex items-center gap-2.5">
                      <CalendarIcon size={15} className="text-indigo-600" />
                      <div>
                        <span className="text-black font-medium block">Google Calendar</span>
                        <span className="text-[10px] text-[#9ca3af] font-mono">
                          {googleConnected ? `${googleEvents.length} events loaded` : '1-Click OAuth Sync'}
                        </span>
                      </div>
                    </div>

                    {googleConnected ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-[10px] rounded-md font-medium border border-emerald-200">
                        Connected
                      </span>
                    ) : (
                      <a
                        href="/api/auth/google?service=workspace&return_to=/meetings"
                        className="px-2.5 py-1 bg-black text-white hover:bg-neutral-800 rounded-lg text-[10px] font-normal transition-colors"
                      >
                        Authorize
                      </a>
                    )}
                  </div>
                </div>

                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-mono pt-1"
                >
                  <span>Open Integrations &amp; Feed URL</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FATHOM VIDEO AI CALLS, ANALYTICS & RECORDINGS                        */}
      {/* ========================================================================= */}
      {activeMainTab === 'fathom' && (
        <div className="space-y-6 animate-fadeIn font-body">
          {!fathomConnected ? (
            <div className="bg-white border border-black/[0.08] rounded-3xl p-8 md:p-14 shadow-sm text-center max-w-2xl mx-auto space-y-6 my-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100 shadow-xs">
                <Video size={30} />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-wider font-medium border border-purple-200">
                  Personal &amp; Independent Connection
                </span>
                <h2 className="text-2xl font-light text-black tracking-tight">
                  Connect Your Personal Fathom Account
                </h2>
                <p className="text-xs text-[#6b7280] font-light max-w-lg mx-auto leading-relaxed">
                  Fathom connections are strictly independent per user. Each team member connects their own Fathom account, and your calls, client transcripts, and action items are kept private to your user profile.
                </p>
              </div>

              <form onSubmit={handleQuickConnectFathom} className="max-w-md mx-auto space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Paste your personal Fathom API Key"
                    value={quickFathomKey}
                    onChange={(e) => setQuickFathomKey(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs font-mono text-black outline-none shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={connectingQuickFathom || !quickFathomKey.trim()}
                    className="px-5 py-2.5 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white rounded-xl text-xs font-normal transition-all cursor-pointer whitespace-nowrap shadow-xs"
                  >
                    {connectingQuickFathom ? 'Connecting...' : 'Connect'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-[#6b7280] pt-1">
                  <a
                    href="https://fathom.video/settings/api"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-black hover:underline flex items-center gap-1 font-light"
                  >
                    <span>Get API key in Fathom settings</span>
                    <ExternalLink size={12} />
                  </a>
                  <Link
                    href="/settings?tab=integrations"
                    className="hover:text-black hover:underline font-light flex items-center gap-1"
                  >
                    <span>Open Settings</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Top Bar: Live Status & Graph Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 px-6 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-xs font-mono text-black font-medium">
                    FATHOM AI LIVE SYNC
                  </span>
                  <span className="text-xs font-mono text-[#6b7280]">
                    • {meetings.length} Total Historical Calls Indexed
                  </span>
                </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFathomAnalytics(prev => !prev)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border',
                  showFathomAnalytics 
                    ? 'bg-purple-50 text-purple-800 border-purple-200 font-semibold' 
                    : 'bg-white text-[#6b7280] border-black/[0.08] hover:text-black'
                )}
              >
                <BarChart3 size={13} />
                <span>{showFathomAnalytics ? 'Hide Visual Graphs' : 'Show Visual Graphs'}</span>
              </button>

              <button
                onClick={handleSyncAll}
                disabled={syncingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-black hover:bg-neutral-800 text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={cn(syncingAll && 'animate-spin')} />
                <span>{syncingAll ? 'Syncing...' : 'Sync All'}</span>
              </button>
            </div>
          </div>

          {/* Fathom Overview Aggregation Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#9ca3af] uppercase block">FILTERED CALLS</span>
                <Video size={14} className="text-purple-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-light text-black">{fathomStats.totalCalls}</span>
                <span className="text-[11px] font-mono text-[#6b7280]">
                  of {meetings.length} all-time
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#9ca3af] uppercase block">RECORDED TIME</span>
                <Clock size={14} className="text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-light text-black">{fathomStats.totalHrs}h</span>
                <span className="text-[11px] font-mono text-[#6b7280]">
                  ({fathomStats.totalMins.toLocaleString()} mins)
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#9ca3af] uppercase block">AVG DURATION</span>
                <Timer size={14} className="text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-light text-black">{fathomStats.avgMins}m</span>
                <span className="text-[11px] font-mono text-[#6b7280]">
                  per discussion
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#9ca3af] uppercase block">ACTIVE PARTICIPANTS</span>
                <Users size={14} className="text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-light text-black">{fathomStats.uniqueParticipantsCount}</span>
                <span className="text-[11px] font-mono text-[#6b7280] truncate max-w-[120px]" title={fathomStats.topSpeaker}>
                  Top: {fathomStats.topSpeaker}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Visual Graphs & Distribution Analytics */}
          {showFathomAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Graph 1: Call Volume Trend Over Time */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-black/[0.08] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-black font-medium">
                    <TrendingUp size={15} className="text-purple-600" />
                    <span>Call Volume &amp; Activity Trend</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#6b7280]">
                    {fathomStats.monthlyTrend.length} periods active
                  </span>
                </div>

                {fathomStats.monthlyTrend.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#9ca3af] font-mono">
                    No calls recorded in selected period
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Bar Chart Visualization */}
                    <div className="h-44 flex items-end gap-2 pt-4 px-2 overflow-x-auto scrollbar-thin">
                      {(() => {
                        const maxCalls = Math.max(...fathomStats.monthlyTrend.map(t => t.callCount), 1)
                        return fathomStats.monthlyTrend.map((t, idx) => {
                          const heightPercent = Math.max(12, Math.round((t.callCount / maxCalls) * 100))
                          return (
                            <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-1.5 group relative">
                              {/* Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-10 pointer-events-none bg-black text-white text-[10px] font-mono py-1 px-2 rounded-lg whitespace-nowrap shadow-lg">
                                {t.callCount} calls • {Math.round((t.minutes / 60) * 10) / 10}h
                              </div>

                              <span className="text-[10px] font-mono text-[#6b7280] font-medium group-hover:text-purple-600">
                                {t.callCount}
                              </span>

                              <div 
                                className="w-full rounded-t-md bg-gradient-to-t from-purple-800 to-purple-500 group-hover:from-purple-900 group-hover:to-indigo-500 transition-all duration-300"
                                style={{ height: `${heightPercent}%` }}
                              />

                              <span className="text-[9px] font-mono text-[#9ca3af] truncate max-w-[42px] select-none">
                                {t.monthLabel}
                              </span>
                            </div>
                          )
                        })
                      })()}
                    </div>
                    <div className="text-[10px] font-mono text-[#9ca3af] text-right">
                      Hover bars to inspect exact meetings &amp; logged hours
                    </div>
                  </div>
                )}
              </div>

              {/* Graph 2: Call Duration Distribution & Top Attendees */}
              <div className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-black font-medium">
                    <PieChart size={15} className="text-indigo-600" />
                    <span>Duration &amp; Attendees</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#6b7280]">
                    Distribution
                  </span>
                </div>

                {/* Duration Distribution Bar */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block">
                    CALL DURATION SPREAD
                  </span>
                  <div className="h-3 rounded-full bg-[#f0f1f4] flex overflow-hidden">
                    {fathomStats.totalCalls > 0 && (
                      <>
                        <div 
                          className="bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${(fathomStats.durationDistribution.short / fathomStats.totalCalls) * 100}%` }}
                          title={`<15 min: ${fathomStats.durationDistribution.short} calls`}
                        />
                        <div 
                          className="bg-purple-500 transition-all duration-500" 
                          style={{ width: `${(fathomStats.durationDistribution.medium / fathomStats.totalCalls) * 100}%` }}
                          title={`15-45 min: ${fathomStats.durationDistribution.medium} calls`}
                        />
                        <div 
                          className="bg-indigo-600 transition-all duration-500" 
                          style={{ width: `${(fathomStats.durationDistribution.long / fathomStats.totalCalls) * 100}%` }}
                          title={`>45 min: ${fathomStats.durationDistribution.long} calls`}
                        />
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-3 text-[10px] font-mono text-[#6b7280] pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>&lt;15m ({fathomStats.durationDistribution.short})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>15-45m ({fathomStats.durationDistribution.medium})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      <span>45m+ ({fathomStats.durationDistribution.long})</span>
                    </div>
                  </div>
                </div>

                {/* Top Participants List */}
                <div className="space-y-2.5 pt-2 border-t border-black/[0.04]">
                  <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block">
                    FREQUENT PARTICIPANTS
                  </span>
                  <div className="space-y-2">
                    {fathomStats.topParticipants.slice(0, 4).map(([name, count], idx) => {
                      const maxP = Math.max(...fathomStats.topParticipants.map(p => p[1]), 1)
                      const pct = Math.round((count / maxP) * 100)
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-black font-medium truncate max-w-[140px]">{name}</span>
                            <span className="text-[#6b7280]">{count} calls</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#f0f1f4] overflow-hidden">
                            <div 
                              className="h-full bg-black/80 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtering & Custom Selection Bar */}
          <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-xs space-y-4">
            {/* Range Presets & Attendee Selection */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Date Range Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-[#6b7280] uppercase flex items-center gap-1 mr-1">
                  <CalendarIcon size={13} className="text-purple-600" />
                  Date Range:
                </span>
                <div className="flex bg-[#f3f4f6] p-1 rounded-xl border border-black/[0.06]">
                  {(['all', '7d', '30d', '90d', 'ytd', 'custom'] as FathomDateRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setFathomDateRange(range)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer uppercase',
                        fathomDateRange === range 
                          ? 'bg-black text-white shadow-xs font-semibold' 
                          : 'text-[#6b7280] hover:text-black'
                      )}
                    >
                      {range === 'all' ? 'All Time' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : range === 'ytd' ? 'This Year' : 'Custom'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendee Dropdown Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#6b7280] uppercase flex items-center gap-1">
                  <UserCheck size={13} className="text-indigo-600" />
                  Attendee:
                </span>
                <select
                  value={fathomSelectedAttendee}
                  onChange={(e) => setFathomSelectedAttendee(e.target.value)}
                  className="bg-[#f3f4f6] border border-black/[0.06] rounded-xl px-3 py-1.5 text-xs text-black font-mono focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                >
                  <option value="all">All Attendees ({meetings.length})</option>
                  {allUniqueAttendees.map(([name, count]) => (
                    <option key={name} value={name}>
                      {name} ({count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort & Duration Filters */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#6b7280] uppercase flex items-center gap-1">
                  <ArrowUpDown size={13} className="text-[#9ca3af]" />
                  Sort:
                </span>
                <select
                  value={fathomSortBy}
                  onChange={(e) => setFathomSortBy(e.target.value as FathomSortBy)}
                  className="bg-[#f3f4f6] border border-black/[0.06] rounded-xl px-3 py-1.5 text-xs text-black font-mono focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="longest">Longest Duration</option>
                  <option value="shortest">Shortest Duration</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range Picker Bar */}
            {fathomDateRange === 'custom' && (
              <div className="p-3 px-4 rounded-xl bg-[#fafafa] border border-black/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="text-black font-medium">Custom Range:</span>
                  <input
                    type="date"
                    value={fathomCustomStart}
                    onChange={(e) => setFathomCustomStart(e.target.value)}
                    className="bg-white border border-black/[0.1] rounded-lg px-2.5 py-1 text-xs text-black focus:outline-none"
                  />
                  <span className="text-[#9ca3af]">to</span>
                  <input
                    type="date"
                    value={fathomCustomEnd}
                    onChange={(e) => setFathomCustomEnd(e.target.value)}
                    className="bg-white border border-black/[0.1] rounded-lg px-2.5 py-1 text-xs text-black focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setFathomCustomStart(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
                      setFathomCustomEnd(format(new Date(), 'yyyy-MM-dd'))
                    }}
                    className="px-2.5 py-1 bg-white border border-black/[0.08] hover:border-black rounded-md text-[11px] text-[#4b5563]"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => {
                      setFathomCustomStart(format(subDays(new Date(), 90), 'yyyy-MM-dd'))
                      setFathomCustomEnd(format(new Date(), 'yyyy-MM-dd'))
                    }}
                    className="px-2.5 py-1 bg-white border border-black/[0.08] hover:border-black rounded-md text-[11px] text-[#4b5563]"
                  >
                    Last 90 Days
                  </button>
                </div>
              </div>
            )}

            {/* Search Input & Reset */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search meetings by title, attendee name, or discussed topic..."
                  className="w-full pl-11 pr-4 py-2.5 bg-[#fafafa] focus:bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light shadow-2xs"
                />
              </div>

              {(searchQuery || fathomSelectedAttendee !== 'all' || fathomDateRange !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFathomSelectedAttendee('all')
                    setFathomDateRange('all')
                    setFathomDurationFilter('all')
                  }}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#4b5563] text-xs font-mono rounded-xl transition-colors cursor-pointer flex-shrink-0"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Active Filters Summary */}
            <div className="flex items-center justify-between text-xs font-mono text-[#6b7280] pt-1 border-t border-black/[0.04]">
              <span>
                Showing <strong className="text-black font-semibold">{filteredFathomMeetings.length}</strong> of {meetings.length} meetings
                {fathomSelectedAttendee !== 'all' ? ` • Filtered by: ${fathomSelectedAttendee}` : ''}
              </span>
              <span>
                Total Duration: <strong className="text-black font-semibold">{fathomStats.totalHrs} hrs</strong>
              </span>
            </div>
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

                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleCopySummary(meeting)}
                        className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors cursor-pointer"
                        title="Copy meeting summary at once"
                      >
                        <Copy size={13} />
                      </button>
                      <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                        <Play size={14} />
                      </span>
                    </div>
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
          </>
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
                  placeholder="e.g. Strategy Sync with Team"
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
            <div className="flex items-center justify-between px-6 py-3 border-b border-black/[0.04] bg-[#fafafa]">
              <div className="flex items-center gap-2">
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

              {/* Fast Copy Action Button for Active Tab */}
              <div className="flex items-center gap-2">
                {activeModalTab === 'summary' && (
                  <button
                    onClick={() => handleCopySummary(selectedMeeting)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer border shadow-2xs font-normal",
                      copiedType === 'summary'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white hover:bg-neutral-50 text-[#374151] hover:text-black border-black/[0.08]"
                    )}
                    title="Copy full AI summary at once"
                  >
                    {copiedType === 'summary' ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-700 font-medium">Summary Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-neutral-500" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>
                )}

                {activeModalTab === 'transcript' && (
                  <button
                    onClick={() => handleCopyTranscript(selectedMeeting)}
                    disabled={!selectedMeeting.transcript || selectedMeeting.transcript.length === 0}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer border shadow-2xs font-normal disabled:opacity-40 disabled:cursor-not-allowed",
                      copiedType === 'transcript'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white hover:bg-neutral-50 text-[#374151] hover:text-black border-black/[0.08]"
                    )}
                    title="Copy full transcript at once"
                  >
                    {copiedType === 'transcript' ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-700 font-medium">Transcript Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-neutral-500" />
                        <span>Copy Full Transcript</span>
                      </>
                    )}
                  </button>
                )}
              </div>
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
                  <div className="p-6 rounded-2xl bg-[#fafafa] border border-black/[0.04] space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.04] pb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-[#6b7280]">
                          Official Fathom Meeting Intelligence (Direct API Source)
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          Fathom Enhanced Summary
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopySummary(selectedMeeting)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer"
                        title="Copy full summary at once"
                      >
                        {copiedType === 'summary' ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy All</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-3 text-xs text-[#374151] leading-relaxed">
                      {selectedMeeting.summary.split('\n\n').map((block, bIdx) => {
                        const trimmedBlock = block.trim()
                        if (!trimmedBlock) return null

                        if (trimmedBlock.startsWith('## ')) {
                          return (
                            <h3 key={bIdx} className="text-sm font-semibold text-black pt-3 pb-1 border-b border-black/[0.04]">
                              {trimmedBlock.replace('## ', '')}
                            </h3>
                          )
                        }

                        if (trimmedBlock.startsWith('### ')) {
                          return (
                            <h4 key={bIdx} className="text-xs font-medium text-black pt-2 text-indigo-900">
                              {trimmedBlock.replace('### ', '')}
                            </h4>
                          )
                        }

                        // Bullet points or paragraphs
                        const lines = trimmedBlock.split('\n')
                        return (
                          <div key={bIdx} className="space-y-1.5">
                            {lines.map((l, lIdx) => {
                              const cleanLine = l.replace(/\[(.*?)\]\(.*?\)/g, (match, text) => text)
                              const isBullet = cleanLine.trim().startsWith('-') || cleanLine.trim().startsWith('*')
                              return (
                                <p key={lIdx} className={cn(isBullet ? 'pl-3 relative' : '', 'font-light leading-relaxed')}>
                                  {isBullet && <span className="absolute left-0 text-purple-600 font-bold">•</span>}
                                  {cleanLine.replace(/^[-*]\s*/, '')}
                                </p>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
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
                  {selectedMeeting.transcript && selectedMeeting.transcript.length > 0 && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 border border-black/[0.04]">
                      <div className="flex items-center gap-2 text-xs text-[#4b5563] font-light">
                        <FileText size={14} className="text-purple-600" />
                        <span>
                          <strong className="text-black font-medium">{selectedMeeting.transcript.length}</strong> dialogue turns recorded with timestamped speakers
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyTranscript(selectedMeeting)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all cursor-pointer"
                        title="Copy full transcript at once"
                      >
                        {copiedType === 'transcript' ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy All Transcript</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {!selectedMeeting.transcript || selectedMeeting.transcript.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#9ca3af] font-light">
                      No timestamped transcript available for this call.
                    </div>
                  ) : (
                    selectedMeeting.transcript.map((line, idx) => (
                      <div key={idx} className="group/line p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.03] space-y-1 relative">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#9ca3af]">
                          <span className="text-black font-semibold">{line.speaker}</span>
                          <div className="flex items-center gap-2">
                            <span>{line.timestamp}</span>
                            <button
                              onClick={() => copyToClipboard(`[${line.timestamp}] ${line.speaker}: ${line.text}`, 'Dialogue line')}
                              className="opacity-0 group-hover/line:opacity-100 p-1 hover:text-black hover:bg-black/5 rounded transition-all cursor-pointer"
                              title="Copy this line"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
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
