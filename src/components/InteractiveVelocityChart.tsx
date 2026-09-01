'use client'

import { useState, useMemo } from 'react'
import { format, subDays, startOfDay } from 'date-fns'
import { TrendingUp, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

interface InteractiveVelocityChartProps {
  tasks: Task[]
}

interface VelocityDay {
  date: Date
  dateLabel: string
  dayName: string
  tasksShipped: number
  minutesLogged: number
  topDeliverable: string
}

export default function InteractiveVelocityChart({ tasks }: InteractiveVelocityChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const { daysData, totalLast7Days, percentChange } = useMemo(() => {
    const today = startOfDay(new Date())

    const days: VelocityDay[] = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i)
      const dayName = format(date, 'EEE')
      const dateLabel = format(date, 'dd MMM')
      const dateKey = format(date, 'yyyy-MM-dd')

      // Filter REAL shipped tasks for this exact calendar day
      const dayTasks = tasks.filter(t => {
        if (t.status === 'shipped') {
          const tDate = t.completed_at ? new Date(t.completed_at) : (t.updated_at ? new Date(t.updated_at) : new Date(t.created_at))
          return format(tDate, 'yyyy-MM-dd') === dateKey
        }
        return false
      })

      const count = dayTasks.length
      const mins = dayTasks.reduce((sum, t) => sum + (t.time_box_minutes || 45), 0)
      const topTitle = dayTasks[0]?.title || (count > 0 ? 'Completed Deliverable' : 'No tasks completed on this day')

      return {
        date,
        dateLabel,
        dayName,
        tasksShipped: count,
        minutesLogged: mins,
        topDeliverable: topTitle
      }
    })

    const total7 = days.reduce((sum, d) => sum + d.tasksShipped, 0)

    return {
      daysData: days,
      totalLast7Days: total7,
      percentChange: total7 > 0 ? '+100%' : '0%'
    }
  }, [tasks])

  // Build SVG path coordinates
  const svgWidth = 500
  const svgHeight = 110
  const maxTasks = Math.max(4, ...daysData.map(d => d.tasksShipped))

  const points = daysData.map((d, idx) => {
    const x = (idx / (daysData.length - 1)) * (svgWidth - 40) + 20
    const y = svgHeight - (d.tasksShipped / maxTasks) * (svgHeight - 30) - 15
    return { x, y, data: d }
  })

  // Bezier curve string
  const dPath = points.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`
    const prev = points[idx - 1]
    const cx1 = prev.x + (p.x - prev.x) / 2
    const cy1 = prev.y
    const cx2 = prev.x + (p.x - prev.x) / 2
    const cy2 = p.y
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`
  }, '')

  const areaPath = `${dPath} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`

  const activeDay = hoveredIdx !== null ? daysData[hoveredIdx] : daysData[daysData.length - 1]

  return (
    <div className="bg-white border border-black/[0.08] rounded-3xl p-6 shadow-sm space-y-4 font-body">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block font-light">
            WEEKLY PROGRESS
          </span>
          <h3 className="text-base font-normal text-black">Tasks Completed Over the Last 7 Days</h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-mono text-black font-medium bg-[#f5f5f7] px-2.5 py-1 rounded-lg">
          <TrendingUp size={13} className="text-emerald-600" />
          <span>{totalLast7Days} {totalLast7Days === 1 ? 'task' : 'tasks'} this week</span>
        </div>
      </div>

      {/* SVG Velocity Chart with Interactive Hover Rings */}
      <div className="relative h-32 w-full pt-2">
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="velocityGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Glowing Area Fill */}
          <path d={areaPath} fill="url(#velocityGlow)" />

          {/* Smooth Stroke */}
          <path d={dPath} fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />

          {/* Interactive Data Points */}
          {points.map((p, idx) => (
            <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(idx)}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === idx ? 6 : 4}
                className={cn(
                  'transition-all duration-150',
                  hoveredIdx === idx ? 'fill-indigo-600 stroke-white stroke-2' : 'fill-black'
                )}
              />
              {hoveredIdx === idx && (
                <line
                  x1={p.x}
                  y1={0}
                  x2={p.x}
                  y2={svgHeight}
                  stroke="rgba(0,0,0,0.15)"
                  strokeDasharray="3 3"
                />
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Days Label Axis */}
      <div className="flex justify-between text-[11px] font-mono text-[#9ca3af] px-3">
        {daysData.map((d, idx) => (
          <span
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            className={cn(
              'cursor-pointer transition-colors',
              hoveredIdx === idx ? 'text-black font-semibold' : 'hover:text-black'
            )}
          >
            {d.dayName}
          </span>
        ))}
      </div>

      {/* Hover Info Card */}
      <div className="p-3.5 px-4 rounded-2xl bg-[#fafafa] border border-black/[0.04] flex items-center justify-between text-xs font-mono">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-black font-medium">{activeDay.dayName}, {activeDay.dateLabel}</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">
              {activeDay.tasksShipped} {activeDay.tasksShipped === 1 ? 'task' : 'tasks'} completed ({activeDay.minutesLogged}m focused)
            </span>
          </div>
          <div className="text-[11px] text-[#6b7280] truncate font-light font-body">
            {activeDay.topDeliverable}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <span className="text-[10px] text-[#9ca3af] block uppercase">Day Status</span>
          <span className="text-black font-semibold text-xs">
            {activeDay.tasksShipped > 0 ? 'Active Work' : 'Rest Day'}
          </span>
        </div>
      </div>
    </div>
  )
}
