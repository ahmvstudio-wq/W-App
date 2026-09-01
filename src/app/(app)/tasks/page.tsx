'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Plus, Search, Filter, LayoutGrid, List as ListIcon, Calendar, 
  X, Zap, Trash2, CheckCircle2, Clock, MoreHorizontal, MessageSquare, 
  Paperclip, Tag, AlertCircle, ChevronRight, User, Check, Send, Sparkles,
  TrendingUp, BarChart2, Activity, ArrowUpRight, Edit3
} from 'lucide-react'
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG, cn, getInitials } from '@/lib/utils'
import type { Task, Priority, TaskStatus } from '@/types'
import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'
import CreateTaskModal from '@/components/CreateTaskModal'
import TaskDetailDrawer from '@/components/TaskDetailDrawer'
import NaturalLanguageInputModal from '@/components/NaturalLanguageInputModal'

export default function TasksPage() {
  const [view, setView] = useState<'board' | 'list'>('board')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSynthesizeOpen, setIsSynthesizeOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([]) 
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  async function fetchTasks(silent = false) {
    if (!silent) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, owner:profiles(*), project:projects(*)')
        .order('created_at', { ascending: false })
      
      if (error) {
        toast.error(`Fetch failed: ${error.message}`)
      } else {
        setTasks(data || [])
        if (selectedTask) {
          const updated = data?.find(t => t.id === selectedTask.id)
          if (updated) setSelectedTask(updated)
        }
      }
    } catch (err: any) {
      toast.error('Sync failed. Retrying...')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks(false)
    
    const channel = supabase.channel('tasks_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks(true)
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const columns: { id: TaskStatus; label: string; accentGradient: string }[] = [
    { id: 'todo', label: 'To-Do', accentGradient: 'from-slate-400 to-slate-600' },
    { id: 'in_progress', label: 'In Progress', accentGradient: 'from-blue-500 to-indigo-500' },
    { id: 'blocked', label: 'Blocked', accentGradient: 'from-amber-500 to-orange-500' },
    { id: 'shipped', label: 'Shipped', accentGradient: 'from-emerald-500 to-teal-500' },
  ]

  async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const targetTask = tasks.find(t => t.id === taskId)
    const updates: any = { status: newStatus }

    if (newStatus === 'shipped') {
      const now = new Date()
      updates.completed_at = now.toISOString()
      
      // Calculate work hours / duration between when task was moved to in_progress and shipped
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

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))

    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)
    if (error) {
      toast.error(`Update failed: ${error.message}`)
      fetchTasks(true)
      return
    }
    toast.success(newStatus === 'shipped' ? 'Task shipped! Work duration recorded.' : `Task moved to ${newStatus}`)
    fetchTasks(true)
  }

  function handleDragStart(e: React.DragEvent, taskId: string) {
    setDraggedTaskId(taskId)
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, columnId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId)
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent, targetStatus: TaskStatus) {
    e.preventDefault()
    setDragOverColumn(null)
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId
    if (taskId) {
      updateTaskStatus(taskId, targetStatus)
      setDraggedTaskId(null)
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) {
      toast.error(`Delete failed: ${error.message}`)
      return
    }
    toast.success('Task deleted')
    if (selectedTask?.id === taskId) setSelectedTask(null)
    fetchTasks()
  }

  // Derived Task Metrics
  const shippedCount = tasks.filter(t => t.status === 'shipped').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  const blockedCount = tasks.filter(t => t.status === 'blocked').length
  const p0Count = tasks.filter(t => t.priority === 'p0' && t.status !== 'shipped').length
  const completionRate = tasks.length > 0 ? Math.round((shippedCount / tasks.length) * 100) : 0

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter
    return matchesSearch && matchesPriority
  })

  return (
    <div className="flex flex-col space-y-6 pb-12 relative font-sans">
      {isCreateModalOpen && (
        <CreateTaskModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => fetchTasks(true)} />
      )}

      {/* Rich Task Detail & Edit Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={() => fetchTasks(true)}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#6b7280] uppercase tracking-wider mb-1 font-light">
            <span>CALLMY_MGMT</span>
            <span>•</span>
            <span className="text-black font-normal">{inProgressCount} ACTIVE IN FLIGHT</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-black flex items-center gap-3">
            <span>Tasks & Sprints</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/[0.05] text-black font-mono font-normal">
              {tasks.length} Total
            </span>
          </h1>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-body">
          <div className="flex bg-white border border-black/[0.08] rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setView('board')}
              className={cn(
                'p-1.5 px-3 rounded-lg text-xs font-normal transition-all flex items-center gap-1.5 cursor-pointer',
                view === 'board' ? 'bg-black text-white shadow-sm' : 'text-[#6b7280] hover:text-black'
              )}
            >
              <LayoutGrid size={14} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-1.5 px-3 rounded-lg text-xs font-normal transition-all flex items-center gap-1.5 cursor-pointer',
                view === 'list' ? 'bg-black text-white shadow-sm' : 'text-[#6b7280] hover:text-black'
              )}
            >
              <ListIcon size={14} />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => setIsSynthesizeOpen(true)}
            className="flex items-center px-3 sm:px-4 py-2 bg-white hover:bg-neutral-50 text-black border border-black/[0.08] font-normal text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>Synthesize</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-black hover:bg-neutral-800 text-white font-normal text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Task Data Visualization Widgets (Ambient Lighting) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-body">
        {/* Widget 1: Sprint Completion Gauge */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-blue-50/40 border border-black/[0.06] shadow-sm relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Sprint Progress</span>
            <div className="text-2xl font-light text-black tracking-tight">{completionRate}%</div>
            <div className="text-[11px] text-[#9ca3af] font-mono">{shippedCount}/{tasks.length} Shipped</div>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-black/[0.06]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-600"
                strokeDasharray={`${completionRate}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-semibold text-black">{completionRate}%</span>
          </div>
        </div>

        {/* Widget 2: Weekly Velocity Sparkline */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50/40 border border-black/[0.06] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Weekly Output</span>
            <span className="text-xs font-mono text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <TrendingUp size={11} /> +24%
            </span>
          </div>
          <div className="h-10 w-full pt-1">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path
                d="M0 20 Q 25 5, 50 12 T 100 2 L 100 25 L 0 25 Z"
                fill="rgba(16, 185, 129, 0.1)"
              />
              <path
                d="M0 20 Q 25 5, 50 12 T 100 2"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[#9ca3af]">
            <span>MON</span><span>WED</span><span>TODAY</span>
          </div>
        </div>

        {/* Widget 3: Priority Load */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-amber-50/40 border border-black/[0.06] shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Priority Queue</span>
            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
              {p0Count} P0 Critical
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-black/[0.05] rounded-full overflow-hidden flex">
              <div className="bg-red-500 h-full" style={{ width: `${Math.round((tasks.filter(t => t.priority === 'p0').length / (tasks.length || 1)) * 100)}%` }} />
              <div className="bg-amber-400 h-full" style={{ width: `${Math.round((tasks.filter(t => t.priority === 'p1').length / (tasks.length || 1)) * 100)}%` }} />
              <div className="bg-blue-400 h-full flex-1" />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-[#9ca3af]">
              <span className="text-red-500">P0</span>
              <span className="text-amber-500">P1</span>
              <span className="text-blue-500">P2/P3</span>
            </div>
          </div>
        </div>

        {/* Widget 4: Active Blockers */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-purple-50/40 border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Blocker Status</span>
            <span className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded-md font-medium",
              blockedCount > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
            )}>
              {blockedCount > 0 ? `${blockedCount} BLOCKED` : 'CLEAR'}
            </span>
          </div>
          <div className="text-2xl font-light text-black tracking-tight">{blockedCount}</div>
          <div className="text-[11px] text-[#9ca3af] font-mono">
            {blockedCount === 0 ? 'Optimal path to ship' : 'Requires immediate unblocking'}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 flex-shrink-0 font-body">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, projects, tags..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black placeholder:text-[#9ca3af] outline-none shadow-sm font-light"
            />
          </div>
        </div>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-1.5 bg-white border border-black/[0.06] p-1 rounded-xl shadow-sm text-xs font-light">
          {['all', 'p0', 'p1', 'p2'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={cn(
                'px-3 py-1 rounded-lg transition-all cursor-pointer uppercase text-[11px] font-mono',
                priorityFilter === p ? 'bg-black text-white font-medium shadow-sm' : 'text-[#6b7280] hover:text-black'
              )}
            >
              {p === 'all' ? 'All Priorities' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Layout with Drag and Drop */}
      {view === 'board' ? (
        <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-6 items-start select-none touch-pan-x scrollbar-none snap-x snap-mandatory">
          {columns.map((column) => {
            const colTasks = filteredTasks.filter((t) => t.status === column.id)
            const isDragOver = dragOverColumn === column.id

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
                className={cn(
                  'w-[285px] sm:w-[310px] flex-shrink-0 snap-start rounded-3xl bg-[#f9fafb] border transition-all duration-200 flex flex-col min-h-[480px] shadow-sm',
                  isDragOver ? 'border-black ring-2 ring-black/10 bg-neutral-100' : 'border-black/[0.06]'
                )}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-black/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2.5 h-2.5 rounded-full bg-gradient-to-r', column.accentGradient)} />
                    <span className="text-xs font-normal text-black tracking-wide">{column.label}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/[0.05] text-black font-mono font-normal">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="p-1 text-[#9ca3af] hover:text-black hover:bg-black/[0.04] rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Task Cards (Draggable) */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => {
                    const daysLeft = task.due_date ? differenceInDays(new Date(task.due_date), new Date()) : null
                    const progressPercent = task.status === 'shipped' ? 100 : task.status === 'in_progress' ? 50 : 0

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTask(task)}
                        className={cn(
                          'p-4 rounded-2xl bg-white hover:bg-[#ffffff] border transition-all duration-150 cursor-grab active:cursor-grabbing shadow-sm group relative',
                          draggedTaskId === task.id ? 'opacity-40 border-dashed border-black' : 'border-black/[0.06] hover:border-black/[0.18] hover:shadow-md',
                          selectedTask?.id === task.id ? 'border-black ring-1 ring-black' : ''
                        )}
                      >
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              'px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase',
                              task.priority === 'p0' ? 'bg-red-50 text-red-600 border border-red-200' :
                              task.priority === 'p1' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                              'bg-black/[0.04] text-[#6b7280]'
                            )}>
                              {task.priority.toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-black/[0.04] text-[#6b7280] font-mono truncate max-w-[120px]">
                              {task.project?.name || 'General'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {daysLeft !== null && (
                              <span className="text-[10px] font-mono text-[#6b7280] bg-black/[0.03] px-1.5 py-0.5 rounded">
                                {daysLeft >= 0 ? `D-${daysLeft}` : `+${Math.abs(daysLeft)}d`}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteTask(task.id)
                              }}
                              className="p-1 text-[#9ca3af] hover:text-red-600 rounded-md transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                              title="Delete task"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-xs font-normal text-black tracking-tight leading-snug mb-1 group-hover:underline">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-[#6b7280] font-body font-light line-clamp-2 mb-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Progress Bar */}
                        <div className="space-y-1 my-2">
                          <div className="flex justify-between text-[9px] font-mono text-[#9ca3af]">
                            <span>Progress</span>
                            <span className="text-black font-medium">{progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-black rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] text-[#6b7280] text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-black text-white font-medium text-[9px] flex items-center justify-center">
                              {getInitials(task.owner?.name || 'C')}
                            </div>
                            <span className="text-[10px] font-mono text-[#6b7280]">{task.time_box_minutes || 45}m</span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-body text-[#9ca3af]">
                            <Edit3 size={11} className="text-[#9ca3af] group-hover:text-black transition-colors" />
                            <span>Edit details</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Add Task Quick Button */}
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full py-2.5 rounded-2xl bg-white hover:bg-neutral-50 border border-dashed border-black/[0.1] text-xs text-[#6b7280] hover:text-black flex items-center justify-center gap-2 transition-all cursor-pointer font-body font-light"
                  >
                    <Plus size={13} />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Improved Interactive Table List View */
        <div className="bg-white border border-black/[0.08] rounded-3xl shadow-sm overflow-hidden font-body">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa] text-[#6b7280] font-mono text-[10px] uppercase font-light">
                  <th className="py-3.5 px-6">Task Deliverable</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Timebox</th>
                  <th className="py-3.5 px-4">Deadline</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="hover:bg-[#f9fafb] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-6 font-normal text-black max-w-xs truncate group-hover:underline">
                      {task.title}
                    </td>
                    <td className="py-3.5 px-4 text-[#6b7280] font-light">
                      {task.project?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase',
                        task.priority === 'p0' ? 'bg-red-50 text-red-600' :
                        task.priority === 'p1' ? 'bg-amber-50 text-amber-600' :
                        'bg-black/[0.04] text-[#6b7280]'
                      )}>
                        {task.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                        className="bg-[#fafafa] border border-black/[0.08] rounded-lg px-2 py-1 text-xs outline-none cursor-pointer font-light"
                      >
                        <option value="todo">To-Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="shipped">Shipped</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#6b7280] text-[11px]">
                      {task.time_box_minutes || 45}m
                    </td>
                    <td className="py-3.5 px-4 text-[#6b7280] font-mono text-[11px] font-light">
                      {task.due_date ? format(new Date(task.due_date), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="p-1 text-[#9ca3af] hover:text-black rounded-lg transition-colors cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-[#9ca3af] hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NaturalLanguageInputModal
        isOpen={isSynthesizeOpen}
        onClose={() => setIsSynthesizeOpen(false)}
        onSuccess={() => fetchTasks(true)}
      />
    </div>
  )
}
