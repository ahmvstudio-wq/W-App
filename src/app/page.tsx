'use client'

export const runtime = 'edge'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowRight, Check, CheckSquare, Video, ExternalLink, 
  ChevronDown, Calendar, RefreshCw, X, Mail, Play, Pause, Camera, 
  MessageSquare, FolderKanban, Layers, FileText, Activity,
  Flame, Timer, Bot, Sparkles, Copy, Terminal, TrendingUp, BarChart3, Zap
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

  // Interactive Live Pomodoro Simulator State
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60)
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false)
  const [pomodoroMode, setPomodoroMode] = useState<'deep' | 'break'>('deep')

  // Interactive AI Connector Console State
  const [activeAiTab, setActiveAiTab] = useState<'claude' | 'chatgpt' | 'openapi'>('claude')
  const [copiedSpec, setCopiedSpec] = useState(false)

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

  // Pomodoro countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (isPomodoroRunning && pomodoroSeconds > 0) {
      timer = setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1)
      }, 1000)
    } else if (pomodoroSeconds === 0) {
      setIsPomodoroRunning(false)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isPomodoroRunning, pomodoroSeconds])

  const togglePomodoro = () => {
    setIsPomodoroRunning(!isPomodoroRunning)
  }

  const resetPomodoro = (type: 'deep' | 'break') => {
    setIsPomodoroRunning(false)
    setPomodoroMode(type)
    setPomodoroSeconds(type === 'deep' ? 25 * 60 : 5 * 60)
  }

  const formatPomoTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const copyOpenApiUrl = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/api/chatgpt/openapi.json`
      navigator.clipboard.writeText(url)
      setCopiedSpec(true)
      setTimeout(() => setCopiedSpec(false), 2000)
    }
  }

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

  const faqs = [
    {
      q: 'How do the Claude and ChatGPT connectors work?',
      a: 'Focus exposes a live, secure OpenAPI 3.1 endpoint (/api/chatgpt/openapi.json). You can connect it directly to Claude or ChatGPT Actions. Your chatbots automatically inherit full real-time context of your active P0 tasks, current projects, daily blockers, and meeting takeaways without manual copy-pasting.',
    },
    {
      q: 'What is the Pomodoro timer and streak tracking engine?',
      a: 'Focus includes a native, distraction-free Pomodoro deep work timer built into every task. You can initiate 25-minute sprints linked to specific deliverables. As you complete sessions and ship tasks, Focus builds your consecutive daily streak and logs your annual execution velocity matrix.',
    },
    {
      q: 'How does the visual Whiteboard connect with tasks and projects?',
      a: 'Focus includes a native infinite canvas whiteboard directly inside your projects. You can sketch system flows, brainstorm video hooks, map architecture, and link visual nodes directly to execution milestones.',
    },
    {
      q: 'How does Fathom meeting intelligence work?',
      a: 'When you finish a client call or sponsor briefing on Fathom, your recording, summary, and action items sync into Focus. You can convert any takeaway into an actionable calendar task with one click.',
    },
    {
      q: 'What creator features are supported?',
      a: 'Focus pairs deep work systems with a dedicated creator suite: monitor YouTube retention curves and click-through rates, plan vertical Reels and carousels, and manage sponsor cue-points directly from your daily operating view.',
    },
    {
      q: 'Is Focus free to use?',
      a: 'Yes. You can launch your free workspace right now in under 30 seconds with zero credit card required.',
    },
  ]

  // Mock annual execution heatmap blocks (18 weeks x 7 days)
  const heatmapWeeks = Array.from({ length: 18 }).map((_, w) => 
    Array.from({ length: 7 }).map((_, d) => {
      const level = ((w * 3 + d * 5) % 4)
      return level
    })
  )

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0c0d0f] font-sans selection:bg-black/10 relative">
      {/* Spacious, Minimal Floating Navbar */}
      <nav className="fixed top-5 left-0 right-0 z-40 max-w-5xl mx-auto px-6">
        <div className="bg-white/90 backdrop-blur-md border border-black/[0.08] shadow-xs rounded-full px-6 py-3.5 flex items-center justify-between transition-all">
          <div className="flex items-center gap-2.5">
            {/* High-End Focus Reticle Logo Mark: Zero Letters */}
            <div className="w-7 h-7 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="1" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="23" />
                <line x1="1" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="23" y2="12" />
              </svg>
            </div>
            <span className="font-semibold tracking-tight text-sm text-black">Focus</span>
            <span className="text-[11px] text-neutral-400 font-mono tracking-tight hidden sm:inline">by AHMV Systems</span>
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-normal text-neutral-500">
            <a href="#system" className="hover:text-black transition-colors">OS Cockpit</a>
            <a href="#ai-connectors" className="hover:text-black transition-colors">AI Context</a>
            <a href="#deep-work" className="hover:text-black transition-colors">Streaks &amp; Pomodoro</a>
            <a href="#creator-suite" className="hover:text-black transition-colors">Creator Suite</a>
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

      {/* Hero Section: Systems Philosophy, 1-2 Liner, Proportional Typography */}
      <section className="pt-36 pb-20 px-6 sm:px-10 max-w-5xl mx-auto">
        <div className="space-y-6 text-center max-w-3xl mx-auto mb-14">
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-black leading-tight">
            The unified operating workspace. <br className="hidden sm:inline" />
            <span className="font-semibold text-black">Built for founders, creators, and solo builders.</span>
          </h1>

          <p className="text-sm sm:text-base text-[#52525b] font-light leading-relaxed max-w-2xl mx-auto">
            From strategic architecture and infinite whiteboards to Claude context connectors, 25-minute Pomodoro sprints, and daily shipping streaks. Focus unifies your entire workflow into one cohesive system.
          </p>

          {/* Gen Z Free Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-xs text-neutral-700 font-light mx-auto">
            <span className="font-mono text-emerald-700 font-semibold">$0 Free</span>
            <span className="text-neutral-300">:</span>
            <span>You don&apos;t need to pay, lil bro. It&apos;s on me.</span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="px-6 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium shadow-sm transition-all cursor-pointer flex items-center gap-2 group"
            >
              <span>Launch Free Workspace</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#ai-connectors"
              className="px-5 py-3 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-black/[0.08] text-black text-xs font-normal transition-all"
            >
              Explore AI Connectors ↓
            </a>
          </div>
        </div>

        {/* Systems Design Showcase: macOS Product Window */}
        <div id="system" className="relative max-w-5xl mx-auto">
          {/* Floating Motion Pill 1: Claude & ChatGPT Context Sync */}
          <div 
            className="absolute -top-5 -right-3 sm:-right-6 z-30 bg-white border border-black/[0.1] shadow-lg rounded-2xl px-3.5 py-2 flex items-center gap-2.5 text-xs select-none"
            style={{ animation: 'float-slow 4s ease-in-out infinite' }}
          >
            <div className="w-5 h-5 rounded-lg bg-black text-white flex items-center justify-center text-[9px] shadow-xs">
              <Bot size={11} />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-medium text-black text-[11px] leading-tight">Claude &amp; ChatGPT Sync</span>
              <span className="text-[9px] text-emerald-600 font-mono">Live Context Connected</span>
            </div>
          </div>

          {/* Floating Motion Pill 2: Active 14-Day Streak */}
          <div 
            className="absolute -bottom-5 -left-3 sm:-left-6 z-30 bg-white border border-black/[0.1] shadow-lg rounded-2xl px-3.5 py-2 flex items-center gap-2.5 text-xs select-none"
            style={{ animation: 'float-delayed 4.5s ease-in-out infinite 0.5s' }}
          >
            <div className="w-5 h-5 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[10px] shadow-xs">
              <Flame size={11} />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-medium text-black text-[11px] leading-tight">14 Day Shipping Streak</span>
              <span className="text-[9px] text-neutral-500 font-mono">Pomodoro Sprint Active</span>
            </div>
          </div>

          {/* macOS Minimal Preview Window */}
          {/* macOS Minimal Preview Window */}
          <div className="rounded-3xl border border-black/[0.08] bg-white shadow-2xl shadow-black/[0.04] overflow-hidden">
            {/* Window Titlebar */}
            <div className="px-5 py-3.5 bg-neutral-50/80 border-b border-black/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
                <span>Focus Solo OS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-neutral-400">Live</span>
              </div>
            </div>

            {/* Clean Minimalist Cockpit Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white text-left">
              {/* Column 1: Active Campaign */}
              <div className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.05] space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-medium">
                      ACTIVE CAMPAIGN
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold">84% Shipped</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-black">YouTube Studio</h4>
                    <p className="text-xs text-neutral-400 font-light mt-0.5">
                      Weekly Long-form &amp; Sponsorships
                    </p>
                  </div>

                  <div className="w-full h-1 bg-black/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full" style={{ width: '84%' }} />
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.04] text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                  <span>3 Active Missions</span>
                  <span>14 Tasks Total</span>
                </div>
              </div>

              {/* Column 2: Deep Work Sprint */}
              <div className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.05] space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-medium">
                      FOCUS SESSION
                    </span>
                    <span className="text-[10px] font-mono text-orange-600 font-medium flex items-center gap-1">
                      <Flame size={11} /> 14-Day Streak
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black text-white space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                      <span>DEEP WORK</span>
                      <span>24:18</span>
                    </div>
                    <p className="text-xs font-normal text-neutral-100 truncate">
                      Deliver sponsor video cut
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-600 px-1 font-light">
                    <span className="truncate">Next: Publish Episode 4</span>
                    <span className="text-[10px] font-mono text-neutral-400 shrink-0">4:00 PM</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.04] text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                  <span>Sprint 1 of 4</span>
                  <span>Pomodoro Mode</span>
                </div>
              </div>

              {/* Column 3: AI Assistant & Sync */}
              <div className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.05] space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-medium">
                      INTELLIGENCE &amp; SYNC
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">OpenAPI 3.1</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-black/[0.06] text-xs text-neutral-600 space-y-1 shadow-2xs">
                    <div className="text-[10px] font-mono text-emerald-600 font-medium">Assistant Connected</div>
                    <p className="text-[11px] text-neutral-700 leading-snug font-light">
                      &quot;Today&apos;s priority tasks scheduled. Calendar and meetings synchronized.&quot;
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1 font-light">
                    <span>Google &amp; Apple Sync</span>
                    <span className="text-[10px] font-mono text-emerald-600">Active</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-black/[0.04] text-[11px] font-mono text-neutral-500 flex items-center justify-between">
                  <span>Context Engine</span>
                  <span className="text-black font-medium">Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SHOWCASE SECTION 1: CHATGPT & CLAUDE AUTONOMOUS CONNECTORS */}
      <section id="ai-connectors" className="py-24 px-6 sm:px-10 max-w-5xl mx-auto border-t border-black/[0.08]">
        <div className="space-y-4 max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono text-neutral-700">
            <Bot size={12} />
            <span>AUTONOMOUS CONTEXT ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight">
            Connect Claude and ChatGPT directly to your operating system.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
            Stop copy-pasting your daily schedule, active deliverables, and meeting transcripts into chatbots. Focus exposes a native OpenAPI 3.1 endpoint so Claude and ChatGPT operate with full, real-time context of your entire business.
          </p>
        </div>

        {/* Interactive Dual-Agent Live Preview Console */}
        <div className="rounded-3xl border border-black/[0.1] bg-[#0c0d0f] text-white shadow-2xl overflow-hidden">
          {/* Console Header Bar */}
          <div className="px-6 py-4 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveAiTab('claude')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2",
                  activeAiTab === 'claude' 
                    ? "bg-white text-black shadow-sm" 
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                )}
              >
                <Sparkles size={13} className={activeAiTab === 'claude' ? "text-amber-600" : ""} />
                <span>Claude</span>
              </button>
              <button
                onClick={() => setActiveAiTab('chatgpt')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2",
                  activeAiTab === 'chatgpt' 
                    ? "bg-white text-black shadow-sm" 
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                )}
              >
                <Bot size={13} className={activeAiTab === 'chatgpt' ? "text-emerald-500" : ""} />
                <span>ChatGPT</span>
              </button>
              <button
                onClick={() => setActiveAiTab('openapi')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-2",
                  activeAiTab === 'openapi' 
                    ? "bg-white text-black shadow-sm" 
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                )}
              >
                <Terminal size={12} />
                <span>/api/chatgpt/openapi.json</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Context Engine Active</span>
            </div>
          </div>

          {/* Console Body */}
          <div className="p-6 sm:p-8 font-sans">
            {activeAiTab === 'claude' && (
              <div className="space-y-6 max-w-3xl">
                {/* User Prompt */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center text-xs font-medium shrink-0">
                    You
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-xs sm:text-sm text-neutral-200 leading-relaxed max-w-xl">
                    Claude, give me a status report on today&apos;s sprint. What is blocking our 3:00 PM video drop, and can you reschedule any low-priority noise?
                  </div>
                </div>

                {/* Claude Context Response */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-medium shrink-0">
                    <Sparkles size={14} />
                  </div>
                  <div className="space-y-3 w-full">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-lg w-fit">
                      <span>✓ Connected to Focus OS via OpenAPI (workspace: primary_portfolio)</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs sm:text-sm text-neutral-200 leading-relaxed space-y-3">
                      <p className="text-neutral-300">
                        I inspected your Focus OS workspace snapshot. Here is your priority breakdown:
                      </p>
                      
                      <div className="space-y-2 font-mono text-xs">
                        <div className="p-2.5 rounded-xl bg-black/50 border border-neutral-800 flex items-center justify-between">
                          <span className="text-red-400">[P0 Critical] Sony Sponsor Grade</span>
                          <span className="text-neutral-400">Due: 2:00 PM (Pomodoro running)</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/50 border border-neutral-800 flex items-center justify-between">
                          <span className="text-amber-400">[Blocker Isolated] Missing LUT Export</span>
                          <span className="text-neutral-400">Flagged on Visual Whiteboard</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/50 border border-neutral-800 flex items-center justify-between">
                          <span className="text-neutral-400">[Auto-Rescheduled] 2 P3 Backlog Items</span>
                          <span className="text-emerald-400">Moved to Tomorrow&apos;s Queue</span>
                        </div>
                      </div>

                      <p className="text-neutral-400 text-xs font-light">
                        Current Velocity: 14-day continuous shipping streak. You have 1 hour 45 minutes of scheduled deep work remaining before the drop window.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeAiTab === 'chatgpt' && (
              <div className="space-y-6 max-w-3xl">
                {/* User Prompt */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center text-xs font-medium shrink-0">
                    You
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-xs sm:text-sm text-neutral-200 leading-relaxed max-w-xl">
                    Log that I just finished a 25-minute Pomodoro sprint on the Sony color grade, mark it shipped, and add a quick note to our Living Docs.
                  </div>
                </div>

                {/* ChatGPT Response */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs font-medium shrink-0">
                    <Bot size={14} />
                  </div>
                  <div className="space-y-3 w-full">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-lg w-fit">
                      <span>✓ POST /api/chatgpt/tasks (status: 200 OK)</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs sm:text-sm text-neutral-200 leading-relaxed space-y-3">
                      <p className="text-neutral-300">
                        Done. I executed the updates directly in your Focus OS workspace:
                      </p>
                      
                      <ul className="space-y-1.5 text-xs text-neutral-400 list-disc pl-4 font-light">
                        <li><strong className="text-white font-normal">Task Updated:</strong> &quot;Sony Sponsor Grade&quot; status changed to <span className="text-emerald-400 font-mono">shipped</span>.</li>
                        <li><strong className="text-white font-normal">Focus Session Logged:</strong> +25 minutes deep work saved to your profile metrics.</li>
                        <li><strong className="text-white font-normal">Streak Extended:</strong> Your daily shipping streak is now <span className="text-orange-400 font-mono">15 days</span>.</li>
                        <li><strong className="text-white font-normal">Living Docs:</strong> Added sprint completion timestamp to &quot;Sony Campaign Specification&quot;.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeAiTab === 'openapi' && (
              <div className="space-y-4 font-mono text-xs max-w-3xl">
                <div className="flex items-center justify-between text-neutral-400 pb-2 border-b border-neutral-800">
                  <span>OpenAPI 3.1 Live Action Schema</span>
                  <button
                    onClick={copyOpenApiUrl}
                    className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-[11px]"
                  >
                    {copiedSpec ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copiedSpec ? 'Copied Link' : 'Copy Endpoint URL'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-black/60 border border-neutral-800 text-neutral-300 overflow-x-auto text-[11px] leading-relaxed">
                  <span className="text-purple-400">&#123;</span><br />
                  &nbsp;&nbsp;<span className="text-emerald-400">&quot;openapi&quot;</span>: <span className="text-amber-300">&quot;3.1.0&quot;</span>,<br />
                  &nbsp;&nbsp;<span className="text-emerald-400">&quot;info&quot;</span>: &#123;<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400">&quot;title&quot;</span>: <span className="text-amber-300">&quot;Focus AI Chief of Staff API&quot;</span>,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400">&quot;description&quot;</span>: <span className="text-amber-300">&quot;Read and manage tasks, projects, whiteboards, blockers, and sessions.&quot;</span><br />
                  &nbsp;&nbsp;&#125;,<br />
                  &nbsp;&nbsp;<span className="text-emerald-400">&quot;paths&quot;</span>: &#123;<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400">&quot;/api/chatgpt/overview&quot;</span>: &#123; <span className="text-neutral-500">{`// Workspace snapshot`}</span> &#125;,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400">&quot;/api/chatgpt/tasks&quot;</span>: &#123; <span className="text-neutral-500">{`// List, filter, create, update tasks`}</span> &#125;,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400">&quot;/api/chatgpt/projects&quot;</span>: &#123; <span className="text-neutral-500">{`// Manage projects & milestones`}</span> &#125;,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400">&quot;/api/chatgpt/meetings&quot;</span>: &#123; <span className="text-neutral-500">{`// Fathom call transcripts`}</span> &#125;<br />
                  &nbsp;&nbsp;&#125;<br />
                  <span className="text-purple-400">&#125;</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SHOWCASE SECTION 2: RELENTLESS EXECUTION: POMODORO & DAILY STREAKS */}
      <section id="deep-work" className="py-24 px-6 sm:px-10 max-w-5xl mx-auto border-t border-black/[0.08]">
        <div className="space-y-4 max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono text-neutral-700">
            <Timer size={12} />
            <span>FLOW STATE COCKPIT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight">
            Built-in Pomodoro deep work and consecutive habit streaks.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
            Shipping consistently is a physical rhythm. Focus integrates interactive 25-minute Pomodoro sprints directly into every task, tracks daily completion streaks, and charts your annual velocity heatmap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Live Interactive Pomodoro Simulator */}
          <div className="md:col-span-6 p-7 sm:p-8 rounded-3xl bg-neutral-50 border border-black/[0.08] space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-black uppercase tracking-wider">
                <Timer size={15} />
                <span>Interactive Deep Work Timer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => resetPomodoro('deep')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer",
                    pomodoroMode === 'deep' ? "bg-black text-white" : "bg-neutral-200/70 text-neutral-600 hover:bg-neutral-200"
                  )}
                >
                  25m Sprint
                </button>
                <button
                  onClick={() => resetPomodoro('break')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer",
                    pomodoroMode === 'break' ? "bg-black text-white" : "bg-neutral-200/70 text-neutral-600 hover:bg-neutral-200"
                  )}
                >
                  5m Reset
                </button>
              </div>
            </div>

            {/* Huge Clean Countdown Display */}
            <div className="text-center py-6 bg-white rounded-2xl border border-black/[0.06] shadow-2xs space-y-2">
              <div className="font-mono text-5xl sm:text-6xl font-light text-black tracking-tighter">
                {formatPomoTime(pomodoroSeconds)}
              </div>
              <div className="text-xs text-neutral-400 font-light">
                {isPomodoroRunning ? 'Deep work session in progress. Stay in flow.' : 'Paused. Ready to begin sprint.'}
              </div>
            </div>

            {/* Task Link Pill */}
            <div className="p-3 bg-white rounded-xl border border-black/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="font-medium text-black truncate">P0: Finalize YouTube Hook &amp; Retention Edit</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 shrink-0">
                Sprint 1 of 4
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePomodoro}
                className="flex-1 py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPomodoroRunning ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPomodoroRunning ? 'Pause Sprint' : 'Start 25m Focus Sprint'}</span>
              </button>
              <button
                onClick={() => resetPomodoro(pomodoroMode)}
                className="py-3 px-4 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-black text-xs font-normal transition-all cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Right Column: Consecutive Daily Streaks & Annual Heatmap */}
          <div className="md:col-span-6 p-7 sm:p-8 rounded-3xl bg-neutral-50 border border-black/[0.08] space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-black uppercase tracking-wider">
                <Flame size={15} className="text-orange-600" />
                <span>Daily Shipping Streak</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                <span>🔥 14 DAYS CONSECUTIVE</span>
              </div>
            </div>

            {/* Heatmap Grid Preview */}
            <div className="p-4 bg-white rounded-2xl border border-black/[0.06] shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                <span>Annual Builder Activity</span>
                <span className="text-emerald-700 font-medium">142 Tasks Shipped</span>
              </div>

              {/* Heatmap Squares */}
              <div className="flex gap-1 overflow-x-auto py-1">
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1 shrink-0">
                    {week.map((level, dIdx) => (
                      <div
                        key={dIdx}
                        className={cn(
                          "w-3 h-3 rounded-[3px] transition-colors",
                          level === 0 && "bg-neutral-100",
                          level === 1 && "bg-emerald-200",
                          level === 2 && "bg-emerald-400",
                          level === 3 && "bg-emerald-600"
                        )}
                        title={`Activity level ${level}`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-1 border-t border-black/[0.04]">
                <span>Less</span>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-neutral-100" />
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-200" />
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400" />
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600" />
                </div>
                <span>More</span>
              </div>
            </div>

            {/* Velocity Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white rounded-xl border border-black/[0.06]">
                <div className="text-[10px] text-neutral-400 font-mono">Streak</div>
                <div className="text-base font-semibold text-black mt-0.5">14 Days</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-black/[0.06]">
                <div className="text-[10px] text-neutral-400 font-mono">Deep Work</div>
                <div className="text-base font-semibold text-emerald-600 mt-0.5">38.5 hrs</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-black/[0.06]">
                <div className="text-[10px] text-neutral-400 font-mono">On-Time</div>
                <div className="text-base font-semibold text-purple-600 mt-0.5">98.4%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SHOWCASE SECTION 3: CONNECTED SYSTEMS: WHITEBOARD & FATHOM */}
      <section className="py-24 px-6 sm:px-10 max-w-5xl mx-auto border-t border-black/[0.08]">
        <div className="space-y-4 max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono text-neutral-700">
            <Layers size={12} />
            <span>UNIFIED SYSTEM PIPELINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight">
            Infinite Whiteboard directly linked to Fathom transcripts and calendar tasks.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
            No fragmented tools. When a client speaks on a Fathom call, your meeting summary automatically creates visual nodes on your Infinite Whiteboard, which can be linked to executable P0 calendar tasks with one click.
          </p>
        </div>

        {/* Visual Node-Flow Diagram */}
        <div className="p-6 sm:p-10 rounded-3xl bg-neutral-50 border border-black/[0.08] space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            {/* Stage 1 */}
            <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center text-[10px]">
                  <Video size={12} />
                </span>
                <span className="text-[9px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">Fathom</span>
              </div>
              <div className="text-xs font-medium text-black">Client Strategy Call</div>
              <p className="text-[10px] text-neutral-400 font-light leading-relaxed">
                Full transcript and action points auto-extracted in real time.
              </p>
            </div>

            {/* Stage 2 */}
            <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                  <Sparkles size={12} />
                </span>
                <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">AI Extraction</span>
              </div>
              <div className="text-xs font-medium text-black">Takeaways Filtered</div>
              <p className="text-[10px] text-neutral-400 font-light leading-relaxed">
                3 high-impact deliverables isolated from spoken conversation.
              </p>
            </div>

            {/* Stage 3 */}
            <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center text-[10px]">
                  <Layers size={12} />
                </span>
                <span className="text-[9px] font-mono text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">Canvas</span>
              </div>
              <div className="text-xs font-medium text-black">Whiteboard Mapping</div>
              <p className="text-[10px] text-neutral-400 font-light leading-relaxed">
                Visual node connections mapped to creative assets and briefs.
              </p>
            </div>

            {/* Stage 4 */}
            <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  <Calendar size={12} />
                </span>
                <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Calendar ICS</span>
              </div>
              <div className="text-xs font-medium text-black">Execution &amp; Pomodoro</div>
              <p className="text-[10px] text-neutral-400 font-light leading-relaxed">
                Syncs to Apple &amp; Google Calendar with instant Pomodoro sprint trigger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SHOWCASE SECTION 4: CREATOR PERFORMANCE SUITE (YouTube & Instagram) */}
      <section id="creator-suite" className="py-24 px-6 sm:px-10 max-w-5xl mx-auto border-t border-black/[0.08]">
        <div className="space-y-4 max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono text-neutral-700">
            <Camera size={12} />
            <span>CREATOR SUITE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight">
            Built for modern solo creators and video businesses.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
            Monitor YouTube retention curves, stage 9:16 vertical Reels, schedule sponsor deliverables, and track audience drop-off points alongside your development sprint.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* YouTube Retention Studio */}
          <div className="p-7 sm:p-8 rounded-3xl bg-neutral-50 border border-black/[0.08] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center">
                  <Play size={11} fill="white" />
                </div>
                <span className="text-xs font-semibold text-black">YouTube Retention Intelligence</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                CTR 11.4%
              </span>
            </div>

            {/* Retention Curve Visual */}
            <div className="p-4 bg-white rounded-2xl border border-black/[0.06] space-y-3">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                <span>Audience Retention Curve (12:00)</span>
                <span className="text-purple-600 font-medium">Avg: 62%</span>
              </div>

              {/* Simulated Retention Curve SVG */}
              <div className="w-full h-24 bg-neutral-50 rounded-xl p-2 relative overflow-hidden flex items-end">
                <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                  <path
                    d="M 0,10 Q 30,25 70,30 T 150,45 T 230,50 T 300,55 L 300,80 L 0,80 Z"
                    fill="rgba(147, 51, 234, 0.1)"
                  />
                  <path
                    d="M 0,10 Q 30,25 70,30 T 150,45 T 230,50 T 300,55"
                    fill="none"
                    stroke="#9333ea"
                    strokeWidth="2.5"
                  />
                  {/* Critical 0:03 Hook marker */}
                  <circle cx="30" cy="25" r="4" fill="#ef4444" />
                </svg>
                <div className="absolute top-2 left-8 text-[9px] font-mono text-red-600 bg-red-50 px-1 rounded">
                  0:03 Hook Point (88% retained)
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>0:00 Intro</span>
                <span>4:00 Sponsor Cue</span>
                <span>8:00 Case Study</span>
                <span>12:00 CTA</span>
              </div>
            </div>

            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Test opening hooks, diagnose drop-off segments before launching sponsor revisions, and synchronize cue points with your project deliverables.
            </p>
          </div>

          {/* Instagram Visual Planner */}
          <div className="p-7 sm:p-8 rounded-3xl bg-neutral-50 border border-black/[0.08] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <Camera size={12} />
                </div>
                <span className="text-xs font-semibold text-black">Instagram Visual Grid</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 bg-neutral-200/80 px-2 py-0.5 rounded">
                Reels &amp; Carousels
              </span>
            </div>

            {/* Visual Grid Preview */}
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-[9/16] bg-white rounded-xl border border-black/[0.08] p-2 flex flex-col justify-between">
                <span className="text-[9px] font-mono text-emerald-600">6:30 PM Peak</span>
                <span className="text-[10px] font-medium text-black leading-tight">Reel: 1-Person Tech Setup</span>
                <span className="text-[8px] font-mono text-neutral-400">Scheduled</span>
              </div>
              <div className="aspect-[9/16] bg-white rounded-xl border border-black/[0.08] p-2 flex flex-col justify-between">
                <span className="text-[9px] font-mono text-purple-600">Carousel</span>
                <span className="text-[10px] font-medium text-black leading-tight">10 Slides: Systems Design</span>
                <span className="text-[8px] font-mono text-neutral-400">Review</span>
              </div>
              <div className="aspect-[9/16] bg-neutral-100 rounded-xl border border-dashed border-neutral-300 p-2 flex flex-col items-center justify-center text-center">
                <span className="text-neutral-400 text-lg font-light">+</span>
                <span className="text-[9px] text-neutral-400">Drop Slot</span>
              </div>
            </div>

            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Stage 9:16 vertical video drafts, preview caption hooks, schedule drops for peak engagement windows, and manage deliverables with zero context switching.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: FAQ */}
      <section id="faq" className="py-24 px-6 sm:px-10 max-w-3xl mx-auto border-t border-black/[0.08]">
        <div className="text-center mb-12 space-y-2">
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

      {/* Clean Minimal Footer: Focus Reticle Icon (Zero Letters) */}
      <footer className="py-12 px-6 border-t border-black/[0.08] text-center space-y-3 text-xs text-neutral-400 font-light">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-black text-white flex items-center justify-center">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="1" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="23" />
              <line x1="1" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="23" y2="12" />
            </svg>
          </div>
          <span className="font-medium text-black">Focus by AHMV Systems</span>
        </div>

        <div className="flex items-center justify-center gap-2 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>All systems operational</span>
        </div>

        <div className="text-[11px]">
          &copy; {new Date().getFullYear()} Focus by AHMV Systems. Built for founders, solo creators, and builders.
        </div>
      </footer>

      {/* Authentication Modal: Focus Reticle Icon (Zero Letters) */}
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
                  Click the link in your email to open your workspace instantly.
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
                  {/* Focus Reticle Icon: Zero Letters */}
                  <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="4" />
                      <line x1="12" y1="1" x2="12" y2="4" />
                      <line x1="12" y1="20" x2="12" y2="23" />
                      <line x1="1" y1="12" x2="4" y2="12" />
                      <line x1="20" y1="12" x2="23" y2="12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-normal text-black">
                    {mode === 'login' ? 'Sign in to Focus by AHMV Systems' : 'Create your free workspace'}
                  </h3>
                  <p className="text-xs text-neutral-500 font-light">
                    {mode === 'login' ? 'Access your projects, whiteboard, and tasks.' : 'Takes less than 30 seconds. No credit card required.'}
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
