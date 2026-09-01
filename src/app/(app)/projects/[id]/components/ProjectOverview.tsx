'use client'

import React, { useMemo } from 'react'
import { 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts'
import { 
  CheckSquare, Clock, TrendingUp, 
  AlertTriangle, Gauge, Target, Sparkles, Activity, Layers, ArrowUpRight, Zap
} from 'lucide-react'
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG, daysUntil, cn } from '@/lib/utils'
import type { Project, Task } from '@/types'

interface ProjectOverviewProps {
  project: Project
  tasks: Task[]
}

export default function ProjectOverview({ project, tasks }: ProjectOverviewProps) {
  
  const stats = useMemo(() => {
    const total = tasks.length
    const shipped = tasks.filter(t => t.status === 'shipped').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const activeBlockers = tasks.filter(t => t.status === 'blocked').length
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'shipped').length
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const shippedLast7 = tasks.filter(t => t.status === 'shipped' && t.completed_at && new Date(t.completed_at) >= sevenDaysAgo).length
    const velocity = shippedLast7 / 7

    const shipScore = total > 0 ? (shipped / total) * 40 : 0
    const velocityScore = Math.min(velocity * 10, 30)
    const overdueScore = overdue === 0 ? 20 : Math.max(0, 20 - overdue * 5)
    const blockerScore = activeBlockers === 0 ? 10 : 0
    const healthScore = Math.round(shipScore + velocityScore + overdueScore + blockerScore)
    const completionPercent = total > 0 ? Math.round((shipped / total) * 100) : 0

    return { total, shipped, inProgress, activeBlockers, overdue, velocity, healthScore, completionPercent }
  }, [tasks])

  const statusData = useMemo(() => {
    const palette = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#ef4444']
    return Object.keys(TASK_STATUS_CONFIG).map((key, idx) => ({
      name: TASK_STATUS_CONFIG[key as keyof typeof TASK_STATUS_CONFIG].label,
      value: tasks.filter(t => t.status === key).length,
      color: palette[idx % palette.length]
    })).filter(d => d.value > 0)
  }, [tasks])

  const priorityData = useMemo(() => {
    return ['p0', 'p1', 'p2', 'p3'].map(p => ({
      name: p.toUpperCase(),
      total: tasks.filter(t => t.priority === p).length,
      shipped: tasks.filter(t => t.priority === p && t.status === 'shipped').length,
    }))
  }, [tasks])

  const velocityTrendData = [
    { day: 'Day 1', completed: 1, planned: 2 },
    { day: 'Day 2', completed: 3, planned: 4 },
    { day: 'Day 3', completed: 2, planned: 3 },
    { day: 'Day 4', completed: 5, planned: 5 },
    { day: 'Day 5', completed: 4, planned: 4 },
    { day: 'Day 6', completed: 6, planned: 5 },
    { day: 'Today', completed: stats.shipped, planned: stats.total || 8 },
  ]

  const daysLeft = project.deadline ? daysUntil(project.deadline) : null

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 font-sans">
      {/* Hero Strategic Overview Card with Ambient Glow */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#fafbff] to-[#f3f4ff] border border-black/[0.08] p-8 shadow-sm">
        {/* Soft Ambient Light Backdrops */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Project Vitals */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-black/[0.04] text-[#6b7280]">
                STATUS: {project.status.toUpperCase()}
              </span>
              <span className="text-[#9ca3af]">•</span>
              <span className="text-xs font-mono text-indigo-600 font-medium">
                {stats.shipped}/{stats.total} DELIVERABLES COMPLETED
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-light text-black tracking-tight leading-snug">
              {project.description || 'Sprint initiative in active execution.'}
            </h2>

            {/* Target Metric Badge */}
            {project.success_metric && (
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-black/[0.06] shadow-sm space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-black font-semibold">
                  <Target size={13} className="text-indigo-600" />
                  <span>TARGET SUCCESS CRITERIA</span>
                </div>
                <div className="text-xs text-[#374151] font-body font-light">
                  {project.success_metric}
                </div>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 pt-2 font-body">
              <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.04]">
                <span className="text-[10px] font-mono text-[#9ca3af] uppercase block">In Progress</span>
                <span className="text-lg font-light text-black">{stats.inProgress} Tasks</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.04]">
                <span className="text-[10px] font-mono text-[#9ca3af] uppercase block">Time Horizon</span>
                <span className="text-lg font-light text-black">{daysLeft !== null ? `${daysLeft} Days` : 'Open'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.04]">
                <span className="text-[10px] font-mono text-[#9ca3af] uppercase block">Health Score</span>
                <span className="text-lg font-light text-emerald-600">{stats.healthScore}/100</span>
              </div>
            </div>
          </div>

          {/* Right Column: Circular Multi-Ring Gauge with Ambient Glow */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-xl border border-black/[0.06] rounded-3xl shadow-sm">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(0, 0, 0, 0.05)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="url(#ambientIndigoGradient)"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * (stats.completionPercent || 10)) / 100}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="ambientIndigoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-light text-black tracking-tight">{stats.completionPercent}%</span>
                <span className="text-[10px] text-[#6b7280] font-mono uppercase tracking-wider">Completed</span>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></span>
                <span className="text-black font-medium">{stats.shipped} Delivered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d1d5db]"></span>
                <span className="text-[#6b7280]">{stats.total - stats.shipped} Remaining</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid: Velocity Area Curve + Status Distribution + Priority Load */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Sprint Velocity Area Chart with Ambient Glow */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm space-y-4 font-body">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">VELOCITY GRAPH</span>
              <h3 className="text-sm font-normal text-black">Delivery & Planned Output Curve</h3>
            </div>
            <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium">
              <TrendingUp size={13} /> {stats.velocity.toFixed(1)} Tasks/Day
            </span>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityTrendData}>
                <defs>
                  <linearGradient id="glowVelocityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                  itemStyle={{ color: '#111827', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2.5} fill="url(#glowVelocityFill)" name="Completed Tasks" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Breakdown Donut with Ambient Palette */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm space-y-4 font-body flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">DELIVERABLES</span>
              <h3 className="text-sm font-normal text-black">Status Distribution</h3>
            </div>
            <span className="text-xs font-mono text-[#6b7280]">{stats.total} Total</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px' }}
                  itemStyle={{ color: '#111827', fontSize: '12px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-[#6b7280] pt-2 border-t border-black/[0.04]">
            <span>Active Blockers</span>
            <span className={cn("font-medium", stats.activeBlockers > 0 ? "text-red-500" : "text-emerald-600")}>
              {stats.activeBlockers > 0 ? `${stats.activeBlockers} Tasks` : 'Zero Blockers'}
            </span>
          </div>
        </div>
      </div>

      {/* Priority Load Bar Chart with Ambient Gradient Bars */}
      <div className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm space-y-4 font-body">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">PRIORITIES</span>
            <h3 className="text-sm font-normal text-black">Execution Load by Priority (P0 - P3)</h3>
          </div>
        </div>

        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip 
                cursor={{ fill: 'rgba(99,102,241,0.04)' }}
                contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px' }}
              />
              <Legend />
              <Bar dataKey="total" fill="#e2e8f0" name="Total Allocated" radius={[6, 6, 0, 0]} />
              <Bar dataKey="shipped" fill="#6366f1" name="Delivered" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
