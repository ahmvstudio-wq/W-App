'use client'

export const runtime = 'edge'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowRight, Check, CheckSquare, Video, ExternalLink, 
  ChevronDown, Calendar, RefreshCw, X, Mail, Play, Camera, 
  MessageSquare, FolderKanban, Layers, FileText, Activity
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

  const faqs = [
    {
      q: 'What is Focus and how does it replace fragmented tools?',
      a: 'Focus is a unified operating workspace for founders, creators, and solo builders. Instead of juggling one app for whiteboards, another for tasks, a third for meeting recordings, and a fourth for calendar planning, Focus connects your entire workflow into one cohesive system.',
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
      q: 'What creator features are currently on the roadmap?',
      a: 'We are extending the platform with dedicated YouTube analytics tracking (CTR, views, retention curves), automated Instagram Reel and carousel scheduling, and conversational ChatGPT life-context integration to auto-structure your weekly priorities.',
    },
    {
      q: 'Is Focus free to use?',
      a: 'Yes. You can launch your free workspace right now in under 30 seconds with zero credit card required.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0c0d0f] font-sans selection:bg-black/10 relative">
      {/* Spacious, Minimal Floating Navbar */}
      <nav className="fixed top-5 left-0 right-0 z-40 max-w-5xl mx-auto px-6">
        <div className="bg-white/90 backdrop-blur-md border border-black/[0.08] shadow-xs rounded-full px-6 py-3.5 flex items-center justify-between transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-black text-white flex items-center justify-center font-semibold text-xs shadow-xs">
              F
            </div>
            <span className="font-semibold tracking-tight text-sm text-black">Focus</span>
            <span className="text-[11px] text-neutral-400 font-mono tracking-tight hidden sm:inline">by AHMV Systems</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-normal text-neutral-500">
            <a href="#system" className="hover:text-black transition-colors">Architecture</a>
            <a href="#capabilities" className="hover:text-black transition-colors">Capabilities</a>
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
            From high-level architecture and visual whiteboards to P0 tasks, meeting transcripts, and upcoming creator pipelines. Focus unifies your entire workflow into one cohesive system.
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
              href="#system"
              className="px-5 py-3 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-black/[0.08] text-black text-xs font-normal transition-all"
            >
              Explore System Architecture ↓
            </a>
          </div>
        </div>

        {/* Systems Design Showcase: macOS Product Window */}
        <div id="system" className="relative max-w-5xl mx-auto">
          {/* Floating Motion Pill 1: YouTube Pipeline (Noticeable 14px float) */}
          <div 
            className="absolute -top-5 -right-3 sm:-right-6 z-30 bg-white border border-black/[0.1] shadow-lg rounded-2xl px-3.5 py-2 flex items-center gap-2.5 text-xs animate-float-slow select-none"
            style={{ animation: 'float-slow 4s ease-in-out infinite' }}
          >
            <div className="w-5 h-5 rounded-lg bg-red-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
              <Play size={10} fill="white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-medium text-black text-[11px] leading-tight">YouTube Pipeline</span>
              <span className="text-[9px] text-neutral-400 font-mono">Coming Soon</span>
            </div>
          </div>

          {/* Floating Motion Pill 2: Fathom Engine (Noticeable 14px float reverse) */}
          <div 
            className="absolute -bottom-5 -left-3 sm:-left-6 z-30 bg-white border border-black/[0.1] shadow-lg rounded-2xl px-3.5 py-2 flex items-center gap-2.5 text-xs animate-float-reverse select-none"
            style={{ animation: 'float-delayed 4.5s ease-in-out infinite 0.5s' }}
          >
            <div className="w-5 h-5 rounded-lg bg-black text-white flex items-center justify-center text-[10px] shadow-xs">
              <Video size={11} />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-medium text-black text-[11px] leading-tight">Fathom Meeting Engine</span>
              <span className="text-[9px] text-emerald-600 font-mono">Live Sync Active</span>
            </div>
          </div>

          {/* macOS Minimal Preview Window */}
          <div className="rounded-3xl border border-black/[0.1] bg-[#ffffff] shadow-2xl shadow-black/[0.06] overflow-hidden">
            {/* Window Titlebar */}
            <div className="px-5 py-3.5 bg-neutral-50/80 border-b border-black/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/[0.08]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/[0.08]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840] border border-black/[0.08]" />
              </div>
              <div className="text-xs font-mono text-neutral-500">
                Focus : Studio Workspace
              </div>
              <div className="w-12 text-right">
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Online
                </span>
              </div>
            </div>

            {/* Top Workspace System Navigation Bar */}
            <div className="px-6 py-2.5 bg-white border-b border-black/[0.06] flex items-center gap-6 text-xs text-neutral-500 overflow-x-auto">
              <span className="text-black font-semibold flex items-center gap-1.5 shrink-0">
                <Activity size={13} />
                <span>Dashboard</span>
              </span>
              <span className="hover:text-black transition-colors flex items-center gap-1.5 shrink-0">
                <FolderKanban size={13} />
                <span>Projects</span>
              </span>
              <span className="hover:text-black transition-colors flex items-center gap-1.5 shrink-0">
                <Layers size={13} />
                <span>Whiteboard</span>
              </span>
              <span className="hover:text-black transition-colors flex items-center gap-1.5 shrink-0">
                <CheckSquare size={13} />
                <span>Tasks</span>
              </span>
              <span className="hover:text-black transition-colors flex items-center gap-1.5 shrink-0">
                <Video size={13} />
                <span>Meetings</span>
              </span>
              <span className="hover:text-black transition-colors flex items-center gap-1.5 shrink-0">
                <Calendar size={13} />
                <span>Calendar</span>
              </span>
              <span className="hover:text-black transition-colors flex items-center gap-1.5 shrink-0">
                <FileText size={13} />
                <span>Documents</span>
              </span>
            </div>

            {/* Cohesive 3-Column Systems Content Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-white text-left">
              {/* Column 1: Strategic Initiatives & Whiteboard Architecture */}
              <div className="md:col-span-4 space-y-4">
                <div className="flex items-center justify-between pb-1.5 border-b border-black/[0.06]">
                  <span className="text-xs font-semibold text-black uppercase tracking-wider flex items-center gap-1.5">
                    <FolderKanban size={13} />
                    <span>Active Projects</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">3 Total</span>
                </div>

                {/* Project Card */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black">Focus Core Architecture</span>
                    <span className="text-[10px] font-mono text-emerald-700 font-semibold">84%</span>
                  </div>
                  <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '84%' }} />
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Milestone: Fathom Webhook Engine (Done)
                  </div>
                </div>

                {/* Visual Whiteboard Snippet */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black flex items-center gap-1.5">
                      <Layers size={13} />
                      <span>Visual Whiteboard</span>
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400">Canvas</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-black/[0.06] font-mono text-[10px] text-neutral-600 space-y-1">
                    <div className="text-emerald-700">[Node: Client Call]</div>
                    <div className="text-neutral-400 pl-2">&darr; Fathom Transcript</div>
                    <div className="text-black pl-2 font-medium">[Node: Calendar P0 Task]</div>
                  </div>
                </div>
              </div>

              {/* Column 2: Execution Engine (P0 to P2 Tasks) */}
              <div className="md:col-span-4 space-y-4">
                <div className="flex items-center justify-between pb-1.5 border-b border-black/[0.06]">
                  <span className="text-xs font-semibold text-black uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare size={13} />
                    <span>Today&apos;s Execution</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">3 of 5 Done</span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-neutral-50 border border-black/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span className="text-xs text-neutral-400 line-through font-light">
                        Deploy calendar ICS feed
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-200/80 text-neutral-600">
                      Done
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-black/[0.1] shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-md border border-black/[0.3]" />
                      <span className="text-xs font-medium text-black">
                        Deliver Sony sponsor color grade
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-medium">
                      P0: 2:00 PM
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-black/[0.1] shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-md border border-black/[0.3]" />
                      <span className="text-xs font-medium text-black">
                        Upload YouTube 1-Person Business
                      </span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                      P1: 4:00 PM
                    </span>
                  </div>
                </div>

                {/* Velocity Indicator */}
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-black/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">Monthly Execution:</span>
                  <span className="font-mono text-black font-semibold">142 Tasks Shipped</span>
                </div>
              </div>

              {/* Column 3: Meeting Intelligence & Upcoming Creator Pipeline */}
              <div className="md:col-span-4 space-y-4">
                <div className="flex items-center justify-between pb-1.5 border-b border-black/[0.06]">
                  <span className="text-xs font-semibold text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Video size={13} />
                    <span>Intelligence &amp; Drops</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600">Synced</span>
                </div>

                {/* Fathom Call Card */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-black">Fathom Meeting Synced</span>
                    <span className="text-[9px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      32 mins
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-600 font-light truncate">
                    Takeaway converted to P0 calendar task.
                  </div>
                </div>

                {/* YouTube Studio Card (Coming Soon) */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-black/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-red-600 text-white flex items-center justify-center text-[7px] font-bold">
                        <Play size={8} fill="white" />
                      </div>
                      <span className="text-xs font-medium text-black">YouTube Studio</span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-600">
                      Coming Soon
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="p-1 bg-white rounded border border-black/[0.05] text-[10px]">
                      <span className="text-neutral-400 block font-mono text-[8px]">Views</span>
                      <strong className="text-black">48.2k</strong>
                    </div>
                    <div className="p-1 bg-white rounded border border-black/[0.05] text-[10px]">
                      <span className="text-neutral-400 block font-mono text-[8px]">CTR</span>
                      <strong className="text-emerald-600">11.4%</strong>
                    </div>
                    <div className="p-1 bg-white rounded border border-black/[0.05] text-[10px]">
                      <span className="text-neutral-400 block font-mono text-[8px]">Retention</span>
                      <strong className="text-purple-600">62%</strong>
                    </div>
                  </div>
                </div>

                {/* Calendar Sync Status */}
                <div className="p-3 rounded-2xl bg-neutral-50 border border-black/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-neutral-500" />
                    <span className="text-neutral-700 font-medium">Calendar Sync</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700">Google &amp; Apple</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: THE 6 CORE OG SYSTEM CAPABILITIES */}
      <section id="capabilities" className="py-24 px-6 sm:px-10 max-w-5xl mx-auto border-t border-black/[0.08]">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <div className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
            CORE PLATFORM
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight">
            Engineered for deep focus and relentless execution.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-light">
            Every tool in Focus was built to remove friction between idea, decision, and delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Strategic Projects & Milestones */}
          <div className="p-6 rounded-3xl bg-neutral-50 border border-black/[0.06] space-y-3 hover:border-black/[0.15] transition-all">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
              <FolderKanban size={16} />
            </div>
            <h3 className="text-base font-normal text-black">Strategic Projects &amp; Milestones</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Group related initiatives, track completion percentages, monitor project health, and map dependencies without enterprise bureaucracy.
            </p>
          </div>

          {/* Card 2: Infinite Visual Whiteboard */}
          <div className="p-6 rounded-3xl bg-neutral-50 border border-black/[0.06] space-y-3 hover:border-black/[0.15] transition-all">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
              <Layers size={16} />
            </div>
            <h3 className="text-base font-normal text-black">Infinite Visual Whiteboard</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Native node-based canvas inside every project. Architect system flows, brainstorm video hooks, and connect visual ideas directly to tasks.
            </p>
          </div>

          {/* Card 3: Frictionless Task Execution */}
          <div className="p-6 rounded-3xl bg-neutral-50 border border-black/[0.06] space-y-3 hover:border-black/[0.15] transition-all">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
              <CheckSquare size={16} />
            </div>
            <h3 className="text-base font-normal text-black">P0 to P3 Task Architecture</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Lightning-fast execution engine with list and kanban views. Prioritize P0 client revisions and P1 deliverables with zero form fields.
            </p>
          </div>

          {/* Card 4: Fathom Meeting Transcripts */}
          <div className="p-6 rounded-3xl bg-neutral-50 border border-black/[0.06] space-y-3 hover:border-black/[0.15] transition-all">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
              <Video size={16} />
            </div>
            <h3 className="text-base font-normal text-black">Fathom Meeting Intelligence</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Spoken discussions converted directly to execution. Call recordings, full transcripts, and 1-click takeaway conversion to calendar tasks.
            </p>
          </div>

          {/* Card 5: Universal Calendar Sync */}
          <div className="p-6 rounded-3xl bg-neutral-50 border border-black/[0.06] space-y-3 hover:border-black/[0.15] transition-all">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <h3 className="text-base font-normal text-black">Universal Calendar Sync</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Connect via live ICS feed to Google Calendar, Apple Calendar, and Outlook. Your deadlines and drop schedules reflect in real time.
            </p>
          </div>

          {/* Card 6: Project Documents & Notes */}
          <div className="p-6 rounded-3xl bg-neutral-50 border border-black/[0.06] space-y-3 hover:border-black/[0.15] transition-all">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
              <FileText size={16} />
            </div>
            <h3 className="text-base font-normal text-black">Living Documents &amp; Briefs</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Rich project specifications, creative briefs, sponsor contracts, and architecture notes stored directly alongside the tasks that fulfill them.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: UPCOMING CREATOR SUITE (YouTube, Instagram, ChatGPT) */}
      <section id="creator-suite" className="py-24 px-6 sm:px-10 max-w-5xl mx-auto border-t border-black/[0.08]">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
          <div className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
            UPCOMING ROADMAP
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight">
            Extending the system for modern creators.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-light">
            Bringing the same systems-level rigor to content pipelines and audience retention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Creator Pillar 1: YouTube */}
          <div className="p-6 rounded-3xl bg-neutral-50 border border-black/[0.06] space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center">
                <Play size={15} fill="white" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-600">
                Coming Soon
              </span>
            </div>
            <h3 className="text-base font-normal text-black">YouTube Studio Pipeline</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Stage long-form video drops and Shorts (9:16). Monitor Click-Through Rate (CTR), track audience retention curves, and test opening 3-second hooks before publishing.
            </p>
            <div className="text-[11px] font-mono text-neutral-400 pt-2 border-t border-black/[0.05]">
              Metrics: CTR, APV, Sponsor Cue-Points
            </div>
          </div>

          {/* Creator Pillar 2: Instagram */}
          <div className="p-6 rounded-3xl bg-neutral-50 border border-black/[0.06] space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                <Camera size={16} />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-600">
                Coming Soon
              </span>
            </div>
            <h3 className="text-base font-normal text-black">Instagram Visual Planner</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Visually stage your 9:16 Reels and 10-slide carousels. Schedule drops for optimal engagement windows and track sponsor deliverables with zero tab-switching.
            </p>
            <div className="text-[11px] font-mono text-neutral-400 pt-2 border-t border-black/[0.05]">
              Features: Reel Staging, Auto-Posting
            </div>
          </div>

          {/* Creator Pillar 3: ChatGPT Life Context */}
          <div className="p-6 rounded-3xl bg-neutral-50 border border-black/[0.06] space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
                <MessageSquare size={16} />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-600">
                Coming Soon
              </span>
            </div>
            <h3 className="text-base font-normal text-black">ChatGPT Life Context</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Feed your schedule, shoot days, and contracts to ChatGPT in plain conversational English. It translates your context into structured projects, milestones, and daily priorities.
            </p>
            <div className="text-[11px] font-mono text-neutral-400 pt-2 border-t border-black/[0.05]">
              Integration: OpenAPI Custom Action
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FAQ */}
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

      {/* Clean Minimal Footer */}
      <footer className="py-12 px-6 border-t border-black/[0.08] text-center space-y-2 text-xs text-neutral-400 font-light">
        <div className="flex items-center justify-center gap-2 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>All systems operational</span>
        </div>
        <div className="text-[11px]">
          &copy; {new Date().getFullYear()} Focus by AHMV Systems. Built for founders, solo creators, and builders.
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
                  <div className="w-10 h-10 rounded-2xl bg-black text-white font-semibold text-xs flex items-center justify-center mx-auto mb-3 shadow-xs">
                    F
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
