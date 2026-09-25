'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Priority, Project } from '@/types'

interface CreateTaskModalProps {
  onClose: () => void
  onSuccess: () => void
  initialProjectId?: string
  initialDate?: Date
}

export default function CreateTaskModal({ onClose, onSuccess, initialProjectId, initialDate }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [output, setOutput] = useState('')
  const [timeBox, setTimeBox] = useState('45')
  const [priority, setPriority] = useState<Priority>('p1')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'shipped'>('todo')
  const [projectId, setProjectId] = useState<string>(initialProjectId || '')
  
  const formatLocal = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const getInitialDates = () => {
    if (initialDate) {
      const start = new Date(initialDate)
      if (start.getHours() === 0 && start.getMinutes() === 0) {
        start.setHours(18, 0, 0, 0)
      }
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + 45)
      return {
        due: formatLocal(start),
        start: formatLocal(start),
        end: formatLocal(end)
      }
    }
    const defaultStart = new Date()
    defaultStart.setMinutes(defaultStart.getMinutes() + 15)
    const defaultEnd = new Date(defaultStart)
    defaultEnd.setMinutes(defaultEnd.getMinutes() + 45)
    return {
      due: '',
      start: formatLocal(defaultStart),
      end: formatLocal(defaultEnd)
    }
  }

  const init = getInitialDates()
  const [dueDate, setDueDate] = useState<string>(init.due)
  const [startTime, setStartTime] = useState<string>(init.start)
  const [endTime, setEndTime] = useState<string>(init.end)

  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])

  const setDeadlineShortcut = (type: 'today' | 'tomorrow' | 'friday' | 'next_monday') => {
    const now = new Date()
    const target = new Date()
    target.setHours(18, 0, 0, 0)

    if (type === 'today') {
      if (now.getHours() >= 18) {
        target.setDate(now.getDate() + 1)
      }
    } else if (type === 'tomorrow') {
      target.setDate(now.getDate() + 1)
    } else if (type === 'friday') {
      const day = now.getDay()
      const diff = (5 - day + 7) % 7 || 7
      target.setDate(now.getDate() + diff)
    } else if (type === 'next_monday') {
      const day = now.getDay()
      const diff = (1 - day + 7) % 7 || 7
      target.setDate(now.getDate() + diff)
    }
    setDueDate(formatLocal(target))
  }

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase.from('projects').select('id, name').eq('status', 'active')
      if (data) setProjects(data as any)
    }
    fetchProjects()
  }, [])

  async function handleCreateTask() {
    if (!title) {
      toast.error('Task title is required')
      return
    }
    setSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      let workspaceId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null
      if (!workspaceId) {
        let { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', session.user.id).limit(1)
        workspaceId = workspaces?.[0]?.id
      }

      if (!workspaceId) {
        const { data: newWs } = await supabase.from('workspaces').insert({
          owner_id: session.user.id,
          name: 'My Workspace'
        }).select().single()
        workspaceId = newWs?.id
      }

      const due = dueDate ? new Date(dueDate) : null
      const start = startTime ? new Date(startTime) : null
      const end = endTime ? new Date(endTime) : null

      const { data: createdTask, error: taskError } = await supabase.from('tasks').insert({
        title,
        output: output || null,
        priority,
        status,
        time_box_minutes: parseInt(timeBox) || 45,
        project_id: projectId || null,
        workspace_id: workspaceId,
        user_id: session.user.id,
        due_date: due ? due.toISOString() : null,
        start_time: start ? start.toISOString() : null,
        end_time: end ? end.toISOString() : null,
      }).select().single()

      if (taskError) throw taskError

      // Log activity
      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        actor_id: session.user.id,
        action: 'task_created',
        target_type: 'task',
        target_id: createdTask.id,
        metadata: { title, priority, status }
      })

      // Dispatch optimistic updates
      window.dispatchEvent(new CustomEvent('task-created-optimistic', {
        detail: {
          task: createdTask,
          userId: session.user.id,
          timestamp: new Date().toISOString()
        }
      }))

      toast.success(status === 'shipped' ? 'Task logged as shipped' : 'Task created')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white border border-black/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Clean Header */}
        <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-black">Create Task</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#9ca3af] hover:text-black rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-body">
          {/* Task Title */}
          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1">Title</label>
            <input 
              autoFocus
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              type="text" 
              placeholder="What needs to be done?" 
              className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-normal"
            />
          </div>

          {/* Project & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">Project</label>
              <select 
                value={projectId} 
                onChange={e => setProjectId(e.target.value)} 
                className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-normal"
              >
                <option value="">No Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">Status</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value as any)} 
                className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-normal"
              >
                <option value="todo">To-Do</option>
                <option value="in_progress">In Progress</option>
                <option value="shipped">Done / Shipped</option>
              </select>
            </div>
          </div>

          {/* Priority & Timebox */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-normal"
              >
                <option value="p0">P0 - Urgent</option>
                <option value="p1">P1 - High</option>
                <option value="p2">P2 - Normal</option>
                <option value="p3">P3 - Low</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">Timebox</label>
              <div className="flex gap-2">
                <input
                  value={timeBox}
                  onChange={e => setTimeBox(e.target.value)}
                  type="number"
                  placeholder="45"
                  className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-normal"
                />
                <div className="flex gap-1">
                  {['30', '45', '60', '90'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTimeBox(m)}
                      className={cn(
                        'px-2 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                        timeBox === m ? 'bg-black text-white border-black' : 'bg-white border-black/[0.08] text-[#6b7280]'
                      )}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-black/[0.08] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-800 block">Due Date</label>
              <span className="text-[11px] text-neutral-400">Optional deadline</span>
            </div>

            {/* Quick shortcuts */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setDeadlineShortcut('today')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 border border-black/[0.08] text-neutral-700 transition-all cursor-pointer"
              >
                Today 6 PM
              </button>
              <button
                type="button"
                onClick={() => setDeadlineShortcut('tomorrow')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 border border-black/[0.08] text-neutral-700 transition-all cursor-pointer"
              >
                Tomorrow 6 PM
              </button>
              <button
                type="button"
                onClick={() => setDeadlineShortcut('friday')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 border border-black/[0.08] text-neutral-700 transition-all cursor-pointer"
              >
                Friday 6 PM
              </button>
              <button
                type="button"
                onClick={() => setDeadlineShortcut('next_monday')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 border border-black/[0.08] text-neutral-700 transition-all cursor-pointer"
              >
                Next Mon
              </button>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="px-2.5 py-1 rounded-lg text-red-500 hover:bg-red-50 border border-red-200 transition-all cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Exact Datetime Input */}
            <input 
              type="datetime-local" 
              value={dueDate} 
              onChange={e => setDueDate(e.target.value)} 
              className="w-full px-3.5 py-2 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-neutral-700 block mb-1">Description / Deliverable</label>
            <textarea 
              value={output} 
              onChange={e => setOutput(e.target.value)} 
              placeholder="What concrete deliverable proves this is done?" 
              rows={3} 
              className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none resize-none font-normal"
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 px-6 border-t border-black/[0.06] flex justify-end gap-3 bg-[#fdfdfe] font-body">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-normal text-[#6b7280] hover:text-black transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateTask}
            disabled={saving}
            className="px-5 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-sm"
          >
            {saving ? 'Creating...' : status === 'shipped' ? 'Log as Done' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
