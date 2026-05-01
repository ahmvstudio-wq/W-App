'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Search, Filter, FolderKanban, Activity, Target, X, Zap } from 'lucide-react'
import { getProjectHealth, getInitials, daysUntil, daysSince } from '@/lib/utils'
import type { Project } from '@/types'
import { stressTestProject } from '@/lib/groq/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchProjects() {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*, tasks(*)')
      .order('updated_at', { ascending: false })
    
    if (data) setProjects(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Projects</h1>
          <p style={{ color: '#6b6e75', fontFamily: 'DM Mono, monospace', fontSize: '12px', textTransform: 'uppercase' }}>
            {projects.length} Active Projects
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn-accent" style={{ 
            padding: '8px 16px', borderRadius: '6px', border: 'none', 
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer'
          }}>
            <Plus size={16} /> New Project
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b6e75' }} />
          <input type="text" placeholder="Search projects..." style={{ width: '100%', padding: '8px 12px 8px 32px', background: '#141618', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '13px', outline: 'none' }} />
        </div>
        <button style={{ padding: '8px 12px', background: '#141618', border: '1px solid #252729', borderRadius: '6px', color: '#6b6e75', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <Filter size={14} /> Filter
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: '#6b6e75' }}>
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#141618', border: '1px dashed #252729', borderRadius: '12px', color: '#6b6e75' }}>
          No active projects found. Ship something new.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {projects.map(project => {
            const health = getProjectHealth(project as any)
            const totalTasks = project.tasks?.length || 0
            const shippedTasks = project.tasks?.filter((t: any) => t.status === 'shipped').length || 0
            const progress = totalTasks === 0 ? 0 : Math.round((shippedTasks / totalTasks) * 100)
            
            return (
              <Link href={`/projects/${project.id}`} key={project.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card-hover" style={{ background: '#141618', border: '1px solid #252729', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ padding: '20px', borderBottom: '1px solid #252729', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={`health-dot ${health}`} />
                        <h3 style={{ fontSize: '16px' }}>{project.name}</h3>
                      </div>
                      <span className="status-pill" style={{ background: '#1c1e22', color: '#6b6e75' }}>
                        {project.status}
                      </span>
                    </div>
                    
                    <p style={{ color: '#6b6e75', fontSize: '13px', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {project.description || 'No description provided.'}
                    </p>

                    <div style={{ background: '#1c1e22', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f0ede8', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                        <Target size={14} color="#c8f135" /> Success Metric
                      </div>
                      <div style={{ color: '#6b6e75', fontSize: '12px', fontStyle: 'italic' }}>
                        {project.success_metric}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '16px 20px', background: '#1c1e22', borderTop: '1px solid #252729' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace' }}>
                        {shippedTasks}/{totalTasks} TASKS
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace' }}>
                        {project.deadline ? `${daysUntil(project.deadline)}d LEFT` : 'NO DEADLINE'}
                      </div>
                    </div>
                    
                    <div style={{ height: '4px', background: '#252729', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#c8f135', width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {isCreateModalOpen && <CreateProjectWizard onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchProjects} />}
    </div>
  )
}

function CreateProjectWizard({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    success_metric: '',
    min_shippable_version: '',
    kill_condition: '',
    deadline: '',
    priority: 'p1'
  })
  const [aiTestResult, setAiTestResult] = useState('')
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ack, setAck] = useState(false)

  async function runStressTest() {
    setTesting(true)
    const res = await stressTestProject(formData)
    setAiTestResult(res)
    setTesting(false)
    setStep(6)
  }

  async function handleCreateProject() {
    if (!ack) return
    setSaving(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setSaving(false)
      return
    }

    // Attempt to get user's workspace
    let { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', session.user.id).limit(1)
    let workspaceId = workspaces?.[0]?.id

    // If none exists, auto-create a default one
    if (!workspaceId) {
      const { data: newWs } = await supabase.from('workspaces').insert({
        owner_id: session.user.id,
        name: 'My Workspace'
      }).select().single()
      workspaceId = newWs?.id
    }

    if (workspaceId) {
      const { data, error } = await supabase.from('projects').insert({
        workspace_id: workspaceId,
        owner_id: session.user.id,
        name: formData.name,
        description: formData.description,
        success_metric: formData.success_metric,
        min_shippable_version: formData.min_shippable_version,
        kill_condition: formData.kill_condition,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        priority: formData.priority,
        status: 'active'
      }).select().single()
      
      if (!error && data) {
        onSuccess()
        onClose()
        router.push(`/projects/${data.id}`)
      } else {
        console.error('Failed to create project:', error)
      }
    }
    setSaving(false)
  }

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.name.length > 0;
      case 2: return formData.success_metric.length > 0;
      case 3: return formData.min_shippable_version.length > 0;
      case 4: return formData.kill_condition.length > 0;
      case 5: return formData.deadline.length > 0;
      default: return true;
    }
  }

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '12px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: '24px', borderBottom: '1px solid #252729', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>New Project Setup</h2>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1,2,3,4,5,6].map(s => (
                <div key={s} style={{ width: '20px', height: '4px', borderRadius: '2px', background: s <= step ? '#c8f135' : '#252729' }} />
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '32px', minHeight: '300px' }}>
          {step === 1 && (
            <div className="page-enter-active">
              <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>The Basics</h3>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Project Name</label>
                <input autoFocus value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" placeholder="e.g. Q3 Growth Engine" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Description (Optional)</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What is this?" rows={3} style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none', resize: 'none' }} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="page-enter-active">
              <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>The One Metric</h3>
              <p style={{ color: '#6b6e75', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>If this project is successful, what single number will prove it? Do not use vanity metrics. Be specific.</p>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#c8f135', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Success Metric (Required)</label>
                <input autoFocus value={formData.success_metric} onChange={e => setFormData({...formData, success_metric: e.target.value})} type="text" placeholder="e.g. 15% increase in user retention at Day 7" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="page-enter-active">
              <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Minimum Shippable</h3>
              <p style={{ color: '#6b6e75', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>What is the absolute bare minimum version of this we can ship to learn if it works? Cut the scope in half. Then cut it again.</p>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Minimum Shippable Version (Required)</label>
                <textarea autoFocus value={formData.min_shippable_version} onChange={e => setFormData({...formData, min_shippable_version: e.target.value})} placeholder="e.g. A Typeform embedded on a static page." rows={4} style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none', resize: 'none' }} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="page-enter-active">
              <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>The Kill Condition</h3>
              <p style={{ color: '#6b6e75', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>When do we kill this project? Set the bounds now before emotion gets involved.</p>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#ff4444', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Kill Condition (Required)</label>
                <input autoFocus value={formData.kill_condition} onChange={e => setFormData({...formData, kill_condition: e.target.value})} type="text" placeholder="e.g. If we spend >2 weeks on integration." style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="page-enter-active">
              <h3 style={{ fontSize: '20px', marginBottom: '24px' }}>Logistics</h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Deadline (Required)</label>
                  <input value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} type="date" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }}>
                    <option value="p0">P0 - Critical</option>
                    <option value="p1">P1 - High</option>
                    <option value="p2">P2 - Medium</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="page-enter-active">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#c8f135' }}>
                <Zap size={24} /> <h3 style={{ fontSize: '20px' }}>System Stress Test</h3>
              </div>
              <div style={{ background: '#1c1e22', border: '1px solid #c8f135', borderRadius: '8px', padding: '20px' }}>
                <p style={{ color: '#f0ede8', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {aiTestResult}
                </p>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="checkbox" id="ack" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#c8f135' }} />
                <label htmlFor="ack" style={{ fontSize: '13px', color: '#6b6e75', cursor: 'pointer' }}>I have read these challenges and commit to solving them.</label>
              </div>
            </div>
          )}

        </div>

        <div style={{ padding: '24px', borderTop: '1px solid #252729', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {step > 1 && step < 6 ? (
            <button onClick={() => setStep(step - 1)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>Back</button>
          ) : <div />}
          
          {step < 5 ? (
            <button onClick={() => setStep(step + 1)} disabled={!isStepValid()} className="btn-accent" style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: !isStepValid() ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: !isStepValid() ? 0.5 : 1 }}>
              Next
            </button>
          ) : step === 5 ? (
            <button onClick={runStressTest} disabled={!isStepValid() || testing} style={{ padding: '10px 20px', background: 'rgba(200, 241, 53, 0.1)', border: '1px solid #c8f135', color: '#c8f135', borderRadius: '6px', cursor: (!isStepValid() || testing) ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} /> {testing ? 'Testing...' : 'Run Stress Test'}
            </button>
          ) : (
            <button onClick={handleCreateProject} disabled={saving || !ack} className="btn-accent" style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: (saving || !ack) ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: (saving || !ack) ? 0.5 : 1 }}>
              {saving ? 'Creating...' : 'Accept & Create Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
