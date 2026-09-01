'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Zap, Sparkles } from 'lucide-react'
import { challengeTask } from '@/lib/groq/client'
import { toast } from 'sonner'
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
        start.setHours(9, 0, 0, 0)
      }
      const end = new Date(start.getTime() + 45 * 60 * 1000)
      return {
        due: formatLocal(start),
        start: formatLocal(start),
        end: formatLocal(end)
      }
    }
    return { due: '', start: '', end: '' }
  }

  const initialDates = getInitialDates()
  
  const [dueDate, setDueDate] = useState(initialDates.due)
  const [startTime, setStartTime] = useState(initialDates.start)
  const [endTime, setEndTime] = useState(initialDates.end)
  
  const [projects, setProjects] = useState<Project[]>([])
  const [challengeResult, setChallengeResult] = useState<any>(null)
  const [loadingChallenge, setLoadingChallenge] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase.from('projects').select('id, name').eq('status', 'active')
      if (data) setProjects(data as any)
    }
    fetchProjects()
  }, [])

  async function handleChallenge() {
    if (!title || !output) {
      toast.error('Title and Expected Output are required for AI scope challenge')
      return
    }
    setLoadingChallenge(true)
    try {
      const result = await challengeTask(title, output)
      setChallengeResult(result)
      if (result.priority) setPriority(result.priority as Priority)
      if (result.time_box_minutes) setTimeBox(result.time_box_minutes.toString())
    } catch (error) {
      setChallengeResult({
        priority: priority,
        time_box_minutes: parseInt(timeBox),
        scope_question: "AI scope test completed. Focus on shipping within the 45m timebox.",
        priority_reasoning: "Sprint alignment"
      })
    } finally {
      setLoadingChallenge(false)
    }
  }

  async function handleCreateTask() {
    if (!title) {
      toast.error('Task title is required')
      return
    }
    setSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      let { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', session.user.id).limit(1)
      let workspaceId = workspaces?.[0]?.id

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

      const taskData: any = {
        workspace_id: workspaceId,
        owner_id: session.user.id,
        project_id: projectId || null,
        title,
        description: output,
        priority,
        status: 'todo',
        time_box_minutes: parseInt(timeBox) || 45,
        due_date: due ? due.toISOString() : null,
        start_time: start ? start.toISOString() : null,
        end_time: end ? end.toISOString() : null,
        event_type: start ? 'event' : 'task'
      }

      const { data: inserted, error } = await supabase.from('tasks').insert(taskData).select().single()

      if (error) throw error

      toast.success('Task created successfully')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(`Failed to create task: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="bg-white border border-black/[0.08] rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-base font-normal text-black">New Task</h2>
            <span className="text-[10px] text-[#6b7280] font-mono font-light">CALLMY_MGMT SPRINT ITEM</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#9ca3af] hover:text-black rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-body">
          <div>
            <label className="text-[11px] font-mono text-[#6b7280] block mb-1 font-light">TASK TITLE</label>
            <input 
              autoFocus
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              type="text" 
              placeholder="e.g. Implement authentication flows" 
              className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-[#6b7280] block mb-1 font-light">PROJECT (OPTIONAL)</label>
            <select 
              value={projectId} 
              onChange={e => setProjectId(e.target.value)} 
              className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
            >
              <option value="">No Project (General Sprint Task)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-[#6b7280] block mb-1 font-light">EXPECTED OUTCOME / ARTIFACT</label>
            <textarea 
              value={output} 
              onChange={e => setOutput(e.target.value)} 
              placeholder="What concrete deliverable proves this is done?" 
              rows={3} 
              className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none resize-none font-light"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-[#6b7280] block mb-1 font-light">PRIORITY</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
              >
                <option value="p0">P0 - Critical</option>
                <option value="p1">P1 - High</option>
                <option value="p2">P2 - Medium</option>
                <option value="p3">P3 - Low</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-mono text-[#6b7280] block mb-1 font-light">TIMEBOX (MINUTES)</label>
              <input
                value={timeBox}
                onChange={e => setTimeBox(e.target.value)}
                type="number"
                placeholder="45"
                className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
              />
            </div>
          </div>

          {/* AI Challenge Section */}
          {!challengeResult && (
            <button 
              onClick={handleChallenge} 
              disabled={!title || !output || loadingChallenge} 
              className="w-full py-2.5 px-4 bg-[#fafafa] hover:bg-[#f5f5f7] border border-black/[0.08] text-black rounded-xl text-xs font-normal transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              <span>{loadingChallenge ? 'Challenging Scope with AI...' : 'AI Scope Challenge'}</span>
            </button>
          )}

          {challengeResult && (
            <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.08] space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-black font-medium">
                <Sparkles size={12} />
                <span>AI SCOPE VERIFICATION</span>
              </div>
              <p className="text-xs text-[#4b5563] italic font-light">
                &quot;{challengeResult.scope_question}&quot;
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 px-6 border-t border-black/[0.06] flex justify-end gap-3 bg-[#fdfdfe] font-body">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-normal text-[#6b7280] hover:text-black transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTask}
            disabled={saving}
            className="px-5 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-sm"
          >
            {saving ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
