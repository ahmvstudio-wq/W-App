'use client'

export const runtime = 'edge'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowRight, Clock, CheckCircle2, 
  X, ChevronRight, Mail, Calendar,
  CheckSquare, Video, ExternalLink, Building2, 
  FolderKanban, ChevronDown, Check, RefreshCw, Plus, Filter, Play, Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [selectedFocus, setSelectedFocus] = useState<string>('Product & Engineering')
  
  // Interactive Dashboard Preview State
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'meetings' | 'calendar'>('tasks')
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'done'>('all')
  const [demoTasks, setDemoTasks] = useState([
    { id: 1, title: 'Finalize client proposal presentation', done: true, priority: 'P1', tag: 'Proposal', due: 'Done' },
    { id: 2, title: 'Review onboarding feedback with product team', done: false, priority: 'P0', tag: 'Product', due: '2:30 PM' },
    { id: 3, title: 'Prep meeting notes for tomorrow sprint call', done: false, priority: 'P2', tag: 'Sprint', due: 'Tomorrow' },
    { id: 4, title: 'Export monthly milestone report for stakeholders', done: false, priority: 'P1', tag: 'Ops', due: 'Friday' },
  ])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const [actionAdded, setActionAdded] = useState(false)
  const [selectedProject, setSelectedProject] = useState(0)

  const toggleTask = (id: number) => {
    setDemoTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setDemoTasks(prev => [
      ...prev,
      { id: Date.now(), title: newTaskTitle.trim(), done: false, priority: 'P1', tag: 'New', due: 'Today' }
    ])
    setNewTaskTitle('')
    setShowAddInput(false)
  }

  const handleConvertMeetingAction = () => {
    if (actionAdded) return
    setActionAdded(true)
    setDemoTasks(prev => [
      ...prev,
      { id: Date.now(), title: 'Send revised Figma prototype by Thursday (from Fathom call)', done: false, priority: 'P0', tag: 'Fathom', due: 'Thursday' }
    ])
    setTimeout(() => {
      setActiveTab('tasks')
    }, 450)
  }

  const demoProjects = [
    {
      name: 'Tadbeer Expansion',
      progress: 82,
      initiatives: 9,
      status: 'On Track',
      color: 'bg-emerald-500',
      milestones: ['Market assessment (Done)', 'Vendor terms agreed (Done)', 'Operations rollout (In Progress)']
    },
    {
      name: 'Client Portal Redesign',
      progress: 45,
      initiatives: 4,
      status: 'In Progress',
      color: 'bg-blue-500',
      milestones: ['Design mockups (Done)', 'Auth & invite flow (In Progress)', 'Beta release (Upcoming)']
    },
    {
      name: 'Q4 Infrastructure',
      progress: 95,
      initiatives: 12,
      status: 'Final Polish',
      color: 'bg-purple-500',
      milestones: ['Edge runtime deployment (Done)', 'Live calendar feed (Done)', 'Security check (Passed)']
    }
  ]

  const completedCount = demoTasks.filter(t => t.done).length
  const progressPercent = Math.round((completedCount / (demoTasks.length || 1)) * 100)

  const filteredTasks = demoTasks.filter(t => {
    if (taskFilter === 'active') return !t.done
    if (taskFilter === 'done') return t.done
    return true
  })

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check active session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      }
    })

    // Listen for instant session updates (e.g. email confirmation redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        router.push('/dashboard')
      }
    })

    const authErr = searchParams?.get('auth_error')
    if (authErr) {
      setError(authErr)
      setIsAuthOpen(true)
      setMode('login')
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [router, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        const redirectTo = typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback` 
          : undefined

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: redirectTo,
          },
        })

        if (signUpError) {
          setError(signUpError.message)
        } else if (data.session) {
          router.push('/dashboard')
        } else {
          setConfirmationSent(true)
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (signInError) {
          setError(signInError.message)
        } else if (data.session) {
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const focusAreas = [
    { label: 'Product & Engineering', icon: '◈', desc: 'Manage sprint boards, track releases, and squash bugs with high speed.' },
    { label: 'Agencies & Freelancers', icon: '⬡', desc: 'Organize client deliverables, isolate client workspaces, and stay on schedule.' },
    { label: 'Founders & Small Teams', icon: '△', desc: 'Prioritize daily high-impact tasks, track big goals, and keep everyone aligned.' },
    { label: 'Marketing & Operations', icon: '◇', desc: 'Coordinate launches, run campaigns, and manage recurring workflows.' },
  ]

  const faqs = [
    {
      q: 'Is it free to use?',
      a: 'Yes, you can sign up for free and start organizing projects and tasks immediately. No credit card is required.',
    },
    {
      q: 'How does calendar sync work?',
      a: 'Focus provides you with a private calendar subscription link. With one click, your tasks and upcoming deadlines appear inside Google Calendar, Apple Calendar, or Outlook without needing complicated developer setups.',
    },
    {
      q: 'Can I invite teammates and clients?',
      a: 'Yes! You can create multiple workspaces and invite colleagues or clients. Each workspace is private, so members only see the projects and tasks within their assigned workspace.',
    },
    {
      q: 'How does the Fathom meeting integration work?',
      a: 'If you record calls with Fathom, you can link your Fathom key or webhook in Settings. Your call recordings, full transcripts, and takeaways will automatically appear inside your workspace so you can convert them to tasks.',
    },
    {
      q: 'Can I export my tasks and reports?',
      a: 'Yes. You can export your tasks to a CSV file for Excel or Google Sheets at any time, or generate a clean visual progress summary image to share with your team.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0c0d0f] font-sans selection:bg-black/10 relative overflow-hidden">
      {/* Soft Ambient Glow Effects */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-tr from-neutral-200/40 via-neutral-100/20 to-neutral-200/30 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Top Floating Clean Navigation */}
      <nav className="fixed top-5 left-0 right-0 z-40 max-w-5xl mx-auto px-6">
        <div className="bg-white/90 backdrop-blur-xl border border-black/[0.08] shadow-xs rounded-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium tracking-tight text-sm text-black">Focus</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-light text-[#6b7280]">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-black transition-colors">How Teams Use It</a>
            <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setMode('login'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="px-4 py-1.5 text-xs text-black hover:opacity-75 transition-opacity cursor-pointer font-light"
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-normal transition-all shadow-xs cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6 sm:px-10 max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 border border-black/[0.06] text-xs text-[#52525b]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Simple, calm project management</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-black leading-[1.15]">
              Everything your team works on, <br />
              <span className="font-semibold text-black">
                all in one place.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#6b7280] font-light leading-relaxed max-w-xl">
              Organize projects, plan daily tasks, review meeting notes, and sync your calendar — without bouncing between five different tabs.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
                className="px-6 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-normal shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight size={13} />
              </button>
              <a
                href="#features"
                className="px-5 py-3 rounded-full bg-white hover:bg-neutral-50 border border-black/[0.1] text-black text-xs font-normal transition-all"
              >
                See Features ↓
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-3 text-xs text-[#71717a] font-light">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Free to use</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>No credit card required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Ready in 30 seconds</span>
              </span>
            </div>
          </div>

          {/* Right Interactive Functional Dashboard */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white border border-black/[0.08] shadow-xl shadow-black/[0.02] space-y-4 hover:border-black/[0.15] transition-all duration-300 relative group">
            {/* Ambient subtle card glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neutral-200/50 to-neutral-100/30 rounded-3xl blur-sm -z-10 opacity-70 group-hover:opacity-100 transition-opacity" />

            {/* Top Workspace Bar & Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-medium text-xs shadow-2xs">
                  AC
                </div>
                <div>
                  <div className="text-xs font-medium text-black">Acme Studio</div>
                  <div className="text-[10px] text-[#8a8d95] font-light">Live Interactive Workspace</div>
                </div>
              </div>

              {/* Functional Tab Switcher */}
              <div className="flex items-center bg-[#f4f4f5] p-0.5 rounded-xl border border-black/[0.04] text-[11px]">
                {[
                  { id: 'tasks', label: 'Tasks' },
                  { id: 'projects', label: 'Projects' },
                  { id: 'meetings', label: 'Meetings' },
                  { id: 'calendar', label: 'Calendar' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as any)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer font-normal',
                      activeTab === t.id
                        ? 'bg-white text-black shadow-xs font-medium'
                        : 'text-[#71717a] hover:text-black'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: INTERACTIVE TASKS */}
            {activeTab === 'tasks' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                {/* Progress bar header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#71717a] font-light">
                      Sprint Progress: <strong className="text-black font-medium">{completedCount} of {demoTasks.length} done</strong>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700 font-medium">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f4f4f5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Filter Pills & Add Task Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {(['all', 'active', 'done'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setTaskFilter(f)}
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] capitalize transition-colors cursor-pointer',
                          taskFilter === f
                            ? 'bg-black text-white font-normal'
                            : 'bg-black/[0.03] text-[#71717a] hover:text-black hover:bg-black/[0.06]'
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddInput(!showAddInput)}
                    className="text-[11px] text-black hover:opacity-75 flex items-center gap-1 cursor-pointer font-normal"
                  >
                    <Plus size={12} />
                    <span>{showAddInput ? 'Cancel' : 'Add Task'}</span>
                  </button>
                </div>

                {/* Inline Quick Add Form */}
                {showAddInput && (
                  <form onSubmit={handleAddQuickTask} className="flex items-center gap-2 p-1.5 bg-[#fafafa] border border-black/[0.08] rounded-xl animate-in fade-in duration-150">
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="e.g. Schedule design sprint review"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs text-black bg-transparent outline-none font-light"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-black text-white rounded-lg text-xs font-normal hover:bg-neutral-800 transition-colors shadow-2xs"
                    >
                      Add
                    </button>
                  </form>
                )}

                {/* Task Items List */}
                <div className="space-y-1.5 min-h-[160px]">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        'group p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer select-none',
                        task.done
                          ? 'bg-[#fafafa] border-black/[0.04] opacity-75'
                          : 'bg-white border-black/[0.07] hover:border-black/[0.2] hover:shadow-2xs'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {/* Interactive Checkbox with Spring Effect */}
                        <div
                          className={cn(
                            'w-4 h-4 rounded-md flex items-center justify-center transition-all duration-200 shrink-0 text-[10px]',
                            task.done
                              ? 'bg-emerald-500 text-white shadow-2xs scale-100'
                              : 'border border-black/[0.25] group-hover:border-black'
                          )}
                        >
                          {task.done && <Check size={11} strokeWidth={3} />}
                        </div>

                        <span
                          className={cn(
                            'text-xs transition-all duration-200 truncate',
                            task.done
                              ? 'text-[#9ca3af] line-through font-light'
                              : 'text-black font-normal'
                          )}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded font-mono',
                            task.priority === 'P0' ? 'bg-red-50 text-red-700 font-medium' :
                            task.priority === 'P1' ? 'bg-amber-50 text-amber-700' :
                            'bg-black/[0.04] text-[#71717a]'
                          )}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[#8a8d95] hidden sm:inline">{task.due}</span>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-xs text-[#9ca3af] font-light">
                      No tasks in this view
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE PROJECTS */}
            {activeTab === 'projects' && (
              <div className="space-y-2.5 animate-in fade-in duration-200 min-h-[220px]">
                <div className="text-[11px] text-[#71717a] font-light">
                  Click a project to view active milestone details:
                </div>
                {demoProjects.map((proj, idx) => {
                  const isSelected = selectedProject === idx
                  return (
                    <div
                      key={proj.name}
                      onClick={() => setSelectedProject(idx)}
                      className={cn(
                        'p-3 rounded-2xl border transition-all duration-200 cursor-pointer',
                        isSelected
                          ? 'bg-neutral-50/80 border-black shadow-xs'
                          : 'bg-white border-black/[0.06] hover:border-black/[0.15]'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', proj.color)} />
                          <span className="text-xs font-medium text-black">{proj.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#71717a] bg-black/[0.03] px-2 py-0.5 rounded">
                          {proj.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-[#71717a]">
                          <span>{proj.initiatives} Initiatives</span>
                          <span className="font-mono font-medium text-black">{proj.progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-black/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-black rounded-full transition-all duration-300"
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-black/[0.06] space-y-1 text-[11px] text-[#6b7280] font-light">
                          {proj.milestones.map((m, mIdx) => (
                            <div key={mIdx} className="flex items-center gap-1.5">
                              <span className="text-[9px] text-emerald-600">●</span>
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* TAB 3: INTERACTIVE MEETINGS (FATHOM SYNC) */}
            {activeTab === 'meetings' && (
              <div className="space-y-3 animate-in fade-in duration-200 min-h-[220px]">
                <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center">
                        <Video size={12} />
                      </div>
                      <span className="text-xs font-medium text-black">Client Sync with Alex</span>
                    </div>
                    <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                      38 mins • Fathom
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-black/[0.06] rounded-xl space-y-1.5 text-xs text-[#52525b]">
                    <div className="text-[10px] font-medium text-[#71717a] uppercase">Key Decisions &amp; Next Steps:</div>
                    <p className="text-[11px] font-light leading-relaxed">
                      &bull; Agreed to finalize pricing proposal by Wednesday.<br />
                      &bull; Need to deliver the revised Figma prototype before Thursday demo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConvertMeetingAction}
                    disabled={actionAdded}
                    className={cn(
                      'w-full py-2 rounded-xl text-xs font-normal transition-all cursor-pointer flex items-center justify-center gap-1.5',
                      actionAdded
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-black hover:bg-neutral-800 text-white shadow-2xs'
                    )}
                  >
                    {actionAdded ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span>Takeaway Added to Tasks!</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} />
                        <span>+ Convert Takeaway to Task</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: INTERACTIVE CALENDAR */}
            {activeTab === 'calendar' && (
              <div className="space-y-2.5 animate-in fade-in duration-200 min-h-[220px]">
                <div className="flex items-center justify-between text-xs text-[#71717a] font-light">
                  <span>This Week&apos;s Schedule</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live Feed Active
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, dIdx) => (
                    <div
                      key={day}
                      className={cn(
                        'p-2 rounded-xl border text-xs transition-colors',
                        dIdx === 1 ? 'bg-black text-white border-black font-medium shadow-2xs' : 'bg-[#fafafa] border-black/[0.05] text-[#71717a]'
                      )}
                    >
                      <div className="text-[10px] uppercase font-mono">{day}</div>
                      <div className="text-sm font-light mt-0.5">{14 + dIdx}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="p-2 bg-[#f8f9fc] border border-black/[0.06] rounded-xl flex items-center justify-between text-xs">
                    <span className="text-black font-normal">Sprint Standup</span>
                    <span className="text-[10px] text-[#71717a] font-mono">10:00 AM</span>
                  </div>
                  <div className="p-2 bg-[#f8f9fc] border border-black/[0.06] rounded-xl flex items-center justify-between text-xs">
                    <span className="text-black font-normal">Review Onboarding Feedback</span>
                    <span className="text-[10px] text-red-600 font-mono font-medium">2:30 PM (P0)</span>
                  </div>
                  <div className="p-2 bg-[#f8f9fc] border border-black/[0.06] rounded-xl flex items-center justify-between text-xs">
                    <span className="text-black font-normal">Client Progress Walkthrough</span>
                    <span className="text-[10px] text-[#71717a] font-mono">4:00 PM</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Live System Indicator Strip */}
            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-[#71717a] font-light">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-black" />
                <span>Google Calendar Synced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Video size={12} className="text-black" />
                <span>Fathom Notes Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20 px-6 sm:px-10 max-w-6xl mx-auto border-t border-black/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <div className="text-xs font-mono text-[#8a8d95] uppercase tracking-widest">
            FEATURES
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight">
            Everything you need to get work done.
          </h2>
          <p className="text-xs sm:text-sm text-[#6b7280] font-light">
            Simple, fast, and organized so you can focus on building and delivering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Projects & Milestones */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <FolderKanban size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Projects &amp; Milestones</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Group related tasks into clear projects, track progress towards deadlines, and know who is working on what.
            </p>
          </div>

          {/* Card 2: Simple Task Boards */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <CheckSquare size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Simple Task Boards</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Drag-and-drop kanban boards and clean list views. Set priority tags from P0 to P3 so you always know what comes next.
            </p>
          </div>

          {/* Card 3: Meeting Notes & Transcripts */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <Video size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Meeting Notes &amp; Transcripts</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Connect Fathom to automatically import call recordings, full transcripts, and key action items directly into your workspace.
            </p>
          </div>

          {/* Card 4: Calendar Sync */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <Calendar size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Live Calendar Sync</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Subscribe with one click in Google Calendar, Apple Calendar, or Outlook. Your tasks and deadlines appear automatically on your calendar.
            </p>
          </div>

          {/* Card 5: Team & Client Workspaces */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <Building2 size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Workspaces &amp; Team Roles</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Create separate workspaces for different companies or clients. Invite teammates with clear roles like Admin, Member, or Viewer.
            </p>
          </div>

          {/* Card 6: Exports & Sharing */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <ExternalLink size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Exports &amp; Progress Sharing</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Export your task lists to CSV for spreadsheets anytime, or download clean visual progress cards to share with stakeholders.
            </p>
          </div>
        </div>
      </section>

      {/* Focus Area / How Teams Use It */}
      <section id="how-it-works" className="py-20 px-6 sm:px-10 max-w-4xl mx-auto text-center border-t border-black/[0.06]">
        <div className="text-xs font-mono text-[#8a8d95] uppercase tracking-widest mb-2">
          HOW TEAMS USE IT
        </div>
        <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight mb-8">
          Built for how modern teams work.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8 text-left">
          {focusAreas.map((f) => {
            const isSelected = selectedFocus === f.label
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => setSelectedFocus(f.label)}
                className={cn(
                  'p-5 rounded-2xl border text-left transition-all duration-150 cursor-pointer shadow-xs',
                  isSelected 
                    ? 'border-black bg-black text-white' 
                    : 'border-black/[0.08] bg-white hover:border-black/[0.2] text-black'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-mono opacity-70">{f.icon}</span>
                    <span className="text-xs font-normal">{f.label}</span>
                  </div>
                  {isSelected ? <Check size={14} /> : <ChevronRight size={14} className="opacity-30" />}
                </div>
                <p className={cn("text-[11px] font-light leading-relaxed", isSelected ? "text-neutral-300" : "text-[#6b7280]")}>
                  {f.desc}
                </p>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
          className="px-8 py-3 rounded-full bg-black text-white text-xs font-normal hover:bg-neutral-800 shadow-sm transition-all cursor-pointer"
        >
          Open Your Workspace →
        </button>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 sm:px-10 max-w-3xl mx-auto border-t border-black/[0.06]">
        <div className="text-center mb-12 space-y-2">
          <div className="text-xs font-mono text-[#8a8d95] uppercase tracking-widest">
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="text-3xl font-light text-black tracking-tight">
            Common questions answered.
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx
            return (
              <div key={idx} className="border border-black/[0.08] rounded-2xl overflow-hidden bg-white">
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left text-xs sm:text-sm font-normal text-black cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={14} className={cn("text-[#8a8d95] transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-[#6b7280] font-light leading-relaxed border-t border-black/[0.04] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-black/[0.06] text-center space-y-3 text-xs text-[#8a8d95] font-light">
        <div className="flex items-center justify-center gap-2 text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>All systems running smoothly</span>
        </div>
        <div className="text-[11px]">
          &copy; {new Date().getFullYear()} Focus. Simple, fast project management for modern teams.
        </div>
      </footer>

      {/* Authentication Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-black/[0.1] rounded-3xl p-7 sm:p-8 max-w-md w-full text-black shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-[#8a8d95] hover:text-black rounded-xl hover:bg-black/[0.05] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {confirmationSent ? (
              /* Email Confirmation Sent Screen */
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                  <Mail size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-normal text-black">Check your email</h3>
                  <p className="text-xs text-[#6b7280] font-light leading-relaxed">
                    We sent a sign-in link to <strong className="text-black font-medium">{email}</strong>.
                  </p>
                </div>

                <div className="p-3 bg-[#fafafa] border border-black/[0.06] rounded-xl text-xs text-[#6b7280] font-light">
                  Click the link in your email to open your new workspace instantly.
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Open Gmail ↗</span>
                    <ExternalLink size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setConfirmationSent(false)}
                    className="text-xs text-[#8a8d95] hover:text-black transition-colors pt-1"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              /* Login & Sign Up Form */
              <>
                <div className="text-center mb-6 space-y-1">
                  <div className="w-10 h-10 rounded-2xl bg-black text-white font-medium text-xs flex items-center justify-center mx-auto mb-3 shadow-xs">
                    FC
                  </div>
                  <h3 className="text-lg font-normal text-black">
                    {mode === 'login' ? 'Sign in to Focus' : 'Create your free workspace'}
                  </h3>
                  <p className="text-xs text-[#6b7280] font-light">
                    {mode === 'login' ? 'Access your projects, tasks, and notes.' : 'Takes less than 30 seconds.'}
                  </p>
                </div>

                {error && (
                  <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed font-light">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {mode === 'signup' && (
                    <div>
                      <label className="text-xs font-medium text-[#4b5563] block mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full px-3.5 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-[#4b5563] block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full px-3.5 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#4b5563] block mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-normal text-xs rounded-xl shadow-xs transition-all cursor-pointer mt-1 flex items-center justify-center gap-2"
                  >
                    {loading && <RefreshCw size={12} className="animate-spin" />}
                    <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In →' : 'Create Free Workspace →'}</span>
                  </button>
                </form>

                <div className="text-center mt-5 pt-4 border-t border-black/[0.06]">
                  <button
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
                    className="text-xs text-[#6b7280] hover:text-black transition-colors cursor-pointer font-light"
                  >
                    {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
