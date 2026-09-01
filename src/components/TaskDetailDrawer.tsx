'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  X, Trash2, Check, Clock, Calendar, AlertCircle, Sparkles, 
  Tag, ListChecks, MessageSquare, Send, Save, ArrowRight, 
  ExternalLink, Layers, CheckSquare, Plus, ChevronDown, Flag
} from 'lucide-react'
import { format, differenceInDays, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn, getInitials } from '@/lib/utils'
import { challengeTask } from '@/lib/groq/client'
import type { Task, Priority, TaskStatus, Project } from '@/types'

interface TaskDetailDrawerProps {
  task: Task | null
  onClose: () => void
  onUpdate: () => void
}

export default function TaskDetailDrawer({ task, onClose, onUpdate }: TaskDetailDrawerProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState<Priority>(task?.priority || 'p2')
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo')
  const [timeBox, setTimeBox] = useState<number>(task?.time_box_minutes || 45)
  const [dueDate, setDueDate] = useState<string>(task?.due_date ? task.due_date.slice(0, 16) : '')
  const [startTime, setStartTime] = useState<string>(task?.start_time ? task.start_time.slice(0, 16) : '')
  const [endTime, setEndTime] = useState<string>(task?.end_time ? task.end_time.slice(0, 16) : '')
  const [projectId, setProjectId] = useState<string>(task?.project_id || '')
  
  const [projects, setProjects] = useState<Project[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'ai' | 'activity'>('details')

  // Subtasks state
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([
    { id: '1', title: 'Define scope & requirements', completed: task?.status === 'shipped' || task?.status === 'in_progress' },
    { id: '2', title: 'Execute primary deliverable', completed: task?.status === 'shipped' },
    { id: '3', title: 'Review and ship outcome', completed: task?.status === 'shipped' },
  ])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  // Comments / Activity state
  const [comments, setComments] = useState<{ id: string; user: string; time: string; text: string }[]>([
    { id: '1', user: 'AI Chief of Staff', time: 'Initial sync', text: `Task created with ${task?.time_box_minutes || 45}m timebox.` }
  ])
  const [newComment, setNewComment] = useState('')

  // AI Scope Challenge state
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setDescription(task.description || '')
      setPriority(task.priority || 'p2')
      setStatus(task.status || 'todo')
      setTimeBox(task.time_box_minutes || 45)
      setDueDate(task.due_date ? task.due_date.slice(0, 16) : '')
      setStartTime(task.start_time ? task.start_time.slice(0, 16) : '')
      setEndTime(task.end_time ? task.end_time.slice(0, 16) : '')
      setProjectId(task.project_id || '')
    }
  }, [task])

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase.from('projects').select('*').order('name')
      if (data) setProjects(data)
    }
    fetchProjects()
  }, [])

  if (!task) return null

  async function handleSaveChanges() {
    if (!task) return
    setIsSaving(true)
    try {
      const updates: any = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        time_box_minutes: Number(timeBox) || 45,
        project_id: projectId || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        start_time: startTime ? new Date(startTime).toISOString() : null,
        end_time: endTime ? new Date(endTime).toISOString() : null,
        updated_at: new Date().toISOString()
      }

      if (status === 'shipped') {
        const now = new Date()
        updates.completed_at = now.toISOString()
        if (task.started_at) {
          const startMs = new Date(task.started_at).getTime()
          const endMs = now.getTime()
          const diffMinutes = Math.max(1, Math.round((endMs - startMs) / 60000))
          updates.time_box_minutes = diffMinutes
        }
      } else if (status === 'in_progress' && !task.started_at) {
        updates.started_at = new Date().toISOString()
      } else if (status === 'todo') {
        updates.completed_at = null
      }

      const { error } = await supabase.from('tasks').update(updates).eq('id', task.id)
      if (error) throw error

      toast.success('Task updated successfully')
      onUpdate()
    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteTask() {
    if (!task) return
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id)
      if (error) throw error

      toast.success('Task deleted')
      onClose()
      onUpdate()
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleAddSubtask(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!newSubtaskTitle.trim()) return
    setSubtasks(prev => [...prev, { id: Date.now().toString(), title: newSubtaskTitle.trim(), completed: false }])
    setNewSubtaskTitle('')
  }

  function toggleSubtask(id: string) {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s))
  }

  function handleAddComment(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!newComment.trim()) return
    setComments(prev => [...prev, { id: Date.now().toString(), user: 'You', time: 'Just now', text: newComment.trim() }])
    setNewComment('')
  }

  async function handleAiScopeChallenge() {
    setLoadingAi(true)
    try {
      const result = await challengeTask(title, description || title)
      setAiAnalysis(`AI Scope Assessment: ${result.scope_question}\nSuggested Priority: ${result.priority?.toUpperCase()} (${result.priority_reasoning})\nOptimal Timebox: ${result.time_box_minutes}m`)
      if (result.priority) setPriority(result.priority as Priority)
      if (result.time_box_minutes) setTimeBox(result.time_box_minutes)
      toast.success('AI recommendations applied')
    } catch {
      setAiAnalysis('AI Assessment: Task scope aligns with sprint goals. Keep focus high and avoid extraneous features.')
    } finally {
      setLoadingAi(false)
    }
  }

  const completedSubtasks = subtasks.filter(s => s.completed).length
  const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white border-l border-black/[0.08] shadow-2xl z-50 flex flex-col animate-slideInRight font-sans">
      {/* Header */}
      <div className="p-5 px-6 border-b border-black/[0.06] flex items-center justify-between bg-white flex-shrink-0 font-body">
        <div className="flex items-center gap-3">
          <span className={cn(
            'px-2.5 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase',
            priority === 'p0' ? 'bg-red-50 text-red-600 border border-red-200' :
            priority === 'p1' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
            'bg-black/[0.04] text-[#6b7280]'
          )}>
            {priority.toUpperCase()}
          </span>
          <span className="text-xs font-mono text-[#9ca3af]">TASK-{task.id.slice(0, 6).toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/tasks/${task.id}`}
            className="p-1.5 text-[#9ca3af] hover:text-black hover:bg-black/[0.04] rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs"
            title="Open Dedicated Full Page"
          >
            <ExternalLink size={15} />
            <span className="hidden sm:inline">Full Page</span>
          </Link>
          <button
            onClick={handleDeleteTask}
            disabled={isDeleting}
            className="p-1.5 text-[#9ca3af] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Delete Task"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9ca3af] hover:text-black hover:bg-black/[0.04] rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-black/[0.06] flex gap-6 text-xs font-body flex-shrink-0 bg-white">
        {[
          { id: 'details', label: 'Details & Edit', icon: CheckSquare },
          { id: 'subtasks', label: `Checklist (${completedSubtasks}/${subtasks.length})`, icon: ListChecks },
          { id: 'ai', label: 'Scope Guidance', icon: CheckSquare },
          { id: 'activity', label: 'Activity', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'py-3 flex items-center gap-1.5 transition-all cursor-pointer font-light relative',
              activeTab === tab.id
                ? 'text-black font-normal border-b-2 border-black'
                : 'text-[#9ca3af] hover:text-black'
            )}
          >
            <tab.icon size={13} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fbfbfd] font-body">
        {activeTab === 'details' && (
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">TASK DELIVERABLE TITLE</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full px-4 py-2.5 bg-white border border-black/[0.08] focus:border-black rounded-xl text-sm text-black outline-none font-normal shadow-sm"
              />
            </div>

            {/* Project Selection & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">PROJECT</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light shadow-sm"
                >
                  <option value="">No Project (General)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">STATUS</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-3.5 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light shadow-sm"
                >
                  <option value="todo">To-Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="shipped">Shipped</option>
                </select>
              </div>
            </div>

            {/* Priority & Timebox */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">PRIORITY</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3.5 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light shadow-sm"
                >
                  <option value="p0">P0 - Critical</option>
                  <option value="p1">P1 - High</option>
                  <option value="p2">P2 - Medium</option>
                  <option value="p3">P3 - Low</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">TIMEBOX (MINUTES)</label>
                <input
                  type="number"
                  value={timeBox}
                  onChange={(e) => setTimeBox(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light shadow-sm"
                />
              </div>
            </div>

            {/* Expected Output / Description */}
            <div>
              <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">EXPECTED OUTCOME / SPECIFICATION</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the tangible artifact or proof of completion..."
                className="w-full px-4 py-2.5 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none resize-none font-light shadow-sm"
              />
            </div>

            {/* Due Date & Scheduled Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">DEADLINE</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light shadow-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">CALENDAR SCHEDULE START</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light shadow-sm"
                />
              </div>
            </div>

            {/* Metadata & Telemetry Card */}
            <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-2 text-xs">
              <span className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider block">EXECUTION TELEMETRY</span>
              <div className="grid grid-cols-2 gap-2 text-[#6b7280] font-mono text-[11px]">
                <div>Created: <span className="text-black">{format(new Date(task.created_at), 'dd MMM yyyy')}</span></div>
                <div>Status: <span className="text-black uppercase">{task.status}</span></div>
                <div>Started: <span className="text-black">{task.started_at ? format(new Date(task.started_at), 'HH:mm') : 'Not started'}</span></div>
                <div>Shipped: <span className="text-black">{task.completed_at ? format(new Date(task.completed_at), 'dd MMM') : 'In flight'}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subtasks' && (
          <div className="space-y-4">
            {/* Header & AI Decompose */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block">
                ATOMIC MICRO-TASKS
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/ai/microtasks', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title, description })
                    })
                    const data = await res.json()
                    if (data.success && Array.isArray(data.microtasks)) {
                      setSubtasks(data.microtasks.map((m: any) => ({ id: m.id, title: m.title, completed: false })))
                      toast.success(`Generated ${data.microtasks.length} micro-tasks with AI!`)
                    }
                  } catch (e) {
                    toast.error('AI decomposition failed')
                  }
                }}
                className="text-[11px] text-[#6b7280] hover:text-black flex items-center gap-1 font-mono cursor-pointer"
              >
                <span>Break into Subtasks</span>
              </button>
            </div>

            {/* Progress */}
            <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#6b7280]">Checklist Completion</span>
                <span className="text-black font-semibold">{subtaskProgress}%</span>
              </div>
              <div className="w-full h-2 bg-black/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${subtaskProgress}%` }} />
              </div>
            </div>

            {/* Subtask Items */}
            <div className="space-y-2">
              {subtasks.map((s) => (
                <div
                  key={s.id}
                  onClick={() => toggleSubtask(s.id)}
                  className="p-3 px-4 rounded-xl bg-white border border-black/[0.06] shadow-sm flex items-center gap-3 cursor-pointer hover:border-black/[0.15] transition-all"
                >
                  <input
                    type="checkbox"
                    checked={s.completed}
                    onChange={() => toggleSubtask(s.id)}
                    className="w-4 h-4 rounded accent-black cursor-pointer"
                  />
                  <span className={cn('text-xs flex-1', s.completed ? 'line-through text-[#9ca3af]' : 'text-black')}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add new checklist item..."
                className="flex-1 px-4 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light shadow-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-xl text-xs font-normal hover:bg-neutral-800 cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-black font-medium text-xs">
                  <span>Scope Guidance</span>
                </div>
                <button
                  onClick={handleAiScopeChallenge}
                  disabled={loadingAi}
                  className="px-3 py-1 bg-black text-white rounded-lg text-xs font-normal hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                >
                  {loadingAi ? 'Analyzing Scope...' : 'Run Scope Audit'}
                </button>
              </div>

              <div className="text-xs text-[#374151] font-light leading-relaxed whitespace-pre-wrap bg-white/80 p-4 rounded-xl border border-black/[0.04]">
                {aiAnalysis || 'Click "Run Scope Audit" to stress-test deliverable scope, optimal timebox, and priority.'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Log a note or progress update..."
                className="flex-1 px-4 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light shadow-sm"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-black text-white rounded-xl text-xs hover:bg-neutral-800 cursor-pointer"
              >
                <Send size={13} />
              </button>
            </form>

            <div className="space-y-2.5">
              {comments.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-white border border-black/[0.06] shadow-sm space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-[#9ca3af]">
                    <span className="text-black font-medium">{c.user}</span>
                    <span>{c.time}</span>
                  </div>
                  <p className="text-xs text-[#4b5563] font-light leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 px-6 border-t border-black/[0.06] flex items-center justify-between gap-3 bg-white font-body flex-shrink-0">
        <button
          onClick={handleDeleteTask}
          disabled={isDeleting}
          className="px-4 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer font-light"
        >
          Delete Task
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-[#6b7280] hover:text-black transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Save size={13} />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
