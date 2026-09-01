'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  ArrowLeft, Clock, Target, AlertTriangle, CheckSquare, 
  Calendar, FileText, Activity, Layers, Image as ImageIcon,
  Plus, Settings, Share2, MoreVertical, Trash2, Edit3
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getProjectHealth, formatDateTime, getInitials, daysUntil, cn } from '@/lib/utils'
import type { Project, Task } from '@/types'

// Component imports
import ProjectAssets from './components/ProjectAssets'
import ProjectWhiteboard from './components/ProjectWhiteboard'
import ProjectCalendar from './components/ProjectCalendar'
import ProjectOverview from './components/ProjectOverview'
import CreateTaskModal from '@/components/CreateTaskModal'
import TaskDetailDrawer from '@/components/TaskDetailDrawer'

export const dynamic = 'force-dynamic'

export default function SingleProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'whiteboard' | 'assets' | 'calendar'>('overview')

  async function deleteProject() {
    if (!confirm('Are you sure you want to delete this project? This will also delete all associated tasks, assets, and calendar events.')) return
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (error) {
      toast.error(`Failed to delete project: ${error.message}`)
    } else {
      toast.success('Project deleted')
      router.push('/projects')
    }
  }

  async function fetchProject() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }

    if (!project) setLoading(true)
    
    const { data, error } = await supabase
      .from('projects')
      .select('*, tasks(*)')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('SUPABASE ERROR fetching project:', error)
    }

    if (data) {
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
      <div className="h-screen flex items-center justify-center bg-[#fbfbfd] font-sans">
        <div className="text-center font-body">
          <div className="text-xs text-[#9ca3af] font-mono tracking-wider">SYNCING INITIATIVE...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-16 text-center font-sans">
        <h2 className="text-xl font-light text-red-600 mb-2">Project Not Found</h2>
        <Link href="/projects" className="text-xs text-black font-body underline">Return to Portfolio</Link>
      </div>
    )
  }

  const health = getProjectHealth(project as any)

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -m-8 font-sans bg-[#ffffff] overflow-hidden">
      {/* Top Header */}
      <div className="px-8 py-4 bg-white border-b border-black/[0.06] flex items-center justify-between flex-shrink-0 font-body">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="p-1.5 text-[#9ca3af] hover:text-black rounded-lg transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2.5">
            <span className={cn(
              'w-2 h-2 rounded-full',
              health === 'green' ? 'bg-emerald-500' : health === 'amber' ? 'bg-amber-500' : 'bg-red-500'
            )} />
            <h1 className="text-base font-normal text-black tracking-tight">{project.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-[#6b7280] font-mono font-light">
            <Clock size={13} />
            <span>{project.deadline ? `${daysUntil(project.deadline)}d remaining` : 'No deadline'}</span>
          </div>

          <div className="w-px h-4 bg-black/[0.06]" />

          <button
            onClick={deleteProject}
            className="p-1.5 text-[#9ca3af] hover:text-red-600 rounded-lg transition-colors cursor-pointer"
            title="Delete Project"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-8 bg-white border-b border-black/[0.06] flex gap-8 flex-shrink-0 font-body">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          { id: 'whiteboard', label: 'Whiteboard', icon: Layers },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'assets', label: 'Assets', icon: ImageIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'py-3.5 text-xs flex items-center gap-2 transition-all cursor-pointer font-light relative',
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#fbfbfd]">
        {activeTab === 'overview' && (
          <ProjectOverview project={project} tasks={project.tasks || []} />
        )}

        {activeTab === 'tasks' && (
          <div className="p-8">
            <ProjectTasks projectId={project.id} workspaceId={project.workspace_id} onUpdate={fetchProject} />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="p-8 h-full">
            <ProjectCalendar projectId={project.id} workspaceId={project.workspace_id} />
          </div>
        )}

        {activeTab === 'whiteboard' && (
          <div className="h-full w-full">
            <ProjectWhiteboard project={project} />
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="p-8">
            <ProjectAssets projectId={project.id} workspaceId={project.workspace_id} />
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectTasks({ projectId, workspaceId, onUpdate }: { projectId: string, workspaceId: string, onUpdate: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  async function fetchTasks(silent = false) {
    if (!projectId) return
    if (!silent) setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (!error) {
        setTasks(data || [])
        if (selectedTask) {
          const updated = data?.find(t => t.id === selectedTask.id)
          if (updated) setSelectedTask(updated)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks(false)
    const channel = supabase.channel(`project-tasks-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, () => {
        fetchTasks(true)
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  async function updateTaskStatus(taskId: string, status: string) {
    const updates: any = { status }
    if (status === 'shipped') {
      updates.completed_at = new Date().toISOString()
    } else if (status === 'in_progress') {
      updates.started_at = new Date().toISOString()
    } else {
      updates.completed_at = null
    }
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)
    if (!error) {
      fetchTasks(true)
      onUpdate()
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (!error) {
      toast.success('Task deleted')
      if (selectedTask?.id === taskId) setSelectedTask(null)
      fetchTasks()
      onUpdate()
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={() => {
          fetchTasks(true)
          onUpdate()
        }}
      />

      <div className="flex justify-between items-center font-body">
        <div>
          <h3 className="text-base font-normal text-black">Project Deliverables</h3>
          <span className="text-[11px] text-[#9ca3af] font-mono font-light">{tasks.length} total tasks allocated</span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-normal rounded-xl shadow-sm cursor-pointer"
        >
          <Plus size={14} />
          <span>New Task</span>
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

      <div className="space-y-3 font-body">
        {tasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#9ca3af] bg-white border border-dashed border-black/[0.08] rounded-3xl font-light">
            No tasks assigned to this project yet. Click &quot;New Task&quot; to add.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="p-4 px-6 rounded-2xl bg-white border border-black/[0.06] hover:border-black/[0.18] shadow-sm hover:shadow-md flex items-center justify-between gap-4 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn(
                  'px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase',
                  task.priority === 'p0' ? 'bg-red-50 text-red-600' :
                  task.priority === 'p1' ? 'bg-amber-50 text-amber-600' :
                  'bg-black text-white'
                )}>
                  {task.priority.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-normal text-black truncate group-hover:underline">{task.title}</h4>
                  <span className="text-[10px] text-[#9ca3af] font-mono font-light">
                    {task.time_box_minutes || 45}m Box • Click to view full details
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  className="bg-[#fafafa] border border-black/[0.08] rounded-lg px-2 py-1 text-xs text-black outline-none cursor-pointer font-light"
                >
                  <option value="todo">To-Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="shipped">Shipped</option>
                </select>

                <button
                  onClick={() => setSelectedTask(task)}
                  className="p-1 text-[#9ca3af] hover:text-black rounded-lg transition-colors cursor-pointer"
                  title="Edit details"
                >
                  <Edit3 size={14} />
                </button>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 text-[#9ca3af] hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                  title="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
