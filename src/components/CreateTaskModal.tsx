'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Zap } from 'lucide-react'
import { challengeTask } from '@/lib/groq/client'
import { toast } from 'sonner'
import type { Priority, Project } from '@/types'

interface CreateTaskModalProps {
  onClose: () => void
  onSuccess: () => void
  initialProjectId?: string
}

export default function CreateTaskModal({ onClose, onSuccess, initialProjectId }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [output, setOutput] = useState('')
  const [timeBox, setTimeBox] = useState('60')
  const [priority, setPriority] = useState<Priority>('p2')
  const [projectId, setProjectId] = useState<string>(initialProjectId || '')
  
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
      toast.error('Title and Output description are required for AI challenge')
      return
    }
    setLoadingChallenge(true)
    try {
      const result = await challengeTask(title, output)
      setChallengeResult(result)
      if (result.priority) setPriority(result.priority as Priority)
      if (result.time_box_minutes) setTimeBox(result.time_box_minutes.toString())
    } catch (error) {
      console.error('Challenge error:', error)
      toast.error('AI Challenge failed. You can still create the task manually.')
      setChallengeResult({
        priority: priority,
        time_box_minutes: parseInt(timeBox),
        scope_question: "AI service unavailable. Manual configuration applied.",
        priority_reasoning: "Manual setting"
      })
    } finally {
      setLoadingChallenge(false)
    }
  }

  async function handleCreateTask() {
    if (!title) {
      toast.error('Title is required')
      return
    }

    setSaving(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      // Get workspace
      let { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1)
      let workspaceId = workspaces?.[0]?.id

      if (!workspaceId) {
        const { data: newWs, error: wsError } = await supabase.from('workspaces').insert({
          owner_id: user.id,
          name: 'My Workspace'
        }).select().single()
        
        if (wsError) throw new Error('Failed to create workspace')
        workspaceId = newWs?.id
      }

      const taskData = {
        workspace_id: workspaceId,
        owner_id: user.id,
        project_id: projectId || null,
        title,
        output_description: output,
        priority: challengeResult?.priority || priority,
        time_box_minutes: challengeResult?.time_box_minutes || parseInt(timeBox) || 60,
        status: 'todo'
      }

      console.log('SAVING TASK:', taskData)

      const { data: inserted, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single()

      if (error) {
        console.error('INSERT ERROR:', error)
        throw new Error(error.message)
      }

      toast.success('Task created successfully')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('CREATE TASK ERROR:', err)
      toast.error(`Failed to create task: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" style={{ 
      position: 'fixed', inset: 0, zIndex: 1000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      padding: '24px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)'
    }}>
      <div style={{ 
        background: '#141618', border: '1px solid #252729', borderRadius: '12px', 
        width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', 
        maxHeight: '90vh', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #252729', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Create Task</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Title</label>
            <input 
              autoFocus
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              type="text" 
              placeholder="e.g. Design the authentication flow" 
              style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} 
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project (Optional)</label>
            <select 
              value={projectId} 
              onChange={e => setProjectId(e.target.value)} 
              style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }}
            >
              <option value="">No Project (General Task)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected Output</label>
            <textarea 
              value={output} 
              onChange={e => setOutput(e.target.value)} 
              placeholder="What is the artifact of this task? (e.g. 3 UI mocks, 1 SQL file)" 
              rows={3} 
              style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none', resize: 'none' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)} style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }}>
                <option value="p0">P0 - Critical</option>
                <option value="p1">P1 - High</option>
                <option value="p2">P2 - Medium</option>
                <option value="p3">P3 - Low</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Box (Min)</label>
              <input value={timeBox} onChange={e => setTimeBox(e.target.value)} type="number" placeholder="60" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
            </div>
          </div>

          {!challengeResult && (
            <button 
              onClick={handleChallenge} 
              disabled={!title || !output || loadingChallenge} 
              style={{ 
                width: '100%', padding: '12px', background: 'rgba(200, 241, 53, 0.1)', 
                border: '1px solid rgba(200, 241, 53, 0.3)', color: '#c8f135', 
                borderRadius: '6px', fontSize: '13px', fontWeight: 600, 
                cursor: (!title || !output) ? 'not-allowed' : 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
              }}
            >
              <Zap size={16} /> {loadingChallenge ? 'Challenging Scope...' : 'AI Challenge Scope'}
            </button>
          )}

          {challengeResult && (
            <div style={{ background: '#1c1e22', border: '1px solid #c8f135', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#c8f135' }}>
                <Zap size={16} /> <span style={{ fontSize: '13px', fontWeight: 700 }}>System Challenge</span>
              </div>
              <p style={{ fontSize: '14px', marginBottom: '12px', color: '#f0ede8', fontStyle: 'italic' }}>
                "{challengeResult.scope_question}"
              </p>
              <div style={{ fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace' }}>
                AI SUGGESTION: Priority updated to {challengeResult.priority?.toUpperCase()} ({challengeResult.priority_reasoning}). Time box set to {challengeResult.time_box_minutes}m.
              </div>
            </div>
          )}

        </div>
        
        <div style={{ padding: '24px', borderTop: '1px solid #252729', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Cancel</button>
          <button onClick={handleCreateTask} disabled={saving} className="btn-accent" style={{ 
            padding: '10px 20px', borderRadius: '6px', border: 'none', 
            cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', 
            opacity: saving ? 0.5 : 1, fontWeight: 600
          }}>
            {saving ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
