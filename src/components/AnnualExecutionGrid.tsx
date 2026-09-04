'use client'

import { useState, useMemo } from 'react'
import { 
  format, subDays, addDays, subMonths, addMonths, 
  eachDayOfInterval, getDay, isSameDay, startOfDay,
  startOfWeek, endOfWeek
} from 'date-fns'
import { cn } from '@/lib/utils'
import { 
  Clock, CheckCircle2, Flame, TrendingUp, Calendar, 
  X, ExternalLink, Sparkles, ArrowRight, Filter
} from 'lucide-react'
import Link from 'next/link'
import type { Task } from '@/types'

interface AnnualExecutionGridProps {
  tasks: Task[]
}

interface LoggedItem {
  id: string
  title: string
  project: string
  priority: 'p0' | 'p1' | 'p2' | 'p3'
  status: string
  minutes: number
  timeCompleted: string
  startedAt?: string
  dueDate?: string
}

interface DayActivity {
  date: Date
  dateString: string
  dayOfWeek: number // 0-6 (Sun-Sat)
  formattedDate: string
  shortDate: string
  taskCount: number
  totalMinutes: number
  items: LoggedItem[]
  intensity: number // 0 to 4
  isToday: boolean
}

export default function AnnualExecutionGrid({ tasks }: AnnualExecutionGridProps) {
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null)
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null)
  const [gridMode, setGridMode] = useState<'past' | 'future'>('past')
  type RangePreset = '4w' | '12w' | '26w' | '52w' | 'ytd' | 'custom'
  const [rangePreset, setRangePreset] = useState<RangePreset>('52w')
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    return format(subDays(new Date(), 30), 'yyyy-MM-dd')
  })
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return format(new Date(), 'yyyy-MM-dd')
  })

  const {
    activityGrid,
    totalTasksCompleted,
    totalFocusHours,
    tasksInRangeCount,
    hoursInRangeCount,
    realStreak,
    monthLabels,
    startDate,
    endDate,
    rangeBadgeLabel
  } = useMemo(() => {
    const today = startOfDay(new Date())
    
    let rangeStart: Date
    let rangeEnd: Date

    if (rangePreset === 'custom') {
      const parsedStart = customStartDate ? startOfDay(new Date(customStartDate)) : subDays(today, 30)
      const parsedEnd = customEndDate ? startOfDay(new Date(customEndDate)) : today
      if (parsedStart > parsedEnd) {
        rangeStart = parsedEnd
        rangeEnd = parsedStart
      } else {
        rangeStart = parsedStart
        rangeEnd = parsedEnd
      }
    } else if (rangePreset === 'ytd') {
      if (gridMode === 'past') {
        rangeStart = new Date(today.getFullYear(), 0, 1)
        rangeEnd = today
      } else {
        rangeStart = today
        rangeEnd = new Date(today.getFullYear(), 11, 31)
      }
    } else {
      const days = rangePreset === '4w' ? 28 : rangePreset === '12w' ? 84 : rangePreset === '26w' ? 182 : 364
      if (gridMode === 'past') {
        rangeStart = subDays(today, days - 1)
        rangeEnd = today
      } else {
        rangeStart = today
        rangeEnd = addDays(today, days - 1)
      }
    }

    // Align grid to week boundaries starting on Monday (1)
    const gridStart = startOfWeek(rangeStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(rangeEnd, { weekStartsOn: 1 })
    const daysInterval = eachDayOfInterval({ start: gridStart, end: gridEnd })

    // Index tasks by date
    const tasksByDate: Record<string, Task[]> = {}
    
    tasks.forEach(t => {
      if (gridMode === 'past') {
        // In past mode: track tasks shipped on their exact completed_at date
        if (t.status === 'shipped') {
          const rawDate = t.completed_at || t.updated_at || t.created_at
          if (rawDate) {
            try {
              const key = format(new Date(rawDate), 'yyyy-MM-dd')
              if (!tasksByDate[key]) tasksByDate[key] = []
              tasksByDate[key].push(t)
            } catch {}
          }
        }
      } else {
        // In future mode: track tasks by their scheduled deadline (due_date)
        const rawDate = t.due_date || t.start_time
        if (rawDate) {
          try {
            const key = format(new Date(rawDate), 'yyyy-MM-dd')
            if (!tasksByDate[key]) tasksByDate[key] = []
            tasksByDate[key].push(t)
          } catch {}
        }
      }
    })

    const grid: DayActivity[] = daysInterval.map((date) => {
      const dateKey = format(date, 'yyyy-MM-dd')
      const isOutOfRange = date < rangeStart || date > rangeEnd
      const dayTasks = isOutOfRange ? [] : (tasksByDate[dateKey] || [])
      const dayOfWeek = getDay(date)
      const isTodayDate = isSameDay(date, today)

      const items: LoggedItem[] = dayTasks.map((t, idx) => {
        let exactMinutes = t.time_box_minutes || 0
        if (t.started_at && t.completed_at) {
          const diff = Math.round((new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 60000)
          if (diff > 0) exactMinutes = diff
        }

        const timeLabel = t.completed_at 
          ? format(new Date(t.completed_at), 'hh:mm a')
          : (t.due_date ? format(new Date(t.due_date), 'hh:mm a') : `${10 + (idx % 8)}:00 AM`)

        return {
          id: t.id,
          title: t.title,
          project: t.project?.name || 'General Task',
          priority: (t.priority || 'p1') as any,
          status: t.status,
          minutes: exactMinutes,
          timeCompleted: timeLabel,
          startedAt: t.started_at ? format(new Date(t.started_at), 'hh:mm a') : undefined,
          dueDate: t.due_date ? format(new Date(t.due_date), 'MMM d, hh:mm a') : undefined
        }
      })

      const totalMins = items.reduce((acc, i) => acc + i.minutes, 0)

      let intensity = 0
      if (items.length >= 5 || totalMins >= 180) intensity = 4
      else if (items.length >= 3 || totalMins >= 100) intensity = 3
      else if (items.length >= 2 || totalMins >= 60) intensity = 2
      else if (items.length >= 1) intensity = 1

      return {
        date,
        dateString: dateKey,
        dayOfWeek,
        formattedDate: format(date, 'EEEE, MMMM d, yyyy'),
        shortDate: format(date, 'MMM d'),
        taskCount: items.length,
        totalMinutes: totalMins,
        items,
        intensity,
        isToday: isTodayDate
      }
    })

    // Compute metrics
    const shippedTasks = tasks.filter(t => t.status === 'shipped')
    const totalCompleted = shippedTasks.length
    
    const totalMins = shippedTasks.reduce((sum, t) => {
      if (t.started_at && t.completed_at) {
        const diff = Math.round((new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 60000)
        if (diff > 0) return sum + diff
      }
      return sum + (t.time_box_minutes || 0)
    }, 0)

    const hours = Math.round((totalMins / 60) * 10) / 10

    // Range-specific metrics
    const inRangeCount = grid.reduce((acc, day) => acc + day.taskCount, 0)
    const inRangeMins = grid.reduce((acc, day) => acc + day.totalMinutes, 0)
    const inRangeHours = Math.round((inRangeMins / 60) * 10) / 10

    // Consecutive Daily Streak calculation
    let streakCount = 0
    let checkDate = today
    const todayKey = format(today, 'yyyy-MM-dd')
    const yesterdayKey = format(subDays(today, 1), 'yyyy-MM-dd')
    
    if ((tasksByDate[todayKey] || []).length > 0) {
      streakCount = 1
      checkDate = subDays(today, 1)
      while ((tasksByDate[format(checkDate, 'yyyy-MM-dd')] || []).length > 0) {
        streakCount++
        checkDate = subDays(checkDate, 1)
      }
    } else if ((tasksByDate[yesterdayKey] || []).length > 0) {
      streakCount = 1
      checkDate = subDays(today, 2)
      while ((tasksByDate[format(checkDate, 'yyyy-MM-dd')] || []).length > 0) {
        streakCount++
        checkDate = subDays(checkDate, 1)
      }
    }

    // Dynamic month positions across the columns
    const dynamicMonthLabels: { label: string; colIndex: number }[] = []
    let lastMonth = -1
    daysInterval.forEach((date, idx) => {
      const colIndex = Math.floor(idx / 7)
      const monthNum = date.getMonth()
      if (monthNum !== lastMonth) {
        lastMonth = monthNum
        dynamicMonthLabels.push({
          label: format(date, 'MMM'),
          colIndex
        })
      }
    })

    const badgeLabel = (() => {
      const direction = gridMode === 'past' ? 'PAST' : 'UPCOMING'
      if (rangePreset === '4w') return `${direction} 4 WEEKS`
      if (rangePreset === '12w') return `${direction} 12 WEEKS (QUARTER)`
      if (rangePreset === '26w') return `${direction} 26 WEEKS (HALF YEAR)`
      if (rangePreset === '52w') return `${direction} 52 WEEKS (FULL YEAR)`
      if (rangePreset === 'ytd') return `YEAR TO DATE (${format(today, 'yyyy')})`
      return `CUSTOM: ${format(rangeStart, 'MMM d')} – ${format(rangeEnd, 'MMM d, yyyy')}`
    })()

    return {
      activityGrid: grid,
      totalTasksCompleted: totalCompleted,
      totalFocusHours: hours,
      tasksInRangeCount: inRangeCount,
      hoursInRangeCount: inRangeHours,
      realStreak: streakCount,
      monthLabels: dynamicMonthLabels,
      startDate: rangeStart,
      endDate: rangeEnd,
      rangeBadgeLabel: badgeLabel
    }
  }, [tasks, gridMode, rangePreset, customStartDate, customEndDate])

  return (
    <div className="bg-white border border-black/[0.08] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 font-body relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block font-light">
              ACTIVITY HEATMAP
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-black text-white font-mono text-[10px] font-medium uppercase tracking-wide">
              {rangeBadgeLabel}
            </span>
          </div>
          <h3 className="text-xl font-normal text-black flex flex-wrap items-center gap-3 mt-1">
            <span>{gridMode === 'past' ? 'Shipped Work & Focus Hours' : 'Scheduled Tasks & Deadlines'}</span>
            <span className="text-xs font-mono text-[#6b7280] font-normal">
              [{tasksInRangeCount} {tasksInRangeCount === 1 ? 'task' : 'tasks'} in range • {hoursInRangeCount}h logged]
            </span>
          </h3>
        </div>

        {/* Mode Switcher & Range Presets */}
        <div className="flex flex-wrap items-center gap-3">
          {/* History vs Deadlines */}
          <div className="flex bg-[#f3f4f6] p-1 rounded-xl border border-black/[0.06]">
            <button
              onClick={() => setGridMode('past')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer',
                gridMode === 'past' ? 'bg-black text-white shadow-xs font-semibold' : 'text-[#6b7280] hover:text-black'
              )}
            >
              Shipped History
            </button>
            <button
              onClick={() => setGridMode('future')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer',
                gridMode === 'future' ? 'bg-black text-white shadow-xs font-semibold' : 'text-[#6b7280] hover:text-black'
              )}
            >
              Upcoming Deadlines
            </button>
          </div>

          {/* Range Presets */}
          <div className="flex bg-[#f3f4f6] p-1 rounded-xl border border-black/[0.06]">
            {(['4w', '12w', '26w', '52w', 'ytd', 'custom'] as RangePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => setRangePreset(preset)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer uppercase',
                  rangePreset === preset ? 'bg-black text-white shadow-xs font-semibold' : 'text-[#6b7280] hover:text-black'
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Bar (visible when 'custom' is selected) */}
      {rangePreset === 'custom' && (
        <div className="p-3.5 px-5 rounded-2xl bg-[#fafafa] border border-black/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs font-mono animate-fadeIn">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-black font-medium flex items-center gap-1.5">
              <Calendar size={13} className="text-indigo-600" />
              Custom Range:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-black/[0.1] rounded-lg px-2.5 py-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <span className="text-[#9ca3af]">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-black/[0.1] rounded-lg px-2.5 py-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          {/* Quick presets for custom */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCustomStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
                setCustomEndDate(format(new Date(), 'yyyy-MM-dd'))
              }}
              className="px-2.5 py-1 rounded-md text-[11px] bg-white border border-black/[0.08] hover:border-black text-[#4b5563] hover:text-black transition-colors"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => {
                setCustomStartDate(format(subDays(new Date(), 90), 'yyyy-MM-dd'))
                setCustomEndDate(format(new Date(), 'yyyy-MM-dd'))
              }}
              className="px-2.5 py-1 rounded-md text-[11px] bg-white border border-black/[0.08] hover:border-black text-[#4b5563] hover:text-black transition-colors"
            >
              Last 90 Days
            </button>
          </div>
        </div>
      )}

      {/* Legend & Summary */}
      <div className="flex items-center justify-between text-xs font-mono text-[#6b7280]">
        <div className="flex items-center gap-3">
          <span>{gridMode === 'past' ? 'No shipped work' : 'No deadlines'}</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#f0f1f4] border border-black/[0.04]" title="0 tasks" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#cbd5e1]" title="1 task" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#64748b]" title="2 tasks" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#334155]" title="3-4 tasks" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#0f172a]" title="5+ tasks" />
          </div>
          <span className="text-black font-medium">High output</span>
        </div>
        <span className="hidden sm:inline text-[11px] text-[#9ca3af]">
          Showing {activityGrid.length} days ({Math.ceil(activityGrid.length / 7)} weeks)
        </span>
      </div>

      {/* Dynamic Calendar Matrix with Synchronized Month Header */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="inline-flex flex-col gap-1.5 min-w-full">
          {/* Months Header Timeline (Synchronous with column positions) */}
          <div className="flex gap-3 pl-8">
            <div className="relative h-4 text-[10px] font-mono text-[#6b7280] select-none flex-1">
              {monthLabels.map((m, idx) => (
                <span
                  key={`${m.label}-${idx}`}
                  className="absolute font-medium uppercase tracking-wider"
                  style={{ left: `${12 + m.colIndex * 20}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Day-of-week labels + Grid */}
          <div className="flex gap-3 items-start">
            {/* Day-of-week labels column (Row 0=Mon, Row 2=Wed, Row 4=Fri, Row 6=Sun) */}
            <div className="flex flex-col justify-between text-[10px] font-mono text-[#9ca3af] py-3 select-none flex-shrink-0 w-6 h-[142px]">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>

            {/* Dynamic Column Grid (7 rows per column: Mon to Sun) */}
            <div 
              className="grid grid-flow-col auto-cols-max gap-1.5 p-3 rounded-2xl bg-[#fafafa] border border-black/[0.04]"
              style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}
            >
              {activityGrid.map((day) => {
                const shades = [
                  'bg-[#f0f1f4] hover:bg-black/10 border-black/[0.03]',
                  'bg-[#cbd5e1] hover:bg-[#94a3b8]',
                  'bg-[#64748b] hover:bg-[#475569]',
                  'bg-[#334155] hover:bg-[#1e293b]',
                  'bg-[#0f172a] hover:bg-black',
                ]

                const isSelected = selectedDay?.dateString === day.dateString
                const isHovered = hoveredDay?.dateString === day.dateString

                return (
                  <button
                    key={day.dateString}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    onMouseEnter={() => setHoveredDay(day)}
                    className={cn(
                      'w-3.5 h-3.5 rounded-[3px] transition-all duration-150 cursor-pointer border relative',
                      shades[day.intensity],
                      day.isToday && 'ring-2 ring-black font-bold',
                      (isSelected || isHovered) && 'ring-2 ring-indigo-600 scale-125 z-10 shadow-sm'
                    )}
                    title={`${day.formattedDate}${day.isToday ? ' (TODAY)' : ''}: ${day.taskCount} ${gridMode === 'past' ? 'shipped' : 'scheduled'}, ${day.totalMinutes}m duration`}
                  >
                    {day.isToday && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Interactive Hover Bar */}
      <div className="p-3.5 px-5 rounded-2xl bg-[#f8f9fc] border border-black/[0.05] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <Calendar size={14} className="text-indigo-600" />
          <span className="text-black font-medium">
            {hoveredDay 
              ? `${hoveredDay.formattedDate}${hoveredDay.isToday ? ' (Today)' : ''}` 
              : (selectedDay ? `${selectedDay.formattedDate}${selectedDay.isToday ? ' (Today)' : ''}` : 'Hover or click any calendar square')}
          </span>
          <span>•</span>
          <span className="text-emerald-700 font-semibold">
            {hoveredDay 
              ? `${hoveredDay.taskCount} ${hoveredDay.taskCount === 1 ? 'task' : 'tasks'} shipped (${hoveredDay.totalMinutes}m work duration)` 
              : `${selectedDay ? `${selectedDay.taskCount} tasks shipped` : 'Click to inspect'}`}
          </span>
        </div>

        <span className="text-[11px] text-[#6b7280]">
          💡 Tracks work duration between task start (in progress) and finish (shipped)
        </span>
      </div>

      {/* Footer Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-black/[0.04] text-xs font-mono">
        <div className="flex items-center gap-2 text-[#6b7280]">
          <TrendingUp size={14} className="text-emerald-600" />
          <span className="text-black font-semibold">{totalTasksCompleted} Shipped Deliverables</span>
          <span>across all active projects</span>
        </div>

        <div className="flex items-center gap-3 text-[#6b7280]">
          <div className="flex items-center gap-1.5">
            <Flame size={14} className="text-amber-500" />
            <span className="font-semibold text-black">{realStreak} DAY STREAK</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-indigo-600" />
            <span>{totalFocusHours} Tracked Work Hours</span>
          </div>
        </div>
      </div>

      {/* Full Detail History Modal (Opens upon clicking any block) */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white border border-black/[0.1] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 border-b border-black/[0.06] flex items-center justify-between bg-gradient-to-r from-neutral-50 to-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-[#6b7280]">
                  <Calendar size={13} className="text-indigo-600" />
                  <span>DAY WORK SUMMARY</span>
                  <span>•</span>
                  <span className="text-black uppercase font-medium">
                    {selectedDay.shortDate} {selectedDay.isToday ? '(TODAY)' : ''}
                  </span>
                </div>
                <h2 className="text-lg font-normal text-black">{selectedDay.formattedDate}</h2>
              </div>

              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 text-[#9ca3af] hover:text-black hover:bg-black/[0.05] rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 p-4 px-6 bg-[#fafafa] border-b border-black/[0.04] text-center font-mono">
              <div className="p-3 bg-white rounded-2xl border border-black/[0.04]">
                <span className="text-[10px] text-[#9ca3af] uppercase block">SHIPPED TASKS</span>
                <span className="text-lg font-semibold text-black">{selectedDay.taskCount}</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-black/[0.04]">
                <span className="text-[10px] text-[#9ca3af] uppercase block">TRACKED WORK DURATION</span>
                <span className="text-lg font-semibold text-black">{selectedDay.totalMinutes}m</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-black/[0.04]">
                <span className="text-[10px] text-[#9ca3af] uppercase block">OUTPUT INTENSITY</span>
                <span className="text-lg font-semibold text-indigo-600">Level {selectedDay.intensity} of 4</span>
              </div>
            </div>

            {/* Modal Scrollable Content: Detailed Task Breakdown */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block">
                  TASKS SHIPPED ON THIS DATE
                </span>
                <span className="text-xs font-mono text-[#9ca3af]">{selectedDay.items.length} tasks</span>
              </div>

              {selectedDay.items.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#9ca3af] border border-dashed border-black/[0.08] rounded-2xl space-y-1">
                  <p className="text-black font-medium">No tasks shipped on this date</p>
                  <p>Tasks completed and marked &quot;Shipped&quot; on this calendar date will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedDay.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-2xl bg-white hover:bg-[#fafbff] border border-black/[0.08] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase',
                            item.priority === 'p0' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-black/[0.05] text-black'
                          )}>
                            {item.priority.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-[#9ca3af] bg-black/[0.02] px-2 py-0.5 rounded-md">
                            {item.project}
                          </span>
                          <span className="text-[10px] font-mono text-[#6b7280]">
                            • Shipped at {item.timeCompleted}
                          </span>
                        </div>

                        <h4 className="text-xs font-normal text-black truncate group-hover:underline">
                          {item.title}
                        </h4>

                        {item.startedAt && (
                          <span className="text-[10px] font-mono text-[#9ca3af] block">
                            Started at {item.startedAt} • Tracked duration: {item.minutes}m
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right font-mono text-xs">
                          <span className="text-black font-medium">{item.minutes}m</span>
                          <span className="text-[10px] text-[#9ca3af] block">work duration</span>
                        </div>

                        <Link
                          href={`/tasks/${item.id}`}
                          className="p-2 text-[#9ca3af] hover:text-black hover:bg-black/[0.05] rounded-xl transition-colors"
                          title="Open Dedicated Task Page"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-black/[0.06] bg-[#fafafa] flex items-center justify-between">
              <span className="text-xs text-[#6b7280] font-mono">
                Real-time workspace activity
              </span>
              <button
                onClick={() => setSelectedDay(null)}
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
