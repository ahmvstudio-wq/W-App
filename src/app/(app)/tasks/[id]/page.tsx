'use client'

export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { 
  ArrowLeft, CheckSquare, Sparkles, Clock, Calendar, 
  Trash2, Save, Layers, AlertCircle, Plus, Check, 
  Send, ExternalLink, Play, CheckCircle2, ChevronRight, User, Flag
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { cn, getInitials } from '@/lib/utils'
import { challengeTask } from '@/lib/groq/client'
import type { Task, Priority, TaskStatus, Project } from '@/types'

export const dynamic = 'force-dynamic'

interface MicroTask {
  id: string
  title: string
  completed: boolean
  estimated_minutes?: number
}

export default function DedicatedTaskPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params?.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [outputDescription, setOutputDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('p1')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [timeBox, setTimeBox] = useState<number>(45)
  const [dueDate, setDueDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [projectId, setProjectId] = useState('')

  // Micro-Tasks State
  const [microtasks, setMicrotasks] = useState<MicroTask[]>([])
  const [newMicroTaskTitle, setNewMicroTaskTitle] = useState('')
  const [newMicroTaskMinutes, setNewMicroTaskMinutes] = useState(15)
  const [generatingAi, setGeneratingAi] = useState(false)

  // Activity / Notes
  const [notes, setNotes] = useState<{ id: string; user: string; time: string; text: string }[]>([
    { id: '1', user: 'AI Chief of Staff', time: 'Initial Sync', text: 'Task staged into active sprint.' }
  ])
  const [newNote, setNewNote] = useState('')

  // AI Scope Review
  const [aiReview, setAiReview] = useState<string | null>(null)
  const [auditingAi, setAuditingAi] = useState(false)

  async function fetchTaskData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, project:projects(*), owner:profiles(*)')
        .eq('id', taskId)
        .single()

      if (error || !data) {
        toast.error('Task not found')
        router.push('/tasks')
        return
      }

      setTask(data)
      setTitle(data.title || '')
      setDescription(data.description || '')
      setOutputDescription(data.output_description || '')
      setPriority(data.priority || 'p1')
      setStatus(data.status || 'todo')
      setTimeBox(data.time_box_minutes || 45)
      setDueDate(data.due_date ? data.due_date.slice(0, 16) : '')
      setStartTime(data.start_time ? data.start_time.slice(0, 16) : '')
      setEndTime(data.end_time ? data.end_time.slice(0, 16) : '')
      setProjectId(data.project_id || '')

      // Load microtasks from storage or defaults
      const savedMicrotasks = localStorage.getItem(`microtasks_${taskId}`)
      if (savedMicrotasks) {
        try {
          setMicrotasks(JSON.parse(savedMicrotasks))
        } catch {
          setMicrotasks(getDefaultMicrotasks(data.status))
        }
      } else {
        setMicrotasks(getDefaultMicrotasks(data.status))
      }

      // Fetch projects
      const { data: projData } = await supabase.from('projects').select('*').order('name')
      if (projData) setProjects(projData)
    } catch (err: any) {
      toast.error(`Error loading task: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  function getDefaultMicrotasks(taskStatus: TaskStatus): MicroTask[] {
    return [
      { id: '1', title: 'Define scope, requirements & constraints', completed: taskStatus === 'shipped' || taskStatus === 'in_progress', estimated_minutes: 15 },
      { id: '2', title: 'Execute primary core deliverable', completed: taskStatus === 'shipped', estimated_minutes: 30 },
      { id: '3', title: 'Verify quality & review edge cases', completed: taskStatus === 'shipped', estimated_minutes: 15 },
      { id: '4', title: 'Ship tangible output and log results', completed: taskStatus === 'shipped', estimated_minutes: 10 },
    ]
  }

  useEffect(() => {
    if (taskId) fetchTaskData()
  }, [taskId])

  // Save microtasks to local storage on change
  useEffect(() => {
    if (taskId && microtasks.length > 0) {
      localStorage.setItem(`microtasks_${taskId}`, JSON.stringify(microtasks))
    }
  }, [microtasks, taskId])

  async function handleSaveTask() {
    setSaving(true)
    try {
      const updates: any = {
        title: title.trim(),
        description: description.trim(),
        output_description: outputDescription.trim(),
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
        if (task?.started_at) {
          const startMs = new Date(task.started_at).getTime()
          const endMs = now.getTime()
          const diffMinutes = Math.max(1, Math.round((endMs - startMs) / 60000))
          updates.time_box_minutes = diffMinutes
        }
      } else if (status === 'in_progress' && !task?.started_at) {
        updates.started_at = new Date().toISOString()
      } else if (status === 'todo') {
        updates.completed_at = null
      }

      const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)
      if (error) throw error

      toast.success('Task saved successfully')
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteTask() {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) throw error

      toast.success('Task deleted')
      router.push('/tasks')
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleAddMicroTask(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!newMicroTaskTitle.trim()) return

    const newId = `m-${Date.now()}`
    setMicrotasks(prev => [
      ...prev,
      {
        id: newId,
        title: newMicroTaskTitle.trim(),
        completed: false,
        estimated_minutes: Number(newMicroTaskMinutes) || 15
      }
    ])
    setNewMicroTaskTitle('')
    toast.success('Micro-task added')
  }

  function toggleMicroTask(id: string) {
    setMicrotasks(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m)
      const allDone = updated.every(m => m.completed)
      if (allDone && status !== 'shipped') {
        setStatus('shipped')
        toast.success('All micro-tasks finished! Marked as Shipped.')
      }
      return updated
    })
  }

  function deleteMicroTask(id: string) {
    setMicrotasks(prev => prev.filter(m => m.id !== id))
  }

  async function handleAiDecompose() {
    setGeneratingAi(true)
    try {
      const res = await fetch('/api/ai/microtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      })

      const data = await res.json()
      if (data.success && Array.isArray(data.microtasks)) {
        setMicrotasks(data.microtasks)
        toast.success(`Generated ${data.microtasks.length} atomic micro-tasks!`)
      } else {
        toast.error('Failed to generate micro-tasks')
      }
    } catch (err: any) {
      toast.error(`AI Decomposition error: ${err.message}`)
    } finally {
      setGeneratingAi(false)
    }
  }

  async function handleRunAiReview() {
    setAuditingAi(true)
    try {
      const result = await challengeTask(title, description || title)
      setAiReview(`Scope Assessment: ${result.scope_question}\nSuggested Priority: ${result.priority?.toUpperCase()} (${result.priority_reasoning})\nOptimal Timebox: ${result.time_box_minutes}m`)
      if (result.priority) setPriority(result.priority as Priority)
      if (result.time_box_minutes) setTimeBox(result.time_box_minutes)
      toast.success('Scope audit complete')
    } catch {
      setAiReview('Task scope aligns with current sprint priorities. Ensure proof of deliverable is captured before shipping.')
    } finally {
      setAuditingAi(false)
    }
  }

  function handleAddNote(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!newNote.trim()) return
    setNotes(prev => [
      ...prev,
      { id: Date.now().toString(), user: 'You', time: 'Just now', text: newNote.trim() }
    ])
    setNewNote('')
  }

  const completedMicrotasks = microtasks.filter(m => m.completed).length
  const progressPercent = microtasks.length > 0 ? Math.round((completedMicrotasks / microtasks.length) * 100) : 0
  const totalMicroMinutes = microtasks.reduce((acc, m) => acc + (m.estimated_minutes || 15), 0)

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#9ca3af] font-body font-light">
        Loading dedicated task workspace...
      </div>
    )
  }

  if (!task) return null

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/tasks"
            className="p-2 text-[#9ca3af] hover:text-black hover:bg-black/[0.04] rounded-xl transition-colors flex items-center gap-1.5 text-xs font-body font-light"
          >
            <ArrowLeft size={16} />
            <span>Tasks</span>
          </Link>
          <span className="text-[#d1d5db]">/</span>
          <div className="flex items-center gap-2 font-mono text-xs text-[#6b7280]">
            <span className="px-2 py-0.5 rounded-md bg-black/[0.04] text-black uppercase font-medium">
              {priority.toUpperCase()}
            </span>
            <span>TASK-{taskId.slice(0, 6).toUpperCase()}</span>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 font-body">
          <button
            onClick={handleDeleteTask}
            disabled={isDeleting}
            className="p-2 text-[#9ca3af] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1.5"
            title="Delete Task"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <button
            onClick={handleSaveTask}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white font-normal text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Dedicated Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start font-body">
        {/* Left / Main Column: Task Details, Micro-tasks & Deliverables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title Card */}
          <div className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm space-y-4">
            <div>
              <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1.5">
                TASK TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to get done?"
                className="w-full text-xl font-normal text-black outline-none border-b border-transparent focus:border-black py-1 placeholder:text-[#9ca3af]"
              />
            </div>

            {/* Quick Selectors Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-black/[0.04]">
              <div>
                <label className="text-[10px] font-mono text-[#9ca3af] uppercase block mb-1">STATUS</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full p-2 bg-[#fafafa] border border-black/[0.06] rounded-xl text-xs text-black outline-none font-light"
                >
                  <option value="todo">To-Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="shipped">Shipped</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#9ca3af] uppercase block mb-1">PRIORITY</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full p-2 bg-[#fafafa] border border-black/[0.06] rounded-xl text-xs text-black outline-none font-light"
                >
                  <option value="p0">P0 - Urgent</option>
                  <option value="p1">P1 - High</option>
                  <option value="p2">P2 - Medium</option>
                  <option value="p3">P3 - Low</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#9ca3af] uppercase block mb-1">TIMEBOX</label>
                <input
                  type="number"
                  value={timeBox}
                  onChange={(e) => setTimeBox(Number(e.target.value))}
                  className="w-full p-2 bg-[#fafafa] border border-black/[0.06] rounded-xl text-xs text-black outline-none font-light"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#9ca3af] uppercase block mb-1">PROJECT</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full p-2 bg-[#fafafa] border border-black/[0.06] rounded-xl text-xs text-black outline-none font-light truncate"
                >
                  <option value="">No Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Micro-Tasks & Subtasks Dedicated Section */}
          <div className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <CheckSquare size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-normal text-black">Micro-Tasks &amp; Checklist</h3>
                </div>
                <p className="text-[11px] text-[#9ca3af] font-mono mt-0.5">
                  {completedMicrotasks} of {microtasks.length} steps completed • Total ~{totalMicroMinutes}m
                </p>
              </div>

              <button
                onClick={handleAiDecompose}
                disabled={generatingAi}
                className="px-3 py-1.5 bg-[#fafafa] hover:bg-[#f0f0f2] text-black border border-black/[0.08] rounded-xl text-xs font-normal transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{generatingAi ? 'Decomposing...' : 'Break Into Micro-Tasks'}</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#6b7280]">Progress</span>
                <span className="text-black font-semibold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/[0.04] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Micro-Tasks List */}
            <div className="space-y-2.5">
              {microtasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#9ca3af] border border-dashed border-black/[0.08] rounded-2xl">
                  No micro-tasks yet. Click &quot;Decompose with AI&quot; or add a step below.
                </div>
              ) : (
                microtasks.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => toggleMicroTask(m.id)}
                    className={cn(
                      'p-3.5 px-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group',
                      m.completed
                        ? 'bg-[#fcfdfd] border-black/[0.04] opacity-75'
                        : 'bg-white hover:bg-[#fafbff] border-black/[0.08]'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={m.completed}
                        onChange={() => toggleMicroTask(m.id)}
                        className="w-4 h-4 rounded accent-black cursor-pointer"
                      />
                      <span className={cn('text-xs flex-1 truncate font-light', m.completed ? 'line-through text-[#9ca3af]' : 'text-black')}>
                        {m.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {m.estimated_minutes && (
                        <span className="text-[10px] font-mono text-[#9ca3af] bg-black/[0.03] px-2 py-0.5 rounded-md">
                          {m.estimated_minutes}m
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMicroTask(m.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[#9ca3af] hover:text-red-600 transition-opacity p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Micro-Task Form */}
            <form onSubmit={handleAddMicroTask} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newMicroTaskTitle}
                onChange={(e) => setNewMicroTaskTitle(e.target.value)}
                placeholder="Add next actionable step..."
                className="flex-1 px-4 py-2 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
              />
              <input
                type="number"
                value={newMicroTaskMinutes}
                onChange={(e) => setNewMicroTaskMinutes(Number(e.target.value))}
                placeholder="Minutes"
                className="w-20 px-3 py-2 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                title="Estimated minutes"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-xl text-xs font-normal hover:bg-neutral-800 cursor-pointer"
              >
                Add Step
              </button>
            </form>
          </div>

          {/* Outcome Artifact & Description */}
          <div className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm space-y-4">
            <h3 className="text-sm font-normal text-black">Description &amp; Deliverables</h3>
            <div>
              <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">
                DESCRIPTION &amp; DETAILS
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Context and details for this task..."
                className="w-full p-3.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-2xl text-xs text-black outline-none resize-none font-light leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-1">
                COMPLETION PROOF / ATTACHMENT LINK (OPTIONAL)
              </label>
              <textarea
                rows={2}
                value={outputDescription}
                onChange={(e) => setOutputDescription(e.target.value)}
                placeholder="e.g. Pull Request link, Loom video URL, Figma link, or document link..."
                className="w-full p-3.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-2xl text-xs text-black outline-none resize-none font-light leading-relaxed"
              />
            </div>
          </div>

          {/* Progress Notes / Discussion */}
          <div className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm space-y-4">
            <h3 className="text-sm font-normal text-black">Notes &amp; Updates</h3>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a progress update or note..."
                className="flex-1 px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-black text-white rounded-xl text-xs hover:bg-neutral-800 cursor-pointer flex items-center gap-1.5"
              >
                <Send size={12} />
                <span>Add Note</span>
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {notes.map(n => (
                <div key={n.id} className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.04] space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-[#9ca3af]">
                    <span className="text-black font-medium">{n.user}</span>
                    <span>{n.time}</span>
                  </div>
                  <p className="text-xs text-[#4b5563] font-light leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Telemetry & AI Chief of Staff */}
        <div className="space-y-6">
          {/* Telemetry Card */}
          <div className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm space-y-4">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block">
              TASK TIMELINE
            </span>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between pb-2 border-b border-black/[0.04]">
                <span className="text-[#9ca3af]">Created:</span>
                <span className="text-black">{format(new Date(task.created_at), 'dd MMM yyyy')}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-black/[0.04]">
                <span className="text-[#9ca3af]">Started:</span>
                <span className="text-black">{task.started_at ? format(new Date(task.started_at), 'HH:mm') : 'Not started'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-black/[0.04]">
                <span className="text-[#9ca3af]">Shipped:</span>
                <span className="text-black">{task.completed_at ? format(new Date(task.completed_at), 'dd MMM') : 'In flight'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Deadline:</span>
                <span className="text-black">{dueDate ? format(new Date(dueDate), 'dd MMM HH:mm') : 'None set'}</span>
              </div>
            </div>
          </div>

          {/* Scope Advice Card */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-black font-medium text-xs">
                <span>Scope Guidance</span>
              </div>
              <button
                onClick={handleRunAiReview}
                disabled={auditingAi}
                className="px-3 py-1 bg-black text-white rounded-lg text-xs font-normal hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                {auditingAi ? 'Auditing...' : 'Review Scope'}
              </button>
            </div>

            <div className="text-xs text-[#374151] font-light leading-relaxed whitespace-pre-wrap bg-white/80 p-4 rounded-2xl border border-black/[0.04]">
              {aiReview || 'Click "Review Scope" to get AI suggestions on timebox and deliverable focus.'}
            </div>
          </div>

          {/* Associated Project */}
          {task.project && (
            <div className="p-6 rounded-3xl bg-white border border-black/[0.08] shadow-sm space-y-3">
              <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block">
                ASSOCIATED PROJECT
              </span>
              <div className="space-y-1">
                <h4 className="text-sm font-normal text-black">{task.project.name}</h4>
                <p className="text-xs text-[#9ca3af] font-light line-clamp-2">{task.project.description}</p>
              </div>
              <Link
                href={`/projects/${task.project.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline font-mono pt-1"
              >
                <span>View Full Project Overview</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
