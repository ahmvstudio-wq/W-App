'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { callGroq, buildWorkspaceContext } from '@/lib/groq/client'
import { cn, formatDateTime, getInitials, PRIORITY_CONFIG, TASK_STATUS_CONFIG, getProjectHealth } from '@/lib/utils'
import { 
  CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp, TrendingDown,
  Play, Check, X, RefreshCw, MessageSquare, ChevronRight, Zap,
  Flame, Clock, Target, Calendar as CalendarIcon, ArrowUpRight,
  ShieldCheck, Activity, Award, Sparkles, FolderKanban
} from 'lucide-react'
import type { Task, Project, User } from '@/types'
import { toast } from 'sonner'
import Link from 'next/link'

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [brief, setBrief] = useState<string | null>(null)
  const [generatingBrief, setGeneratingBrief] = useState(false)
  const [userName, setUserName] = useState<string>('Founder')

  useEffect(() => {
    fetchData(false)
    
    const channel = supabase.channel('dashboard_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchData(true))
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchData(silent = false) {
    if (!silent) setLoading(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    setUserName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Founder')

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*, owner:profiles(*), project:projects(*)')
      .order('created_at', { ascending: false })
      
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*, owner:profiles(*), tasks(*)')
      .order('updated_at', { ascending: false })

    const activeTasks = tasksData || []
    const activeProjects = projectsData || []

    setTasks(activeTasks)
    setProjects(activeProjects)
    setLoading(false)
    
    if (!brief && activeTasks.length > 0) {
      generateBrief(activeTasks, activeProjects)
    }
  }

  async function generateBrief(currentTasks: Task[], currentProjects: Project[]) {
    setGeneratingBrief(true)
    const topTask = currentTasks.find(t => t.priority === 'p0' && t.status !== 'shipped' && t.status !== 'killed')?.title
    const biggestBlocker = currentTasks.find(t => t.status === 'blocked')?.title
    const slowProject = currentProjects.find(p => getProjectHealth(p as any) === 'red')?.name

    try {
      const generated = await callGroq([
        { role: 'system', content: 'Generate an executive morning brief in exactly 3 punchy bullet points. Direct, outcome-oriented. Under 70 words total.' },
        { role: 'user', content: `Top priority: ${topTask || 'None pending'}\nBlocker: ${biggestBlocker || 'Zero active blockers'}\nProject: ${slowProject || 'All on track'}` }
      ])
      setBrief(generated)
    } catch {
      setBrief('• P0 Priority: Focus on immediate core deliverables.\n• Zero critical blockers recorded.\n• Maintain high execution velocity.')
    }
    setGeneratingBrief(false)
  }

  async function updateTaskStatus(taskId: string, newStatus: any) {
    const updates: any = { status: newStatus }
    if (newStatus === 'shipped') {
      updates.completed_at = new Date().toISOString()
    } else if (newStatus === 'in_progress') {
      updates.started_at = new Date().toISOString()
    }
    
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)
    if (error) {
      toast.error('Failed to update task')
    } else {
      toast.success(`Task moved to ${newStatus}`)
      fetchData(true)
    }
  }

  // Derived Metrics
  const shippedTasks = tasks.filter(t => t.status === 'shipped')
  const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress')
  const blockedTasks = tasks.filter(t => t.status === 'blocked')
  const p0Tasks = tasks.filter(t => (t.priority === 'p0' || t.priority === 'p1') && t.status !== 'shipped' && t.status !== 'killed')
  const totalFocusMinutes = tasks.reduce((acc, t) => acc + (t.status === 'shipped' ? (t.time_box_minutes || 45) : 0), 240)
  const totalHours = (totalFocusMinutes / 60).toFixed(1)

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8a8d95] uppercase tracking-wider mb-1">
            <span>[0034:0075]</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">SYSTEM_STATUS [HEALTHY]</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Executive Command Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => generateBrief(tasks, projects)}
            disabled={generatingBrief}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-xs font-medium text-[#f0ede8] transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={cn(generatingBrief && 'animate-spin text-[#c8f135]')} />
            <span>Regenerate Brief</span>
          </button>
          
          <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#8b5cf6]/20 to-[#c8f135]/20 border border-[#c8f135]/30 text-xs font-mono text-[#c8f135] flex items-center gap-2">
            <Flame size={14} className="text-orange-400 animate-pulse" />
            <span>449 DAY STREAK</span>
          </div>
        </div>
      </div>

      {/* Hero Insight Card (Reference 9 & 5 Aesthetic) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16181d] via-[#121316] to-[#0c0d0f] border border-white/[0.08] p-8 shadow-glass">
        {/* Topographic ambient mesh */}
        <div className="absolute inset-0 bg-topo-pattern opacity-40 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial-gradient from-[#8b5cf6]/10 to-transparent blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Greeting & Big Punchy Value */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8b5cf6] to-[#a594f9] p-0.5 shadow-glow-purple flex items-center justify-center">
                <span className="font-bold text-black text-sm">{getInitials(userName)}</span>
              </div>
              <div>
                <span className="text-xs font-mono text-[#a594f9] uppercase tracking-wider block">CHIEF OF STAFF ONLINE</span>
                <span className="text-sm font-semibold text-white">Hello, {userName}!</span>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {totalHours} hours focused <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f0ede8] to-[#8a8d95]">
                thanks to smart execution.
              </span>
            </h2>

            <div className="flex items-center gap-3 text-xs text-[#8a8d95]">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono font-medium border border-emerald-500/20">
                +15% velocity
              </span>
              <span>compared to last week</span>
            </div>

            {/* AI Briefing Summary */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-mono text-[#c8f135] mb-1.5">
                <Sparkles size={13} />
                <span>MORNING INTELLIGENCE BRIEF</span>
              </div>
              <div className="text-xs text-[#d1d5db] whitespace-pre-line leading-relaxed font-sans">
                {brief || 'Analyzing current priorities and blocker state...'}
              </div>
            </div>
          </div>

          {/* Right Column: Radial Arc Donut Gauge */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/[0.04] rounded-3xl backdrop-blur-md">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Animated SVG Donut Gauge */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="10"
                />
                {/* Regular Work Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset="125"
                  strokeLinecap="round"
                  className="opacity-60"
                />
                {/* High Deep Work Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="url(#purpleGradient)"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset="80"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#c8f135" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-white tracking-tight">{totalFocusMinutes}</span>
                <span className="text-[10px] text-[#8a8d95] font-mono uppercase tracking-wider">Minutes Logged</span>
              </div>
            </div>

            {/* Split Legend */}
            <div className="flex items-center gap-6 mt-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] shadow-glow-purple"></span>
                <span className="text-white font-medium">Deep Work 65.6%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>
                <span className="text-[#8a8d95]">Operations 34.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Projects Completed Bento + November Heat Totals + Task Progress (Reference 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Projects Completed Milestone Slider (Reference 7 - Top Left) */}
        <div className="lg:col-span-7 bg-[#141618] border border-white/[0.08] rounded-3xl p-6 shadow-glass space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Projects progress</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-[#8a8d95] font-mono">
                  {projects.length} Active
                </span>
              </div>
              <span className="text-xs text-[#8a8d95] font-mono bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                Sprint Horizon
              </span>
            </div>

            {/* Multi-Segment Milestone Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-[11px] font-mono text-[#8a8d95]">
                <span>TOTAL SHIP PROGRESS</span>
                <span className="text-[#c8f135] font-bold">55%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/[0.06] relative overflow-hidden flex">
                <div className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#a594f9] w-[25%] rounded-l-full"></div>
                <div className="h-full bg-[#ff4d2e] w-[30%]"></div>
                <div className="h-full striped-track flex-1"></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#52545a] pt-1">
                <span>0% START</span>
                <span>25% MVP</span>
                <span className="text-white">55% CURRENT</span>
                <span>100% SHIPPED</span>
              </div>
            </div>

            {/* Mini Project Cards List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {projects.slice(0, 2).map((p) => {
                const pTasks = p.tasks || []
                const shipped = pTasks.filter(t => t.status === 'shipped').length
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-6 h-6 rounded-lg bg-[#c8f135]/20 flex items-center justify-center text-[#c8f135]">
                        <FolderKanban size={12} />
                      </div>
                      <span className="text-[10px] font-mono text-[#8a8d95]">{shipped}/{pTasks.length || 0}</span>
                    </div>
                    <div className="text-xs font-bold text-white truncate group-hover:text-[#c8f135] transition-colors">{p.name}</div>
                    <div className="text-[10px] text-[#6b6e75] truncate mt-0.5">{p.status.toUpperCase()}</div>
                  </Link>
                )
              })}

              {/* Velocity Score Badge */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.06] flex flex-col justify-between">
                <span className="text-[10px] font-mono text-[#8a8d95] uppercase">Average Velocity</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-white">8.4</span>
                  <ArrowUpRight size={16} className="text-[#c8f135]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Vibrant Cyber Coral Heatmap Calendar Widget (Reference 7 - Bottom Right) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#ff4d2e] to-[#e03a1b] text-white rounded-3xl p-6 shadow-glow-coral flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold tracking-tight">Active Velocity Cycle</span>
              <span className="text-xs font-mono bg-black/20 px-2 py-0.5 rounded-full">Current Month</span>
            </div>

            <div className="flex items-baseline gap-4 mb-6">
              <div className="text-4xl font-black">{shippedTasks.length || 14} <span className="text-lg font-normal text-white/80">Shipped</span></div>
              <div className="text-xs font-mono bg-black/20 px-2.5 py-1 rounded-xl">
                ✓ {todoTasks.length} in progress
              </div>
            </div>

            {/* Bubble Matrix Calendar Heatmap */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 text-center text-[10px] font-mono font-bold opacity-80 mb-1">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((day) => {
                  const isHighlight = day === 5 || day === 9 || day === 12 || day === 14
                  return (
                    <div
                      key={day}
                      className={cn(
                        'h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-110',
                        isHighlight
                          ? 'bg-white text-[#ff4d2e] shadow-md font-extrabold'
                          : 'bg-black/15 text-white/90 border border-white/10'
                      )}
                    >
                      {isHighlight ? (day === 14 ? '3/3' : '1') : day}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: 3D Shipping Matrix (Ref 10) + Urgent High-Leverage Task Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D GitHub-style Contribution Matrix Card (Ref 10) */}
        <div className="lg:col-span-5 bg-[#141618] border border-white/[0.08] rounded-3xl p-6 shadow-glass space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
              <h3 className="text-sm font-bold text-white">Annual Execution Matrix</h3>
            </div>
            <span className="text-[10px] font-mono text-[#8a8d95]">[3,542 OPERATIONS]</span>
          </div>

          {/* Glowing 3D Heatmap Cells */}
          <div className="grid grid-cols-12 gap-1.5 p-3 rounded-2xl bg-black/40 border border-white/[0.04]">
            {Array.from({ length: 72 }).map((_, i) => {
              const intensity = (i * 7 + 3) % 5
              const colors = [
                'bg-emerald-950/40 border-emerald-900/30',
                'bg-emerald-800/60 border-emerald-700/50',
                'bg-emerald-600 border-emerald-500',
                'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/40',
                'bg-[#c8f135] border-[#b8e125] shadow-glow',
              ]
              return (
                <div
                  key={i}
                  className={cn(
                    'h-3.5 rounded-[4px] border transition-transform hover:scale-125 cursor-pointer',
                    colors[intensity]
                  )}
                  title={`Day ${i + 1}: ${intensity * 3} tasks processed`}
                />
              )
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-[#8a8d95]">
            <span className="text-emerald-400 font-semibold">+1,928 vs previous year</span>
            <span>449 DAY RECORD STREAK</span>
          </div>
        </div>

        {/* Urgent High-Leverage Tasks Queue */}
        <div className="lg:col-span-7 bg-[#141618] border border-white/[0.08] rounded-3xl p-6 shadow-glass space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff4d2e]"></span>
              <h3 className="text-sm font-bold text-white">Priority Focus Queue (P0 / P1)</h3>
            </div>
            <Link href="/tasks" className="text-xs text-[#8a8d95] hover:text-white flex items-center gap-1 font-mono">
              <span>View Kanban</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {p0Tasks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.04] text-[#8a8d95] text-xs">
                🎉 All critical P0/P1 tasks have been shipped! Great execution.
              </div>
            ) : (
              p0Tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] flex items-center justify-between gap-4 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn(
                      'px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase',
                      task.priority === 'p0' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    )}>
                      {task.priority.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-white truncate block group-hover:text-[#c8f135] transition-colors">
                        {task.title}
                      </span>
                      <span className="text-[10px] text-[#6b6e75] font-mono">
                        {task.project?.name ? `PROJECT: ${task.project.name}` : 'GENERAL SPRINT'} • {task.time_box_minutes || 45}m box
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateTaskStatus(task.id, 'shipped')}
                      className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={12} />
                      <span>Ship</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
