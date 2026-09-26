'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { callGroq, buildWorkspaceContext } from '@/lib/groq/client'
import { cn, formatDateTime, getInitials, PRIORITY_CONFIG, TASK_STATUS_CONFIG, getProjectHealth } from '@/lib/utils'
import { 
  CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp, TrendingDown,
  Play, Check, X, RefreshCw, MessageSquare, ChevronRight, ChevronDown, ChevronUp, Zap,
  Flame, Clock, Target, Calendar as CalendarIcon, ArrowUpRight,
  ShieldCheck, Activity, Award, Sparkles, FolderKanban, BarChart3,
  Layers, CheckSquare, Plus, ListTodo, Sun, CircleDot
} from 'lucide-react'
import type { Task, Project, User } from '@/types'
import { toast } from 'sonner'
import Link from 'next/link'
import { format, subDays, addDays, isSameDay, startOfDay } from 'date-fns'
import AnnualExecutionGrid from '@/components/AnnualExecutionGrid'
import InteractiveVelocityChart from '@/components/InteractiveVelocityChart'
import CreateTaskModal from '@/components/CreateTaskModal'
import TaskDetailDrawer from '@/components/TaskDetailDrawer'
import { getCached, setCached } from '@/lib/cache/swrCache'

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      return getCached<Task[]>('dashboard_tasks') || []
    }
    return []
  })
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      return getCached<Project[]>('dashboard_projects') || []
    }
    return []
  })
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const cachedT = getCached<Task[]>('dashboard_tasks')
      const cachedP = getCached<Project[]>('dashboard_projects')
      return (!cachedT || cachedT.length === 0) && (!cachedP || cachedP.length === 0)
    }
    return true
  })
  const [brief, setBrief] = useState<string | null>(() => getCached<string>('dashboard_brief'))
  const [generatingBrief, setGeneratingBrief] = useState(false)
  const [userName, setUserName] = useState<string>('Founder')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [agendaDate, setAgendaDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [showShippedToday, setShowShippedToday] = useState(false)
  const [isBriefExpanded, setIsBriefExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cultlike_brief_expanded')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })

  const toggleBriefExpanded = () => {
    setIsBriefExpanded(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('cultlike_brief_expanded', String(next))
      }
      return next
    })
  }

  useEffect(() => {
    const cachedTasks = getCached<Task[]>('dashboard_tasks')
    const cachedProjects = getCached<Project[]>('dashboard_projects')
    const cachedBrief = getCached<string>('dashboard_brief')
    if (cachedTasks && cachedTasks.length > 0) setTasks(cachedTasks)
    if (cachedProjects && cachedProjects.length > 0) setProjects(cachedProjects)
    if (cachedBrief) setBrief(cachedBrief)
    if ((cachedTasks && cachedTasks.length > 0) || (cachedProjects && cachedProjects.length > 0)) {
      setLoading(false)
    }

    fetchData(Boolean(cachedTasks && cachedTasks.length > 0))
    
    const channel = supabase.channel('dashboard_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchData(true))
      .subscribe()

    const handleWsChanged = () => fetchData(false)
    window.addEventListener('workspace-changed', handleWsChanged)
      
    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('workspace-changed', handleWsChanged)
    }
  }, [])

  async function fetchData(silent = false) {
    if (!silent) setLoading(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    setUserName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Founder')

    let activeWsId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null
    if (!activeWsId) {
      const { data: userWs } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', session.user.id)
        .limit(1)

      if (userWs && userWs.length > 0) {
        activeWsId = userWs[0].id
        if (typeof window !== 'undefined') {
          localStorage.setItem('focus_active_workspace_id', userWs[0].id)
        }
      }
    }

    if (!activeWsId) {
      setTasks([])
      setProjects([])
      setLoading(false)
      return
    }

    let tasksQuery = supabase
      .from('tasks')
      .select('*, owner:profiles(*), project:projects(*)')
      .eq('workspace_id', activeWsId)
      .order('created_at', { ascending: false })

    let projectsQuery = supabase
      .from('projects')
      .select('*, owner:profiles(*), tasks(*)')
      .eq('workspace_id', activeWsId)
      .order('updated_at', { ascending: false })

    const [{ data: tasksData }, { data: projectsData }] = await Promise.all([
      tasksQuery,
      projectsQuery
    ])

    const activeTasks = tasksData || []
    const activeProjects = projectsData || []

    setTasks(activeTasks)
    setProjects(activeProjects)
    setCached('dashboard_tasks', activeTasks)
    setCached('dashboard_projects', activeProjects)
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
      setCached('dashboard_brief', generated)
    } catch {
      const fallback = '• P0 Priority: Deliver core deliverables for the active sprint.\n• Zero critical blockers recorded across projects.\n• Maintain shipping velocity and daily output.'
      setBrief(fallback)
      setCached('dashboard_brief', fallback)
    }
    setGeneratingBrief(false)
  }

  async function updateTaskStatus(taskId: string, newStatus: any) {
    const targetTask = tasks.find(t => t.id === taskId)
    const updates: any = { status: newStatus }

    if (newStatus === 'shipped') {
      const now = new Date()
      updates.completed_at = now.toISOString()
      
      // Calculate work duration between in_progress (started_at) and shipped (completed_at)
      if (targetTask?.started_at) {
        const startMs = new Date(targetTask.started_at).getTime()
        const endMs = now.getTime()
        const diffMinutes = Math.max(1, Math.round((endMs - startMs) / 60000))
        updates.time_box_minutes = diffMinutes
      }
    } else if (newStatus === 'in_progress') {
      if (!targetTask?.started_at) {
        updates.started_at = new Date().toISOString()
      }
    } else if (newStatus === 'todo') {
      updates.completed_at = null
    }
    
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)
    if (error) {
      toast.error('Failed to update task')
    } else {
      toast.success(newStatus === 'shipped' ? 'Task shipped! Work duration recorded.' : `Task moved to ${newStatus}`)
      fetchData(true)
    }
  }

  // Derived Real Metrics strictly for shipped tasks
  const shippedTasks = tasks.filter(t => t.status === 'shipped')
  const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress')
  const blockedTasks = tasks.filter(t => t.status === 'blocked')
  const p0Tasks = tasks.filter(t => (t.priority === 'p0' || t.priority === 'p1') && t.status !== 'shipped' && t.status !== 'killed')
  
  const totalFocusMinutes = shippedTasks.reduce((acc, t) => {
    if (t.started_at && t.completed_at) {
      const diff = Math.round((new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 60000)
      if (diff > 0) return acc + diff
    }
    return acc + (t.time_box_minutes || 0)
  }, 0)

  const totalHours = (totalFocusMinutes / 60).toFixed(1)
  const completionRate = tasks.length > 0 ? Math.round((shippedTasks.length / tasks.length) * 100) : 0

  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const tomorrowKey = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const isAgendaToday = agendaDate === todayKey

  // Calculate day-specific tasks for the active date
  const agendaTasks = tasks.filter(t => {
    const dueKey = t.due_date ? format(new Date(t.due_date), 'yyyy-MM-dd') : null
    const completedKey = t.completed_at ? format(new Date(t.completed_at), 'yyyy-MM-dd') : null
    const startKey = t.started_at ? format(new Date(t.started_at), 'yyyy-MM-dd') : null
    const createdKey = t.created_at ? format(new Date(t.created_at), 'yyyy-MM-dd') : null

    if (isAgendaToday) {
      if (completedKey === todayKey) return true
      if (t.status === 'in_progress') return true
      if (dueKey === todayKey) return true
      if (t.status === 'todo' && dueKey && dueKey < todayKey) return true
      if (t.status === 'todo' && !dueKey) return true
      return false
    } else {
      // Historical or planned date: only match tasks that were due, completed, started, or created on that specific date
      return dueKey === agendaDate || completedKey === agendaDate || startKey === agendaDate || createdKey === agendaDate
    }
  }).map(t => {
    if (isAgendaToday) return t

    // Project status back in time if inspecting a past date
    const targetDate = startOfDay(new Date(agendaDate + 'T00:00:00'))
    const nextDay = addDays(targetDate, 1)

    const completedAt = t.completed_at ? new Date(t.completed_at) : null
    const startedAt = t.started_at ? new Date(t.started_at) : null

    let historicalStatus = t.status
    if (completedAt && completedAt < nextDay) {
      historicalStatus = 'shipped'
    } else if (startedAt && startedAt < nextDay) {
      historicalStatus = 'in_progress'
    } else if (startedAt && startedAt >= nextDay) {
      // If task was started on a future date (e.g. Sept 5) but we are viewing Sept 3, it was still to-do!
      historicalStatus = 'todo'
    }

    return {
      ...t,
      status: historicalStatus
    }
  })

  const agendaActiveTasks = agendaTasks.filter(t => t.status !== 'shipped' && t.status !== 'killed')
  const agendaShippedTasks = agendaTasks.filter(t => t.status === 'shipped')

  return (
    <div className="space-y-4 pb-10 animate-fadeIn font-sans">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-0.5 font-light">
            DASHBOARD
          </div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-black">
            Your Daily Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2.5 font-body">
          <button
            onClick={() => generateBrief(tasks, projects)}
            disabled={generatingBrief}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-neutral-50 border border-black/[0.08] rounded-xl text-xs font-normal text-black transition-all cursor-pointer shadow-2xs"
            title="Regenerate daily intelligence briefing"
          >
            <RefreshCw size={12} className={cn(generatingBrief && 'animate-spin')} />
            <span>Generate Today&apos;s Brief</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Hero Insight Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-black/[0.08] p-6 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Greeting & Big Punchy Metric */}
          <div className="lg:col-span-7 space-y-3.5">
            <h2 className="text-2xl sm:text-3xl font-normal text-black tracking-tight leading-snug">
              {totalHours} focused hours logged <br />
              <span className="text-neutral-500 font-light">
                across {projects.length} active projects.
              </span>
            </h2>

            <div className="flex items-center gap-3 text-xs text-neutral-600">
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-900 border border-black/[0.08] font-mono text-[10px]">
                {completionRate}% completed
              </span>
              <span>•</span>
              <span className="font-normal text-black">{shippedTasks.length} deliverables shipped</span>
            </div>

            {/* Executive Intelligence Brief */}
            <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] transition-all">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-500 font-medium uppercase tracking-wide">
                    DAILY SUMMARY &amp; NEXT STEPS
                  </span>
                </div>
                <button
                  onClick={toggleBriefExpanded}
                  className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-black font-medium transition-colors px-2 py-0.5 rounded-lg hover:bg-black/[0.04] cursor-pointer"
                  title={isBriefExpanded ? "Minimize summary" : "Expand summary"}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider">{isBriefExpanded ? 'Minimize' : 'Expand'}</span>
                  {isBriefExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {isBriefExpanded ? (
                <div className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed font-light mt-2 animate-fadeIn">
                  {brief || 'Analyzing current priorities and next steps...'}
                </div>
              ) : (
                <div 
                  onClick={toggleBriefExpanded} 
                  className="text-xs text-neutral-500 truncate font-light mt-1.5 cursor-pointer hover:text-neutral-700 select-none"
                  title="Click to expand"
                >
                  {brief ? brief.replace(/\n+/g, ' ') : 'Analyzing current priorities and next steps...'}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Radial Arc Donut Gauge */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 bg-[#fafafa] border border-black/[0.06] rounded-3xl">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(0, 0, 0, 0.08)"
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
                <span className="text-3xl font-medium text-black tracking-tight">{totalFocusMinutes}</span>
                <span className="text-[10px] text-[#4b5563] font-mono uppercase tracking-wider font-semibold">Minutes Logged</span>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                <span className="text-black font-semibold">Completed: {completionRate}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9ca3af]"></span>
                <span className="text-[#4b5563] font-medium">Target: 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Interactive Velocity Chart + Project Progress Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive Sprint Velocity Area Chart */}
        <div className="lg:col-span-7">
          <InteractiveVelocityChart tasks={tasks} />
        </div>

        {/* Project Progress Breakdown */}
        <div className="lg:col-span-5 bg-white border border-black/[0.08] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block font-light">PORTFOLIO</span>
                <h3 className="text-sm font-medium text-black">Active Projects Health</h3>
              </div>
              <Link href="/projects" className="text-xs text-[#6b7280] hover:text-black font-body font-light flex items-center gap-1">
                <span>View All</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="space-y-2.5">
              {projects.slice(0, 3).map((p) => {
                const pTasks = p.tasks || []
                const shipped = pTasks.filter(t => t.status === 'shipped').length
                const percent = pTasks.length > 0 ? Math.round((shipped / pTasks.length) * 100) : 0

                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="p-3 rounded-2xl bg-[#f9fafb] hover:bg-[#f3f4f6] border border-black/[0.04] block transition-all group"
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

      {/* TODAY'S ACTIVE TASKS & DAILY AGENDA SECTION (Requested Feature) */}
      <div className="bg-white border border-black/[0.08] rounded-3xl p-6 shadow-xs space-y-5 font-body">
        {/* Section Header with Date Selector & Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
          <div>
            <span className="text-[10px] font-mono text-neutral-400 tracking-[0.14em] uppercase block mb-1">
              Execution Agenda
            </span>
            <h3 className="text-lg font-medium tracking-tight text-black flex items-center gap-2">
              <span>Active Tasks</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-black text-white font-mono font-medium">
                {agendaActiveTasks.length}
              </span>
              {agendaShippedTasks.length > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-900 border border-black/[0.08] text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
                  {agendaShippedTasks.length} shipped
                </span>
              )}
            </h3>
            <p className="text-xs text-[#6b7280] font-light mt-0.5">
              Deliverables for <strong className="text-black font-medium">{format(new Date(agendaDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</strong>
            </p>
          </div>

          {/* Quick Date Switchers & Add Task */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-[#f3f4f6] p-1 rounded-xl border border-black/[0.06] text-xs font-mono">
              <button
                onClick={() => setAgendaDate(todayKey)}
                className={cn(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1',
                  agendaDate === todayKey ? 'bg-black text-white shadow-xs font-semibold' : 'text-[#6b7280] hover:text-black'
                )}
              >
                <span>Today</span>
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
              </button>
              <button
                onClick={() => setAgendaDate(tomorrowKey)}
                className={cn(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer',
                  agendaDate === tomorrowKey ? 'bg-black text-white shadow-xs font-semibold' : 'text-[#6b7280] hover:text-black'
                )}
              >
                Tomorrow
              </button>
            </div>

            {/* Custom Date Input */}
            <div className="flex items-center gap-1.5 border border-black/[0.08] rounded-xl px-2.5 py-1 bg-white">
              <input
                type="date"
                value={agendaDate}
                onChange={(e) => setAgendaDate(e.target.value)}
                className="text-xs font-mono bg-transparent outline-none text-black cursor-pointer"
              />
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-sm"
            >
              <Plus size={14} />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Active Deliverables List */}
        <div className="space-y-3">
          {agendaActiveTasks.length === 0 ? (
            <div className="py-12 px-6 text-center rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center mx-auto text-xl shadow-xs">
                🎯
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-normal text-black">
                  {isAgendaToday 
                    ? 'All planned tasks for today are completed!' 
                    : `Zero pending tasks scheduled for ${format(new Date(agendaDate + 'T00:00:00'), 'MMM d')}`}
                </h4>
                <p className="text-xs text-[#6b7280] font-light max-w-md mx-auto">
                  {agendaShippedTasks.length > 0 
                    ? `Great shipping velocity! You have logged ${agendaShippedTasks.length} shipped deliverables for this date.`
                    : 'Schedule tasks or assign deadlines to plan your high-leverage deep work.'}
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-normal transition-all cursor-pointer shadow-sm"
              >
                <Plus size={13} />
                <span>Create Task for this Date</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {agendaActiveTasks.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'shipped'
                const formattedDeadline = task.due_date ? format(new Date(task.due_date), 'hh:mm a') : null

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-4 rounded-2xl bg-[#fbfbfd] hover:bg-white border border-black/[0.06] hover:border-black/[0.15] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Priority Pill */}
                      <span className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase flex-shrink-0',
                        task.priority === 'p0' ? 'bg-red-50 text-red-700 border border-red-200' :
                        task.priority === 'p1' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-black/[0.05] text-black'
                      )}>
                        {task.priority.toUpperCase()}
                      </span>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-black truncate group-hover:underline block">
                            {task.title}
                          </span>
                          {task.status === 'in_progress' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                              IN FLIGHT
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#6b7280]">
                          <span className="text-[#374151] font-medium">
                            {task.project?.name ? `PROJECT: ${task.project.name}` : 'GENERAL'}
                          </span>
                          <span>•</span>
                          <span>{task.time_box_minutes || 45}m box</span>
                          {formattedDeadline && (
                            <>
                              <span>•</span>
                              <span className={cn(isOverdue ? 'text-red-600 font-semibold' : 'text-[#6b7280]')}>
                                {isOverdue ? `Overdue (${formattedDeadline})` : `Deadline: ${formattedDeadline}`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Status Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('toggle-focus-timer', {
                          detail: { taskId: task.id, taskTitle: task.title, timeBox: task.time_box_minutes || 25 }
                        }))}
                        className="px-2.5 py-1.5 bg-[#f5f5f7] hover:bg-[#eaeaed] text-neutral-800 rounded-xl text-xs font-normal transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs font-body"
                        title="Start custom focus timer with brown noise"
                      >
                        <Clock size={12} className="text-neutral-500" />
                        <span>Focus</span>
                      </button>

                      {task.status === 'todo' ? (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="px-3 py-1.5 bg-white hover:bg-neutral-50 border border-black/[0.1] text-black rounded-xl text-xs font-normal transition-all flex items-center gap-1.5 cursor-pointer shadow-xs font-body"
                          title="Put in flight"
                        >
                          <Play size={11} className="text-blue-600 fill-blue-600" />
                          <span>Start</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'shipped')}
                          className="px-3.5 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm font-body"
                          title="Mark task completed and shipped"
                        >
                          <Check size={12} className="text-white" />
                          <span>Ship Deliverable</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Shipped Deliverables for this Date (Toggle) */}
        {agendaShippedTasks.length > 0 && (
          <div className="pt-4 border-t border-black/[0.04]">
            <button
              onClick={() => setShowShippedToday(!showShippedToday)}
              className="text-xs font-mono text-[#6b7280] hover:text-black flex items-center gap-1.5 cursor-pointer"
            >
              <span>{showShippedToday ? 'Hide' : 'Show'} {agendaShippedTasks.length} shipped {agendaShippedTasks.length === 1 ? 'task' : 'tasks'} for this date</span>
              <ChevronRight size={13} className={cn('transition-transform', showShippedToday && 'rotate-90')} />
            </button>

            {showShippedToday && (
              <div className="space-y-2 mt-3 animate-fadeIn">
                {agendaShippedTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="p-3 rounded-xl bg-[#f9fafb] border border-black/[0.04] flex items-center justify-between text-xs cursor-pointer hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <CheckCircle2 size={14} className="text-neutral-900 flex-shrink-0" />
                      <span className="text-black truncate font-normal">{t.title}</span>
                      <span className="text-[10px] font-mono text-neutral-400">({t.project?.name || 'General'})</span>
                    </div>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-900 border border-black/[0.08] text-[9px] font-mono flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
                      Shipped
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Task Modal with Date Context */}
      {isCreateModalOpen && (
        <CreateTaskModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => fetchData(true)}
          initialDate={new Date(agendaDate + 'T18:00:00')}
        />
      )}

      {/* Task Detail & Edit Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={() => fetchData(true)}
      />
    </div>
  )
}
