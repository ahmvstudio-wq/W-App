'use client'

export const runtime = 'edge'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowRight, Check, CheckSquare, Video, ExternalLink, 
  ChevronDown, Plus, Zap, Camera, Sparkles, RefreshCw, X, Mail
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
  const [selectedFocus, setSelectedFocus] = useState<string>('Creators & Digital Studios')
  
  // Interactive Dashboard Preview State
  const [activeTab, setActiveTab] = useState<'tasks' | 'meetings' | 'youtube' | 'instagram' | 'chatgpt'>('tasks')
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'done'>('all')
  const [demoTasks, setDemoTasks] = useState([
    { id: 1, title: 'Finalize brand partnership proposal', done: true, priority: 'P1', due: 'Done' },
    { id: 2, title: 'Upload YouTube Long-form: 1-Person Business Stack', done: false, priority: 'P0', due: '4:00 PM' },
    { id: 3, title: 'Schedule Instagram Reel: Studio editing flow', done: false, priority: 'P0', due: '6:15 PM' },
    { id: 4, title: 'Review Fathom takeaways from sponsor call', done: false, priority: 'P2', due: 'Tomorrow' },
    { id: 5, title: 'Stage thumbnail variations for weekend drop', done: false, priority: 'P1', due: 'Thursday' },
  ])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const [actionAdded, setActionAdded] = useState(false)
  const [chatGptSynced, setChatGptSynced] = useState(false)
  const [gptPromptActive, setGptPromptActive] = useState(false)

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      }
    })

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

  const toggleTask = (id: number) => {
    setDemoTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setDemoTasks(prev => [
      ...prev,
      { id: Date.now(), title: newTaskTitle.trim(), done: false, priority: 'P1', due: 'Today' }
    ])
    setNewTaskTitle('')
    setShowAddInput(false)
  }

  const handleConvertMeetingAction = () => {
    if (actionAdded) return
    setActionAdded(true)
    setDemoTasks(prev => [
      ...prev,
      { id: Date.now(), title: 'Deliver revised color grade before Thursday noon (from Fathom call)', done: false, priority: 'P0', due: 'Thursday' }
    ])
    setTimeout(() => {
      setActiveTab('tasks')
    }, 400)
  }

  const handleSimulateChatGpt = () => {
    if (gptPromptActive) return
    setGptPromptActive(true)
    setTimeout(() => {
      setChatGptSynced(true)
      setDemoTasks(prev => [
        { id: Date.now(), title: 'Draft YouTube script: "Solo Creator Stack" (from ChatGPT)', done: false, priority: 'P0', due: 'Today' },
        ...prev
      ])
      setGptPromptActive(false)
    }, 800)
  }

  const focusAreas = [
    { label: 'Creators & Digital Studios', icon: '◈', desc: 'Stage YouTube & Instagram pipelines, track sponsor deliverables, and schedule releases without chaos.' },
    { label: 'Solo Founders & Builders', icon: '△', desc: 'Fast task tracking, direct calendar integration, and zero corporate bloat.' },
    { label: 'Boutique Agencies & Operators', icon: '⬡', desc: 'Isolate client workspaces, turn meeting calls into action items, and keep projects on schedule.' },
    { label: 'Agile Teams', icon: '◇', desc: 'Eliminate useless status check-ins and let everyone focus on what actually moves the needle.' },
  ]

  const faqs = [
    {
      q: 'Why is Focus different from tools like Jira or Asana?',
      a: 'Legacy tools were built for enterprise middle managers with endless ticket fields and status meetings. Focus is built for creators, studios, and solo builders. It connects your tasks, your meetings, and your calendar in one calm, fast screen.',
    },
    {
      q: 'What creator features are coming soon?',
      a: 'We are currently developing dedicated YouTube analytics tracking (CTR, views, retention pacing), automated Instagram feed staging & scheduling, and direct life-context sync with ChatGPT to auto-structure your week.',
    },
    {
      q: 'How does the Fathom meeting integration work?',
      a: 'When you finish a call recorded on Fathom, your transcript and AI action items sync into Focus. With one click, you turn call takeaways into assigned, scheduled tasks.',
    },
    {
      q: 'Can I sync my tasks with Google Calendar and Apple Calendar?',
      a: 'Yes. Focus gives you a private calendar subscription URL. Your deadlines and scheduled items show up automatically in Google Calendar, Apple Calendar, or Outlook.',
    },
    {
      q: 'Is it completely free to get started?',
      a: 'Yes, 100% free. Create your workspace in 30 seconds with no credit card required.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0c0d0f] font-sans selection:bg-black/10 relative overflow-hidden">
      {/* Subtle Apple-Grade Glow Backlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-neutral-200/50 via-neutral-100/30 to-transparent blur-3xl rounded-full pointer-events-none -z-10 animate-ambient" />

      {/* Spacious, Minimal Floating Navbar */}
      <nav className="fixed top-5 left-0 right-0 z-40 max-w-5xl mx-auto px-6">
        <div className="bg-white/85 backdrop-blur-xl border border-black/[0.08] shadow-sm shadow-black/[0.02] rounded-full px-6 py-3.5 flex items-center justify-between transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-black text-white flex items-center justify-center font-semibold text-xs shadow-xs">
              F
            </div>
            <span className="font-semibold tracking-tight text-sm text-black">Focus</span>
            <span className="text-[11px] text-neutral-400 font-mono tracking-tight hidden sm:inline">by AHMV Systems</span>
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-normal text-neutral-500">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-black transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setMode('login'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="px-3.5 py-1.5 text-xs text-neutral-600 hover:text-black transition-colors cursor-pointer font-normal"
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-normal transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section: Punchy 1-2 Liner, Short Description, Apple-Minimal */}
      <section className="pt-36 pb-20 px-6 sm:px-10 max-w-5xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 text-xs text-neutral-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-black">Focus by AHMV Systems</span>
              <span className="text-neutral-300">•</span>
              <span>Solo Creators &amp; Builders</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-black leading-[1.08]">
              Run your entire business <br className="hidden sm:inline" />
              <span className="font-semibold text-black">in one calm flow.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#52525b] font-light leading-relaxed max-w-md">
              Unify your daily tasks, calendar, client meetings, and upcoming creator pipelines in one distraction-free workspace.
            </p>

            {/* Gen Z Free Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100/90 border border-neutral-200 text-xs text-neutral-700 font-light">
              <span className="font-mono text-emerald-700 font-semibold">$0 Free</span>
              <span className="text-neutral-300">•</span>
              <span>You don&apos;t need to pay, lil bro.</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
                className="px-6 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium shadow-sm transition-all cursor-pointer flex items-center gap-2 group"
              >
                <span>Launch Free Workspace</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="#features"
                className="px-5 py-3 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-black/[0.08] text-black text-xs font-normal transition-all"
              >
                Explore Features ↓
              </a>
            </div>
          </div>

          {/* Right Interactive Dashboard Preview with Apple Motion Graphics */}
          <div className="lg:col-span-6 relative">
            {/* Motion Badge 1: YouTube Drops (Floating Top-Right) */}
            <div className="absolute -top-3.5 -right-2 sm:-right-4 z-30 bg-white/95 backdrop-blur-xl border border-black/[0.08] shadow-lg shadow-black/[0.04] rounded-2xl px-3.5 py-2 flex items-center gap-2.5 text-xs animate-float select-none">
              <div className="w-5 h-5 rounded-lg bg-red-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                ▶
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-black text-[11px] leading-tight">YouTube Pipeline</span>
                <span className="text-[9px] text-neutral-400 font-mono">Coming Soon</span>
              </div>
            </div>

            {/* Motion Badge 2: ChatGPT Life Context (Floating Bottom-Left) */}
            <div className="absolute -bottom-3.5 -left-2 sm:-left-4 z-30 bg-white/95 backdrop-blur-xl border border-black/[0.08] shadow-lg shadow-black/[0.04] rounded-2xl px-3.5 py-2 flex items-center gap-2.5 text-xs animate-float-delayed select-none">
              <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] text-white shadow-xs">
                ⚡
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-black text-[11px] leading-tight">ChatGPT Life Context</span>
                <span className="text-[9px] text-neutral-400 font-mono">Coming Soon</span>
              </div>
            </div>

            {/* Main Interactive Glass Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-black/[0.08] shadow-xl shadow-black/[0.03] space-y-4 relative overflow-hidden">
              {/* Subtle ambient backlight */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-100/30 via-neutral-100/30 to-blue-100/30 rounded-3xl blur-lg -z-10 pointer-events-none animate-ambient" />

              {/* Workspace Header & Tab Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] gap-2 overflow-x-auto">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center font-semibold text-[10px]">
                    F
                  </div>
                  <span className="text-xs font-medium text-black">Focus Studio</span>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center bg-neutral-100 p-1 rounded-xl text-[11px] shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('tasks')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                      activeTab === 'tasks' ? 'bg-white text-black shadow-xs font-medium' : 'text-neutral-500 hover:text-black font-light'
                    )}
                  >
                    Tasks
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('meetings')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap',
                      activeTab === 'meetings' ? 'bg-white text-black shadow-xs font-medium' : 'text-neutral-500 hover:text-black font-light'
                    )}
                  >
                    Meetings
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('youtube')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1',
                      activeTab === 'youtube' ? 'bg-white text-black shadow-xs font-medium' : 'text-neutral-500 hover:text-black font-light'
                    )}
                  >
                    <span>YouTube</span>
                    <span className="text-[8px] font-mono bg-neutral-200/80 text-neutral-600 px-1 py-0.2 rounded">Soon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('instagram')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1',
                      activeTab === 'instagram' ? 'bg-white text-black shadow-xs font-medium' : 'text-neutral-500 hover:text-black font-light'
                    )}
                  >
                    <span>Instagram</span>
                    <span className="text-[8px] font-mono bg-neutral-200/80 text-neutral-600 px-1 py-0.2 rounded">Soon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('chatgpt')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1',
                      activeTab === 'chatgpt' ? 'bg-white text-black shadow-xs font-medium' : 'text-neutral-500 hover:text-black font-light'
                    )}
                  >
                    <span>ChatGPT</span>
                    <span className="text-[8px] font-mono bg-neutral-200/80 text-neutral-600 px-1 py-0.2 rounded">Soon</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: INTERACTIVE TASKS */}
              {activeTab === 'tasks' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {/* Sprint Velocity bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 font-light">
                        Daily Sprint: <strong className="text-black font-medium">{completedCount} of {demoTasks.length} done</strong>
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 font-medium">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Filter Pills & Add Task Toggle */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1">
                      {(['all', 'active', 'done'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setTaskFilter(f)}
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] capitalize transition-colors cursor-pointer',
                            taskFilter === f
                              ? 'bg-black text-white font-normal'
                              : 'bg-neutral-100 text-neutral-600 hover:text-black'
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
                      <span>{showAddInput ? 'Cancel' : 'Quick Add'}</span>
                    </button>
                  </div>

                  {/* Inline Quick Add Form */}
                  {showAddInput && (
                    <form onSubmit={handleAddQuickTask} className="flex items-center gap-2 p-1.5 bg-neutral-50 border border-black/[0.08] rounded-xl animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        required
                        placeholder="e.g. Stage thumbnail variation on YouTube"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs text-black bg-transparent outline-none font-light"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-black text-white rounded-lg text-xs font-normal hover:bg-neutral-800 transition-colors"
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
                          'p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer select-none',
                          task.done
                            ? 'bg-neutral-50/60 border-black/[0.04] opacity-70'
                            : 'bg-white border-black/[0.07] hover:border-black/[0.2]'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={cn(
                              'w-4 h-4 rounded-md flex items-center justify-center transition-all shrink-0 text-[10px]',
                              task.done
                                ? 'bg-emerald-500 text-white'
                                : 'border border-black/[0.25]'
                            )}
                          >
                            {task.done && <Check size={11} strokeWidth={3} />}
                          </div>

                          <span
                            className={cn(
                              'text-xs transition-all truncate',
                              task.done
                                ? 'text-neutral-400 line-through font-light'
                                : 'text-black font-normal'
                            )}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded font-mono text-[9px]',
                              task.priority === 'P0' ? 'bg-red-50 text-red-700 font-medium' :
                              task.priority === 'P1' ? 'bg-amber-50 text-amber-700' :
                              'bg-neutral-100 text-neutral-600'
                            )}
                          >
                            {task.priority}
                          </span>
                          <span className="text-neutral-400 hidden sm:inline">{task.due}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE MEETINGS (FATHOM) */}
              {activeTab === 'meetings' && (
                <div className="space-y-3 animate-in fade-in duration-200 min-h-[160px]">
                  <div className="p-3.5 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center">
                          <Video size={12} />
                        </div>
                        <span className="text-xs font-medium text-black">Sponsor Call: Sony Alpha Campaign</span>
                      </div>
                      <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                        32 mins • Fathom
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 font-light leading-relaxed">
                      Key Takeaway: Sponsor approved 60s mid-roll integration in upcoming Thursday video. Final cut due Thursday noon.
                    </p>

                    <button
                      type="button"
                      onClick={handleConvertMeetingAction}
                      disabled={actionAdded}
                      className={cn(
                        'w-full py-2 rounded-xl text-xs font-normal transition-all cursor-pointer flex items-center justify-center gap-1.5',
                        actionAdded
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-black hover:bg-neutral-800 text-white'
                      )}
                    >
                      {actionAdded ? (
                        <>
                          <Check size={13} className="text-emerald-600" />
                          <span>Action Item Converted to Task!</span>
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>Convert Takeaway to Task →</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: MINIMAL YOUTUBE PREVIEW (COMING SOON) */}
              {activeTab === 'youtube' && (
                <div className="space-y-3 animate-in fade-in duration-200 min-h-[160px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center text-[8px] font-bold">
                        ▶
                      </div>
                      <span className="text-xs font-medium text-black">YouTube Studio Pipeline</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                      Coming Soon
                    </span>
                  </div>

                  {/* 3 Clean Metric Tiles */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-neutral-50 rounded-xl border border-black/[0.05]">
                      <div className="text-[10px] text-neutral-400 font-mono">Views</div>
                      <div className="text-xs font-semibold text-black mt-0.5">48.2k</div>
                    </div>
                    <div className="p-2 bg-neutral-50 rounded-xl border border-black/[0.05]">
                      <div className="text-[10px] text-neutral-400 font-mono">Avg CTR</div>
                      <div className="text-xs font-semibold text-emerald-600 mt-0.5">11.4%</div>
                    </div>
                    <div className="p-2 bg-neutral-50 rounded-xl border border-black/[0.05]">
                      <div className="text-[10px] text-neutral-400 font-mono">Retention</div>
                      <div className="text-xs font-semibold text-purple-600 mt-0.5">62% APV</div>
                    </div>
                  </div>

                  {/* Queued Video Row */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-black/[0.05] flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-black">How I Run a 1-Person Business (Full Stack)</div>
                      <div className="text-[10px] text-neutral-400">Scheduled for Friday • 10:00 AM EST</div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Ready
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 4: MINIMAL INSTAGRAM PREVIEW (COMING SOON) */}
              {activeTab === 'instagram' && (
                <div className="space-y-3 animate-in fade-in duration-200 min-h-[160px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera size={14} className="text-purple-600" />
                      <span className="text-xs font-medium text-black">Instagram Visual Planner</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                      Coming Soon
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-neutral-50 border border-black/[0.05] space-y-1">
                      <span className="text-[9px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">Reel 9:16</span>
                      <div className="text-xs font-medium text-black truncate">Studio BTS Flow</div>
                      <div className="text-[10px] text-neutral-400">Today • 6:15 PM</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-50 border border-black/[0.05] space-y-1">
                      <span className="text-[9px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Carousel</span>
                      <div className="text-xs font-medium text-black truncate">5 Rules for Solos</div>
                      <div className="text-[10px] text-neutral-400">Thu • 12:00 PM</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-50 border border-black/[0.05] space-y-1">
                      <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Story</span>
                      <div className="text-xs font-medium text-black truncate">Desk Gear Tour</div>
                      <div className="text-[10px] text-neutral-400">Sat • 10:30 AM</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: MINIMAL CHATGPT PREVIEW (COMING SOON) */}
              {activeTab === 'chatgpt' && (
                <div className="space-y-3 animate-in fade-in duration-200 min-h-[160px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span className="text-xs font-medium text-black">ChatGPT Life Context Sync</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                      Coming Soon
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 border border-black/[0.05] space-y-2">
                    <p className="text-xs text-neutral-600 font-light leading-relaxed">
                      &ldquo;Shoot YouTube video Tuesday, sponsor cut due Thursday, launch Friday morning.&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={handleSimulateChatGpt}
                      disabled={chatGptSynced}
                      className="w-full py-2 rounded-xl text-xs bg-black text-white hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5"
                    >
                      {gptPromptActive ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          <span>Structuring Tasks...</span>
                        </>
                      ) : chatGptSynced ? (
                        <>
                          <Check size={12} />
                          <span>Context Synced to Tasks!</span>
                        </>
                      ) : (
                        <>
                          <Zap size={12} />
                          <span>Simulate Context Sync →</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: THE 3 CORE PILLARS (Clean Apple 3-Card Grid) */}
      <section id="features" className="py-20 px-6 sm:px-10 max-w-5xl mx-auto border-t border-black/[0.06]">
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <div className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
            FEATURES
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight">
            Everything you need to execute.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-light">
            Simple, fast, and organized so you can focus on building and delivering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Tasks & Calendar */}
          <div className="p-6 rounded-3xl bg-neutral-50/70 border border-black/[0.06] space-y-3 hover:border-black/[0.15] transition-all">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
              <CheckSquare size={16} />
            </div>
            <h3 className="text-base font-normal text-black">Fast Tasks &amp; Calendar</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Drag-and-drop boards, priority tags from P0 to P3, and 1-click live sync to Google and Apple Calendar.
            </p>
          </div>

          {/* Card 2: Fathom Meeting Takeaways */}
          <div className="p-6 rounded-3xl bg-neutral-50/70 border border-black/[0.06] space-y-3 hover:border-black/[0.15] transition-all">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
              <Video size={16} />
            </div>
            <h3 className="text-base font-normal text-black">Meeting Notes &amp; Sync</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Connect Fathom to automatically import call recordings and transcripts. Turn takeaways into tasks in 1 click.
            </p>
          </div>

          {/* Card 3: Creator Pipelines (Coming Soon) */}
          <div className="p-6 rounded-3xl bg-neutral-50/70 border border-black/[0.06] space-y-3 hover:border-black/[0.15] transition-all relative">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-200/70 text-neutral-600">
                Coming Soon
              </span>
            </div>
            <h3 className="text-base font-normal text-black">Creator Pipelines</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Dedicated YouTube retention analytics, visual Instagram feed staging, and ChatGPT natural language life-context structuring.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW TEAMS & CREATORS USE IT */}
      <section id="how-it-works" className="py-20 px-6 sm:px-10 max-w-4xl mx-auto text-center border-t border-black/[0.06]">
        <div className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-2">
          HOW IT WORKS
        </div>
        <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight mb-8">
          Built for how modern creators work.
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
                  'p-5 rounded-2xl border text-left transition-all duration-150 cursor-pointer',
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
                  {isSelected && <Check size={14} />}
                </div>
                <p className={cn("text-[11px] font-light leading-relaxed", isSelected ? "text-neutral-300" : "text-neutral-500")}>
                  {f.desc}
                </p>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
          className="px-7 py-3 rounded-full bg-black text-white text-xs font-normal hover:bg-neutral-800 transition-all cursor-pointer"
        >
          Open Your Workspace →
        </button>
      </section>

      {/* SECTION 3: FAQ */}
      <section id="faq" className="py-20 px-6 sm:px-10 max-w-3xl mx-auto border-t border-black/[0.06]">
        <div className="text-center mb-10 space-y-2">
          <div className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
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
                  <ChevronDown size={14} className={cn("text-neutral-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-neutral-500 font-light leading-relaxed border-t border-black/[0.04] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 px-6 border-t border-black/[0.06] text-center space-y-2 text-xs text-neutral-400 font-light">
        <div className="flex items-center justify-center gap-2 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>All systems operational</span>
        </div>
        <div className="text-[11px]">
          &copy; {new Date().getFullYear()} Focus by AHMV Systems. Built for solo entrepreneurs, creators, and lean teams who ship.
        </div>
      </footer>

      {/* Authentication Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-black/[0.1] rounded-3xl p-7 sm:p-8 max-w-md w-full text-black shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-black rounded-xl hover:bg-black/[0.05] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {confirmationSent ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                  <Mail size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-normal text-black">Check your email</h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">
                    We sent a sign-in link to <strong className="text-black font-medium">{email}</strong>.
                  </p>
                </div>

                <div className="p-3 bg-neutral-50 border border-black/[0.06] rounded-xl text-xs text-neutral-500 font-light">
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
                    className="text-xs text-neutral-400 hover:text-black transition-colors pt-1"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6 space-y-1">
                  <div className="w-10 h-10 rounded-2xl bg-black text-white font-semibold text-xs flex items-center justify-center mx-auto mb-3 shadow-xs">
                    F
                  </div>
                  <h3 className="text-lg font-normal text-black">
                    {mode === 'login' ? 'Sign in to Focus by AHMV Systems' : 'Create your free workspace'}
                  </h3>
                  <p className="text-xs text-neutral-500 font-light">
                    {mode === 'login' ? 'Access your projects, tasks, and notes.' : 'Takes less than 30 seconds. No credit card required.'}
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
                      <label className="text-xs font-medium text-neutral-600 block mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-neutral-600 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@studio.com"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-600 block mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
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
                    className="text-xs text-neutral-500 hover:text-black transition-colors cursor-pointer font-light"
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
