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
  FolderKanban, ChevronDown, Check, RefreshCw, Plus, Filter, Play, Layers,
  MessageSquare, Zap, Camera, Share2, Sparkles, Copy, Flame
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
  const [activeTab, setActiveTab] = useState<'tasks' | 'youtube' | 'instagram' | 'chatgpt' | 'meetings'>('tasks')
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'done'>('all')
  const [demoTasks, setDemoTasks] = useState([
    { id: 1, title: 'Finalize brand partnership proposal', done: true, priority: 'P1', tag: 'Sponsor', due: 'Done' },
    { id: 2, title: 'Upload YouTube Long-form: 1-Person Business Stack', done: false, priority: 'P0', tag: 'YouTube', due: '4:00 PM' },
    { id: 3, title: 'Schedule Instagram Reel: Studio BTS editing workflow', done: false, priority: 'P0', tag: 'Social', due: '6:15 PM' },
    { id: 4, title: 'Prep meeting notes for brand strategy call', done: false, priority: 'P2', tag: 'Strategy', due: 'Tomorrow' },
    { id: 5, title: 'Stage thumbnail A/B test variations', done: false, priority: 'P1', tag: 'YouTube', due: 'Thursday' },
  ])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const [actionAdded, setActionAdded] = useState(false)
  const [selectedProject, setSelectedProject] = useState(0)

  // YouTube & Creator State
  const [selectedYoutubeVideo, setSelectedYoutubeVideo] = useState(0)
  const youtubeVideos = [
    {
      id: 1,
      title: 'How I Run a 1-Person Business (Full Stack)',
      format: 'Long-Form • 18:42',
      status: 'Ready to Publish',
      views: '48.2k projected',
      ctr: '11.4% CTR',
      rpm: '$8.40 RPM',
      retention: '62% at 5:00',
      hook: 'Most solo creators build an unpaid prison, not a business. Here is how I automate 80% of my week.',
      tag: 'Long-Form Drop',
      gradient: 'from-red-600 via-rose-600 to-amber-600'
    },
    {
      id: 2,
      title: 'Why Jira Sucks for Creators (Short)',
      format: 'Shorts (9:16) • 0:54',
      status: 'Live & Scaling',
      views: '142.8k Views',
      ctr: '84.2% Viewed',
      rpm: '$0.85 RPM',
      retention: '118% APV',
      hook: 'If your project management tool requires a 2-hour onboarding video, run away.',
      tag: 'YouTube Short',
      gradient: 'from-purple-600 via-pink-600 to-red-500'
    },
    {
      id: 3,
      title: 'Desk Setup & Production Pipeline 2026',
      format: 'Sponsor Integration • 14:10',
      status: 'Brand Approved',
      views: '65.0k projected',
      ctr: '9.8% CTR',
      rpm: '$14.20 RPM',
      retention: '58% at 3:00',
      hook: 'The 3 hardware pieces that doubled our solo editing velocity this month.',
      tag: 'Sponsorship Drop',
      gradient: 'from-amber-500 via-orange-600 to-rose-600'
    }
  ]

  // Creator & Instagram State
  const [selectedInstaPost, setSelectedInstaPost] = useState(0)
  const [captionCopied, setCaptionCopied] = useState(false)
  const [gptPromptActive, setGptPromptActive] = useState(false)
  const [chatGptSynced, setChatGptSynced] = useState(false)

  const instaPosts = [
    {
      id: 1,
      title: 'Studio BTS & Editing Flow',
      format: 'Reel (9:16)',
      scheduled: 'Tomorrow • 6:15 PM EST',
      status: 'Scheduled',
      hook: 'How our 3-person studio ships client deliverables in 48 hours without burnout.',
      tags: '#buildinpublic #creatortools #productivity',
      gradient: 'from-amber-400 via-rose-500 to-purple-600',
      tagBadge: 'Reel • Ready',
      saves: '1.4k est. saves'
    },
    {
      id: 2,
      title: '5 Rules for Creator Teams',
      format: 'Carousel (10 Slides)',
      scheduled: 'Thursday • 12:00 PM EST',
      status: 'Caption Ready',
      hook: 'Stop managing tickets. Start managing attention, creative momentum, and delivery.',
      tags: '#creatorops #solopreneur #agencyworkflow',
      gradient: 'from-blue-500 via-indigo-500 to-violet-600',
      tagBadge: 'Carousel • Draft',
      saves: '2.8k est. saves'
    },
    {
      id: 3,
      title: 'Sponsor Drop: Product Setup',
      format: 'Story + Feed Post',
      scheduled: 'Saturday • 10:30 AM EST',
      status: 'Staged',
      hook: 'Unboxing the hardware and software stack powering our remote production.',
      tags: '#sponsored #creatorgear #desktour',
      gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
      tagBadge: 'Sponsorship',
      saves: '950 est. saves'
    }
  ]

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

  const handleSimulateChatGpt = () => {
    if (gptPromptActive) return
    setGptPromptActive(true)
    setTimeout(() => {
      setChatGptSynced(true)
      setDemoTasks(prev => [
        { id: Date.now(), title: 'Draft script: "The Anti-Jira Creator Stack" (from ChatGPT Life Context)', done: false, priority: 'P0', tag: 'ChatGPT', due: 'Today' },
        ...prev
      ])
      setGptPromptActive(false)
    }, 900)
  }

  const handleCopyHook = (hookText: string) => {
    navigator.clipboard?.writeText?.(hookText)
    setCaptionCopied(true)
    setTimeout(() => setCaptionCopied(false), 2000)
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
      name: 'Creator Studio Launch',
      progress: 65,
      initiatives: 6,
      status: 'In Progress',
      color: 'bg-rose-500',
      milestones: ['Brand kit & font stack (Done)', 'Instagram schedule staging (Done)', 'Sponsor media kit (In Progress)']
    },
    {
      name: 'Client Portal Redesign',
      progress: 45,
      initiatives: 4,
      status: 'In Progress',
      color: 'bg-blue-500',
      milestones: ['Design mockups (Done)', 'Auth & invite flow (In Progress)', 'Beta release (Upcoming)']
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
    { label: 'Creators & Content Studios', icon: '◈', desc: 'Plan Instagram feeds, track sponsor deliverables, schedule drops, and eliminate production chaos.' },
    { label: 'Boutique Agencies & Operators', icon: '⬡', desc: 'Isolate client workspaces, convert client calls to action items, and maintain 100% on-time delivery.' },
    { label: 'Solo Founders & Builders', icon: '△', desc: 'Give ChatGPT your entire life context so it structures your weekly sprints, milestones, and daily habits.' },
    { label: 'Agile Creative Teams', icon: '◇', desc: 'Eliminate 80% of useless status check-ins and let your team do the work that actually generates revenue.' },
  ]

  const faqs = [
    {
      q: 'Why isn’t this just another Jira or Asana clone?',
      a: 'Because those tools were designed in 2005 for enterprise middle-managers who love 20-field tickets and 45-minute meetings about meetings. Focus is built for creators, studios, and builders who ship. No ticket grooming, no corporate theater. Just your calendar, your content pipeline, your meetings, and your tasks connected in one calm place.',
    },
    {
      q: 'How does the automated Instagram planning & strategy work?',
      a: 'Focus gives you a dedicated content production pipeline. You can visually stage your 9:16 Reels and carousels, test high-retention hooks, track sponsor deliverables, and schedule releases to hit optimal audience windows without bouncing across third-party scheduling apps.',
    },
    {
      q: 'How do I feed my life context to ChatGPT to structure the app?',
      a: 'Focus provides an OpenAPI endpoint and Custom GPT Action. You tell ChatGPT about your daily habits, client contracts, video shoot days, or life goals in plain conversational English. ChatGPT automatically translates your context into structured projects, milestones, prioritized tasks, and deadlines inside Focus.',
    },
    {
      q: 'How does the Fathom meeting integration work?',
      a: 'When you finish a client or team call on Fathom, your recording, transcript summary, and takeaways automatically sync into Focus. With one click, you turn call action items into assigned P0/P1 tasks so nothing gets lost.',
    },
    {
      q: 'Can I sync with Google Calendar and Apple Calendar?',
      a: 'Yes. You get a private subscription link. Your deadlines, sprint dates, and content drops appear seamlessly in Google Calendar, Apple Calendar, or Outlook with zero developer configuration.',
    },
    {
      q: 'Is it free to get started?',
      a: '100% free. You can create your workspace right now in 30 seconds. No credit card required.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0c0d0f] font-sans selection:bg-black/10 relative overflow-hidden">
      {/* Soft Ambient Apple-grade Glow Mesh with Pulse Animation */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[580px] bg-gradient-to-b from-neutral-200/50 via-rose-100/20 to-transparent blur-3xl rounded-full pointer-events-none -z-10 animate-ambient" />
      <div className="absolute top-80 -right-36 w-[450px] h-[450px] bg-rose-200/25 blur-3xl rounded-full pointer-events-none -z-10 animate-float" />
      <div className="absolute top-[600px] -left-36 w-[450px] h-[450px] bg-emerald-200/25 blur-3xl rounded-full pointer-events-none -z-10 animate-float-delayed" />

      {/* Top Floating Apple-grade Navigation */}
      <nav className="fixed top-5 left-0 right-0 z-40 max-w-5xl mx-auto px-6">
        <div className="bg-white/85 backdrop-blur-2xl border border-black/[0.08] shadow-sm shadow-black/[0.03] rounded-full px-6 py-3 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center font-semibold text-[11px] shadow-xs">
              F
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold tracking-tight text-sm text-black">Focus</span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-tight hidden sm:inline">by AHMV Systems</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full hidden md:inline">
              Solo &amp; Creators
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-normal text-[#6b7280]">
            <a href="#why-different" className="hover:text-black transition-colors">Why It&apos;s Different</a>
            <a href="#youtube-pipeline" className="hover:text-black transition-colors">YouTube Metrics</a>
            <a href="#instagram-planner" className="hover:text-black transition-colors">Instagram</a>
            <a href="#chatgpt-engine" className="hover:text-black transition-colors">ChatGPT Context</a>
            <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setMode('login'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="px-3.5 py-1.5 text-xs text-black hover:opacity-75 transition-opacity cursor-pointer font-light"
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

      {/* Hero Section: De-cluttered, High-Finesse Apple Aesthetics */}
      <section className="pt-36 pb-20 px-6 sm:px-10 max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy: Clean, Crisp, Solo Entrepreneur & Creator Focused */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.08] text-xs text-neutral-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-black">Focus by AHMV Systems</span>
              <span className="text-neutral-300">•</span>
              <span className="text-neutral-500">Solo Operators &amp; Creators</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-black leading-[1.1]">
              Stop playing project manager. <br />
              <span className="font-semibold text-black bg-gradient-to-r from-black via-neutral-900 to-neutral-600 bg-clip-text text-transparent">
                Ship what makes you money.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#52525b] font-light leading-relaxed max-w-lg">
              The calm, high-velocity workspace for solo entrepreneurs and creators. Track your YouTube &amp; Instagram pipelines with real-time metrics, feed ChatGPT your entire life context to auto-structure your schedule, and execute without corporate bloat.
            </p>

            {/* Classy Gen Z Tongue-in-Cheek Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-light shadow-2xs">
              <span className="font-mono text-emerald-700 font-semibold">$0 Free</span>
              <span className="text-emerald-300">•</span>
              <span>You don&apos;t need to pay, lil bro. Keep the bag for camera gear.</span>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
                className="px-6 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 group"
              >
                <span>Launch Free Workspace</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="#youtube-pipeline"
                className="px-5 py-3 rounded-full bg-white hover:bg-neutral-50 border border-black/[0.1] text-black text-xs font-normal transition-all shadow-2xs"
              >
                Explore Creator Suite ↓
              </a>
            </div>
          </div>

          {/* Right Interactive Apple-Grade Dashboard Preview with Motion Graphics */}
          <div className="lg:col-span-6 relative">
            {/* Motion Pill 1: YouTube Real-Time CTR (Floating Top-Right) */}
            <div className="absolute -top-4 -right-2 z-30 bg-white/90 backdrop-blur-xl border border-black/[0.08] shadow-lg rounded-full px-3 py-1.5 flex items-center gap-2 text-[11px] animate-float select-none">
              <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px] font-bold">
                ▶
              </div>
              <span className="font-medium text-black">YouTube Drop</span>
              <span className="text-neutral-300">•</span>
              <span className="font-mono text-emerald-600 font-medium">48.2k Views (11.4% CTR)</span>
            </div>

            {/* Motion Pill 2: Instagram Reel Status (Floating Top-Left) */}
            <div className="absolute -top-4 -left-3 z-30 bg-white/90 backdrop-blur-xl border border-black/[0.08] shadow-lg rounded-full px-3 py-1.5 hidden sm:flex items-center gap-2 text-[11px] animate-float-delayed select-none">
              <Camera size={12} className="text-purple-600" />
              <span className="font-medium text-black">Reel #42</span>
              <span className="text-neutral-300">•</span>
              <span className="text-purple-700 font-mono text-[10px]">6:15 PM Ready</span>
            </div>

            {/* Motion Pill 3: ChatGPT Context Synced (Floating Bottom-Left) */}
            <div className="absolute -bottom-4 -left-3 z-30 bg-white/90 backdrop-blur-xl border border-black/[0.08] shadow-lg rounded-full px-3 py-1.5 flex items-center gap-2 text-[11px] animate-float-delayed select-none">
              <Sparkles size={12} className="text-emerald-600" />
              <span className="font-medium text-black">ChatGPT</span>
              <span className="text-neutral-300">•</span>
              <span className="text-emerald-700 font-mono text-[10px]">Life Context Synced</span>
            </div>

            {/* Main Interactive Glass Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-black/[0.08] shadow-2xl shadow-black/[0.05] space-y-4 hover:border-black/[0.15] transition-all duration-300 relative group overflow-hidden">
              {/* Dynamic Ambient Glow Backlight */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-200/50 via-rose-100/40 to-blue-100/50 rounded-3xl blur-md -z-10 opacity-75 group-hover:opacity-100 transition-opacity" />

              {/* Workspace Header & Tab Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-semibold text-xs shadow-xs">
                    F
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-black">Solo Studio Hub</div>
                    <div className="text-[10px] text-[#8a8d95] font-light">Focus by AHMV Systems</div>
                  </div>
                </div>

                {/* Tab Switcher - 5 Live Tabs */}
                <div className="flex items-center bg-[#f4f4f5] p-1 rounded-xl border border-black/[0.04] text-[11px] overflow-x-auto">
                  {[
                    { id: 'tasks', label: 'Tasks' },
                    { id: 'youtube', label: 'YouTube' },
                    { id: 'instagram', label: 'Instagram' },
                    { id: 'chatgpt', label: 'ChatGPT' },
                    { id: 'meetings', label: 'Meetings' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id as any)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap',
                        activeTab === t.id
                          ? 'bg-white text-black shadow-xs font-medium'
                          : 'text-[#71717a] hover:text-black font-light'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB 1: INTERACTIVE TASKS WITH AMBIENT LIGHTING */}
              {activeTab === 'tasks' && (
                <div className="space-y-3 animate-in fade-in duration-200 relative">
                  {/* Subtle emerald ambient halo */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 blur-2xl pointer-events-none rounded-full" />

                  {/* Sprint Velocity Header */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#71717a] font-light">
                        Sprint Velocity: <strong className="text-black font-medium">{completedCount} of {demoTasks.length} shipped</strong>
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 font-medium">
                        {progressPercent}% Complete
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
                      <span>{showAddInput ? 'Cancel' : 'Quick Add'}</span>
                    </button>
                  </div>

                  {/* Inline Quick Add Form */}
                  {showAddInput && (
                    <form onSubmit={handleAddQuickTask} className="flex items-center gap-2 p-1.5 bg-[#fafafa] border border-black/[0.08] rounded-xl animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        required
                        placeholder="e.g. Test thumbnail variation B on YouTube"
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
                          'group p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer select-none relative overflow-hidden',
                          task.done
                            ? 'bg-[#fafafa] border-black/[0.04] opacity-75'
                            : 'bg-white border-black/[0.07] hover:border-black/[0.2] hover:shadow-2xs'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
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
                              'px-1.5 py-0.5 rounded font-mono text-[9px]',
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

              {/* TAB 2: INTERACTIVE YOUTUBE PIPELINE & METRICS TRACKER */}
              {activeTab === 'youtube' && (
                <div className="space-y-3 animate-in fade-in duration-200 min-h-[220px] relative">
                  {/* Subtle red/ruby ambient halo */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-red-500/10 blur-2xl pointer-events-none rounded-full" />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-light">
                      YouTube Studio Pipeline &amp; Retention
                    </span>
                    <span className="text-[10px] font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      Live Metric Sync
                    </span>
                  </div>

                  {/* 3-Video Selector Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {youtubeVideos.map((video, idx) => {
                      const isSelected = selectedYoutubeVideo === idx
                      return (
                        <div
                          key={video.id}
                          onClick={() => setSelectedYoutubeVideo(idx)}
                          className={cn(
                            'p-2 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden group',
                            isSelected 
                              ? 'border-black bg-neutral-50 shadow-xs' 
                              : 'border-black/[0.06] bg-white hover:border-black/[0.15]'
                          )}
                        >
                          <div className={cn('h-12 rounded-lg bg-gradient-to-br mb-2 flex items-end p-1.5 relative overflow-hidden', video.gradient)}>
                            <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors" />
                            <span className="text-[9px] font-mono text-white font-medium drop-shadow-sm relative z-10 flex items-center gap-1">
                              <span>▶</span>
                              <span>{video.format.split(' ')[0]}</span>
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-black truncate">{video.title}</div>
                          <div className="text-[9px] text-[#71717a] truncate">{video.views}</div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Selected Video Metrics & Retention Hook Card */}
                  {youtubeVideos[selectedYoutubeVideo] && (
                    <div className="p-3 bg-[#fafafa] border border-black/[0.07] rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded bg-red-600 text-white flex items-center justify-center text-[7px] font-bold">
                            ▶
                          </div>
                          <span className="text-xs font-medium text-black truncate max-w-[200px]">
                            {youtubeVideos[selectedYoutubeVideo].title}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          {youtubeVideos[selectedYoutubeVideo].status}
                        </span>
                      </div>

                      {/* 4-Metric Tile Strip */}
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        <div className="p-1.5 bg-white rounded-lg border border-black/[0.05]">
                          <div className="text-[9px] text-neutral-400 font-mono">Views</div>
                          <div className="text-[11px] font-semibold text-black">{youtubeVideos[selectedYoutubeVideo].views.split(' ')[0]}</div>
                        </div>
                        <div className="p-1.5 bg-white rounded-lg border border-black/[0.05]">
                          <div className="text-[9px] text-neutral-400 font-mono">CTR</div>
                          <div className="text-[11px] font-semibold text-emerald-600">{youtubeVideos[selectedYoutubeVideo].ctr.split(' ')[0]}</div>
                        </div>
                        <div className="p-1.5 bg-white rounded-lg border border-black/[0.05]">
                          <div className="text-[9px] text-neutral-400 font-mono">RPM</div>
                          <div className="text-[11px] font-semibold text-black">{youtubeVideos[selectedYoutubeVideo].rpm.split(' ')[0]}</div>
                        </div>
                        <div className="p-1.5 bg-white rounded-lg border border-black/[0.05]">
                          <div className="text-[9px] text-neutral-400 font-mono">Retention</div>
                          <div className="text-[11px] font-semibold text-purple-600">{youtubeVideos[selectedYoutubeVideo].retention.split(' ')[0]}</div>
                        </div>
                      </div>

                      {/* Hook preview */}
                      <div className="p-2 bg-white border border-black/[0.05] rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-wider">3-Sec Hook:</span>
                          <button
                            type="button"
                            onClick={() => handleCopyHook(youtubeVideos[selectedYoutubeVideo].hook)}
                            className="text-[10px] text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer font-light"
                          >
                            {captionCopied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            <span>{captionCopied ? 'Copied' : 'Copy Hook'}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-[#374151] font-light leading-snug italic truncate">
                          &ldquo;{youtubeVideos[selectedYoutubeVideo].hook}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INTERACTIVE INSTAGRAM PLANNER */}
              {activeTab === 'instagram' && (
                <div className="space-y-3 animate-in fade-in duration-200 min-h-[220px] relative">
                  {/* Subtle violet ambient halo */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 blur-2xl pointer-events-none rounded-full" />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-light">
                      Visual Feed &amp; Hook Engine
                    </span>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      Automated Posting Active
                    </span>
                  </div>

                  {/* 3-Post Visual Staging Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {instaPosts.map((post, idx) => {
                      const isSelected = selectedInstaPost === idx
                      return (
                        <div
                          key={post.id}
                          onClick={() => setSelectedInstaPost(idx)}
                          className={cn(
                            'p-2 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden group',
                            isSelected 
                              ? 'border-black bg-neutral-50 shadow-xs' 
                              : 'border-black/[0.06] bg-white hover:border-black/[0.15]'
                          )}
                        >
                          <div className={cn('h-12 rounded-lg bg-gradient-to-br mb-2 flex items-end p-1.5 relative overflow-hidden', post.gradient)}>
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            <span className="text-[9px] font-mono text-white font-medium drop-shadow-sm relative z-10">
                              {post.format.split(' ')[0]}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-black truncate">{post.title}</div>
                          <div className="text-[9px] text-[#71717a] truncate">{post.scheduled.split('•')[0]}</div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Post Strategy & Hook Card */}
                  {instaPosts[selectedInstaPost] && (
                    <div className="p-3 bg-[#fafafa] border border-black/[0.07] rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Camera size={13} className="text-purple-600" />
                          <span className="text-xs font-medium text-black">{instaPosts[selectedInstaPost].title}</span>
                        </div>
                        <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          {instaPosts[selectedInstaPost].scheduled}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white border border-black/[0.05] rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Hook Strategy:</span>
                          <button
                            type="button"
                            onClick={() => handleCopyHook(instaPosts[selectedInstaPost].hook)}
                            className="text-[10px] text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer font-light"
                          >
                            {captionCopied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            <span>{captionCopied ? 'Copied' : 'Copy Hook'}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-[#374151] font-light leading-snug italic">
                          &ldquo;{instaPosts[selectedInstaPost].hook}&rdquo;
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-500 font-light pt-0.5">
                        <span>{instaPosts[selectedInstaPost].tags}</span>
                        <span className="font-mono text-emerald-600">{instaPosts[selectedInstaPost].saves}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CHATGPT LIFE CONTEXT ENGINE */}
              {activeTab === 'chatgpt' && (
                <div className="space-y-3 animate-in fade-in duration-200 min-h-[220px]">
                  <div className="p-3 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 border border-emerald-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                          <Sparkles size={12} />
                        </div>
                        <span className="text-xs font-semibold text-emerald-950">ChatGPT Life Context Sync</span>
                      </div>
                      <span className="text-[10px] font-mono bg-white text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                        OpenAPI Linked
                      </span>
                    </div>

                    <p className="text-[11px] text-emerald-900/80 font-light leading-relaxed">
                      Connect your ChatGPT directly. Tell it your schedule, YouTube drops, and sponsor deadlines — it auto-structures your boards and daily priorities.
                    </p>

                    <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-100 text-[11px] space-y-1 font-mono text-neutral-700">
                      <div className="text-[9px] text-neutral-400 uppercase">Context Sent to ChatGPT:</div>
                      <div>&ldquo;Shoot YouTube video Tuesday, sponsor cut due Thursday, launch Friday morning.&rdquo;</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateChatGpt}
                      disabled={gptPromptActive || chatGptSynced}
                      className={cn(
                        'w-full py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs',
                        chatGptSynced
                          ? 'bg-emerald-600 text-white'
                          : 'bg-black text-white hover:bg-neutral-800'
                      )}
                    >
                      {gptPromptActive ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          <span>ChatGPT Structuring Workspace...</span>
                        </>
                      ) : chatGptSynced ? (
                        <>
                          <Check size={12} />
                          <span>Sprints &amp; Tasks Auto-Created!</span>
                        </>
                      ) : (
                        <>
                          <Zap size={12} />
                          <span>Simulate ChatGPT Life Context Sync →</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: INTERACTIVE MEETINGS (FATHOM SYNC) */}
              {activeTab === 'meetings' && (
                <div className="space-y-3 animate-in fade-in duration-200 min-h-[220px]">
                  <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-2">
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

                    <div className="p-2.5 bg-white border border-black/[0.06] rounded-xl space-y-1.5 text-xs text-[#52525b]">
                      <div className="text-[10px] font-medium text-[#71717a] uppercase">Key Decisions &amp; Next Steps:</div>
                      <p className="text-[11px] font-light leading-relaxed">
                        &bull; Sponsor approved 60s integration in Thursday YouTube video.<br />
                        &bull; Need to deliver revised color grade before Thursday noon.
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
                          <span>Takeaway Converted to Task!</span>
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

              {/* Bottom Live System Indicator Strip */}
              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-[#71717a] font-light">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>YouTube &amp; Insta Synced</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-emerald-600" />
                  <span>ChatGPT Context Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: WHY THIS AIN'T JUST ANOTHER PROJECT MANAGEMENT APP (Gen X Contrast) */}
      <section id="why-different" className="py-24 px-6 sm:px-10 max-w-6xl mx-auto border-t border-black/[0.06] relative">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-black/[0.06] text-xs text-neutral-600 font-mono uppercase tracking-wider">
            <span>THE RAW TRUTH</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-light text-black tracking-tight leading-tight">
            Why this ain&apos;t just another project management tool.
          </h2>
          <p className="text-sm sm:text-base text-[#52525b] font-light max-w-2xl mx-auto">
            You didn&apos;t build a creator brand or launch a digital studio to spend 10 hours a week grooming tickets in enterprise bloatware.
          </p>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Column 1: Legacy Enterprise Apps */}
          <div className="p-8 rounded-3xl bg-neutral-50/80 border border-black/[0.08] space-y-6 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-red-600 font-medium">Legacy Enterprise Apps</span>
              <span className="text-xs text-neutral-400">Jira, Asana, ClickUp</span>
            </div>
            <h3 className="text-xl font-normal text-neutral-800">
              Built for middle managers who love meetings about meetings.
            </h3>
            <ul className="space-y-3 text-xs text-[#52525b] font-light">
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                <span>Requires filling 14 dropdown fields before you can write a simple task down.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                <span>Zero understanding of Instagram reels, carousels, sponsor deliverables, or drop schedules.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                <span>Endless status check-in meetings because nobody actually checks the bloated boards.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                <span>Isolated silos where meeting recordings, calendar, and task lists live in 6 disconnected tabs.</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Focus (Apple-grade minimalist execution) */}
          <div className="p-8 rounded-3xl bg-black text-white border border-black shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-500/20 to-transparent blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-medium">Focus Platform</span>
              <span className="text-xs text-neutral-400">For Creators &amp; Agile Studios</span>
            </div>
            <h3 className="text-xl font-normal text-white">
              Built for people who actually produce, ship, and deliver.
            </h3>
            <ul className="space-y-3 text-xs text-neutral-300 font-light">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                <span>Type a task, press enter, and ship. P0 to P3 prioritization without bureaucratic friction.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                <span>Dedicated visual Instagram planner with hook testing, carousel staging, and automated posting.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                <span>Feed your full life context into ChatGPT to auto-structure your entire workspace and schedules.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                <span>Fathom call takeaways converted to actionable tasks in 1 click, auto-synced with your calendar.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION: YOUTUBE PRODUCTION & REAL-TIME RETENTION METRICS */}
      <section id="youtube-pipeline" className="py-24 px-6 sm:px-10 max-w-6xl mx-auto border-t border-black/[0.06] relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200/80 text-xs text-red-800 font-mono uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>YOUTUBE STUDIO &amp; METRICS ENGINE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight leading-tight">
              Long-form, Shorts, and real-time retention tracking.
            </h2>

            <p className="text-sm text-[#52525b] font-light leading-relaxed">
              Stop guessing what thumbnails or hooks convert. Stage your long-form YouTube videos, organize Shorts (9:16) drops, monitor projected RPM and CTR metrics, and track sponsor integrations with zero tab-switching.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-1">
                <div className="text-xs font-medium text-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  Thumbnail CTR &amp; Hook Testing
                </div>
                <p className="text-[11px] text-[#6b7280] font-light">
                  A/B test thumbnail concepts and opening 3-second lines before hitting publish.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-1">
                <div className="text-xs font-medium text-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  Audience Retention Drop-Off Curves
                </div>
                <p className="text-[11px] text-[#6b7280] font-light">
                  Keep average percentage viewed (APV) high by mapping pacing and b-roll changes.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-1">
                <div className="text-xs font-medium text-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  Sponsor Integration Cue-Points
                </div>
                <p className="text-[11px] text-[#6b7280] font-light">
                  Track 60s mid-roll delivery dates, contract rates, and client approvals in one pipeline.
                </p>
              </div>
            </div>
          </div>

          {/* Visual Apple-like YouTube Dashboard Mockup */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-[#fafafa] border border-black/[0.08] shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 blur-3xl pointer-events-none rounded-full" />

            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs text-xs font-bold">
                  ▶
                </div>
                <div>
                  <div className="text-xs font-medium text-black">YouTube Studio Hub</div>
                  <div className="text-[10px] text-neutral-400">Long-form &amp; Shorts Analytics</div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded border border-emerald-200">
                Avg CTR: 11.4%
              </span>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 bg-white rounded-2xl border border-black/[0.06] text-center shadow-2xs">
                <div className="text-[10px] text-neutral-400 font-mono">Views</div>
                <div className="text-sm font-semibold text-black mt-0.5">142.8k</div>
                <div className="text-[9px] text-emerald-600 font-mono">+18% vs avg</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-black/[0.06] text-center shadow-2xs">
                <div className="text-[10px] text-neutral-400 font-mono">Click-Through</div>
                <div className="text-sm font-semibold text-emerald-600 mt-0.5">11.4%</div>
                <div className="text-[9px] text-emerald-600 font-mono">Top 5%</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-black/[0.06] text-center shadow-2xs">
                <div className="text-[10px] text-neutral-400 font-mono">Watch Time</div>
                <div className="text-sm font-semibold text-black mt-0.5">4.8k hrs</div>
                <div className="text-[9px] text-neutral-400 font-mono">Monetized</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-black/[0.06] text-center shadow-2xs">
                <div className="text-[10px] text-neutral-400 font-mono">Est. RPM</div>
                <div className="text-sm font-semibold text-purple-700 mt-0.5">$8.40</div>
                <div className="text-[9px] text-neutral-400 font-mono">Tech niche</div>
              </div>
            </div>

            {/* Video Pipeline Item Card */}
            <div className="p-4 bg-white rounded-2xl border border-black/[0.06] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-mono text-[9px]">
                    Long-Form Video
                  </span>
                  <span className="text-xs font-semibold text-black">
                    How I Run a 1-Person Business (Full Stack)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">18:42</span>
              </div>

              {/* Retention Curve Simulation */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-light">
                  <span>Audience Retention Curve</span>
                  <span className="font-mono text-emerald-600 font-medium">62% held at 5:00</span>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: '62%' }} />
                  <div className="h-full bg-neutral-300" style={{ width: '18%' }} />
                  <div className="h-full bg-neutral-200 rounded-r-full" style={{ width: '20%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: AUTOMATED INSTAGRAM PLANNING & SOCIAL STRATEGY */}
      <section id="instagram-planner" className="py-24 px-6 sm:px-10 max-w-6xl mx-auto border-t border-black/[0.06] relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-xs text-rose-800 font-mono uppercase tracking-wider">
              <Camera size={12} />
              <span>CONTENT PRODUCTION PIPELINE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight leading-tight">
              Automated Instagram planning, scheduling, and posting strategy.
            </h2>

            <p className="text-sm text-[#52525b] font-light leading-relaxed">
              Stop juggling random notes apps, Canva folders, and clumsy scheduling tools. Plan your 9:16 Reels, stage multi-slide carousels, test viral opening hooks, and line up sponsor deliverables in one seamless visual workflow.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-1">
                <div className="text-xs font-medium text-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Visual Feed &amp; Grid Staging
                </div>
                <p className="text-[11px] text-[#6b7280] font-light">
                  Preview how your Reels, carousels, and sponsor drops sit together before publishing.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-1">
                <div className="text-xs font-medium text-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Hook &amp; Retention Strategy Engine
                </div>
                <p className="text-[11px] text-[#6b7280] font-light">
                  Craft and test opening 3-second hooks designed for maximum watch time, saves, and shares.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-1">
                <div className="text-xs font-medium text-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Automated Posting Windows
                </div>
                <p className="text-[11px] text-[#6b7280] font-light">
                  Map each drop directly to your audience&apos;s peak engagement windows with automated schedule triggers.
                </p>
              </div>
            </div>
          </div>

          {/* Visual Apple-like Social Dashboard Mockup */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-[#fafafa] border border-black/[0.08] shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Camera size={14} />
                </div>
                <div>
                  <div className="text-xs font-medium text-black">Instagram Grid &amp; Pipeline</div>
                  <div className="text-[10px] text-neutral-400">Optimal Drop Times Synced</div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                12 Posts Staged
              </span>
            </div>

            {/* Visual Feed Preview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-2xl border border-black/[0.06] space-y-2 shadow-2xs">
                <div className="h-28 rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-purple-600 flex flex-col justify-between p-2 text-white">
                  <span className="text-[9px] font-mono bg-black/40 backdrop-blur-xs px-1.5 py-0.5 rounded w-fit">9:16 Reel</span>
                  <span className="text-[10px] font-medium leading-tight">Editing Workflow BTS</span>
                </div>
                <div className="text-[11px] font-medium text-black">Reel #42</div>
                <div className="text-[10px] text-neutral-500">Scheduled: Wed 6:15 PM</div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-black/[0.06] space-y-2 shadow-2xs">
                <div className="h-28 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex flex-col justify-between p-2 text-white">
                  <span className="text-[9px] font-mono bg-black/40 backdrop-blur-xs px-1.5 py-0.5 rounded w-fit">Carousel</span>
                  <span className="text-[10px] font-medium leading-tight">5 Creator Rules</span>
                </div>
                <div className="text-[11px] font-medium text-black">Carousel #18</div>
                <div className="text-[10px] text-neutral-500">Scheduled: Thu 12:00 PM</div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-black/[0.06] space-y-2 shadow-2xs">
                <div className="h-28 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex flex-col justify-between p-2 text-white">
                  <span className="text-[9px] font-mono bg-black/40 backdrop-blur-xs px-1.5 py-0.5 rounded w-fit">Sponsor</span>
                  <span className="text-[10px] font-medium leading-tight">Hardware Drop</span>
                </div>
                <div className="text-[11px] font-medium text-black">Brand Collab</div>
                <div className="text-[10px] text-neutral-500">Scheduled: Sat 10:30 AM</div>
              </div>
            </div>

            {/* Performance & Hook Insights Bar */}
            <div className="p-3.5 bg-white border border-black/[0.06] rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-amber-500" />
                <span className="text-neutral-700 font-light">Avg. Hook Engagement Score:</span>
                <strong className="text-black font-semibold font-mono">94.8%</strong>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">Timezone: Auto-adjusted</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: CHATGPT LIFE CONTEXT ENGINE */}
      <section id="chatgpt-engine" className="py-24 px-6 sm:px-10 max-w-6xl mx-auto border-t border-black/[0.06] relative">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-mono uppercase tracking-wider">
            <Sparkles size={12} />
            <span>AI LIFE CONTEXT ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-light text-black tracking-tight leading-tight">
            Tell ChatGPT your entire life context. <br />
            <span className="font-semibold">It structures your workspace automatically.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#52525b] font-light max-w-2xl mx-auto">
            You don&apos;t need to manually configure projects, sprint tags, or due dates. Feed your life context, client contracts, and shooting schedules into ChatGPT — it creates everything inside Focus for you.
          </p>
        </div>

        {/* Visual Interactive Life Context Translation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch max-w-5xl mx-auto">
          {/* Left: Conversational Life Context */}
          <div className="md:col-span-5 p-6 rounded-3xl bg-neutral-900 text-white border border-neutral-800 space-y-4 flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <Sparkles size={13} />
                <span>What you tell ChatGPT:</span>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-800/90 border border-neutral-700 text-xs font-light leading-relaxed text-neutral-200">
                &ldquo;Here&apos;s my situation: I run a 3-person video studio. We have a sponsor contract with Sony that requires 2 Reels and 1 YouTube integration delivered by Friday. My editor is on PTO Thursday. Structure my week so we don&apos;t miss the deadline.&rdquo;
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
              <span>OpenAPI Custom Action</span>
              <span className="text-emerald-400 font-mono">Auto-Syncing...</span>
            </div>
          </div>

          {/* Center Connection Arrow */}
          <div className="hidden md:flex md:col-span-2 items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-neutral-100 border border-black/[0.08] flex items-center justify-center text-black">
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Right: How Focus Automatically Structures It */}
          <div className="md:col-span-5 p-6 rounded-3xl bg-white border border-black/[0.08] shadow-md space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400 uppercase">Focus Workspace Auto-Configured</span>
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  Instant
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-black/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="font-medium text-black">Sony Alpha Cut to Client</span>
                  </div>
                  <span className="text-[10px] font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">P0 • Wed 2pm</span>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-50 border border-black/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-medium text-black">Batch 2 Reels before PTO</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">P1 • Wed 6pm</span>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-50 border border-black/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-medium text-black">Final YouTube Upload &amp; Tags</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">P0 • Fri 9am</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 font-light pt-2 border-t border-black/[0.05]">
              Milestones, dependencies, and calendar reminders created without a single manual click.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW TEAMS SHIP 4X FASTER & INCREASE EFFICIENCY */}
      <section id="efficiency" className="py-24 px-6 sm:px-10 max-w-6xl mx-auto border-t border-black/[0.06] relative">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-800 font-mono uppercase tracking-wider">
            <Zap size={12} />
            <span>MEASURABLE VELOCITY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-light text-black tracking-tight leading-tight">
            How lean teams ship 4x faster with zero burnout.
          </h2>
          <p className="text-sm sm:text-base text-[#52525b] font-light max-w-2xl mx-auto">
            High efficiency isn&apos;t about working 80 hours a week. It&apos;s about removing the friction, lost files, forgotten meeting takeaways, and endless status pings.
          </p>
        </div>

        {/* 3 Metric Velocity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-3 hover:border-black/[0.15] transition-all">
            <div className="text-3xl sm:text-4xl font-light text-black tracking-tight font-mono">
              -80%
            </div>
            <h3 className="text-base font-normal text-black">Fewer Status Check-In Meetings</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              When calendar deadlines, meeting transcripts, and sprint priorities live in one shared view, you never need to ask &ldquo;what are you working on today?&rdquo;
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-3 hover:border-black/[0.15] transition-all">
            <div className="text-3xl sm:text-4xl font-light text-black tracking-tight font-mono">
              100%
            </div>
            <h3 className="text-base font-normal text-black">On-Time Sponsor &amp; Client Delivery</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Clear P0/P1 priority flags mean critical client revisions and sponsor cuts get handled before casual backlog ideas.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-3 hover:border-black/[0.15] transition-all">
            <div className="text-3xl sm:text-4xl font-light text-black tracking-tight font-mono">
              1-Click
            </div>
            <h3 className="text-base font-normal text-black">Meeting Takeaways to Execution</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Fathom call transcripts are automatically synthesized into concrete action items. Click once, and it&apos;s a scheduled task on your calendar.
            </p>
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
                  <div className="w-10 h-10 rounded-2xl bg-black text-white font-semibold text-xs flex items-center justify-center mx-auto mb-3 shadow-xs">
                    F
                  </div>
                  <h3 className="text-lg font-normal text-black">
                    {mode === 'login' ? 'Sign in to Focus by AHMV Systems' : 'Create your free workspace'}
                  </h3>
                  <p className="text-xs text-[#6b7280] font-light">
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
                      placeholder="alex@studio.com"
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
