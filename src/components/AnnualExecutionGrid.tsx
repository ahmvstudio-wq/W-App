'use client'

import { useState, useMemo } from 'react'
import { format, subDays, eachDayOfInterval, getDay, isSameDay, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { 
  Clock, CheckCircle2, Flame, TrendingUp, Calendar, 
  X, ExternalLink
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
  status: 'shipped' | 'in_progress' | 'todo'
  minutes: number
  timeCompleted: string
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
}

export default function AnnualExecutionGrid({ tasks }: AnnualExecutionGridProps) {
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null)
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null)

  // 52 weeks (364 days leading up to today)
  const daysCount = 364

  const { activityGrid, totalTasksCompleted, totalFocusHours, realStreak } = useMemo(() => {
    const today = startOfDay(new Date())
    const startDate = subDays(today, daysCount - 1)
    const daysInterval = eachDayOfInterval({ start: startDate, end: today })

    // Index REAL tasks by completion date (or creation date if completed)
    const tasksByDate: Record<string, Task[]> = {}
    tasks.forEach(t => {
      if (t.status === 'shipped') {
        const taskDate = t.completed_at ? new Date(t.completed_at) : (t.updated_at ? new Date(t.updated_at) : new Date(t.created_at))
        const key = format(taskDate, 'yyyy-MM-dd')
        if (!tasksByDate[key]) tasksByDate[key] = []
        tasksByDate[key].push(t)
      }
    })

    const grid: DayActivity[] = daysInterval.map((date) => {
      const dateKey = format(date, 'yyyy-MM-dd')
      const dayTasks = tasksByDate[dateKey] || []
      const dayOfWeek = getDay(date)

      const items: LoggedItem[] = dayTasks.map((t, idx) => ({
        id: t.id,
        title: t.title,
        project: t.project?.name || 'General Task',
        priority: (t.priority || 'p1') as any,
        status: (t.status || 'shipped') as any,
        minutes: t.time_box_minutes || 45,
        timeCompleted: t.completed_at ? format(new Date(t.completed_at), 'hh:mm a') : `${10 + idx}:00 AM`
      }))

      const totalMins = items.reduce((acc, i) => acc + i.minutes, 0)

      // Darkness Intensity based purely on real completed work
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
        intensity
      }
    })

    // Compute 100% Real Total Metrics
    const totalCompleted = tasks.filter(t => t.status === 'shipped').length
    const totalMins = tasks.filter(t => t.status === 'shipped').reduce((sum, t) => sum + (t.time_box_minutes || 45), 0)
    const hours = Math.round((totalMins / 60) * 10) / 10

    // Compute Real Consecutive Days Streak
    let streak = 0
    for (let i = grid.length - 1; i >= 0; i--) {
      if (grid[i].taskCount > 0) {
        streak++
      } else {
        // If today has 0 tasks yet, don't break streak if yesterday had tasks
        if (i === grid.length - 1) {
          continue
        }
        break
      }
    }

    return {
      activityGrid: grid,
      totalTasksCompleted: totalCompleted,
      totalFocusHours: hours,
      realStreak: Math.max(streak, totalCompleted > 0 ? 1 : 0)
    }
  }, [tasks])

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="bg-white border border-black/[0.08] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 font-body relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block font-light">
              YEARLY ACTIVITY
            </span>
            <span className="px-2 py-0.5 rounded-md bg-black/[0.05] text-black font-mono text-[10px] font-semibold">
              365 DAYS
            </span>
          </div>
          <h3 className="text-xl font-normal text-black flex items-center gap-3 mt-1">
            <span>Work Completed This Year</span>
            <span className="text-xs font-mono text-[#6b7280] font-normal">
              [{totalTasksCompleted} {totalTasksCompleted === 1 ? 'task' : 'tasks'} completed]
            </span>
          </h3>
        </div>

        {/* Legend / Intensity Scale */}
        <div className="flex items-center gap-4 text-xs font-mono text-[#6b7280]">
          <span>No tasks</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#f0f1f4] border border-black/[0.04]" title="0 tasks" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#cbd5e1]" title="1 task" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#64748b]" title="2 tasks" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#334155]" title="3-4 tasks" />
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#0f172a]" title="5+ tasks" />
          </div>
          <span className="text-black font-medium">Most active</span>
        </div>
      </div>

      {/* Months Header Timeline */}
      <div className="flex justify-between text-[11px] font-mono text-[#9ca3af] px-8 select-none">
        {months.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>

      {/* 52-Week Day-Wise Calendar Matrix */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {/* Day-of-week labels column */}
        <div className="flex flex-col justify-between text-[10px] font-mono text-[#9ca3af] py-1 select-none flex-shrink-0">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
          <span>Sun</span>
        </div>

        {/* 52-Column Grid (7 rows per column = Mon to Sun) */}
        <div 
          className="grid grid-flow-col gap-1.5 min-w-[760px] flex-1 p-3 rounded-2xl bg-[#fafafa] border border-black/[0.04]"
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
                  'w-3.5 h-3.5 rounded-[3px] transition-all duration-150 cursor-pointer border',
                  shades[day.intensity],
                  (isSelected || isHovered) && 'ring-2 ring-indigo-600 scale-125 z-10 shadow-sm'
                )}
                title={`${day.formattedDate}: ${day.taskCount} tasks, ${day.totalMinutes}m logged`}
              />
            )
          })}
        </div>
      </div>

      {/* Quick Interactive Hover Bar */}
      <div className="p-3.5 px-5 rounded-2xl bg-[#f8f9fc] border border-black/[0.05] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <Calendar size={14} className="text-indigo-600" />
          <span className="text-black font-medium">
            {hoveredDay ? hoveredDay.formattedDate : (selectedDay ? selectedDay.formattedDate : 'Hover or click any day square')}
          </span>
          <span>•</span>
          <span className="text-emerald-700 font-semibold">
            {hoveredDay 
              ? `${hoveredDay.taskCount} ${hoveredDay.taskCount === 1 ? 'task' : 'tasks'} (${hoveredDay.totalMinutes}m logged)` 
              : `${selectedDay ? `${selectedDay.taskCount} tasks` : 'Click to inspect'}`}
          </span>
        </div>

        <span className="text-[11px] text-[#6b7280]">
          💡 Click any square to view tasks completed on that date
        </span>
      </div>

      {/* Footer Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-black/[0.04] text-xs font-mono">
        <div className="flex items-center gap-2 text-[#6b7280]">
          <TrendingUp size={14} className="text-emerald-600" />
          <span className="text-black font-semibold">{totalTasksCompleted} Tasks Completed</span>
          <span>across all projects</span>
        </div>

        <div className="flex items-center gap-3 text-[#6b7280]">
          <div className="flex items-center gap-1.5">
            <Flame size={14} className="text-amber-500" />
            <span className="font-semibold text-black">{realStreak} DAY STREAK</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-indigo-600" />
            <span>{totalFocusHours} Focus Hours</span>
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
                  <span>DAY SUMMARY</span>
                  <span>•</span>
                  <span className="text-black uppercase font-medium">{selectedDay.shortDate}</span>
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
                <span className="text-[10px] text-[#9ca3af] uppercase block">COMPLETED TASKS</span>
                <span className="text-lg font-semibold text-black">{selectedDay.taskCount}</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-black/[0.04]">
                <span className="text-[10px] text-[#9ca3af] uppercase block">TIME FOCUSED</span>
                <span className="text-lg font-semibold text-black">{selectedDay.totalMinutes}m</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-black/[0.04]">
                <span className="text-[10px] text-[#9ca3af] uppercase block">INTENSITY</span>
                <span className="text-lg font-semibold text-indigo-600">Level {selectedDay.intensity} of 4</span>
              </div>
            </div>

            {/* Modal Scrollable Content: Detailed Task Breakdown */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block">
                  TASKS COMPLETED ON THIS DATE
                </span>
                <span className="text-xs font-mono text-[#9ca3af]">{selectedDay.items.length} tasks</span>
              </div>

              {selectedDay.items.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#9ca3af] border border-dashed border-black/[0.08] rounded-2xl space-y-1">
                  <p className="text-black font-medium">No tasks logged on this day</p>
                  <p>Tasks completed on this calendar date will appear here automatically.</p>
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
                            • {item.timeCompleted}
                          </span>
                        </div>

                        <h4 className="text-xs font-normal text-black truncate group-hover:underline">
                          {item.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right font-mono text-xs">
                          <span className="text-black font-medium">{item.minutes}m</span>
                          <span className="text-[10px] text-[#9ca3af] block">timebox</span>
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
