'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Search, Filter, LayoutGrid, List as ListIcon, Calendar, X, Zap } from 'lucide-react'
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG, cn, getInitials } from '@/lib/utils'
import type { Task, Priority, TaskStatus } from '@/types'
import { challengeTask } from '@/lib/groq/client'
import Link from 'next/link'

export default function TasksPage() {
  const [view, setView] = useState<'board' | 'list' | 'timeline'>('board')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([]) 
  const [loading, setLoading] = useState(true)

  async function fetchTasks() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(id, name), owner:profiles(id, name)')
      .order('updated_at', { ascending: false })
    
    if (data) setTasks(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
    
    const channel = supabase.channel('tasks_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks()
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const columns: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'shipped', 'killed']

  async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Tasks</h1>
          <p style={{ color: '#6b6e75', fontFamily: 'DM Mono, monospace', fontSize: '12px', textTransform: 'uppercase' }}>
            {tasks.length} total • {tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length} active
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', padding: '2px' }}>
            <button onClick={() => setView('board')} style={{ padding: '6px', background: view === 'board' ? '#252729' : 'transparent', color: view === 'board' ? '#f0ede8' : '#6b6e75', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><LayoutGrid size={16} /></button>
            <button onClick={() => setView('list')} style={{ padding: '6px', background: view === 'list' ? '#252729' : 'transparent', color: view === 'list' ? '#f0ede8' : '#6b6e75', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><ListIcon size={16} /></button>
            <button onClick={() => setView('timeline')} style={{ padding: '6px', background: view === 'timeline' ? '#252729' : 'transparent', color: view === 'timeline' ? '#f0ede8' : '#6b6e75', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Calendar size={16} /></button>
          </div>
          
          <button onClick={() => setIsCreateModalOpen(true)} className="btn-accent" style={{ 
            padding: '8px 16px', borderRadius: '6px', border: 'none', 
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer'
          }}>
            <Plus size={16} /> New Task
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexShrink: 0 }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b6e75' }} />
          <input type="text" placeholder="Search tasks..." style={{ width: '100%', padding: '8px 12px 8px 32px', background: '#141618', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '13px', outline: 'none' }} />
        </div>
        <button style={{ padding: '8px 12px', background: '#141618', border: '1px solid #252729', borderRadius: '6px', color: '#6b6e75', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <Filter size={14} /> Filter
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#6b6e75', padding: '40px', textAlign: 'center' }}>Loading tasks...</div>
      ) : view === 'board' ? (
        <div style={{ display: 'flex', gap: '16px', flex: 1, overflowX: 'auto', paddingBottom: '16px' }}>
          {columns.map(status => (
            <div key={status} style={{ width: '320px', flexShrink: 0, background: '#141618', borderRadius: '10px', display: 'flex', flexDirection: 'column', border: '1px solid #252729' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #252729', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: TASK_STATUS_CONFIG[status].color }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{TASK_STATUS_CONFIG[status].label}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#6b6e75', background: '#1c1e22', padding: '2px 8px', borderRadius: '10px' }}>
                  {tasks.filter(t => t.status === status).length}
                </span>
              </div>
              <div style={{ padding: '12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tasks.filter(t => t.status === status).map(task => (
                  <div key={task.id} className="card-hover" style={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span className="status-pill" style={{ color: PRIORITY_CONFIG[task.priority].color, border: `1px solid ${PRIORITY_CONFIG[task.priority].color}33`, background: `${PRIORITY_CONFIG[task.priority].color}11` }}>
                        {PRIORITY_CONFIG[task.priority].label}
                      </span>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#252729', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>
                        {getInitials((task.owner as any)?.name || 'U')}
                      </div>
                    </div>
                    <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '12px', lineHeight: 1.4 }}>{task.title}</div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <select 
                        value={task.status} 
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                        style={{ width: '100%', padding: '4px 8px', background: '#141618', border: '1px solid #252729', borderRadius: '4px', color: '#6b6e75', fontSize: '11px', outline: 'none' }}
                      >
                        {columns.map(col => (
                           <option key={col} value={col}>{TASK_STATUS_CONFIG[col].label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6b6e75', fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>
                      {task.project ? (
                        <Link href={`/projects/${(task.project as any).id}`} style={{ color: '#c8f135', textDecoration: 'none' }}>
                          {(task.project as any).name}
                        </Link>
                      ) : <span>--</span>}
                      <span>{task.time_box_minutes}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : view === 'list' ? (
        <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#1c1e22', borderBottom: '1px solid #252729' }}>
              <tr>
                <th style={{ padding: '12px 16px', color: '#6b6e75', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>Title</th>
                <th style={{ padding: '12px 16px', color: '#6b6e75', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>Priority</th>
                <th style={{ padding: '12px 16px', color: '#6b6e75', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>Status</th>
                <th style={{ padding: '12px 16px', color: '#6b6e75', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>Project</th>
                <th style={{ padding: '12px 16px', color: '#6b6e75', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>Owner</th>
                <th style={{ padding: '12px 16px', color: '#6b6e75', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>Time Box</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id} style={{ borderBottom: '1px solid #252729' }}>
                  <td style={{ padding: '16px', fontWeight: 500, fontSize: '13px' }}>{task.title}</td>
                  <td style={{ padding: '16px' }}><span style={{ color: PRIORITY_CONFIG[task.priority].color, fontSize: '12px', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>{PRIORITY_CONFIG[task.priority].label}</span></td>
                  <td style={{ padding: '16px' }}>
                    <select 
                      value={task.status} 
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                      style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #252729', borderRadius: '4px', color: TASK_STATUS_CONFIG[task.status].color, fontSize: '11px', outline: 'none', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}
                    >
                      {columns.map(col => (
                          <option key={col} value={col}>{TASK_STATUS_CONFIG[col].label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#6b6e75' }}>
                    {task.project ? (
                      <Link href={`/projects/${(task.project as any).id}`} style={{ color: '#c8f135', textDecoration: 'none' }}>
                        {(task.project as any).name}
                      </Link>
                    ) : '--'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#252729', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>
                        {getInitials((task.owner as any)?.name)}
                      </div>
                      <span style={{ fontSize: '13px' }}>{(task.owner as any)?.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', fontFamily: 'DM Mono, monospace', color: '#6b6e75' }}>{task.time_box_minutes}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {isCreateModalOpen && (
        <CreateTaskModal onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchTasks} />
      )}
    </div>
  )
}

function CreateTaskModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [title, setTitle] = useState('')
  const [output, setOutput] = useState('')
  const [timeBox, setTimeBox] = useState('')
  const [priority, setPriority] = useState<Priority>('p2')
  
  const [challengeResult, setChallengeResult] = useState<any>(null)
  const [loadingChallenge, setLoadingChallenge] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleChallenge() {
    if (!title || !output) return
    setLoadingChallenge(true)
    const result = await challengeTask(title, output)
    setChallengeResult(result)
    if (result.priority) setPriority(result.priority as Priority)
    if (result.time_box_minutes) setTimeBox(result.time_box_minutes.toString())
    setLoadingChallenge(false)
  }

  async function handleCreateTask() {
    if (!challengeResult) return
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setSaving(false)
      return
    }

    let { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', session.user.id).limit(1)
    let workspaceId = workspaces?.[0]?.id

    if (!workspaceId) {
      const { data: newWs } = await supabase.from('workspaces').insert({
        owner_id: session.user.id,
        name: 'My Workspace'
      }).select().single()
      workspaceId = newWs?.id
    }

    if (workspaceId) {
      const { error } = await supabase.from('tasks').insert({
        workspace_id: workspaceId,
        owner_id: session.user.id,
        title,
        output_description: output,
        priority: challengeResult.priority,
        time_box_minutes: challengeResult.time_box_minutes || parseInt(timeBox) || 60,
        status: 'todo'
      })
      if (!error) {
        onSuccess()
        onClose()
      } else {
        console.error('Failed to create task:', error)
      }
    }
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '12px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #252729', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px' }}>Create Task</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Task Title (Action-oriented)</label>
            <input value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="e.g. Write database schema" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Expected Output (What ships?)</label>
            <textarea value={output} onChange={e => setOutput(e.target.value)} placeholder="e.g. A SQL file committed to main containing 10 tables." rows={3} style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none', resize: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)} style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none', appearance: 'none' }}>
                <option value="p0">P0 - Critical</option>
                <option value="p1">P1 - High</option>
                <option value="p2">P2 - Medium</option>
                <option value="p3">P3 - Low</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Time Box (Minutes)</label>
              <input value={timeBox} onChange={e => setTimeBox(e.target.value)} type="number" placeholder="60" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
            </div>
          </div>

          {!challengeResult && (
            <button onClick={handleChallenge} disabled={!title || !output || loadingChallenge} style={{ width: '100%', padding: '12px', background: 'rgba(200, 241, 53, 0.1)', border: '1px solid rgba(200, 241, 53, 0.3)', color: '#c8f135', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: (!title || !output) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Zap size={16} /> {loadingChallenge ? 'Challenging Scope...' : 'AI Challenge Scope (Required)'}
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
                AI SUGGESTION: Priority updated to {challengeResult.priority.toUpperCase()} ({challengeResult.priority_reasoning}). Time box set to {challengeResult.time_box_minutes}m.
              </div>
            </div>
          )}

        </div>
        
        <div style={{ padding: '24px', borderTop: '1px solid #252729', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Cancel</button>
          <button onClick={handleCreateTask} disabled={!challengeResult || saving} className="btn-accent" style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: (!challengeResult || saving) ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: (!challengeResult || saving) ? 0.5 : 1 }}>
            {saving ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
