'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Search, Filter, LayoutGrid, List as ListIcon, Calendar, X, Zap } from 'lucide-react'
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG, cn, getInitials } from '@/lib/utils'
import type { Task, Priority, TaskStatus } from '@/types'
import { challengeTask } from '@/lib/groq/client'
import { format } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'

import CreateTaskModal from '@/components/CreateTaskModal'

export default function TasksPage() {
  const [view, setView] = useState<'board' | 'list' | 'timeline'>('board')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([]) 
  const [loading, setLoading] = useState(true)

  async function fetchTasks() {
    setLoading(true)
    console.log('FETCHING ALL TASKS...')
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('SUPABASE FETCH ERROR:', error.message)
        toast.error(`Fetch failed: ${error.message}`)
      } else {
        console.log('TASKS FETCHED SUCCESS:', data?.length || 0, 'tasks found')
        setTasks(data || [])
        if (data && data.length > 0) {
          toast.success(`${data.length} tasks discovered`)
        }
      }
    } catch (err: any) {
      console.error('UNEXPECTED FETCH ERROR:', err)
      toast.error('Sync failed. Retrying...')
    } finally {
      setLoading(false)
    }
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
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    if (error) {
      console.error('FAILED TO UPDATE TASK STATUS:', error.message)
      toast.error(`Update failed: ${error.message}`)
      return
    }
    toast.success(`Task status updated to ${newStatus}`)
    fetchTasks()
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Are you sure? This action is irreversible.')) return
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) {
      console.error('FAILED TO DELETE TASK:', error.message)
      toast.error(`Delete failed: ${error.message}`)
      return
    }
    toast.success('Task deleted')
    fetchTasks()
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
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <select 
                        value={task.status} 
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                        style={{ flex: 1, padding: '4px 8px', background: '#141618', border: '1px solid #252729', borderRadius: '4px', color: '#6b6e75', fontSize: '11px', outline: 'none' }}
                      >
                        {columns.map(col => (
                           <option key={col} value={col}>{TASK_STATUS_CONFIG[col].label}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('toggle-focus-timer', { detail: { taskId: task.id, taskTitle: task.title, timeBox: task.time_box_minutes } }))}
                        style={{ padding: '4px 8px', background: 'rgba(200, 241, 53, 0.1)', border: '1px solid rgba(200, 241, 53, 0.3)', borderRadius: '4px', color: '#c8f135', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Zap size={10} /> <span style={{ fontSize: '10px', fontWeight: 700 }}>FOCUS</span>
                      </button>
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
              {tasks.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6b6e75' }}>No tasks found. Create one to get started.</td></tr>
              ) : (
                tasks.map(task => (
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
                        <span style={{ fontSize: '13px' }}>{(task.owner as any)?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', fontFamily: 'DM Mono, monospace', color: '#6b6e75' }}>{task.time_box_minutes}m</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ flex: 1, background: '#141618', border: '1px solid #252729', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#6b6e75' }}>
          <Calendar size={48} style={{ opacity: 0.2 }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#f0ede8', marginBottom: '8px' }}>Timeline View</h3>
            <p style={{ maxWidth: '400px' }}>Visualizing the critical path. All tasks with due dates will appear here sequentially.</p>
          </div>
          <div style={{ width: '100%', maxWidth: '800px', marginTop: '24px' }}>
             {tasks.filter(t => t.due_date).sort((a,b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()).map(task => (
               <div key={task.id} style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                 <div style={{ width: '100px', fontSize: '11px', fontFamily: 'DM Mono, monospace', textAlign: 'right', paddingTop: '4px' }}>
                   {format(new Date(task.due_date!), 'MMM d, HH:mm')}
                 </div>
                 <div style={{ position: 'relative', flex: 1, padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '8px', borderLeft: `4px solid ${PRIORITY_CONFIG[task.priority].color}` }}>
                   <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0ede8' }}>{task.title}</div>
                   <div style={{ fontSize: '11px', color: '#6b6e75', marginTop: '4px' }}>{(task.project as any)?.name || 'NO PROJECT'} • {task.status.toUpperCase()}</div>
                 </div>
               </div>
             ))}
             {tasks.filter(t => t.due_date).length === 0 && (
               <div style={{ textAlign: 'center', opacity: 0.5 }}>No tasks with deadlines found.</div>
             )}
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateTaskModal onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchTasks} />
      )}
    </div>
  )
}

