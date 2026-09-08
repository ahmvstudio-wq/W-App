'use client'

export const runtime = 'edge'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Plus, Search, Filter, FolderKanban, Activity, Target, X, Zap, 
  Trash2, ChevronRight, Clock, TrendingUp, Layers, CheckCircle2, 
  Building2, Briefcase, Sparkles, ArrowUpRight, Palette, Edit3,
  Play, ListTodo
} from 'lucide-react'
import { getProjectHealth, getInitials, daysUntil, daysSince, cn } from '@/lib/utils'
import type { Project } from '@/types'
import { stressTestProject } from '@/lib/groq/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import NaturalLanguageInputModal from '@/components/NaturalLanguageInputModal'

export interface MasterProjectInfo {
  id: string
  name: string
  subtitle?: string
  description?: string
  colorTheme?: 'emerald' | 'indigo' | 'purple' | 'blue' | 'amber' | 'rose'
}

const DEFAULT_MASTER_PROJECTS: MasterProjectInfo[] = []

export default function ProjectsPage() {
  const router = useRouter()
  
  // Modals & States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreateMasterModalOpen, setIsCreateMasterModalOpen] = useState(false)
  const [isSynthesizeOpen, setIsSynthesizeOpen] = useState(false)
  const [createInitialMasterProject, setCreateInitialMasterProject] = useState<string>('')
  
  // Data States
  const [projects, setProjects] = useState<Project[]>([])
  const [masterProjects, setMasterProjects] = useState<MasterProjectInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Selected Master Project for the Command Hub Banner & Filter
  const [activeMasterProjectName, setActiveMasterProjectName] = useState<string>('')
  const [selectedMasterFilter, setSelectedMasterFilter] = useState<string>('all')

  // Load custom master projects from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('focus_master_projects')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter((p: MasterProjectInfo) => p.name !== 'Primary Portfolio')
          if (cleaned.length > 0) {
            setMasterProjects(cleaned)
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load master projects from localStorage:', e)
    }
  }, [])

  async function saveMasterProjects(newList: MasterProjectInfo[]) {
    setMasterProjects(newList)
    try {
      localStorage.setItem('focus_master_projects', JSON.stringify(newList))
    } catch (e) {
      console.warn('Failed to save master projects to localStorage:', e)
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      let activeWsId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null
      if (!activeWsId) {
        const { data: userWs } = await supabase.from('workspaces').select('id').eq('owner_id', session.user.id).limit(1)
        activeWsId = userWs?.[0]?.id
      }
      if (activeWsId) {
        const { data: wsRow } = await supabase.from('workspaces').select('settings').eq('id', activeWsId).single()
        const currentSettings = wsRow?.settings || {}
        await supabase.from('workspaces').update({
          settings: {
            ...currentSettings,
            master_projects: newList
          }
        }).eq('id', activeWsId)
      }
    } catch (err) {
      console.warn('Failed to sync master projects to workspace settings:', err)
    }
  }

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
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setProjects([])
      setLoading(false)
      return
    }

    let activeWsId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null
    if (!activeWsId) {
      const { data: userWs } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', session.user.id)
        .limit(1)

      if (userWs && userWs.length > 0) {
        activeWsId = userWs[0].id
        if (typeof window !== 'undefined') {
          localStorage.setItem('focus_active_workspace_id', userWs[0].id)
        }
      }
    }

    if (!activeWsId) {
      setProjects([])
      setLoading(false)
      return
    }

    // Fetch workspace row to resolve workspace-specific settings & master programs
    const { data: wsData } = await supabase
      .from('workspaces')
      .select('id, name, owner_id, settings')
      .eq('id', activeWsId)
      .single()

    const isTaufiq = session.user.email?.toLowerCase().includes('taufiq') || wsData?.owner_id === '89f0a1d6-3c0e-4bb9-8df9-cfe1e8de4128'

    const defaultMastersForWorkspace: MasterProjectInfo[] = isTaufiq ? [
      {
        id: 'mp-tadbeer',
        name: 'Tadbeer TT',
        subtitle: 'Primary Business Architecture',
        description: 'Core commercial trading, client CRM, e-commerce products, and operations.',
        colorTheme: 'emerald'
      },
      {
        id: 'mp-internal',
        name: 'Internal Core',
        subtitle: 'Platform & Infrastructure',
        description: 'Underlying infrastructure, hosting, and systems architecture.',
        colorTheme: 'blue'
      }
    ] : []

    const wsSettings = wsData?.settings || {}
    const rawSaved: MasterProjectInfo[] = Array.isArray(wsSettings.master_projects) ? wsSettings.master_projects : []
    // Filter out dummy "Primary Portfolio" if non-Taufiq user
    const savedMasterProjects: MasterProjectInfo[] = (!isTaufiq && rawSaved.length === 1 && rawSaved[0].name === 'Primary Portfolio')
      ? []
      : (rawSaved.length > 0 ? rawSaved : defaultMastersForWorkspace)

    const projectMasterMap: Record<string, string> = wsSettings.project_master_map || {}

    let query = supabase
      .from('projects')
      .select('*, tasks(*)')
      .eq('workspace_id', activeWsId)
      .order('updated_at', { ascending: false })
    
    const { data } = await query
    
    if (data) {
      const fallbackMaster = savedMasterProjects[0]?.name || (isTaufiq ? 'Tadbeer TT' : '')
      const enriched: Project[] = data.map((p: any) => ({
        ...p,
        master_project: projectMasterMap[p.id] || p.master_project || fallbackMaster
      }))
      setProjects(enriched)

      // Auto-register any new master_project names found
      const foundNames = Array.from(new Set(enriched.map(p => p.master_project).filter((n): n is string => Boolean(n))))
      const mergedMasters = [...savedMasterProjects]
      foundNames.forEach(name => {
        if (!mergedMasters.some(m => m.name.toLowerCase() === name.toLowerCase())) {
          mergedMasters.push({
            id: `mp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name,
            subtitle: 'Master Campaign',
            description: `Initiatives under ${name}.`,
            colorTheme: 'purple'
          })
        }
      })
      setMasterProjects(mergedMasters)

      if (mergedMasters.length > 0) {
        if (!activeMasterProjectName || !mergedMasters.some(m => m.name.toLowerCase() === activeMasterProjectName.toLowerCase())) {
          setActiveMasterProjectName(mergedMasters[0].name)
        }
        setCreateInitialMasterProject(mergedMasters[0].name)
      } else {
        setActiveMasterProjectName('')
        setCreateInitialMasterProject('')
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProjects()
    const handleWsChanged = () => fetchProjects()
    const handleOpenCreateMaster = () => setIsCreateMasterModalOpen(true)
    window.addEventListener('workspace-changed', handleWsChanged)
    window.addEventListener('open-create-master-modal', handleOpenCreateMaster)
    return () => {
      window.removeEventListener('workspace-changed', handleWsChanged)
      window.removeEventListener('open-create-master-modal', handleOpenCreateMaster)
    }
  }, [])

  // All distinct Master Project names
  const allMasterNames = useMemo(() => {
    const set = new Set<string>()
    masterProjects.forEach(m => set.add(m.name))
    projects.forEach(p => { if (p.master_project) set.add(p.master_project) })
    return Array.from(set)
  }, [masterProjects, projects])

  // Active Master Project Object
  const activeMasterObj = useMemo(() => {
    if (!activeMasterProjectName) {
      return {
        id: 'none',
        name: 'Master Campaign',
        subtitle: 'Start by creating your first campaign',
        description: 'Organize your missions under one umbrella brand.',
        colorTheme: 'emerald' as const
      }
    }
    const found = masterProjects.find(m => m.name.toLowerCase() === activeMasterProjectName.toLowerCase())
    if (found) return found
    return {
      id: 'custom',
      name: activeMasterProjectName,
      subtitle: 'Campaign Hub',
      description: `Strategic initiatives for ${activeMasterProjectName}.`,
      colorTheme: 'emerald' as const
    }
  }, [masterProjects, activeMasterProjectName])

  // Initiatives for Active Master Project
  const activeMasterProjects = useMemo(() => {
    return projects.filter(p => (p.master_project || 'General').toLowerCase() === activeMasterProjectName.toLowerCase())
  }, [projects, activeMasterProjectName])

  const activeMasterTasks = activeMasterProjects.flatMap(p => p.tasks || [])
  const activeMasterShipped = activeMasterTasks.filter((t: any) => t.status === 'shipped').length
  const activeMasterProgress = activeMasterTasks.length > 0 ? Math.round((activeMasterShipped / activeMasterTasks.length) * 100) : 0

  // Filtered Projects for Grid
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const projectMaster = p.master_project || 'General'
    const matchesMaster = selectedMasterFilter === 'all' || projectMaster.toLowerCase() === selectedMasterFilter.toLowerCase()

    return matchesSearch && matchesMaster
  })

  // Dynamic Context-Aware Analytics (strictly calculated for the chosen Master Program or Portfolio)
  const isAllFilter = selectedMasterFilter === 'all'
  const scopedProjects = useMemo(() => {
    if (isAllFilter) return projects
    return projects.filter(p => (p.master_project || 'General').toLowerCase() === selectedMasterFilter.toLowerCase())
  }, [projects, isAllFilter, selectedMasterFilter])

  const scopedMasterName = isAllFilter ? 'Portfolio' : selectedMasterFilter
  const scopedTasks = useMemo(() => scopedProjects.flatMap(p => p.tasks || []), [scopedProjects])
  const scopedTotalTasks = scopedTasks.length
  const scopedShippedTasks = useMemo(() => scopedTasks.filter((t: any) => t.status === 'shipped').length, [scopedTasks])
  const scopedDeliveryRate = scopedTotalTasks > 0 ? Math.round((scopedShippedTasks / scopedTotalTasks) * 100) : 0
  const scopedHealthyCount = useMemo(() => scopedProjects.filter(p => getProjectHealth(p as any) === 'green').length, [scopedProjects])
  const scopedAtRiskCount = useMemo(() => scopedProjects.filter(p => getProjectHealth(p as any) === 'amber' || getProjectHealth(p as any) === 'red').length, [scopedProjects])

  function handleCreateNewMasterProject(info: { name: string; subtitle: string; description: string; colorTheme: any }) {
    const newMp: MasterProjectInfo = {
      id: `mp-${Date.now()}`,
      name: info.name.trim(),
      subtitle: info.subtitle.trim() || 'Master Client Program',
      description: info.description.trim() || `Strategic initiatives for ${info.name.trim()}.`,
      colorTheme: info.colorTheme || 'emerald'
    }

    const updated = [...masterProjects, newMp]
    saveMasterProjects(updated)
    setActiveMasterProjectName(newMp.name)
    setSelectedMasterFilter(newMp.name)
    toast.success(`Master Project "${newMp.name}" created!`)
    setIsCreateMasterModalOpen(false)
  }

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#6b7280] uppercase tracking-wider mb-1 font-light">
            <span>FOCUS</span>
            <span>•</span>
            <span>SOLO OS</span>
            <span>•</span>
            <span className="text-black font-normal">{allMasterNames.length} CAMPAIGNS &amp; {projects.length} MISSIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-black">
            Campaigns &amp; Projects
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-body">
          {/* Tutorial Guide Button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-game-tutorial'))}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-white hover:bg-neutral-50 text-black border border-black/[0.08] font-normal text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            title="Interactive Video Game Tutorial & Guide"
          >
            <Target size={14} className="text-amber-500" />
            <span>Tutorial Guide</span>
          </button>

          <button
            onClick={() => setIsSynthesizeOpen(true)}
            className="flex items-center px-3 sm:px-4 py-2 bg-white hover:bg-neutral-50 text-black border border-black/[0.08] font-normal text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>Synthesize</span>
          </button>

          <button
            onClick={() => setIsCreateMasterModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-white hover:bg-neutral-50 text-black border border-black/[0.08] font-normal text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Building2 size={14} className="text-indigo-600" />
            <span>New Campaign</span>
          </button>

          <button
            onClick={() => {
              setCreateInitialMasterProject(activeMasterProjectName)
              setIsCreateModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-black hover:bg-neutral-800 text-white font-normal text-xs rounded-xl shadow-sm transition-all cursor-pointer font-body"
          >
            <Plus size={15} />
            <span>New Mission</span>
          </button>
        </div>
      </div>

      {allMasterNames.length === 0 ? (
        /* ========================================================================= */
        /* VIDEO GAME TUTORIAL & SYSTEM BRIEFING FOR NEW USERS (CLEAN EMPTY STATE)   */
        /* ========================================================================= */
        <div className="space-y-6 animate-fadeIn font-body">
          {/* Main Briefing Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-xs relative overflow-hidden">
            <div className="space-y-6">
              {/* Header Badge & Title */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                  Workspace Structure
                </span>
                <h2 className="text-2xl font-light tracking-tight text-black">
                  Projects &amp; Master Portfolios
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 font-light max-w-2xl leading-relaxed">
                  Focus separates high-level ventures from finite deliverables. Organize operations into distinct master portfolios, track milestone velocity, and execute tasks without cross-business clutter.
                </p>
              </div>

              {/* 3 Level Hierarchy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Level 1 */}
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-neutral-400">
                      01 &bull; Master Portfolio
                    </span>
                    <h3 className="text-sm font-medium text-black">
                      Master Project
                    </h3>
                    <p className="text-xs text-neutral-500 font-light leading-relaxed">
                      The overarching entity or brand (e.g., your media channel, product company, or advisory firm). All deliverables remain isolated within their parent portfolio.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-black/[0.05] text-[11px] font-mono text-neutral-400">
                    Isolates distinct business lines.
                  </div>
                </div>

                {/* Level 2 */}
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-neutral-400">
                      02 &bull; Milestone Scope
                    </span>
                    <h3 className="text-sm font-medium text-black">
                      Deliverable Project
                    </h3>
                    <p className="text-xs text-neutral-500 font-light leading-relaxed">
                      A concrete deliverable with a deadline, progress metrics, and linked whiteboard specs (e.g., Q3 sponsor drop, collection launch, or redesign).
                    </p>
                  </div>
                  <div className="pt-2 border-t border-black/[0.05] text-[11px] font-mono text-neutral-400">
                    Defines completion percentage.
                  </div>
                </div>

                {/* Level 3 */}
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-neutral-400">
                      03 &bull; Action Units
                    </span>
                    <h3 className="text-sm font-medium text-black">
                      Execution Tasks
                    </h3>
                    <p className="text-xs text-neutral-500 font-light leading-relaxed">
                      Individual, ranked tasks (P0 critical to P3 normal). Shipping tasks automatically updates project velocity and increments your daily execution streak.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-black/[0.05] text-[11px] font-mono text-neutral-400">
                    Powers the Pomodoro timer.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  onClick={() => setIsCreateMasterModalOpen(true)}
                  className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-normal text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center"
                >
                  Create Master Project
                </button>

                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-game-tutorial'))}
                  className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-black/[0.08] font-normal text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Open Operating Manual
                </button>
              </div>

              {/* One-Click Quick Initializers */}
              <div className="pt-4 border-t border-black/[0.06] space-y-2">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Quick Initialize Preset:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Studio & Media', desc: 'Main channel, weekly uploads, and content production.' },
                    { name: 'Apparel Brand', desc: 'Apparel drops, supply, and e-commerce.' },
                    { name: 'Advisory Studio', desc: 'Deliverables, consulting, and client sprints.' },
                    { name: 'Software Product', desc: 'Product development, roadmap, and growth.' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleCreateNewMasterProject({
                        name: preset.name,
                        subtitle: 'Master Portfolio',
                        description: preset.desc,
                        colorTheme: 'emerald'
                      })}
                      className="px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-black hover:text-white border border-black/[0.06] text-xs font-mono transition-all cursor-pointer"
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* MASTER PROGRAM SWITCHER CAROUSEL (PRIMARY PORTFOLIO, INTERNAL, + CREATE)  */}
          {/* ========================================================================= */}
          <div className="space-y-3 font-body">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block font-light">
                SELECT MASTER CAMPAIGN / BRAND HUB
              </span>
          <button
            onClick={() => setIsCreateMasterModalOpen(true)}
            className="text-xs text-indigo-600 hover:underline font-mono flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Create Master Project</span>
          </button>
        </div>

        {/* Master Project Cards Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allMasterNames.map((mName) => {
            const isSelected = activeMasterProjectName.toLowerCase() === mName.toLowerCase()
            const mProjects = projects.filter(p => (p.master_project || 'General').toLowerCase() === mName.toLowerCase())
            const mTasks = mProjects.flatMap(p => p.tasks || [])
            const mShipped = mTasks.filter((t: any) => t.status === 'shipped').length
            const mProgress = mTasks.length > 0 ? Math.round((mShipped / mTasks.length) * 100) : 0
            const info = masterProjects.find(m => m.name.toLowerCase() === mName.toLowerCase())

            return (
              <button
                key={mName}
                type="button"
                onClick={() => {
                  setActiveMasterProjectName(mName)
                  setSelectedMasterFilter(mName)
                }}
                className={cn(
                  'p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group shadow-xs',
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900 ring-2 ring-neutral-900/20'
                    : 'bg-white hover:bg-[#fafbff] border-black/[0.08] text-black'
                )}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className={cn(
                      'text-[9px] font-mono uppercase tracking-wider block',
                      isSelected ? 'text-emerald-400' : 'text-[#6b7280]'
                    )}>
                      MASTER PROGRAM
                    </span>
                    <h4 className={cn('text-sm font-medium truncate', isSelected ? 'text-white' : 'text-black')}>
                      {mName}
                    </h4>
                    {info?.subtitle && (
                      <p className={cn('text-[11px] truncate font-light', isSelected ? 'text-white/60' : 'text-[#9ca3af]')}>
                        {info.subtitle}
                      </p>
                    )}
                  </div>

                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-mono font-medium flex-shrink-0',
                    isSelected ? 'bg-white/10 text-white' : 'bg-black/[0.04] text-[#6b7280]'
                  )}>
                    {mProjects.length} {mProjects.length === 1 ? 'project' : 'projects'}
                  </span>
                </div>

                {/* Progress bar inside card */}
                <div className="w-full space-y-1">
                  <div className={cn('flex justify-between text-[10px] font-mono', isSelected ? 'text-white/60' : 'text-[#9ca3af]')}>
                    <span>{mShipped}/{mTasks.length} shipped</span>
                    <span>{mProgress}%</span>
                  </div>
                  <div className={cn('w-full h-1 rounded-full overflow-hidden', isSelected ? 'bg-white/20' : 'bg-black/[0.06]')}>
                    <div 
                      className={cn('h-full rounded-full transition-all duration-300', isSelected ? 'bg-emerald-400' : 'bg-black')}
                      style={{ width: `${mProgress}%` }}
                    />
                  </div>
                </div>
              </button>
            )
          })}

          {/* Quick Create Card Button */}
          <button
            type="button"
            onClick={() => setIsCreateMasterModalOpen(true)}
            className="p-4 rounded-2xl border border-dashed border-black/[0.15] hover:border-black bg-white hover:bg-neutral-50 text-left transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 min-h-[105px] text-[#6b7280] hover:text-black group shadow-xs"
          >
            <div className="w-7 h-7 rounded-xl bg-black/[0.05] group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors">
              <Plus size={14} />
            </div>
            <span className="text-xs font-normal">Add Master Project</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE MASTER PROGRAM COMMAND BANNER (CRYSTAL CLEAR HIGH-CONTRAST)         */}
      {/* ========================================================================= */}
      <div className="p-8 rounded-3xl bg-white text-black shadow-md relative overflow-hidden font-body border-2 border-black/[0.08] animate-fadeIn">
        {/* Subtle Ambient Background Accents */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-50/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: Master Program Meta & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/[0.08]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-950 font-mono text-[10px] uppercase tracking-wider font-semibold border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                  <Building2 size={12} className="text-emerald-700" />
                  ACTIVE MASTER PROGRAM
                </span>
                <span className="text-black/30 text-xs font-mono">•</span>
                <span className="text-emerald-700 text-xs font-mono font-semibold">Executive Command Hub</span>
              </div>
              <h2 className="text-2xl font-normal tracking-tight text-black flex items-center gap-3">
                <span>{activeMasterObj.name}</span>
                {activeMasterObj.subtitle && (
                  <span className="text-xs font-mono text-[#4b5563] font-normal">
                    ({activeMasterObj.subtitle})
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#4b5563] font-normal max-w-2xl leading-relaxed">
                {activeMasterObj.description}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedMasterFilter(activeMasterObj.name)
                }}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border shadow-xs',
                  selectedMasterFilter === activeMasterObj.name
                    ? 'bg-black text-white border-black'
                    : 'bg-white hover:bg-neutral-100 text-black border-black/[0.15]'
                )}
              >
                {selectedMasterFilter === activeMasterObj.name ? `Filtered: ${activeMasterObj.name}` : `Filter ${activeMasterObj.name}`}
              </button>

              <button
                onClick={() => {
                  setCreateInitialMasterProject(activeMasterObj.name)
                  setIsCreateModalOpen(true)
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-all cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                <span>Add Initiative to {activeMasterObj.name}</span>
              </button>
            </div>
          </div>

          {/* Middle Row: Sub-Initiatives Grid inside this Master Project */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-mono text-[#4b5563] uppercase tracking-wider block font-semibold">
              SUB-INITIATIVES UNDER {activeMasterObj.name.toUpperCase()} ({activeMasterProjects.length})
            </span>

            {activeMasterProjects.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-neutral-50 border border-dashed border-black/[0.12] text-[#6b7280] text-xs font-light">
                No initiatives assigned to {activeMasterObj.name} yet. Click &quot;Add Initiative to {activeMasterObj.name}&quot; above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeMasterProjects.map((p) => {
                  const pTasks = p.tasks || []
                  const pShipped = pTasks.filter((t: any) => t.status === 'shipped').length
                  const pProg = pTasks.length > 0 ? Math.round((pShipped / pTasks.length) * 100) : 0

                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="p-4 rounded-2xl bg-[#f8f9fa] hover:bg-white border border-black/[0.08] hover:border-black/[0.22] hover:shadow-md transition-all block group space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-black truncate group-hover:text-emerald-700 transition-colors">
                          {p.name}
                        </span>
                        <ArrowUpRight size={13} className="text-[#6b7280] group-hover:text-black transition-colors flex-shrink-0" />
                      </div>

                      <p className="text-[11px] text-[#4b5563] line-clamp-1 font-light">
                        {p.description || 'No description'}
                      </p>

                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] font-mono text-[#4b5563]">
                          <span className="font-medium">{pShipped}/{pTasks.length} shipped</span>
                          <span className="font-semibold text-black">{pProg}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/[0.08] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                            style={{ width: `${pProg}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bottom Row: Program Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-black/[0.08] text-xs font-mono">
            <div className="p-3 bg-[#f8f9fa] rounded-xl border border-black/[0.04]">
              <span className="text-[10px] text-[#6b7280] block uppercase font-medium">TOTAL INITIATIVES</span>
              <span className="text-lg font-normal text-black">{activeMasterProjects.length} Active</span>
            </div>
            <div className="p-3 bg-[#f8f9fa] rounded-xl border border-black/[0.04]">
              <span className="text-[10px] text-[#6b7280] block uppercase font-medium">OVERALL COMPLETION</span>
              <span className="text-lg font-semibold text-emerald-700">{activeMasterProgress}% Shipped</span>
            </div>
            <div className="p-3 bg-[#f8f9fa] rounded-xl border border-black/[0.04]">
              <span className="text-[10px] text-[#6b7280] block uppercase font-medium">DELIVERABLES</span>
              <span className="text-lg font-normal text-black">{activeMasterShipped} / {activeMasterTasks.length} Done</span>
            </div>
            <div className="p-3 bg-[#f8f9fa] rounded-xl border border-black/[0.04]">
              <span className="text-[10px] text-[#6b7280] block uppercase font-medium">PROGRAM STATUS</span>
              <span className="text-lg font-normal text-indigo-700">High Velocity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Program & Portfolio Metrics Overview (Context-Aware to Chosen Master Program) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-body">
        {/* Metric 1: Delivery Rate */}
        <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-semibold">
              {isAllFilter ? 'Portfolio Delivery' : `${scopedMasterName} Delivery`}
            </span>
            <div className="text-2xl font-normal text-black tracking-tight">{scopedDeliveryRate}%</div>
            <div className="text-[11px] text-[#4b5563] font-mono">{scopedShippedTasks}/{scopedTotalTasks} Tasks Shipped</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Metric 2: Program Health */}
        <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-semibold">
              {isAllFilter ? 'Portfolio Health' : `${scopedMasterName} Health`}
            </span>
            <div className="text-2xl font-normal text-emerald-700 tracking-tight">{scopedHealthyCount}/{scopedProjects.length || 1}</div>
            <div className="text-[11px] text-[#4b5563] font-mono">Initiatives On Track</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
            <Activity size={22} />
          </div>
        </div>

        {/* Metric 3: Scope Scale (Master Programs or Sub-Initiatives) */}
        <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-semibold">
              {isAllFilter ? 'Master Programs' : `${scopedMasterName} Scope`}
            </span>
            <div className="text-2xl font-normal text-purple-700 tracking-tight">
              {isAllFilter ? allMasterNames.length : scopedProjects.length}
            </div>
            <div className="text-[11px] text-[#4b5563] font-mono">
              {isAllFilter ? 'Selectable Program Hubs' : `${scopedProjects.length === 1 ? 'Active Sub-Initiative' : 'Active Sub-Initiatives'}`}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center">
            <Building2 size={22} />
          </div>
        </div>

        {/* Metric 4: Risk / Attention Required */}
        <div className="p-5 rounded-3xl bg-white border border-black/[0.08] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-semibold">
              {isAllFilter ? 'Attention Needed' : `${scopedMasterName} Bottlenecks`}
            </span>
            <div className="text-2xl font-normal text-amber-600 tracking-tight">{scopedAtRiskCount}</div>
            <div className="text-[11px] text-[#4b5563] font-mono">{scopedAtRiskCount === 0 ? 'Zero active bottlenecks' : 'Requires scope review'}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
            <Target size={22} />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar with Master Program Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-body">
        {/* Master Project Selector Pills */}
        <div className="flex items-center gap-1 bg-[#f5f5f7] p-1 rounded-2xl border border-black/[0.04] overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedMasterFilter('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-normal whitespace-nowrap',
              selectedMasterFilter === 'all'
                ? 'bg-white text-black font-medium shadow-xs'
                : 'text-[#6b7280] hover:text-black'
            )}
          >
            All Programs ({projects.length})
          </button>

          {allMasterNames.map((mName) => {
            const count = projects.filter(p => (p.master_project || 'General').toLowerCase() === mName.toLowerCase()).length
            return (
              <button
                key={mName}
                onClick={() => {
                  setSelectedMasterFilter(mName)
                  setActiveMasterProjectName(mName)
                }}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-normal flex items-center gap-1.5 whitespace-nowrap',
                  selectedMasterFilter.toLowerCase() === mName.toLowerCase()
                    ? 'bg-white text-black font-medium shadow-xs'
                    : 'text-[#6b7280] hover:text-black'
                )}
              >
                <Building2 size={12} className={selectedMasterFilter.toLowerCase() === mName.toLowerCase() ? 'text-emerald-600' : 'text-[#9ca3af]'} />
                <span>{mName}</span>
                <span className="px-1.5 py-0.2 bg-black/[0.05] rounded-full text-[10px] font-mono">
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Field */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search initiatives..."
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
          No initiatives found under this filter. Click &quot;New Initiative&quot; to initialize a project.
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
            const masterName = project.master_project || 'General'

            return (
              <Link
                href={`/projects/${project.id}`}
                key={project.id}
                className="group block rounded-3xl bg-white hover:bg-[#fafbff] border border-black/[0.08] hover:border-black/[0.18] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  {/* Top Badges & Master Program Tag */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1 font-medium">
                        <Building2 size={11} className="text-emerald-600" />
                        {masterName}
                      </span>
                      <h3 className="text-base font-normal text-black tracking-tight group-hover:underline truncate">
                        {project.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={cn(
                        'w-2.5 h-2.5 rounded-full shadow-sm',
                        health === 'green' ? 'bg-emerald-500 shadow-emerald-200' : health === 'amber' ? 'bg-amber-500 shadow-amber-200' : 'bg-red-500 shadow-red-200'
                      )} title={`Health: ${health}`} />
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
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )}

      {/* Creation Modal for Initiatives */}
      {isCreateModalOpen && (
        <CreateProjectWizard 
          initialMasterProject={createInitialMasterProject}
          availableMasterProjects={allMasterNames}
          onOpenCreateMaster={() => {
            setIsCreateModalOpen(false)
            setIsCreateMasterModalOpen(true)
          }}
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={fetchProjects} 
        />
      )}

      {/* Dedicated Creation Modal for Master Projects */}
      {isCreateMasterModalOpen && (
        <CreateMasterProjectModal
          onClose={() => setIsCreateMasterModalOpen(false)}
          onCreate={handleCreateNewMasterProject}
        />
      )}

      <NaturalLanguageInputModal
        isOpen={isSynthesizeOpen}
        onClose={() => setIsSynthesizeOpen(false)}
        onSuccess={fetchProjects}
      />
    </div>
  )
}

/**
 * Modal to create a new Master Project / Organization Hub
 */
function CreateMasterProjectModal({
  onClose,
  onCreate
}: {
  onClose: () => void
  onCreate: (info: { name: string; subtitle: string; description: string; colorTheme: any }) => void
}) {
  const [name, setName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [colorTheme, setColorTheme] = useState<'emerald' | 'indigo' | 'purple' | 'blue' | 'amber' | 'rose'>('emerald')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onCreate({ name, subtitle, description, colorTheme })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white border border-black/[0.1] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col font-body animate-scaleUp">
        {/* Header */}
        <div className="p-6 border-b border-black/[0.06] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <Building2 size={16} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block font-light">
                SOLO OS CAMPAIGN
              </span>
              <h2 className="text-base font-normal text-black tracking-tight">Create Master Campaign</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#9ca3af] hover:text-black rounded-xl cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#fbfbfd]">
          <div>
            <label className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block mb-1 font-light">
              CAMPAIGN / BRAND NAME *
            </label>
            <p className="text-[11px] text-[#9ca3af] font-light mb-1.5">
              Your main brand or umbrella (e.g. YouTube Studio, Clothing Brand, Agency).
            </p>
            <input
              type="text"
              required
              placeholder="e.g. YouTube Studio, Clothing Brand, Freelance Agency"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-black/[0.1] focus:border-black rounded-xl text-xs text-black outline-none font-light shadow-xs"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block mb-1 font-light">
              SUBTITLE (OPTIONAL)
            </label>
            <input
              type="text"
              placeholder="e.g. Weekly Video Series, E-Commerce Drop"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-black/[0.1] focus:border-black rounded-xl text-xs text-black outline-none font-light shadow-xs"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block mb-1 font-light">
              WHAT IS THIS CAMPAIGN ABOUT?
            </label>
            <textarea
              rows={3}
              placeholder="Describe the main goal of this brand or creative studio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-black/[0.1] focus:border-black rounded-xl text-xs text-black outline-none font-light shadow-xs resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-black/[0.04]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#6b7280] hover:text-black font-light cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              Start Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateProjectWizard({ 
  initialMasterProject = '',
  availableMasterProjects = [],
  onOpenCreateMaster,
  onClose, 
  onSuccess 
}: { 
  initialMasterProject?: string
  availableMasterProjects?: string[]
  onOpenCreateMaster?: () => void
  onClose: () => void
  onSuccess: () => void 
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    master_project: initialMasterProject,
    description: '',
    success_metric: '',
    min_shippable_version: '',
    kill_condition: '',
    deadline: '',
    priority: 'p1'
  })
  const [customMasterInput, setCustomMasterInput] = useState('')
  const [isTypingCustomMaster, setIsTypingCustomMaster] = useState(false)
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

    if (workspaceId) {
      const chosenMaster = isTypingCustomMaster && customMasterInput.trim() ? customMasterInput.trim() : (formData.master_project || 'General')

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
        try {
          const { data: wsRow } = await supabase.from('workspaces').select('settings').eq('id', workspaceId).single()
          const currentSettings = wsRow?.settings || {}
          const currentMap = currentSettings.project_master_map || {}
          const currentMasters: MasterProjectInfo[] = currentSettings.master_projects || []

          if (!currentMasters.some((m: any) => m.name.toLowerCase() === chosenMaster.toLowerCase())) {
            currentMasters.push({
              id: `mp-${Date.now()}`,
              name: chosenMaster,
              subtitle: 'Client Program & Portfolio',
              description: `Initiatives under ${chosenMaster}.`,
              colorTheme: 'purple'
            })
          }

          await supabase.from('workspaces').update({
            settings: {
              ...currentSettings,
              master_projects: currentMasters,
              project_master_map: {
                ...currentMap,
                [data.id]: chosenMaster
              }
            }
          }).eq('id', workspaceId)
        } catch (err) {
          console.warn('Failed to sync project to workspace master map:', err)
        }

        toast.success(`Initiative created under ${chosenMaster}!`)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white border border-black/[0.1] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col font-body animate-scaleUp">
        {/* Modal Header */}
        <div className="p-6 border-b border-black/[0.06] flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block font-light">
                STEP {step} OF 6
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono font-medium">
                {isTypingCustomMaster && customMasterInput ? customMasterInput : (formData.master_project || 'General')}
              </span>
            </div>
            <h2 className="text-lg font-normal text-black tracking-tight">
              {step === 1 && 'Initiative Identity & Master Program'}
              {step === 2 && 'Success Target (Definition of Done)'}
              {step === 3 && 'Minimum Shippable Version'}
              {step === 4 && 'Kill Condition (Scope Boundary)'}
              {step === 5 && 'Target Delivery Deadline'}
              {step === 6 && 'Review & Final Authorization'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-[#9ca3af] hover:text-black rounded-xl cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-6 flex-1 bg-[#fbfbfd]">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block font-light">
                    SELECT MASTER PROGRAM
                  </label>
                  {onOpenCreateMaster && (
                    <button
                      type="button"
                      onClick={onOpenCreateMaster}
                      className="text-xs text-indigo-600 hover:underline font-mono"
                    >
                      + Create New Master
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {availableMasterProjects.map((mp) => (
                    <button
                      key={mp}
                      type="button"
                      onClick={() => {
                        setIsTypingCustomMaster(false)
                        setFormData({ ...formData, master_project: mp })
                      }}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-all flex items-center gap-2 truncate',
                        !isTypingCustomMaster && formData.master_project === mp
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium shadow-xs'
                          : 'bg-white border-black/[0.08] text-[#6b7280] hover:text-black'
                      )}
                    >
                      <Building2 size={13} className={!isTypingCustomMaster && formData.master_project === mp ? 'text-emerald-600' : 'text-[#9ca3af]'} />
                      <span className="truncate">{mp}</span>
                    </button>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => setIsTypingCustomMaster(true)}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-all flex items-center gap-2',
                      isTypingCustomMaster
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-medium shadow-xs'
                        : 'bg-white border-black/[0.08] text-[#6b7280] hover:text-black'
                    )}
                  >
                    <Plus size={13} />
                    <span>Custom Name</span>
                  </button>
                </div>

                {isTypingCustomMaster && (
                  <input
                    type="text"
                    placeholder="Enter custom Master Program name..."
                    value={customMasterInput}
                    onChange={(e) => {
                      setCustomMasterInput(e.target.value)
                      setFormData({ ...formData, master_project: e.target.value })
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-indigo-300 focus:border-black rounded-xl text-xs text-black outline-none font-light shadow-xs mb-3"
                    autoFocus
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block mb-2 font-light">
                  INITIATIVE TITLE *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ERP Inventory Sync Module"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-black/[0.1] focus:border-black rounded-2xl text-sm text-black outline-none font-light shadow-sm"
                  autoFocus={!isTypingCustomMaster}
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block mb-2 font-light">
                  EXECUTIVE SUMMARY / CONTEXT
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what this initiative achieves for the master program..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-black/[0.1] focus:border-black rounded-2xl text-xs text-black outline-none font-light shadow-sm resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block font-light">
                WHAT CONCRETE OUTCOME PROVES SUCCESS?
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Core milestone is deployed and verified in production."
                value={formData.success_metric}
                onChange={(e) => setFormData({ ...formData, success_metric: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-black/[0.1] focus:border-black rounded-2xl text-sm text-black outline-none font-light shadow-sm resize-none"
                autoFocus
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <label className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block font-light">
                MINIMUM SHIPPABLE VERSION (V1 BOUNDARY)
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Client-branded dashboard with 2-4 showcase products and lead intake form."
                value={formData.min_shippable_version}
                onChange={(e) => setFormData({ ...formData, min_shippable_version: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-black/[0.1] focus:border-black rounded-2xl text-sm text-black outline-none font-light shadow-sm resize-none"
                autoFocus
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <label className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block font-light">
                KILL CONDITION (WHEN TO STOP / REJECT EXPANSION)
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Do not expand into multi-currency billing until client confirms initial scope."
                value={formData.kill_condition}
                onChange={(e) => setFormData({ ...formData, kill_condition: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-black/[0.1] focus:border-black rounded-2xl text-sm text-black outline-none font-light shadow-sm resize-none"
                autoFocus
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block mb-2 font-light">
                  TARGET DELIVERY DEADLINE
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-black/[0.1] focus:border-black rounded-2xl text-sm text-black outline-none font-light shadow-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block mb-2 font-light">
                  PRIORITY LEVEL
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['p0', 'p1', 'p2', 'p3'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={cn(
                        'py-2.5 rounded-xl border text-xs font-mono font-medium uppercase cursor-pointer transition-all',
                        formData.priority === p
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white border-black/[0.08] text-[#6b7280] hover:text-black'
                      )}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-3 text-xs">
                <div className="flex justify-between border-b border-black/[0.06] pb-2">
                  <span className="text-[#6b7280] font-mono uppercase">Master Program:</span>
                  <span className="text-black font-semibold">{formData.master_project}</span>
                </div>
                <div className="flex justify-between border-b border-black/[0.06] pb-2">
                  <span className="text-[#6b7280] font-mono uppercase">Initiative Title:</span>
                  <span className="text-black font-semibold">{formData.name}</span>
                </div>
                <div className="flex justify-between border-b border-black/[0.06] pb-2">
                  <span className="text-[#6b7280] font-mono uppercase">Success Metric:</span>
                  <span className="text-black font-light text-right max-w-xs">{formData.success_metric}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280] font-mono uppercase">Target Deadline:</span>
                  <span className="text-black font-mono">{formData.deadline || 'None'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <input
                  type="checkbox"
                  id="ack"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="ack" className="text-xs text-emerald-950 font-light cursor-pointer">
                  I authorize this initiative under master program <strong>{formData.master_project}</strong> with the stated scope boundaries.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-black/[0.06] bg-white flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs text-[#6b7280] hover:text-black font-light cursor-pointer"
            >
              Back
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            {step < 5 && (
              <button
                type="button"
                disabled={!isStepValid()}
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                Next Step
              </button>
            )}

            {step === 5 && (
              <button
                type="button"
                disabled={!isStepValid() || testing}
                onClick={runStressTest}
                className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {testing ? 'Analyzing Scope...' : 'Verify & Review Scope'}
              </button>
            )}

            {step === 6 && (
              <button
                type="button"
                disabled={!ack || saving}
                onClick={handleCreateProject}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {saving ? 'Creating Initiative...' : 'Authorize Initiative'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
