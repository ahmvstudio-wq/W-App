'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Search, Filter, FolderKanban, Activity, Target, X, Zap, Trash2, ChevronRight, Clock, TrendingUp, Layers, CheckCircle2, Sparkles } from 'lucide-react'
import { getProjectHealth, getInitials, daysUntil, daysSince, cn } from '@/lib/utils'
import type { Project } from '@/types'
import { stressTestProject } from '@/lib/groq/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import NaturalLanguageInputModal from '@/components/NaturalLanguageInputModal'

export default function ProjectsPage() {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSynthesizeOpen, setIsSynthesizeOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  async function handleDeleteProject(id: string) {
    if (!confirm('Are you sure you want to delete this project? This will also delete all associated tasks, assets, and calendar events.')) return
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) {
      toast.error(`Failed to delete project: ${error.message}`)
    } else {
      toast.success('Project deleted')
      fetchProjects()
    }
  }

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

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Portfolio Analytics
  const totalProjects = projects.length
  const allTasks = projects.flatMap(p => p.tasks || [])
  const totalTasks = allTasks.length
  const shippedTasks = allTasks.filter((t: any) => t.status === 'shipped').length
  const portfolioProgress = totalTasks > 0 ? Math.round((shippedTasks / totalTasks) * 100) : 0
  const healthyCount = projects.filter(p => getProjectHealth(p as any) === 'green').length
  const atRiskCount = projects.filter(p => getProjectHealth(p as any) === 'amber' || getProjectHealth(p as any) === 'red').length

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#6b7280] uppercase tracking-wider mb-1 font-light">
            <span>CALLMY_MGMT</span>
            <span>•</span>
            <span className="text-black font-normal">{totalProjects} ACTIVE PORTFOLIO INITIATIVES</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-black">
            Projects & Portfolio Management
          </h1>
        </div>

        <div className="flex items-center gap-3 font-body">
          <button
            onClick={() => setIsSynthesizeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-950 border border-indigo-200/80 font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Sparkles size={14} className="text-indigo-600" />
            <span>Synthesize from Text</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white font-normal text-xs rounded-xl shadow-sm transition-all cursor-pointer font-body"
          >
            <Plus size={15} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Portfolio Data Visualizations with Ambient Soft Glows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-body">
        {/* Metric 1: Overall Delivery Rate */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-blue-50/50 border border-black/[0.06] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Delivery Rate</span>
            <div className="text-2xl font-light text-black tracking-tight">{portfolioProgress}%</div>
            <div className="text-[11px] text-[#9ca3af] font-mono">{shippedTasks}/{totalTasks} Tasks Shipped</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Metric 2: Portfolio Health */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50/50 border border-black/[0.06] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Portfolio Health</span>
            <div className="text-2xl font-light text-emerald-600 tracking-tight">{healthyCount}/{totalProjects || 1}</div>
            <div className="text-[11px] text-[#9ca3af] font-mono">Initiatives On Track</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
            <Activity size={22} />
          </div>
        </div>

        {/* Metric 3: Active Sprints Velocity */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-purple-50/50 border border-black/[0.06] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Average Velocity</span>
            <div className="text-2xl font-light text-purple-700 tracking-tight">8.6 <span className="text-xs text-[#9ca3af]">/ 10</span></div>
            <div className="text-[11px] text-[#9ca3af] font-mono">+12% vs last cycle</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Metric 4: Risk / Attention Required */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-amber-50/50 border border-black/[0.06] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Attention Needed</span>
            <div className="text-2xl font-light text-amber-600 tracking-tight">{atRiskCount}</div>
            <div className="text-[11px] text-[#9ca3af] font-mono">{atRiskCount === 0 ? 'Zero active bottlenecks' : 'Requires scope review'}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
            <Target size={22} />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 font-body">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title or objective..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black placeholder:text-[#9ca3af] outline-none transition-all shadow-sm font-light"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#9ca3af] font-body font-light">
          Loading projects portfolio...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white border border-dashed border-black/[0.1] text-[#6b7280] text-xs font-body font-light">
          No active projects found. Click &quot;New Project&quot; to initialize a new sprint.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const health = getProjectHealth(project as any)
            const pTasks = project.tasks || []
            const pTotal = pTasks.length
            const pShipped = pTasks.filter((t: any) => t.status === 'shipped').length
            const pProgress = pTotal === 0 ? 0 : Math.round((pShipped / pTotal) * 100)
            const daysLeft = project.deadline ? daysUntil(project.deadline) : null

            return (
              <Link
                href={`/projects/${project.id}`}
                key={project.id}
                className="group block rounded-3xl bg-gradient-to-b from-white to-[#fcfcfd] hover:to-white border border-black/[0.08] hover:border-black/[0.18] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        'w-2.5 h-2.5 rounded-full shadow-sm',
                        health === 'green' ? 'bg-emerald-500 shadow-emerald-200' : health === 'amber' ? 'bg-amber-500 shadow-amber-200' : 'bg-red-500 shadow-red-200'
                      )}></span>
                      <h3 className="text-base font-normal text-black tracking-tight group-hover:underline">
                        {project.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-black/[0.04] text-[#6b7280]">
                        {project.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDeleteProject(project.id)
                        }}
                        className="p-1 text-[#9ca3af] hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#6b7280] font-body font-light line-clamp-2 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>

                  {/* Success Metric Pill */}
                  {project.success_metric && (
                    <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.04] text-xs font-body font-light">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-black font-medium mb-1">
                        <Target size={12} className="text-indigo-600" />
                        <span>SUCCESS TARGET</span>
                      </div>
                      <div className="text-xs text-[#4b5563] italic truncate">
                        {project.success_metric}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress & Milestone Footer */}
                <div className="p-4 px-6 bg-[#fafafa]/80 border-t border-black/[0.04] space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-mono text-[#6b7280] font-light">
                    <span>{pShipped}/{pTotal} DELIVERABLES</span>
                    <span>{daysLeft !== null ? `${daysLeft}D REMAINING` : 'OPEN HORIZON'}</span>
                  </div>
                  <div className="w-full h-2 bg-black/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${pProgress}%` }}
                    ></div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <CreateProjectWizard onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchProjects} />
      )}

      <NaturalLanguageInputModal
        isOpen={isSynthesizeOpen}
        onClose={() => setIsSynthesizeOpen(false)}
        onSuccess={fetchProjects}
      />
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
        toast.success('Project created!')
        onSuccess()
        onClose()
        router.push(`/projects/${data.id}`)
      } else {
        toast.error('Failed to create project')
      }
    }
    setSaving(false)
  }

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.name.length > 0
      case 2: return formData.success_metric.length > 0
      case 3: return formData.min_shippable_version.length > 0
      case 4: return formData.kill_condition.length > 0
      case 5: return formData.deadline.length > 0
      default: return true
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="bg-white border border-black/[0.08] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-base font-normal text-black">New Project Setup</h2>
            <div className="flex gap-1.5 mt-2">
              {[1,2,3,4,5,6].map(s => (
                <div key={s} className={cn(
                  'w-6 h-1 rounded-full',
                  s <= step ? 'bg-black' : 'bg-black/[0.08]'
                )} />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#9ca3af] hover:text-black rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Step Body */}
        <div className="p-6 min-h-[260px] font-body">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-light text-black">The Basics</h3>
              <div>
                <label className="text-[11px] font-mono text-[#6b7280] block mb-1">PROJECT NAME</label>
                <input
                  autoFocus
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  type="text"
                  placeholder="e.g. CallMy Growth Engine"
                  className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-[#6b7280] block mb-1">DESCRIPTION (OPTIONAL)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="What is the objective of this initiative?"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none resize-none font-light"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-light text-black">Success Metric</h3>
              <p className="text-xs text-[#6b7280] font-light">What single measurable metric proves this initiative is successful?</p>
              <div>
                <label className="text-[11px] font-mono text-black font-medium block mb-1">TARGET METRIC</label>
                <input
                  autoFocus
                  value={formData.success_metric}
                  onChange={e => setFormData({...formData, success_metric: e.target.value})}
                  type="text"
                  placeholder="e.g. 50 active users or 100% test coverage"
                  className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-light text-black">Minimum Shippable Version</h3>
              <p className="text-xs text-[#6b7280] font-light">What is the absolute bare minimum slice to ship first?</p>
              <div>
                <label className="text-[11px] font-mono text-[#6b7280] block mb-1">MVP SCOPE</label>
                <textarea
                  autoFocus
                  value={formData.min_shippable_version}
                  onChange={e => setFormData({...formData, min_shippable_version: e.target.value})}
                  placeholder="e.g. A single clean dashboard page with core data."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none resize-none font-light"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-light text-black">Kill Condition</h3>
              <p className="text-xs text-[#6b7280] font-light">When do we kill or pivot this project?</p>
              <div>
                <label className="text-[11px] font-mono text-red-600 block mb-1">KILL CRITERIA</label>
                <input
                  autoFocus
                  value={formData.kill_condition}
                  onChange={e => setFormData({...formData, kill_condition: e.target.value})}
                  type="text"
                  placeholder="e.g. If no user adoption after 14 days."
                  className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-light text-black">Timeline & Priority</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-[#6b7280] block mb-1">DEADLINE</label>
                  <input
                    value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value})}
                    type="date"
                    className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[#6b7280] block mb-1">PRIORITY</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                  >
                    <option value="p0">P0 - Critical</option>
                    <option value="p1">P1 - High</option>
                    <option value="p2">P2 - Medium</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-black font-medium text-sm">
                <Zap size={16} />
                <span>AI Scope Verification</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] text-xs text-[#4b5563] font-light leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {aiTestResult}
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="ack"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                  className="w-4 h-4 rounded text-black accent-black cursor-pointer"
                />
                <label htmlFor="ack" className="text-xs text-[#6b7280] cursor-pointer font-light">
                  I commit to this project scope and execution timeline.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-black/[0.06] flex justify-between items-center bg-[#fdfdfe] font-body">
          {step > 1 && step < 6 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-normal text-[#6b7280] hover:text-black transition-colors cursor-pointer"
            >
              Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!isStepValid()}
              className="px-5 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-normal rounded-xl transition-all cursor-pointer"
            >
              Next Step →
            </button>
          ) : step === 5 ? (
            <button
              onClick={runStressTest}
              disabled={!isStepValid() || testing}
              className="px-5 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-normal rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap size={13} />
              <span>{testing ? 'Analyzing...' : 'Run Scope Test'}</span>
            </button>
          ) : (
            <button
              onClick={handleCreateProject}
              disabled={saving || !ack}
              className="px-5 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-normal rounded-xl transition-all cursor-pointer shadow-sm"
            >
              {saving ? 'Creating...' : 'Accept & Launch Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
