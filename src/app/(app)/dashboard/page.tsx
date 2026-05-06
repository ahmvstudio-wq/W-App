'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { callGroq, buildWorkspaceContext } from '@/lib/groq/client'
import { cn, formatDateTime, getInitials, PRIORITY_CONFIG, TASK_STATUS_CONFIG, getProjectHealth } from '@/lib/utils'
import { 
  CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp, TrendingDown,
  Play, Check, X, RefreshCw, MessageSquare, ChevronRight, Zap
} from 'lucide-react'
import type { Task, Project, User } from '@/types'

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [brief, setBrief] = useState<string | null>(null)
  const [generatingBrief, setGeneratingBrief] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: 'System online. What is the priority?' }
  ])
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    fetchData()
    
    const channel = supabase.channel('dashboard_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchData())
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchData() {
    setLoading(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*, owner:profiles(*), project:projects(*), blocker:tasks!blocked_by_task_id(title)')
      .order('created_at', { ascending: false })
      
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*, owner:profiles(*), tasks(*)')
      .order('updated_at', { ascending: false })

    const activeTasks = tasksData || []
    const activeProjects = projectsData || []

    setTasks(activeTasks)
    setProjects(activeProjects)
    setLoading(false)
    
    if (!brief) {
      generateBrief(activeTasks, activeProjects)
    }
  }

  async function generateBrief(currentTasks: Task[], currentProjects: Project[]) {
    setGeneratingBrief(true)
    const topTask = currentTasks.find(t => t.priority === 'p0' && t.status !== 'shipped' && t.status !== 'killed')?.title
    const biggestBlocker = currentTasks.find(t => t.status === 'blocked')?.title
    const slowProject = currentProjects.find(p => getProjectHealth(p as any) === 'red')?.name

    try {
      const generated = await callGroq([
        { role: 'system', content: 'Generate a morning brief in exactly 3 bullet points. Brutal. Direct. No fluff. Under 80 words.' },
        { role: 'user', content: `Top priority task: ${topTask || 'none'}\nBiggest blocker: ${biggestBlocker || 'none'}\nSlowest project: ${slowProject || 'none'}` }
      ])
      setBrief(generated)
    } catch (e) {
      setBrief('- P0 needs attention\n- Blockers are active\n- Push harder')
    }
    setGeneratingBrief(false)
  }

  async function handleAiSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!aiInput.trim() || aiLoading) return

    const newMessages = [...aiMessages, { role: 'user' as const, content: aiInput }]
    setAiMessages(newMessages)
    setAiInput('')
    setAiLoading(true)

    const context = buildWorkspaceContext({
      projects: projects.map(p => ({
        name: p.name,
        status: p.status,
        tasksTotal: p.tasks?.length || 0,
        tasksShipped: p.tasks?.filter(t => t.status === 'shipped').length || 0
      })),
      tasks: tasks.filter(t => t.status !== 'shipped' && t.status !== 'killed').map(t => ({
        title: t.title,
        priority: t.priority,
        status: t.status,
        owner: t.owner?.name
      })),
      blockers: tasks.filter(t => t.status === 'blocked').map(t => ({
        title: t.title,
        reason: t.blocked_reason || 'Unknown'
      }))
    })

    try {
      const response = await callGroq(newMessages, context)
      setAiMessages([...newMessages, { role: 'assistant', content: response }])
    } catch (e) {
      setAiMessages([...newMessages, { role: 'assistant', content: 'Connection error. Re-engage.' }])
    }
    setAiLoading(false)
  }

  // Derived stats
  const shippedToday = tasks.filter(t => t.status === 'shipped' && new Date(t.updated_at).toDateString() === new Date().toDateString()).length
  const activeBlockers = tasks.filter(t => t.status === 'blocked')
  const atRiskProjects = projects.filter(p => getProjectHealth(p as any) === 'red')
  
  const activeTasks = tasks.filter(t => (t.priority === 'p0' || t.priority === 'p1') && t.status !== 'shipped' && t.status !== 'killed')
  const killList = tasks.filter(t => t.priority === 'p3' && t.status !== 'shipped' && t.status !== 'killed' && new Date(t.updated_at).getTime() < Date.now() - 14 * 24 * 60 * 60 * 1000)

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '88px' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="skeleton" style={{ height: '160px' }} />
            <div className="skeleton" style={{ height: '300px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="skeleton" style={{ height: '240px' }} />
            <div className="skeleton" style={{ height: '200px' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Command Center</h1>
          <p style={{ color: '#6b6e75', fontFamily: 'DM Mono, monospace', fontSize: '12px', textTransform: 'uppercase' }}>
            {formatDateTime(new Date())}
          </p>
        </div>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="btn-accent" 
          style={{ 
            padding: '8px 16px', borderRadius: '6px', border: 'none', 
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer'
          }}
        >
          <Play size={14} /> New Action
        </button>
      </header>

      {/* ZONE 1 - Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#6b6e75' }}>
            <CheckCircle2 size={16} /> <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>Shipped Today</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>
            {shippedToday}<span style={{ color: '#6b6e75', fontSize: '20px' }}>/5</span>
          </div>
        </div>
        
        <div style={{ background: '#141618', border: `1px solid ${activeBlockers.length > 0 ? '#ff4444' : '#252729'}`, borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: activeBlockers.length > 0 ? '#ff4444' : '#6b6e75' }}>
            <AlertTriangle size={16} /> <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>Active Blockers</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: activeBlockers.length > 0 ? '#ff4444' : '#f0ede8' }}>
            {activeBlockers.length}
          </div>
        </div>

        <div style={{ background: '#141618', border: `1px solid ${atRiskProjects.length > 0 ? '#f5a623' : '#252729'}`, borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: atRiskProjects.length > 0 ? '#f5a623' : '#6b6e75' }}>
            <AlertOctagon size={16} /> <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>Projects at Risk</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: atRiskProjects.length > 0 ? '#f5a623' : '#f0ede8' }}>
            {atRiskProjects.length}
          </div>
        </div>

        <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#6b6e75' }}>
            <TrendingUp size={16} /> <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>Velocity Delta</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#00c853', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            +12% <span style={{ fontSize: '12px', color: '#6b6e75', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>vs last week</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '24px' }}>
        {/* ZONE 2 - Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Morning Brief */}
          <div style={{ background: 'linear-gradient(145deg, #1c1e22, #141618)', border: '1px solid #c8f135', borderRadius: '10px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, color: '#c8f135' }}>
              <Zap size={120} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="#c8f135" /> Morning Brief
              </h2>
              <button 
                onClick={() => generateBrief(tasks, projects)}
                disabled={generatingBrief}
                style={{ background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              >
                <RefreshCw size={12} className={generatingBrief ? 'animate-spin' : ''} /> {generatingBrief ? 'Analyzing...' : 'Refresh'}
              </button>
            </div>
            <div style={{ position: 'relative', zIndex: 1, fontFamily: 'DM Mono, monospace', fontSize: '13px', lineHeight: 1.6, color: '#f0ede8', whiteSpace: 'pre-wrap' }}>
              {brief || 'Initializing...'}
            </div>
          </div>

          {/* Active Tasks */}
          <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #252729', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px' }}>Active Priority Tasks</h3>
              <span className="status-pill" style={{ background: 'rgba(200, 241, 53, 0.1)', color: '#c8f135' }}>P0 & P1 Only</span>
            </div>
            <div>
              {activeTasks.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#6b6e75' }}>No active high-priority tasks.</div>
              ) : (
                activeTasks.map((task, i) => (
                  <div key={task.id} className="card-hover" style={{ 
                    padding: '16px 20px', borderBottom: i < activeTasks.length - 1 ? '1px solid #252729' : 'none',
                    display: 'flex', alignItems: 'center', gap: '16px', background: '#141618'
                  }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#252729', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                      {getInitials(task.owner?.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: PRIORITY_CONFIG[task.priority].color, fontSize: '11px', fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>
                          {task.priority.toUpperCase()}
                        </span>
                        <span style={{ color: '#6b6e75', fontSize: '11px' }}>•</span>
                        <span style={{ color: '#6b6e75', fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>{task.time_box_minutes}m box</span>
                        {task.project && (
                          <>
                            <span style={{ color: '#6b6e75', fontSize: '11px' }}>•</span>
                            <span style={{ color: '#6b6e75', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.project.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button style={{ 
                      width: '32px', height: '32px', borderRadius: '6px', background: '#1c1e22', border: '1px solid #252729',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b6e75', transition: 'all 150ms'
                    }} onMouseEnter={e => { e.currentTarget.style.background = '#00c853'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#00c853' }} onMouseLeave={e => { e.currentTarget.style.background = '#1c1e22'; e.currentTarget.style.color = '#6b6e75'; e.currentTarget.style.borderColor = '#252729' }}>
                      <Check size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Blocked Items */}
          {activeBlockers.length > 0 && (
            <div style={{ background: '#141618', border: '1px solid #ff4444', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #252729', background: 'rgba(255, 68, 68, 0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color="#ff4444" />
                <h3 style={{ fontSize: '14px', color: '#ff4444' }}>Blocked Items</h3>
              </div>
              <div>
                {activeBlockers.map((task, i) => (
                  <div key={task.id} style={{ 
                    padding: '16px 20px', borderBottom: i < activeBlockers.length - 1 ? '1px solid #252729' : 'none',
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: '8px' }}>{task.title}</div>
                    <div style={{ background: '#1c1e22', padding: '10px', borderRadius: '6px', fontSize: '13px', color: '#f5a623', borderLeft: '2px solid #f5a623', marginBottom: '12px' }}>
                      {task.blocked_reason}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#6b6e75' }}>
                        Blocked by: <span style={{ color: '#f0ede8' }}>{(task as any).blocker?.title || 'Another Task'}</span>
                      </div>
                      <button style={{ 
                        padding: '4px 12px', background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', 
                        borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                      }}>
                        Ping Blocker
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ZONE 3 - Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AI Assistant Panel */}
          <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '10px', display: 'flex', flexDirection: 'column', height: '400px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #252729', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c8f135', boxShadow: '0 0 8px rgba(200, 241, 53, 0.4)' }} />
              <h3 style={{ fontSize: '14px' }}>System Intelligence</h3>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {aiMessages.map((msg, i) => (
                <div key={i} style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.role === 'user' ? '#1c1e22' : 'transparent',
                  border: msg.role === 'user' ? '1px solid #252729' : 'none',
                  padding: msg.role === 'user' ? '10px 14px' : '0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: msg.role === 'user' ? '#f0ede8' : '#c8f135',
                  fontFamily: msg.role === 'assistant' ? 'DM Mono, monospace' : 'Inter, sans-serif',
                  lineHeight: 1.5
                }}>
                  {msg.content}
                </div>
              ))}
              {aiLoading && (
                <div style={{ alignSelf: 'flex-start', color: '#6b6e75', fontSize: '12px', fontFamily: 'DM Mono, monospace' }}>Processing...</div>
              )}
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid #252729' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button onClick={() => setAiInput('Stress test my active projects')} style={{ whiteSpace: 'nowrap', padding: '4px 10px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '100px', fontSize: '11px', color: '#6b6e75', cursor: 'pointer' }}>Stress test</button>
                <button onClick={() => setAiInput('What is blocking the most work?')} style={{ whiteSpace: 'nowrap', padding: '4px 10px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '100px', fontSize: '11px', color: '#6b6e75', cursor: 'pointer' }}>Find blockers</button>
                <button onClick={() => setAiInput('What should I delete?')} style={{ whiteSpace: 'nowrap', padding: '4px 10px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '100px', fontSize: '11px', color: '#6b6e75', cursor: 'pointer' }}>Delete work</button>
              </div>
              <form onSubmit={handleAiSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder="Command system..."
                  style={{ flex: 1, background: '#1c1e22', border: '1px solid #252729', padding: '10px 14px', borderRadius: '6px', color: '#f0ede8', fontSize: '13px', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#c8f135'}
                  onBlur={e => e.target.style.borderColor = '#252729'}
                />
                <button type="submit" disabled={!aiInput.trim() || aiLoading} style={{ 
                  background: '#c8f135', color: '#000', border: 'none', borderRadius: '6px', width: '40px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!aiInput.trim() || aiLoading) ? 'not-allowed' : 'pointer', opacity: (!aiInput.trim() || aiLoading) ? 0.5 : 1
                }}>
                  <ChevronRight size={18} />
                </button>
              </form>
            </div>
          </div>

          {/* Project Health */}
          <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #252729' }}>
              <h3 style={{ fontSize: '14px' }}>Project Health</h3>
            </div>
            <div>
              {projects.filter(p => p.status === 'active').map(project => {
                const health = getProjectHealth(project as any)
                const total = project.tasks?.length || 0
                const shipped = project.tasks?.filter(t => t.status === 'shipped').length || 0
                
                return (
                  <div key={project.id} className="card-hover" style={{ 
                    padding: '16px 20px', borderBottom: '1px solid #252729', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className={`health-dot ${health}`} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '4px' }}>{project.name}</div>
                        <div style={{ fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace' }}>
                          {shipped}/{total} SHIPPED
                        </div>
                      </div>
                    </div>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#252729', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>
                      {getInitials(project.owner?.name)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Kill List */}
          {killList.length > 0 && (
            <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #252729', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', color: '#6b6e75' }}>Kill List</h3>
                <span className="status-pill" style={{ background: '#1c1e22', color: '#6b6e75' }}>14+ DAYS INACTIVE</span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '13px', color: '#6b6e75', marginBottom: '16px' }}>
                  {killList.length} low-priority tasks have been sitting untouched.
                </div>
                <button style={{ 
                  width: '100%', padding: '10px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)', 
                  color: '#ff4444', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms'
                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)'}>
                  Bulk Delete All
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
