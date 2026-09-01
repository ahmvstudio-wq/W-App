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
import { challengeTask } from '@/lib/groq/client'
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
    { id: '1', user: 'AI Chief of Staff', time: 'Just now', text: 'Task scope verified. Ready for high-velocity execution.' }
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
        // If drawer open, update selectedTask reference
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

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'To-Do', color: '#8a8d95' },
    { id: 'in_progress', label: 'On Progress', color: '#3b82f6' },
    { id: 'blocked', label: 'Blocked', color: '#f5a623' },
    { id: 'shipped', label: 'Shipped', color: '#c8f135' },
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
    <div className="flex flex-col h-[calc(100vh-6rem)] relative">
      {isCreateModalOpen && (
        <CreateTaskModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => fetchTasks(true)} />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8a8d95] uppercase tracking-wider mb-1">
            <span>[PROJECTS & OPERATIONS]</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{tasks.filter(t => t.status === 'in_progress').length} ACTIVE SPRINT</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Tasks</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#8a8d95] font-mono font-normal">
              {tasks.length} total
            </span>
          </h1>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex bg-[#141618] border border-white/[0.08] rounded-xl p-1">
            <button
              onClick={() => setView('board')}
              className={cn(
                'p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer',
                view === 'board' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-[#8a8d95] hover:text-white'
              )}
            >
              <LayoutGrid size={14} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer',
                view === 'list' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-[#8a8d95] hover:text-white'
              )}
            >
              <ListIcon size={14} />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#c8f135] hover:bg-[#b8e125] text-black font-semibold text-xs rounded-xl shadow-glow transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Plus size={15} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-3 mb-6 flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6e75]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or project..."
            className="w-full pl-9 pr-4 py-2 bg-[#141618] border border-white/[0.08] focus:border-[#c8f135]/50 rounded-xl text-xs text-white placeholder:text-[#6b6e75] outline-none transition-all"
          />
        </div>
      </div>

      {/* Kanban Board Layout (Reference 8) */}
      {view === 'board' ? (
        <div className="flex gap-5 flex-1 overflow-x-auto pb-4 items-start select-none">
          {columns.map((column) => {
            const colTasks = filteredTasks.filter((t) => t.status === column.id)
            return (
              <div
                key={column.id}
                className="w-[330px] flex-shrink-0 rounded-3xl bg-[#121316]/90 border border-white/[0.06] flex flex-col max-h-full backdrop-blur-xl shadow-glass"
              >
                {/* Column Header */}
                <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: column.color }}
                    ></span>
                    <span className="text-xs font-bold text-white tracking-wide">{column.label}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#8a8d95] font-mono">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="p-1 text-[#6b6e75] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Task Cards List */}
                <div className="p-3 overflow-y-auto space-y-3 flex-1">
                  {colTasks.map((task) => {
                    const daysLeft = task.due_date ? differenceInDays(new Date(task.due_date), new Date()) : null
                    const progressPercent = task.status === 'shipped' ? 100 : task.status === 'in_progress' ? 50 : 0

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={cn(
                          'p-4 rounded-2xl bg-[#17191d] hover:bg-[#1c1f24] border transition-all duration-200 cursor-pointer shadow-sm group',
                          selectedTask?.id === task.id ? 'border-[#c8f135] shadow-glow' : 'border-white/[0.06] hover:border-white/[0.12]'
                        )}
                      >
                        {/* Top Badges: Priority + Category Tag + Deadline */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-1.5">
                            {/* Priority Badge */}
                            <span className={cn(
                              'px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wide',
                              task.priority === 'p0' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              task.priority === 'p1' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              'bg-white/[0.06] text-[#8a8d95] border border-white/[0.08]'
                            )}>
                              {task.priority === 'p0' ? 'High' : task.priority === 'p1' ? 'Medium' : 'Low'}
                            </span>

                            {/* Department / Category Tag */}
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                              {task.project?.name ? task.project.name.slice(0, 10) : 'Systems'}
                            </span>
                          </div>

                          {/* Deadline D-Day Tag */}
                          {daysLeft !== null && (
                            <span className="text-[10px] font-mono text-[#8a8d95] bg-black/30 px-1.5 py-0.5 rounded border border-white/[0.04]">
                              {daysLeft >= 0 ? `D-${daysLeft}` : `+${Math.abs(daysLeft)}d`}
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-xs font-semibold text-white tracking-tight leading-snug mb-1 group-hover:text-[#c8f135] transition-colors">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-[#8a8d95] line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}

                        {/* Progress Bar (Reference 8) */}
                        <div className="space-y-1 my-2.5">
                          <div className="flex justify-between text-[9px] font-mono text-[#6b6e75]">
                            <span>Progress</span>
                            <span className="text-white">{progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#c8f135] rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Bottom Footer: Assignee Stack + Icons */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[#6b6e75] text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#8b5cf6] to-[#c8f135] text-black font-extrabold text-[9px] flex items-center justify-center">
                              {getInitials(task.owner?.name || 'W')}
                            </div>
                            <span className="text-[10px] text-[#8a8d95] font-mono">{task.time_box_minutes || 45}m</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[10px]">
                              <MessageSquare size={11} />
                              <span>2</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <Paperclip size={11} />
                              <span>1</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Add New Pill Button */}
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full py-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-dashed border-white/[0.08] text-xs text-[#8a8d95] hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add task</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-[#121316] border border-white/[0.06] rounded-3xl p-6 shadow-glass overflow-y-auto">
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="p-4 rounded-2xl bg-[#17191d] hover:bg-[#1c1f24] border border-white/[0.06] flex items-center justify-between gap-4 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase',
                    task.priority === 'p0' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  )}>
                    {task.priority.toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white block truncate">{task.title}</span>
                    <span className="text-[10px] text-[#6b6e75] font-mono">{task.project?.name || 'General'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#8a8d95]">{task.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sliding Task Detail Drawer (Reference 8 Right Drawer) */}
      {selectedTask && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#141618]/95 backdrop-blur-2xl border-l border-white/[0.1] shadow-2xl z-50 flex flex-col animate-slideInRight">
          {/* Drawer Header */}
          <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8b5cf6] to-[#a594f9] flex items-center justify-center text-black font-extrabold text-xs">
                W
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  {selectedTask.project?.name || 'Focus OS Task'}
                </h3>
                <span className="text-[10px] text-[#6b6e75] font-mono">TASK ID: {selectedTask.id.slice(0, 8)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => deleteTask(selectedTask.id)}
                className="p-1.5 text-[#6b6e75] hover:text-red-400 hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
                title="Delete task"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 text-[#6b6e75] hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Drawer Body Attributes */}
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Task Name Input */}
            <div>
              <label className="text-[10px] font-mono text-[#6b6e75] uppercase block mb-1">Task Title</label>
              <h2 className="text-lg font-bold text-white">{selectedTask.title}</h2>
            </div>

            {/* Key-Value Attributes Grid (Reference 8) */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-black/30 border border-white/[0.06] text-xs">
              <div>
                <span className="text-[10px] text-[#6b6e75] font-mono block">PEOPLE</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-5 h-5 rounded-full bg-[#c8f135] text-black font-bold text-[9px] flex items-center justify-center">
                    {getInitials(selectedTask.owner?.name || 'W')}
                  </div>
                  <span className="text-white font-medium">{selectedTask.owner?.name || 'Assigned to you'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#6b6e75] font-mono block">DUE DATE</span>
                <span className="text-white font-medium mt-1 block">
                  {selectedTask.due_date ? format(new Date(selectedTask.due_date), 'dd MMMM yyyy') : 'No deadline'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#6b6e75] font-mono block">STATUS</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => updateTaskStatus(selectedTask.id, e.target.value as TaskStatus)}
                  className="mt-1 bg-white/[0.06] text-white border border-white/[0.1] rounded-lg px-2 py-1 text-xs outline-none cursor-pointer"
                >
                  <option value="todo" className="bg-[#141618]">To-Do</option>
                  <option value="in_progress" className="bg-[#141618]">On Progress</option>
                  <option value="blocked" className="bg-[#141618]">Blocked</option>
                  <option value="shipped" className="bg-[#141618]">Shipped</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-[#6b6e75] font-mono block">PRIORITY</span>
                <span className={cn(
                  'inline-block mt-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase',
                  selectedTask.priority === 'p0' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                )}>
                  {selectedTask.priority.toUpperCase()} Priority
                </span>
              </div>
            </div>

            {/* Tab Switcher: Description / Discussion / Attachments */}
            <div className="border-b border-white/[0.08] flex gap-6 text-xs font-medium">
              {(['description', 'discussion', 'attachments'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDrawerTab(tab)}
                  className={cn(
                    'pb-3 capitalize transition-all relative cursor-pointer',
                    activeDrawerTab === tab ? 'text-white font-bold' : 'text-[#6b6e75] hover:text-white'
                  )}
                >
                  {tab} {tab === 'attachments' && '3'}
                  {activeDrawerTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c8f135] rounded-full"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            {activeDrawerTab === 'description' ? (
              <div className="text-xs text-[#d1d5db] leading-relaxed whitespace-pre-wrap">
                {selectedTask.description || 'No detailed description provided for this task.'}
              </div>
            ) : activeDrawerTab === 'discussion' ? (
              <div className="space-y-4">
                {/* Suggestion Chips (Reference 8) */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "I'll do it 🔥",
                    "Okay 👌",
                    "Well, I'll get it done right away 👀",
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleAddComment(chip)}
                      className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[10px] text-[#8a8d95] hover:text-white transition-all cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Comment Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Add a note or update..."
                    className="flex-1 px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-[#6b6e75] outline-none"
                  />
                  <button
                    onClick={() => handleAddComment()}
                    className="px-3 py-2 bg-[#c8f135] text-black font-bold rounded-xl text-xs cursor-pointer hover:bg-[#b8e125]"
                  >
                    <Send size={13} />
                  </button>
                </div>

                {/* Comment Thread */}
                <div className="space-y-3 pt-2">
                  {comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-[#6b6e75]">
                        <span className="text-white font-medium">{c.user}</span>
                        <span>{c.time}</span>
                      </div>
                      <p className="text-xs text-[#d1d5db]">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#6b6e75]">
                3 Project assets linked.
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-white/[0.08] flex items-center justify-between gap-3 bg-[#101114]">
            <button
              onClick={() => updateTaskStatus(selectedTask.id, 'shipped')}
              className="flex-1 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={14} />
              <span>Mark Shipped</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
