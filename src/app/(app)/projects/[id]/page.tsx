'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  ArrowLeft, Clock, Target, AlertTriangle, CheckSquare, 
  Calendar, FileText, Activity, Layers, Image as ImageIcon,
  Plus, Settings, Share2, MoreVertical, Trash2
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { getProjectHealth, formatDateTime, getInitials, daysUntil } from '@/lib/utils'
import type { Project, Task } from '@/types'

// Component imports
import ProjectAssets from './components/ProjectAssets'
import ProjectWhiteboard from './components/ProjectWhiteboard'
import ProjectCalendar from './components/ProjectCalendar'
import ProjectOverview from './components/ProjectOverview'

export default function SingleProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'whiteboard' | 'assets' | 'calendar'>('overview')

  async function fetchProject() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }

    if (!project) setLoading(true)
    
    // Simplified query to ensure it doesn't fail on complex joins
    const { data, error } = await supabase
      .from('projects')
      .select('*, tasks(*)')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('SUPABASE ERROR fetching project:', error)
    }

    if (data) {
      // Handle the owner separately if needed or try to fetch it
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.owner_id)
        .single()

      const sortedTasks = data.tasks ? [...data.tasks].sort((a: any, b: any) => {
        const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 }
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 0)
      }) : []
      
      setProject({ ...data, owner: ownerData, tasks: sortedTasks })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProject()
    
    const channel = supabase.channel(`project-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` }, () => {
        fetchProject()
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0d0f' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '8px', margin: '0 auto 16px' }} />
          <div style={{ color: '#6b6e75', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>SYNCING PROJECT DATA...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ padding: '64px', textAlign: 'center' }}>
        <h2 style={{ color: '#ff4444', marginBottom: '16px' }}>Project Not Found</h2>
        <Link href="/projects" style={{ color: '#c8f135', textDecoration: 'none' }}>Return to Mission Control</Link>
      </div>
    )
  }

  const health = getProjectHealth(project as any)
  const totalTasks = project.tasks?.length || 0
  const shippedTasks = project.tasks?.filter((t: any) => t.status === 'shipped').length || 0
  const progress = totalTasks === 0 ? 0 : Math.round((shippedTasks / totalTasks) * 100)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Header */}
      <div style={{ 
        padding: '16px 32px', background: '#141618', borderBottom: '1px solid #252729',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/projects" style={{ color: '#6b6e75', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={`health-dot ${health}`} />
            <h1 style={{ fontSize: '18px', fontWeight: 600 }}>{project.name}</h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b6e75', fontSize: '12px', fontFamily: 'DM Mono, monospace' }}>
            <Clock size={14} />
            {project.deadline ? `${daysUntil(project.deadline)}d` : '--'}
          </div>
          <div style={{ width: '1px', height: '20px', background: '#252729' }} />
          <div style={{ display: 'flex', overflow: 'hidden', width: '24px' }}>
             <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#c8f135', border: '2px solid #141618', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#000' }}>
                {getInitials(project.owner?.name)}
             </div>
          </div>
          <button style={{ background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer' }}>
            <Share2 size={18} />
          </button>
          <button style={{ background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer' }}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ 
        padding: '0 32px', background: '#141618', borderBottom: '1px solid #252729',
        display: 'flex', gap: '24px', flexShrink: 0
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          { id: 'whiteboard', label: 'Whiteboard', icon: Layers },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'assets', label: 'Assets', icon: ImageIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '16px 4px', background: 'transparent',
              color: activeTab === tab.id ? '#f0ede8' : '#6b6e75', 
              border: 'none', borderBottom: activeTab === tab.id ? '2px solid #c8f135' : '2px solid transparent',
              fontSize: '13px', fontWeight: activeTab === tab.id ? 500 : 400, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 150ms'
            }}
          >
            <tab.icon size={14} color={activeTab === tab.id ? '#c8f135' : '#6b6e75'} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#0c0d0f' }}>
        {activeTab === 'overview' && (
          <ProjectOverview project={project} tasks={project.tasks || []} />
        )}

        {activeTab === 'tasks' && (
          <div style={{ padding: '32px' }}>
             <ProjectTasks projectId={project.id} workspaceId={project.workspace_id} onUpdate={fetchProject} />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div style={{ padding: '32px', height: '100%' }}>
             <ProjectCalendar projectId={project.id} workspaceId={project.workspace_id} />
          </div>
        )}

        {activeTab === 'whiteboard' && (
          <div style={{ height: 'calc(100vh - 120px)', width: '100%' }}>
             <ProjectWhiteboard project={project} />
          </div>
        )}

        {activeTab === 'assets' && (
          <div style={{ padding: '32px' }}>
             <ProjectAssets projectId={project.id} workspaceId={project.workspace_id} />
          </div>
        )}
      </div>
    </div>
  )
}

import CreateTaskModal from '@/components/CreateTaskModal'

function ProjectTasks({ projectId, workspaceId, onUpdate }: { projectId: string, workspaceId: string, onUpdate: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  async function fetchTasks() {
    if (!projectId) return
    console.log('ProjectTasks: Fetching tasks for project', projectId)
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('ProjectTasks: Error fetching tasks:', error)
        toast.error(`Fetch failed: ${error.message}`)
      } else {
        console.log('ProjectTasks: Fetched', data?.length || 0, 'tasks')
        setTasks(data || [])
        if (data && data.length > 0) {
          toast.success(`${data.length} tasks synced`)
        }
      }
    } catch (err: any) {
      console.error('ProjectTasks: Unexpected error:', err)
      toast.error('Connection failed. Re-syncing...')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    
    const channel = supabase.channel(`project-tasks-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, () => {
        console.log('ProjectTasks: Realtime update received')
        fetchTasks()
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  async function updateTaskStatus(taskId: string, status: string) {
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (error) {
       toast.error(`Failed to update: ${error.message}`)
    } else {
       fetchTasks()
       onUpdate()
    }
  }

  async function updateTaskDueDate(taskId: string, dueDate: string) {
    const { error } = await supabase.from('tasks').update({ due_date: dueDate }).eq('id', taskId)
    if (error) {
      toast.error(`Failed to update due date: ${error.message}`)
    } else {
      fetchTasks()
      onUpdate()
    }
  }

  async function scheduleWorkBlock(task: Task) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const start = new Date()
    const end = new Date(start.getTime() + (task.time_box_minutes || 60) * 60000)

    const { error } = await supabase.from('calendar_events').insert({
      project_id: projectId,
      workspace_id: workspaceId,
      owner_id: user.id,
      task_id: task.id,
      title: `WORK: ${task.title}`,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      color: '#c8f135',
      event_type: 'event'
    })

    if (error) {
      toast.error(`Failed to schedule: ${error.message}`)
    } else {
      toast.success('Work block scheduled for right now!')
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Are you sure you want to kill this task?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) {
      toast.error(`Failed to delete: ${error.message}`)
    } else {
      toast.success('Task eliminated')
      fetchTasks()
      onUpdate()
    }
  }

  if (loading) return <div style={{ color: '#6b6e75', padding: '20px' }}>Syncing tasks...</div>

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Action Items</h3>
        <button onClick={() => setIsModalOpen(true)} className="btn-accent" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {isModalOpen && (
        <CreateTaskModal 
          initialProjectId={projectId} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            fetchTasks()
            onUpdate()
          }} 
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tasks.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#6b6e75', background: '#141618', border: '1px solid #252729', borderRadius: '12px' }}>
            No tasks assigned to this project.
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              padding: '20px', background: '#141618', border: '1px solid #252729', borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', background: '#c8f135', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#000'
                }}>
                  {getInitials((task.owner as any)?.name || 'U')}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>{task.title}</div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', alignItems: 'center' }}>
                    <span style={{ color: (task.priority === 'p0' || task.priority === 'p1') ? '#ff4444' : '#6b6e75' }}>
                       {task.priority.toUpperCase()}
                    </span>
                    <span>{task.time_box_minutes} MINS</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={10} />
                      <input 
                        type="date" 
                        value={task.due_date ? task.due_date.split('T')[0] : ''} 
                        onChange={(e) => updateTaskDueDate(task.id, e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#c8f135', fontSize: '10px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={() => scheduleWorkBlock(task)}
                  style={{ background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.2)', color: '#c8f135', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  SCHEDULE BLOCK
                </button>
                <select 
                  value={task.status} 
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  style={{ 
                    padding: '6px 12px', background: '#1c1e22', border: '1px solid #252729', 
                    borderRadius: '6px', color: '#f0ede8', fontSize: '12px', outline: 'none'
                  }}
                >
                  <option value="todo">TODO</option>
                  <option value="in_progress">IN PROGRESS</option>
                  <option value="blocked">BLOCKED</option>
                  <option value="shipped">SHIPPED</option>
                  <option value="killed">KILLED</option>
                </select>
                <button 
                  onClick={() => deleteTask(task.id)}
                  style={{ background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#6b6e75'}
                >
                   <Trash2 size={18} />
                </button>
                <button style={{ background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer' }}>
                   <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
