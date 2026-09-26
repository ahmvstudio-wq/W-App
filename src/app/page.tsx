'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, X, ChevronDown, Plus, Play, Pause, RotateCcw, 
  Check, Sparkles, Terminal, Cpu, Database, Share2, Layers,
  ExternalLink, Zap, ShieldCheck, Clock, TrendingUp, Calendar, Video
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import LandingMenuModal from '@/components/LandingMenuModal'

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Animated word reveal for Apple-style cinematic typography
const AnimatedText = ({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) => {
  const words = text.split(" ")
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.035, delayChildren: delay }
        }
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      className={className}
    >
      {words.map((word, index) => (
        <span key={index} className="inline-block overflow-hidden mr-[0.22em] pb-1">
          <motion.span 
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { ease, duration: 0.75 }
              }
            }} 
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.div>
  )
}

// Integration fleet list with clean monochrome branding & metadata
const INTEGRATIONS = [
  { name: 'Fathom Video', role: 'Meeting Takeaways & Action Items', tag: 'Native Webhook' },
  { name: 'Google Drive', role: 'Raw Media Ingestion & Content Vault', tag: 'Direct Storage' },
  { name: 'YouTube Studio', role: 'Video Publishing & Retention Analytics', tag: 'Omnichannel' },
  { name: 'Instagram', role: 'Reels & Carousel Staging Pipeline', tag: 'Social API' },
  { name: 'Claude 3.5 Sonnet', role: 'Autonomous Background Sprint Planner', tag: 'OpenAPI 3.1' },
  { name: 'OpenAI GPT-4o', role: 'Headless Context Assistant Connector', tag: 'Live GPT Action' },
  { name: 'GitHub', role: 'Commit Sync & Shipping Velocity', tag: 'Codebase Bridge' },
  { name: 'Figma', role: 'Design Canvas & Spec Linking', tag: 'Asset Bridge' },
  { name: 'Linear', role: 'Bi-Directional Issue Sync', tag: 'Workflow Hub' },
  { name: 'Slack', role: 'Daily Executive Digest Dispatch', tag: 'Bot Gateway' },
  { name: 'Notion', role: 'Document Memo & PRD Import', tag: 'Sync Engine' },
  { name: 'Apple Calendar', role: 'Deep Work Timeboxing Blocks', tag: 'iCal Sync' }
]

// Headless AI Simulator Workflows
const HEADLESS_WORKFLOWS = [
  {
    id: 'meeting',
    title: 'Zero-Input Meeting Distiller',
    subtitle: 'Fathom call finishes -> Headless AI creates sprint tasks automatically.',
    inputLabel: 'Incoming Call: Architecture Sprint Review (42 min)',
    rawSnippet: `[00:14:20] "We definitely need to migrate the database indexes to Postgres before Friday."\n[00:28:10] "Let's also make sure the OAuth callback handles token refresh errors silently."`,
    outputSummary: '3 Actionable Deliverables Created & Ranked',
    actions: [
      { title: 'Migrate Postgres database indexes for sprint query load', priority: 'P0', time: '45m', status: 'Queued' },
      { title: 'Patch silent token refresh retry logic in OAuth callback', priority: 'P1', time: '30m', status: 'Queued' },
      { title: 'Sync migration documentation into Document Memo Hub', priority: 'P2', time: '15m', status: 'Queued' },
    ]
  },
  {
    id: 'sprint',
    title: 'Autonomous Sprint Planner',
    subtitle: 'Set a high-level outcome -> Headless AI organizes your deep work calendar.',
    inputLabel: 'Creator Prompt: "Ship the v1.0 public launch landing page this sprint"',
    rawSnippet: `Goal: Deliver high-converting Apple-style landing page with interactive Headless AI simulator, telemetry graphs, and live OAuth authentication.`,
    outputSummary: 'Calculated 14.5 Focused Hours across 5 Deliverables',
    actions: [
      { title: 'Hero Section: Ambient light tracking & typography hierarchy', priority: 'P0', time: '90m', status: 'Ready' },
      { title: 'Interactive Headless AI Simulator cockpit component', priority: 'P0', time: '120m', status: 'Ready' },
      { title: 'Integration marquee fleet with infinite kinetic velocity', priority: 'P1', time: '45m', status: 'Ready' },
    ]
  },
  {
    id: 'content',
    title: 'Omnichannel Content Engine',
    subtitle: 'Upload raw video footage to Drive -> Headless AI generates hooks & schedules.',
    inputLabel: 'Google Drive File: studio_vlog_ep48_final_4k.mp4 (1.8 GB)',
    rawSnippet: `Audio Transcribed: "Why traditional productivity tools fail high-agency builders..." -> Extracted 3 high-retention 3-second hook candidates.`,
    outputSummary: 'Staged Across YouTube & Instagram with Viral Curve Analysis',
    actions: [
      { title: 'Shorts Hook: "Stop organizing work. Start shipping."', priority: 'Viral 88%', time: 'Schedule', status: 'Staged' },
      { title: 'Instagram Reel: Behind-the-scenes engineering studio tour', priority: 'Viral 76%', time: 'Schedule', status: 'Staged' },
      { title: 'Long-form YouTube: Deep dive on headless workspace architecture', priority: 'P0 Vault', time: 'Schedule', status: 'Staged' },
    ]
  }
]

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeWorkflow, setActiveWorkflow] = useState<number>(0)
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false)

  // Interactive Live Pomodoro Simulator inside showcase
  const [timerSeconds, setTimerSeconds] = useState(25 * 60)
  const [timerActive, setTimerActive] = useState(false)

  // Mouse tracking ambient spotlight coordinates
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, { damping: 30, stiffness: 200 })
  const smoothMouseY = useSpring(mouseY, { damping: 30, stiffness: 200 })

  const heroRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const authErr = params.get('auth_error')
      if (authErr) {
        setError(authErr)
        setIsAuthOpen(true)
        setMode('login')
      }
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Mouse move handler for the hero interactive ambient spotlight
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  // Timer ticker for live in-app preview
  useEffect(() => {
    let interval: any = null
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(s => s - 1), 1000)
    } else if (timerSeconds === 0) {
      setTimerActive(false)
    }
    return () => clearInterval(interval)
  }, [timerActive, timerSeconds])

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
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
      q: 'Why do you call Cultlike the "Anti-Productivity" app?',
      a: 'Traditional productivity apps turn you into a project manager for yourself. You spend hours creating tags, moving cards, and writing status reports instead of building. Cultlike eliminates this meta-work. With Headless AI, meeting intelligence, and 25-minute execution blocks, the workspace manages itself in the background.',
    },
    {
      q: 'What exactly is Headless AI?',
      a: 'Headless AI is background intelligence that operates without requiring you to open a chat box or write prompts. It automatically listens to your completed Fathom calls, analyzes your Google Drive uploads, and connects to Claude or ChatGPT via secure OpenAPI 3.1 endpoints to turn raw ideas into shipped work.',
    },
    {
      q: 'How does the deep work chronograph and streak tracking work?',
      a: 'Every deliverable in your workspace has an integrated 25-minute Pomodoro timer. As you focus and ship deliverables, Cultlike logs your actual focused hours, updates your consecutive daily streak, and visualizes your velocity on an annual 52-week heatmap.',
    },
    {
      q: 'How do meeting summaries turn into tasks?',
      a: 'When your Fathom call finishes, the full transcript and AI action items sync instantly. You can convert any spoken takeaway into an executable P0 deliverable with a single click, ensuring nothing gets lost.',
    },
    {
      q: 'Is Cultlike OS free for solo creators and founders?',
      a: 'Yes. Cultlike is 100% free for solo builders. You can launch your complete workspace in under 30 seconds with no credit card required.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#fafafc] text-[#0c0d0f] selection:bg-sky-500/20 relative font-sans overflow-x-hidden">

      {/* ─── STICKY APPLE-STYLE FROSTED GLASS HEADER ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] transition-all">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-10 h-16 sm:h-[72px] flex items-center justify-between relative">
          {/* Left: Brand Emblem */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <img 
                src="/logo-cultlike.png" 
                alt="Cultlike Logo" 
                className="h-11 w-11 sm:h-12 sm:w-12 object-contain rounded-full hover:scale-105 transition-transform shadow-[0_2px_8px_rgba(0,0,0,0.06)]" 
              />
            </Link>
          </div>

          {/* Center: Iconic Pill Menu Button (Dead center via exact absolute positioning) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto z-10">
            <button 
              onClick={() => setIsMenuOpen(true)}
              type="button"
              className="inline-flex items-center gap-2.5 px-5 py-1.5 sm:py-2 rounded-full border border-neutral-200/90 bg-white hover:bg-neutral-50 active:scale-[0.98] text-neutral-900 text-sm font-medium shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all cursor-pointer select-none"
              title="Open Navigation Menu"
            >
              <svg className="w-4 h-2.5 text-neutral-900" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="1" y1="2" x2="15" y2="2" />
                <line x1="1" y1="8" x2="15" y2="8" />
              </svg>
              <span>Menu</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 font-sans">
            <button
              onClick={() => { setMode('login'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="hidden sm:inline-block text-xs font-medium text-neutral-600 hover:text-black px-3.5 py-1.5 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="px-5 py-2 sm:py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium shadow-xs hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Menu Modal Component */}
      <LandingMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenAuth={(authMode) => {
          setMode(authMode)
          setConfirmationSent(false)
          setIsAuthOpen(true)
        }}
      />

      {/* ─── TARGETED SKY-BLUE SUBTLE AMBIENT LIGHTING ACCENTS (NO PINK / NO MULTICOLOR) ─── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(56,189,248,0.07),rgba(255,255,255,0))] pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-20 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(56,189,248,0.04),rgba(255,255,255,0))] pointer-events-none z-0" />

      {/* ─── HERO SECTION (NOTHING BUT TEXT IN MIDDLE WITH INTERACTIVE AMBIENT ACCENTS) ─── */}
      <section 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-[90vh] flex flex-col items-center justify-center pt-28 sm:pt-36 pb-20 px-6 sm:px-10 max-w-[1200px] mx-auto text-center z-10 select-none"
      >
        {/* Interactive Mouse Follower Spotlight (Subtle Sky-Blue Specular Aura) */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 blur-[100px] z-0 opacity-70"
          style={{
            left: smoothMouseX,
            top: smoothMouseY,
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(14, 165, 233, 0.04) 45%, transparent 70%)'
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto space-y-7 flex flex-col items-center">
          
          {/* Minimalist Brand Category Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-500/20 bg-sky-50/60 backdrop-blur-md shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-sky-950 font-medium">
              THE ANTI-PRODUCTIVITY OPERATING SYSTEM
            </span>
          </motion.div>

          {/* Giant Apple-Style Headline */}
          <h1 className="text-[clamp(40px,7vw,84px)] font-normal tracking-[-0.04em] leading-[1.04] text-black">
            <AnimatedText text="Stop organizing work." className="font-semibold text-black" />
            <span className="text-neutral-400 font-light block mt-1">
              <AnimatedText text="Start shipping." delay={0.25} />
            </span>
          </h1>

          {/* Simple, Punchy, Human Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease, duration: 0.7, delay: 0.4 }}
            className="text-base sm:text-xl text-neutral-600 font-light leading-relaxed max-w-2xl mx-auto"
          >
            Traditional productivity apps force you to do meta-work — endlessly moving cards, setting tags, and writing tickets. Cultlike runs silently in the background with <strong className="font-medium text-black">Headless AI</strong>, turning your meetings, thoughts, and recordings into delivered work.
          </motion.p>

          {/* Interactive CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease, duration: 0.7, delay: 0.55 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3 w-full sm:w-auto"
          >
            <button
              onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-medium transition-all cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <span>Launch Free Workspace</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#headless-simulator"
              className="w-full sm:w-auto px-7 py-4 rounded-full border border-black/[0.1] hover:border-black/[0.25] bg-white/80 backdrop-blur-md text-sm font-normal text-black transition-all cursor-pointer shadow-xs hover:bg-white flex items-center justify-center gap-2"
            >
              <span>See Headless AI in Action</span>
              <ChevronDown size={14} className="text-neutral-500" />
            </a>
          </motion.div>

          {/* Minimalist Live Telemetry Pill */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="pt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-mono text-neutral-500"
          >
            <span className="flex items-center gap-1.5">
              <Check size={13} className="text-sky-600 stroke-[2.5]" />
              <span>Zero Backlog Grooming</span>
            </span>
            <span className="hidden sm:inline text-neutral-300">•</span>
            <span className="flex items-center gap-1.5">
              <Check size={13} className="text-sky-600 stroke-[2.5]" />
              <span>Live Fathom & Drive Sync</span>
            </span>
            <span className="hidden sm:inline text-neutral-300">•</span>
            <span className="flex items-center gap-1.5">
              <Check size={13} className="text-sky-600 stroke-[2.5]" />
              <span>100% Free for Solo Creators</span>
            </span>
          </motion.div>

        </div>
      </section>


      {/* ─── INTEGRATIONS LOGO FLEET (INFINITE SMOOTH KINETIC SCROLL MARQUEE) ─── */}
      <section className="py-14 border-y border-black/[0.06] bg-white/60 backdrop-blur-sm relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 mb-6 text-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-medium">
            CONNECTED TO YOUR ENTIRE CREATIVE STACK
          </span>
        </div>

        {/* Marquee Track (Duplicated for Seamless Infinite Loop) */}
        <div className="flex overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex gap-4 items-center shrink-0 animate-marquee py-2">
            {INTEGRATIONS.concat(INTEGRATIONS).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-black/[0.06] shadow-2xs hover:border-sky-500/30 hover:shadow-xs hover:scale-[1.02] transition-all cursor-default shrink-0 group"
              >
                <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-xs font-mono font-semibold text-black group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900 leading-none group-hover:text-black">
                    {item.name}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 mt-1">
                    {item.role}
                  </div>
                </div>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-neutral-50 text-[9px] font-mono text-neutral-500 border border-black/[0.04]">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── HEADLESS AI SIMULATOR (INTERACTIVE LIVE WORKFLOW COCKPIT) ─── */}
      <section id="headless-simulator" className="py-24 sm:py-36 px-6 sm:px-10 max-w-[1300px] mx-auto relative z-10">
        <div className="space-y-4 text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-800 text-[10px] font-mono uppercase tracking-wider">
            <Cpu size={12} className="text-sky-600" />
            <span>BACKGROUND EXECUTION ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-black">
            Meet Headless AI.
          </h2>
          <p className="text-base sm:text-lg text-neutral-500 font-light leading-relaxed">
            No typing prompts into a blank box. Headless AI connects to your real inputs, digests context automatically, and delivers completed deliverables ready to ship.
          </p>
        </div>

        {/* Interactive Simulator Shell */}
        <div className="rounded-3xl bg-white border border-black/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
          
          {/* Top Workflow Selector Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-black/[0.06] bg-neutral-50/70 p-2 gap-2">
            {HEADLESS_WORKFLOWS.map((wf, idx) => (
              <button
                key={wf.id}
                onClick={() => setActiveWorkflow(idx)}
                className={cn(
                  "p-4 rounded-2xl text-left transition-all cursor-pointer relative",
                  activeWorkflow === idx 
                    ? "bg-white text-black shadow-xs border border-black/[0.06]" 
                    : "hover:bg-white/50 text-neutral-600"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-medium">Workflow 0{idx + 1}</span>
                  {activeWorkflow === idx && (
                    <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.8)]" />
                  )}
                </div>
                <div className="text-sm font-semibold text-black">{wf.title}</div>
                <div className="text-[11px] text-neutral-500 font-light mt-0.5 line-clamp-1">{wf.subtitle}</div>
              </button>
            ))}
          </div>

          {/* Workflow Live Execution Cockpit */}
          <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Input Digest & Raw Signal */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-medium block mb-1.5">
                  RAW UNSTRUCTURED SIGNAL
                </span>
                <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-2.5 font-mono text-xs shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] text-neutral-400">
                    <span className="text-sky-400">{HEADLESS_WORKFLOWS[activeWorkflow].inputLabel}</span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white">Ingested</span>
                  </div>
                  <p className="text-neutral-300 font-light leading-relaxed whitespace-pre-line text-[11px]">
                    {HEADLESS_WORKFLOWS[activeWorkflow].rawSnippet}
                  </p>
                </div>
              </div>

              {/* Headless AI Processing Bridge Indicator */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  <span className="text-xs font-mono text-sky-900 font-medium">Headless Neural Synthesizer</span>
                </div>
                <span className="text-[10px] font-mono text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full font-medium">
                  0.4s Latency
                </span>
              </div>
            </div>

            {/* Right: Automatically Generated Shippable Outcomes */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-medium block mb-1.5">
                  HEADLESS AI SHIPPABLE DELIVERABLES
                </span>
                <div className="space-y-2.5">
                  {HEADLESS_WORKFLOWS[activeWorkflow].actions.map((act, aIdx) => (
                    <motion.div
                      key={aIdx}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: aIdx * 0.1, duration: 0.4 }}
                      className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] hover:border-black/[0.15] hover:bg-white transition-all flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-white border border-black/[0.08] flex items-center justify-center text-xs font-mono text-neutral-800 shadow-2xs shrink-0">
                          {aIdx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-black truncate group-hover:text-sky-950">
                            {act.title}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                            Est: {act.time} · Ready in Workspace Sprint
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60 text-[10px] font-mono font-semibold">
                          {act.priority}
                        </span>
                        <span className="text-xs font-mono text-neutral-400 group-hover:text-black transition-colors">
                          →
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-neutral-400">
                  {HEADLESS_WORKFLOWS[activeWorkflow].outputSummary}
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ─── THE 3 PILLARS OF "THE ANTI-PRODUCTIVITY APP" ─── */}
      <section className="py-24 sm:py-36 px-6 sm:px-10 bg-white border-t border-black/[0.06] relative z-10">
        <div className="max-w-[1300px] mx-auto space-y-16">
          
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-sky-600 font-semibold">
              WHY BUILDERS CHOOSE CULTLIKE
            </span>
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-black leading-tight">
              Built for high-agency creators who refuse to do fake work.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            
            {/* Pillar 1 */}
            <div className="p-8 rounded-3xl bg-[#fbfbfd] border border-black/[0.06] hover:border-black/[0.12] transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-black shadow-2xs group-hover:scale-105 transition-transform">
                <Cpu size={22} className="text-neutral-900" />
              </div>
              <h3 className="text-xl font-semibold text-black tracking-tight">
                Zero Backlog Grooming
              </h3>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">
                Never waste Sunday afternoons grooming JIRA tickets or categorizing color-coded Notion boards. Headless AI extracts tasks directly from meetings, commits, and memos automatically.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 rounded-3xl bg-[#fbfbfd] border border-black/[0.06] hover:border-black/[0.12] transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-black shadow-2xs group-hover:scale-105 transition-transform">
                <Clock size={22} className="text-neutral-900" />
              </div>
              <h3 className="text-xl font-semibold text-black tracking-tight">
                25-Min Deep Work Chronograph
              </h3>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">
                Work happens in focused sprint blocks, not endless todo list scrolling. Every deliverable links directly to a native Pomodoro timer and logs into your annual shipping streak.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 rounded-3xl bg-[#fbfbfd] border border-black/[0.06] hover:border-black/[0.12] transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-black shadow-2xs group-hover:scale-105 transition-transform">
                <Video size={22} className="text-neutral-900" />
              </div>
              <h3 className="text-xl font-semibold text-black tracking-tight">
                Omnichannel Content Vault
              </h3>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">
                Seamless pipeline from Google Drive media files to YouTube and Instagram scheduling. Analyze audience retention curves and verify your proof of work without switching tools.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* ─── REAL IN-APP SHOWCASE (INTERACTIVE DEEP WORK & RETENTION PREVIEW) ─── */}
      <section className="py-24 sm:py-36 px-6 sm:px-10 max-w-[1300px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Text Description */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-black/[0.06] text-neutral-800 text-[10px] font-mono uppercase tracking-wider">
              <span>NATIVE HARDWARE STUDIO</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-black leading-tight">
              One unified surface for your entire operation.
            </h2>
            <p className="text-base text-neutral-600 font-light leading-relaxed">
              Launch focus sprints with zero distractions. The native chronograph tracks actual deep work minutes, automatically compiling daily executive summaries and 7-day velocity curves.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-neutral-700">
                <span className="w-5 h-5 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center text-xs font-semibold">✓</span>
                <span>Hardware radial arc chronograph with real minute tracking</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-700">
                <span className="w-5 h-5 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center text-xs font-semibold">✓</span>
                <span>Fathom call takeaway auto-sync to P0 sprint queue</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-700">
                <span className="w-5 h-5 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center text-xs font-semibold">✓</span>
                <span>Proof of work annual shipping heatmap with 52-week cadence</span>
              </div>
            </div>
          </div>

          {/* Right: Live Interactive In-App Focus Card Cockpit */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.06)] space-y-6 relative overflow-hidden">
              {/* Subtle top sky-blue specular line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />

              {/* In-App Header Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-semibold flex items-center justify-center font-mono">
                    C
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-black">Active Sprint Cockpit</div>
                    <div className="text-[10px] font-mono text-neutral-400">P0 Core Deliverables · In Progress</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-mono font-medium">
                    14-Day Streak 🔥
                  </span>
                </div>
              </div>

              {/* Interactive Live Pomodoro Dial */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-[#fbfbfd] to-neutral-50 border border-black/[0.04] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block font-semibold">
                    CURRENT DEEP WORK SESSION
                  </span>
                  <div className="text-lg font-medium text-black">
                    Refactor OAuth token rotation engine
                  </div>
                  <div className="text-xs text-neutral-500 font-light">
                    25-minute focused execution block
                  </div>
                </div>

                {/* Clock & Controls */}
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-light font-mono text-black tracking-tight bg-white px-4 py-2 rounded-2xl border border-black/[0.08] shadow-2xs">
                    {formatTimer(timerSeconds)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTimerActive(!timerActive)}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs",
                        timerActive 
                          ? "bg-amber-500 text-white hover:bg-amber-600" 
                          : "bg-black text-white hover:bg-neutral-800"
                      )}
                      title={timerActive ? "Pause Timer" : "Start 25-Min Sprint"}
                    >
                      {timerActive ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>
                    <button
                      onClick={() => { setTimerActive(false); setTimerSeconds(25 * 60) }}
                      className="w-10 h-10 rounded-full bg-white border border-black/[0.08] text-neutral-600 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                      title="Reset Sprint"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 7-Day Velocity Curve Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">Weekly Shipping Velocity</span>
                  <span className="font-semibold text-black">18 Tasks Completed this Week</span>
                </div>
                
                {/* SVG Velocity Graph with subtle sky-blue stroke */}
                <div className="h-20 w-full pt-1">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 80" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="landingVelocityGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,60 Q 50,45 100,50 T 200,30 T 300,40 T 400,10 L 400,80 L 0,80 Z"
                      fill="url(#landingVelocityGlow)"
                    />
                    <path
                      d="M 0,60 Q 50,45 100,50 T 200,30 T 300,40 T 400,10"
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="400" cy="10" r="4" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>


      {/* ─── FAQ SECTION (SPLIT MINIMALIST LAYOUT) ─── */}
      <section id="faq" className="py-24 sm:py-36 px-6 sm:px-10 bg-white border-t border-black/[0.06] relative z-10">
        <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Left: Heading */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-sky-600 font-semibold">
              FREQUENTLY ASKED
            </span>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-black leading-tight">
              Everything you need to know.
            </h2>
            <p className="text-sm text-neutral-500 font-light">
              Have a specific question about workflow setup?{' '}
              <a href="mailto:hello@cultlike.ahmvsystems.com" className="text-black underline underline-offset-4 decoration-black/30 hover:decoration-black transition-colors">
                Contact our engineering team
              </a>
              .
            </p>
          </div>

          {/* Right: Accordion */}
          <div className="lg:col-span-8">
            <div className="divide-y divide-black/[0.06]">
              {faqs.map((faq, idx) => (
                <div key={idx} className="py-6">
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between text-left cursor-pointer group"
                  >
                    <span className="text-base sm:text-lg font-medium text-black pr-8 group-hover:text-neutral-600 transition-colors">
                      {faq.q}
                    </span>
                    <span className="text-neutral-400 shrink-0">
                      {activeFaq === idx ? (
                        <X size={18} strokeWidth={1.5} className="text-black" />
                      ) : (
                        <Plus size={18} strokeWidth={1.5} />
                      )}
                    </span>
                  </button>
                  <AnimatePresence>
                    {activeFaq === idx && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease }}
                        className="overflow-hidden"
                      >
                        <p className="pt-3 text-sm sm:text-base text-neutral-500 font-light leading-relaxed max-w-2xl">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>


      {/* ─── CINEMATIC DARK CTA SECTION ─── */}
      <section className="bg-[#0c0d12] text-white py-24 sm:py-36 px-6 sm:px-10 rounded-t-[44px] relative overflow-hidden z-10">
        {/* Subtle Sky Blue Ambient Backlight Shimmer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.12),transparent_70%)] pointer-events-none" />

        <div className="max-w-[1000px] mx-auto text-center space-y-8 relative z-10">
          <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400 font-medium px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
            START SHIPPING TODAY
          </span>
          
          <h2 className="text-3xl sm:text-6xl font-normal tracking-tight text-white leading-tight">
            Stop managing.<br />
            <span className="font-light text-neutral-400">Start shipping with Cultlike.</span>
          </h2>
          
          <p className="text-base sm:text-lg text-neutral-400 font-light max-w-xl mx-auto leading-relaxed">
            Launch your complete workspace in under 30 seconds. Free forever for solo builders and creators. Zero credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-white hover:bg-neutral-100 text-black text-sm font-medium transition-all cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.15)] active:scale-[0.98]"
            >
              Launch Free Workspace
            </button>
            <button
              onClick={() => { setMode('login'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/20 hover:border-white/40 text-sm font-normal text-white transition-all cursor-pointer bg-white/5"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>


      {/* ─── FOOTER ─── */}
      <footer className="bg-white border-t border-black/[0.06] py-16 px-6 sm:px-10 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-12">
            
            {/* Logo + Tagline */}
            <div className="col-span-2 md:col-span-4 space-y-4">
              <div className="flex items-center">
                <img 
                  src="/logo-cultlike.png" 
                  alt="Cultlike Logo" 
                  className="h-10 w-10 object-contain rounded-full shadow-2xs" 
                />
              </div>
              <p className="text-sm text-neutral-500 font-light max-w-xs">
                The anti-productivity operating system for high-agency creators and solo founders.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
                  className="px-5 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium transition-all cursor-pointer"
                >
                  Get Started Free
                </button>
              </div>
            </div>

            {/* Product */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-semibold text-black uppercase tracking-wider font-mono">Product</h4>
              <div className="space-y-2">
                <a href="#headless-simulator" className="block text-sm text-neutral-500 hover:text-black transition-colors font-light">Headless AI</a>
                <a href="#features" className="block text-sm text-neutral-500 hover:text-black transition-colors font-light">Pomodoro Sprints</a>
                <a href="#faq" className="block text-sm text-neutral-500 hover:text-black transition-colors font-light">FAQ</a>
              </div>
            </div>

            {/* Platform */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-semibold text-black uppercase tracking-wider font-mono">Integrations</h4>
              <div className="space-y-2 text-sm text-neutral-500 font-light">
                <span className="block">Fathom Video</span>
                <span className="block">Google Drive</span>
                <span className="block">YouTube & Instagram</span>
                <span className="block">Claude & OpenAI</span>
              </div>
            </div>

            {/* Legal */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-semibold text-black uppercase tracking-wider font-mono">Legal</h4>
              <div className="space-y-2">
                <Link href="/privacy" className="block text-sm text-neutral-500 hover:text-black transition-colors font-light">Privacy Notice</Link>
                <Link href="/terms" className="block text-sm text-neutral-500 hover:text-black transition-colors font-light">Terms of Use</Link>
                <Link href="/data-deletion" className="block text-sm text-neutral-500 hover:text-black transition-colors font-light">Data Deletion</Link>
              </div>
            </div>

            {/* System Status */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-semibold text-black uppercase tracking-wider font-mono">System</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>All Systems Operational</span>
                </div>
                <span className="block text-xs font-mono text-neutral-400">OpenAPI 3.1 Live</span>
              </div>
            </div>

          </div>

          {/* Copyright */}
          <div className="mt-16 pt-8 border-t border-black/[0.06] text-xs text-neutral-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>© {new Date().getFullYear()} Cultlike OS. All rights reserved.</span>
            <span>The Anti-Productivity OS</span>
          </div>
        </div>
      </footer>


      {/* ─── AUTH MODAL (CLEAN APPLE SPECULAR GLASS MODAL) ─── */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 border border-black/[0.08]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => { setIsAuthOpen(false); setError(null); setConfirmationSent(false) }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 transition-colors cursor-pointer z-10"
            >
              <X size={15} />
            </button>

            <div className="p-8 sm:p-10">
              {/* Logo Emblem */}
              <div className="flex items-center mb-6">
                <img src="/logo-cultlike.png" alt="Logo" className="h-11 w-11 object-contain rounded-full shadow-2xs" />
              </div>

              {confirmationSent ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto text-lg font-semibold">
                    ✓
                  </div>
                  <h3 className="text-lg font-semibold text-black">Check your inbox</h3>
                  <p className="text-sm text-neutral-500 font-light">
                    We sent a confirmation link to <strong className="text-black font-medium">{email}</strong>. Click it to activate your workspace.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 mb-6">
                    <h3 className="text-2xl font-semibold text-black tracking-tight">
                      {mode === 'signup' ? 'Launch your workspace' : 'Welcome back'}
                    </h3>
                    <p className="text-xs text-neutral-500 font-light">
                      {mode === 'signup' 
                        ? 'Zero configuration required. Free for solo creators.' 
                        : 'Sign in to access your projects, tasks, and content.'}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {mode === 'signup' && (
                      <div>
                        <label className="text-[11px] font-mono text-neutral-600 font-medium block mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Mohammad"
                          className="w-full px-4 py-2.5 rounded-xl border border-black/[0.1] text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-mono text-neutral-600 font-medium block mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-black/[0.1] text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-neutral-600 font-medium block mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-black/[0.1] text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50 mt-2"
                    >
                      {loading ? 'Processing...' : (mode === 'signup' ? 'Create Free Workspace' : 'Sign In')}
                    </button>
                  </form>

                  <div className="mt-6 text-center text-xs text-neutral-500 font-light">
                    {mode === 'signup' ? (
                      <span>
                        Already have an account?{' '}
                        <button 
                          onClick={() => { setMode('login'); setError(null) }} 
                          className="text-black font-medium underline underline-offset-2 cursor-pointer"
                        >
                          Sign in
                        </button>
                      </span>
                    ) : (
                      <span>
                        Don&apos;t have an account yet?{' '}
                        <button 
                          onClick={() => { setMode('signup'); setError(null) }} 
                          className="text-black font-medium underline underline-offset-2 cursor-pointer"
                        >
                          Create one free
                        </button>
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
