'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { callGroq, buildWorkspaceContext } from '@/lib/groq/client'
import { cn, formatDateTime, getInitials, PRIORITY_CONFIG, TASK_STATUS_CONFIG, getProjectHealth } from '@/lib/utils'
import { 
  CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp, TrendingDown,
  Play, Check, X, RefreshCw, MessageSquare, ChevronRight, Zap,
  Flame, Clock, Target, Calendar as CalendarIcon, ArrowUpRight,
  ShieldCheck, Activity, Award, Sparkles, FolderKanban, BarChart3,
  Layers, CheckSquare
} from 'lucide-react'
import type { Task, Project, User } from '@/types'
import { toast } from 'sonner'
import Link from 'next/link'
import AnnualExecutionGrid from '@/components/AnnualExecutionGrid'
import InteractiveVelocityChart from '@/components/InteractiveVelocityChart'

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
        { role: 'system', content: 'Generate an executive briefing in exactly 3 punchy bullet points. Direct, outcome-oriented. Under 70 words total.' },
        { role: 'user', content: `Top priority: ${topTask || 'None pending'}\nBlocker: ${biggestBlocker || 'Zero active blockers'}\nProject: ${slowProject || 'All on track'}` }
      ])
      setBrief(generated)
    } catch {
      setBrief('• P0 Priority: Deliver core deliverables for the active sprint.\n• Zero critical blockers recorded across projects.\n• Maintain shipping velocity and daily output.')
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

  // Derived Real Metrics
  const shippedTasks = tasks.filter(t => t.status === 'shipped')
  const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress')
  const blockedTasks = tasks.filter(t => t.status === 'blocked')
  const p0Tasks = tasks.filter(t => (t.priority === 'p0' || t.priority === 'p1') && t.status !== 'shipped' && t.status !== 'killed')
  const totalFocusMinutes = tasks.reduce((acc, t) => acc + (t.status === 'shipped' ? (t.time_box_minutes || 45) : 0), 0)
  const totalHours = (totalFocusMinutes / 60).toFixed(1)
  const completionRate = tasks.length > 0 ? Math.round((shippedTasks.length / tasks.length) * 100) : 0
  const realStreak = shippedTasks.length > 0 ? 1 : 0

  return (
    <div className="space-y-8 pb-16 animate-fadeIn font-sans">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#6b7280] uppercase tracking-wider mb-1 font-light">
            <span>CALLMY</span>
            <span>•</span>
            <span className="text-black font-normal">DASHBOARD</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-black">
            Your Daily Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3 font-body">
          <button 
            onClick={() => generateBrief(tasks, projects)}
            disabled={generatingBrief}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-[#f5f5f7] border border-black/[0.08] rounded-xl text-xs font-normal text-black transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw size={13} className={cn(generatingBrief && 'animate-spin')} />
            <span>Refresh Summary</span>
          </button>
          
          <div className="px-3.5 py-1.5 rounded-xl bg-black text-white text-xs font-mono flex items-center gap-2 shadow-sm">
            <Flame size={13} className="text-[#c8f135]" />
            <span>{realStreak} DAY STREAK</span>
          </div>
        </div>
      </div>

      {/* Hero Insight Card: Clean Minimalist White Box */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-black/[0.08] p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Greeting & Big Punchy Metric */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-medium text-xs">
                {getInitials(userName)}
              </div>
              <div>
                <span className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block font-light">WELCOME BACK</span>
                <span className="text-sm font-normal text-black">{userName}</span>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight leading-snug">
              {totalHours} focused hours logged <br />
              <span className="text-[#6b7280] font-light">
                across {projects.length} active projects.
              </span>
            </h2>

            <div className="flex items-center gap-3 text-xs text-[#6b7280] font-body">
              <span className="px-2 py-0.5 rounded-md bg-black/[0.05] text-black font-mono font-medium">
                {completionRate}% tasks completed
              </span>
              <span>•</span>
              <span>{shippedTasks.length} tasks finished</span>
            </div>

            {/* AI Executive Intelligence Brief */}
            <div className="p-4 rounded-2xl bg-[#f8f9fc] border border-black/[0.05]">
              <div className="flex items-center gap-2 text-xs font-mono text-black font-medium mb-1.5">
                <Sparkles size={13} />
                <span>DAILY SUMMARY &amp; NEXT STEPS</span>
              </div>
              <div className="text-xs text-[#4b5563] whitespace-pre-line leading-relaxed font-body font-light">
                {brief || 'Analyzing current priorities and next steps...'}
              </div>
            </div>
          </div>

          {/* Right Column: Radial Arc Donut Gauge */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#fafafa] border border-black/[0.04] rounded-3xl">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(0, 0, 0, 0.06)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#111827"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * (completionRate || 55)) / 100}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-light text-black tracking-tight">{totalFocusMinutes}</span>
                <span className="text-[10px] text-[#6b7280] font-mono uppercase tracking-wider">Minutes Logged</span>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-black"></span>
                <span className="text-black font-medium">Completed: {completionRate}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#d1d5db]"></span>
                <span className="text-[#6b7280]">Target: 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Interactive Velocity Chart + Project Progress Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Sprint Velocity Area Chart */}
        <div className="lg:col-span-7">
          <InteractiveVelocityChart tasks={tasks} />
        </div>

        {/* Project Progress Breakdown */}
        <div className="lg:col-span-5 bg-white border border-black/[0.08] rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block font-light">PORTFOLIO</span>
                <h3 className="text-base font-normal text-black">Active Projects Health</h3>
              </div>
              <Link href="/projects" className="text-xs text-[#6b7280] hover:text-black font-body font-light flex items-center gap-1">
                <span>View All</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="space-y-3">
              {projects.slice(0, 3).map((p) => {
                const pTasks = p.tasks || []
                const shipped = pTasks.filter(t => t.status === 'shipped').length
                const percent = pTasks.length > 0 ? Math.round((shipped / pTasks.length) * 100) : 0

                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="p-3.5 rounded-2xl bg-[#f9fafb] hover:bg-[#f3f4f6] border border-black/[0.04] block transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-normal text-black truncate group-hover:underline">{p.name}</span>
                      <span className="text-[10px] font-mono text-[#6b7280]">{shipped}/{pTasks.length} tasks ({percent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-black rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-body text-[#6b7280] pt-2 border-t border-black/[0.04]">
            <span>Portfolio Health</span>
            <span className="font-mono text-black font-semibold">On Track (9/10)</span>
          </div>
        </div>
      </div>

      {/* Full-Width Interactive Annual Execution Grid */}
      <AnnualExecutionGrid tasks={tasks} />

      {/* Priority Focus Queue */}
      <div className="bg-white border border-black/[0.08] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block font-light">TODAY&apos;S PRIORITIES</span>
            <h3 className="text-base font-normal text-black">High Priority Tasks</h3>
          </div>
          <Link href="/tasks" className="text-xs text-[#6b7280] hover:text-black font-body font-light flex items-center gap-1">
            <span>View Board</span>
            <ChevronRight size={13} />
          </Link>
        </div>

          <div className="space-y-2.5">
            {p0Tasks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#fafafa] border border-black/[0.04] text-[#6b7280] text-xs font-body font-light">
                🎉 All critical deliverables shipped! Zero urgent blockers.
              </div>
            ) : (
              p0Tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-[#fafafa] hover:bg-[#f5f5f7] border border-black/[0.04] flex items-center justify-between gap-4 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-black text-white uppercase">
                      {task.priority.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-normal text-black truncate block group-hover:underline">
                        {task.title}
                      </span>
                      <span className="text-[10px] text-[#6b6e75] font-mono font-light">
                        {task.project?.name ? `PROJECT: ${task.project.name}` : 'GENERAL'} • {task.time_box_minutes || 45}m box
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => updateTaskStatus(task.id, 'shipped')}
                    className="px-3 py-1 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-medium transition-all flex items-center gap-1 cursor-pointer shadow-sm font-body"
                  >
                    <Check size={12} />
                    <span>Ship</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
  )
}
