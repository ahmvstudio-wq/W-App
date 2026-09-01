'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Plus, Search, Filter, LayoutGrid, List as ListIcon, Calendar, 
  X, Zap, Trash2, CheckCircle2, Clock, MoreHorizontal, MessageSquare, 
  Paperclip, Tag, AlertCircle, ChevronRight, User, Check, Send, Sparkles
} from 'lucide-react'
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG, cn, getInitials } from '@/lib/utils'
import type { Task, Priority, TaskStatus } from '@/types'
import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'
import CreateTaskModal from '@/components/CreateTaskModal'

export default function TasksPage() {
  const [view, setView] = useState<'board' | 'list'>('board')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([]) 
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeDrawerTab, setActiveDrawerTab] = useState<'description' | 'discussion' | 'attachments'>('description')
  const [comments, setComments] = useState<{ id: string; user: string; time: string; text: string }[]>([
    { id: '1', user: 'AI Assistant', time: 'Just now', text: 'Task scope verified. Ready for execution.' }
  ])
  const [newComment, setNewComment] = useState('')

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

  const columns: { id: TaskStatus; label: string }[] = [
    { id: 'todo', label: 'To-Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'blocked', label: 'Blocked' },
    { id: 'shipped', label: 'Shipped' },
  ]

  async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const updates: any = { status: newStatus }
    if (newStatus === 'shipped') {
      updates.completed_at = new Date().toISOString()
    } else if (newStatus === 'in_progress') {
      updates.started_at = new Date().toISOString()
    } else {
      updates.completed_at = null
    }
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)
    if (error) {
      toast.error(`Update failed: ${error.message}`)
      return
    }
    toast.success(`Task moved to ${newStatus}`)
    fetchTasks(true)
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

  function handleAddComment(textToAdd?: string) {
    const commentText = textToAdd || newComment
    if (!commentText.trim()) return
    setComments(prev => [
      ...prev,
      { id: Date.now().toString(), user: 'You', time: 'Just now', text: commentText.trim() }
    ])
    if (!textToAdd) setNewComment('')
  }

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] relative font-sans">
      {isCreateModalOpen && (
        <CreateTaskModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => fetchTasks(true)} />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#6b7280] uppercase tracking-wider mb-1 font-light">
            <span>CALLMY_MGMT</span>
            <span>•</span>
            <span className="text-black font-normal">{tasks.filter(t => t.status === 'in_progress').length} ACTIVE IN SPRINT</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-black flex items-center gap-3">
            <span>Tasks</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/[0.05] text-black font-mono font-normal">
              {tasks.length} Total
            </span>
          </h1>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-3 font-body">
          <div className="flex bg-white border border-black/[0.08] rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setView('board')}
              className={cn(
                'p-1.5 rounded-lg text-xs font-normal transition-all flex items-center gap-1.5 cursor-pointer',
                view === 'board' ? 'bg-black text-white shadow-sm' : 'text-[#6b7280] hover:text-black'
              )}
            >
              <LayoutGrid size={14} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-1.5 rounded-lg text-xs font-normal transition-all flex items-center gap-1.5 cursor-pointer',
                view === 'list' ? 'bg-black text-white shadow-sm' : 'text-[#6b7280] hover:text-black'
              )}
            >
              <ListIcon size={14} />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white font-normal text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-3 mb-6 flex-shrink-0 font-body">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or project..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black placeholder:text-[#9ca3af] outline-none transition-all shadow-sm font-light"
          />
        </div>
      </div>

      {/* Clean White Kanban Board */}
      {view === 'board' ? (
        <div className="flex gap-5 flex-1 overflow-x-auto pb-4 items-start select-none">
          {columns.map((column) => {
            const colTasks = filteredTasks.filter((t) => t.status === column.id)
            return (
              <div
                key={column.id}
                className="w-[320px] flex-shrink-0 rounded-3xl bg-[#f9fafb] border border-black/[0.06] flex flex-col max-h-full shadow-sm"
              >
                {/* Column Header */}
                <div className="p-4 border-b border-black/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2">
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

                {/* Task Cards */}
                <div className="p-3 overflow-y-auto space-y-3 flex-1">
                  {colTasks.map((task) => {
                    const daysLeft = task.due_date ? differenceInDays(new Date(task.due_date), new Date()) : null
                    const progressPercent = task.status === 'shipped' ? 100 : task.status === 'in_progress' ? 50 : 0

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={cn(
                          'p-4 rounded-2xl bg-white hover:bg-[#ffffff] border transition-all duration-150 cursor-pointer shadow-sm group',
                          selectedTask?.id === task.id ? 'border-black ring-1 ring-black' : 'border-black/[0.06] hover:border-black/[0.15]'
                        )}
                      >
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-black text-white uppercase">
                              {task.priority.toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-black/[0.04] text-[#6b7280] font-mono">
                              {task.project?.name ? task.project.name.slice(0, 12) : 'General'}
                            </span>
                          </div>

                          {daysLeft !== null && (
                            <span className="text-[10px] font-mono text-[#6b7280] bg-black/[0.03] px-1.5 py-0.5 rounded">
                              {daysLeft >= 0 ? `D-${daysLeft}` : `+${Math.abs(daysLeft)}d`}
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-xs font-normal text-black tracking-tight leading-snug mb-1 group-hover:underline">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-[#6b7280] font-body font-light line-clamp-2 mb-2">
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

                          <div className="flex items-center gap-3 text-[10px] font-body text-[#9ca3af]">
                            <div className="flex items-center gap-1">
                              <MessageSquare size={11} />
                              <span>1</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Add Task Pill Button */}
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
        /* List View */
        <div className="bg-white border border-black/[0.08] rounded-3xl p-6 shadow-sm overflow-y-auto">
          <div className="space-y-2 font-body">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="p-4 rounded-2xl bg-[#fafafa] hover:bg-[#f5f5f7] border border-black/[0.04] flex items-center justify-between gap-4 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-black text-white uppercase">
                    {task.priority.toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-normal text-black block truncate">{task.title}</span>
                    <span className="text-[10px] text-[#6b7280] font-mono font-light">{task.project?.name || 'General'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#6b7280]">{task.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sliding Task Detail Drawer (White Minimal Theme) */}
      {selectedTask && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white border-l border-black/[0.08] shadow-2xl z-50 flex flex-col animate-slideInRight font-sans">
          {/* Drawer Header */}
          <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-medium text-xs">
                CM
              </div>
              <div>
                <h3 className="text-sm font-normal text-black leading-tight">
                  {selectedTask.project?.name || 'CallMy Mgmt Task'}
                </h3>
                <span className="text-[10px] text-[#6b7280] font-mono">ID: {selectedTask.id.slice(0, 8)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => deleteTask(selectedTask.id)}
                className="p-1.5 text-[#9ca3af] hover:text-red-600 hover:bg-black/[0.04] rounded-xl transition-colors cursor-pointer"
                title="Delete task"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 text-[#9ca3af] hover:text-black hover:bg-black/[0.04] rounded-xl transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div>
              <label className="text-[10px] font-mono text-[#9ca3af] uppercase block mb-1">Task Title</label>
              <h2 className="text-lg font-normal text-black">{selectedTask.title}</h2>
            </div>

            {/* Key-Value Attributes Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#fafafa] border border-black/[0.04] text-xs font-body font-light">
              <div>
                <span className="text-[10px] text-[#9ca3af] font-mono block">ASSIGNED</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-5 h-5 rounded-full bg-black text-white font-medium text-[9px] flex items-center justify-center">
                    {getInitials(selectedTask.owner?.name || 'C')}
                  </div>
                  <span className="text-black font-normal">{selectedTask.owner?.name || 'Assigned to you'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#9ca3af] font-mono block">DUE DATE</span>
                <span className="text-black font-normal mt-1 block">
                  {selectedTask.due_date ? format(new Date(selectedTask.due_date), 'dd MMMM yyyy') : 'No deadline'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#9ca3af] font-mono block">STATUS</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => updateTaskStatus(selectedTask.id, e.target.value as TaskStatus)}
                  className="mt-1 bg-white text-black border border-black/[0.1] rounded-lg px-2 py-1 text-xs outline-none cursor-pointer"
                >
                  <option value="todo">To-Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="shipped">Shipped</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-[#9ca3af] font-mono block">PRIORITY</span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-medium bg-black text-white uppercase">
                  {selectedTask.priority.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-black/[0.06] flex gap-6 text-xs font-body">
              {(['description', 'discussion', 'attachments'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDrawerTab(tab)}
                  className={cn(
                    'pb-3 capitalize transition-all relative cursor-pointer font-light',
                    activeDrawerTab === tab ? 'text-black font-normal border-b-2 border-black' : 'text-[#9ca3af] hover:text-black'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeDrawerTab === 'description' ? (
              <div className="text-xs text-[#4b5563] leading-relaxed whitespace-pre-wrap font-body font-light">
                {selectedTask.description || 'No detailed description provided for this task.'}
              </div>
            ) : activeDrawerTab === 'discussion' ? (
              <div className="space-y-4 font-body">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Add an update or note..."
                    className="flex-1 px-3 py-2 bg-[#fafafa] border border-black/[0.08] rounded-xl text-xs text-black placeholder:text-[#9ca3af] outline-none font-light"
                  />
                  <button
                    onClick={() => handleAddComment()}
                    className="px-3 py-2 bg-black text-white font-medium rounded-xl text-xs cursor-pointer hover:bg-neutral-800"
                  >
                    <Send size={13} />
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-[#fafafa] border border-black/[0.04] space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-[#9ca3af]">
                        <span className="text-black font-normal">{c.user}</span>
                        <span>{c.time}</span>
                      </div>
                      <p className="text-xs text-[#4b5563] font-light">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#9ca3af] font-body font-light">
                0 files attached.
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-black/[0.06] flex items-center justify-between gap-3 bg-[#fdfdfe] font-body">
            <button
              onClick={() => updateTaskStatus(selectedTask.id, 'shipped')}
              className="flex-1 py-2.5 bg-black hover:bg-neutral-800 text-white font-normal rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Check size={14} />
              <span>Mark as Shipped</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
