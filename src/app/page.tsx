'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, X, ChevronDown, Plus, Play, Pause, RotateCcw, 
  Cpu, Clock, Video, FileText, Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import LandingMenuModal from '@/components/LandingMenuModal'
import {
  FathomLogo, GoogleDriveLogo, YouTubeLogo, InstagramLogo,
  ClaudeLogo, OpenAILogo, GitHubLogo, FigmaLogo,
  LinearLogo, SlackLogo, NotionLogo, AppleLogo
} from '@/components/IntegrationLogos'

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
          transition: { staggerChildren: 0.04, delayChildren: delay }
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
              hidden: { opacity: 0, y: 28 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: { ease, duration: 0.8 }
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

// Integration partner fleet with real vector logos
const INTEGRATIONS = [
  { name: 'Fathom Video', Logo: FathomLogo, role: 'Meeting Takeaways' },
  { name: 'Google Drive', Logo: GoogleDriveLogo, role: 'Media Vault' },
  { name: 'YouTube', Logo: YouTubeLogo, role: 'Publishing & Analytics' },
  { name: 'Instagram', Logo: InstagramLogo, role: 'Reels Studio' },
  { name: 'Claude', Logo: ClaudeLogo, role: 'Background Sprint Planner' },
  { name: 'OpenAI', Logo: OpenAILogo, role: 'Context Bridge' },
  { name: 'GitHub', Logo: GitHubLogo, role: 'Shipping Velocity' },
  { name: 'Figma', Logo: FigmaLogo, role: 'Asset Linking' },
  { name: 'Linear', Logo: LinearLogo, role: 'Deliverable Sync' },
  { name: 'Slack', Logo: SlackLogo, role: 'Digest Gateway' },
  { name: 'Notion', Logo: NotionLogo, role: 'Document Sync' },
  { name: 'Apple', Logo: AppleLogo, role: 'Calendar Blocks' }
]

// Headless AI Simulator Workflows (Zero ugly tags, clean narrative)
const HEADLESS_WORKFLOWS = [
  {
    id: 'meeting',
    title: 'Zero-Input Meeting Distiller',
    subtitle: 'Fathom call finishes → Headless AI creates sprint deliverables automatically.',
    inputTitle: 'Incoming Fathom Call: Product Architecture Review',
    rawText: `[00:14:20] "We need to migrate our database indexes to Postgres before Friday."\n[00:28:10] "Let's make sure the OAuth callback handles silent token refreshes."`,
    actions: [
      { title: 'Migrate Postgres database indexes for sprint query load', time: '45m' },
      { title: 'Patch silent token refresh retry logic in OAuth callback', time: '30m' },
      { title: 'Sync migration notes into Document Memo Hub', time: '15m' },
    ]
  },
  {
    id: 'sprint',
    title: 'Autonomous Sprint Planner',
    subtitle: 'State your goal → Headless AI organizes your deep work blocks.',
    inputTitle: 'Founder Goal: "Ship the v1.0 public launch this sprint"',
    rawText: `Goal: Deliver public landing page with interactive Headless AI simulator, live OAuth authentication, and telemetry curves.`,
    actions: [
      { title: 'Hero Section: Ambient light tracking & typography hierarchy', time: '90m' },
      { title: 'Interactive Headless AI Simulator cockpit component', time: '120m' },
      { title: 'Integration marquee fleet with infinite kinetic velocity', time: '45m' },
    ]
  },
  {
    id: 'content',
    title: 'Omnichannel Content Engine',
    subtitle: 'Upload footage to Drive → Headless AI drafts hooks and stages publishing.',
    inputTitle: 'Google Drive File: studio_vlog_ep48_final.mp4',
    rawText: `Audio Transcribed: "Why traditional productivity tools fail high-agency builders..." → Extracted 3 high-retention hook variations.`,
    actions: [
      { title: 'Shorts Hook: "Stop organizing work. Start shipping."', time: 'Ready' },
      { title: 'Instagram Reel: Behind-the-scenes engineering studio tour', time: 'Ready' },
      { title: 'Long-form YouTube: Deep dive on headless workspace architecture', time: 'Ready' },
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

  // Interactive Live Pomodoro Simulator
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
      q: 'What is Headless AI?',
      a: 'Headless AI is background intelligence that operates without requiring you to open a chat box or write prompts. It automatically listens to your completed Fathom calls, analyzes your Google Drive uploads, and connects to Claude or ChatGPT via secure OpenAPI 3.1 endpoints to turn raw ideas into shipped work.',
    },
    {
      q: 'How does the deep work chronograph work?',
      a: 'Every deliverable in your workspace has an integrated 25-minute Pomodoro timer. As you focus and ship deliverables, Cultlike logs your actual focused hours, updates your consecutive daily streak, and visualizes your velocity on an annual 52-week heatmap.',
    },
    {
      q: 'How do meeting summaries turn into tasks?',
      a: 'When your Fathom call finishes, the full transcript and AI action items sync instantly. You can convert any spoken takeaway into an executable deliverable with a single click, ensuring nothing gets lost.',
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

      {/* ─── TARGETED SKY-BLUE SUBTLE AMBIENT LIGHTING (NO PINK / NO MULTICOLOR) ─── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(56,189,248,0.08),rgba(255,255,255,0))] pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-20 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(56,189,248,0.04),rgba(255,255,255,0))] pointer-events-none z-0" />

      {/* ─── HERO SECTION (NOTHING BUT HEADING & SUBTITLE IN MIDDLE - ZERO UGLY TAGS) ─── */}
      <section 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-[85vh] flex flex-col items-center justify-center pt-28 sm:pt-36 pb-16 px-6 sm:px-10 max-w-[1200px] mx-auto text-center z-10 select-none"
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

        <div className="relative z-10 max-w-4xl mx-auto space-y-8 flex flex-col items-center">
          
          {/* Main Hero Headline: The Anti-Productivity App */}
          <h1 className="text-[clamp(44px,7.5vw,92px)] font-medium tracking-[-0.04em] leading-[1.02] text-black">
            <AnimatedText text="The anti-productivity app." className="text-black" />
          </h1>

          {/* Simple, Punchy, Human Subtitle (Poppins Light) */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease, duration: 0.7, delay: 0.3 }}
            className="text-lg sm:text-2xl text-neutral-500 font-light leading-relaxed max-w-2xl mx-auto"
          >
            Stop managing work. Start shipping. Cultlike runs in the background with Headless AI — turning your meetings, thoughts, and recordings into delivered work without the friction.
          </motion.p>

          {/* Clean Action Buttons (Zero Clutter) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease, duration: 0.7, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 w-full sm:w-auto"
          >
            <button
              onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-medium transition-all cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <span>Get Started</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => { setMode('login'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-black/[0.1] hover:border-black/[0.25] bg-white/80 backdrop-blur-md text-sm font-normal text-black transition-all cursor-pointer shadow-xs hover:bg-white flex items-center justify-center"
            >
              <span>Sign In</span>
            </button>
          </motion.div>

        </div>
      </section>


      {/* ─── INTEGRATIONS LOGO FLEET WITH REAL VECTOR LOGOS (INFINITE KINETIC MARQUEE) ─── */}
      <section className="py-14 border-y border-black/[0.06] bg-white/70 backdrop-blur-sm relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 mb-6 text-center">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-medium">
            CONNECTED TO YOUR TOOLS
          </span>
        </div>

        {/* Marquee Track with Real Logos */}
        <div className="flex overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex gap-4 items-center shrink-0 animate-marquee py-2">
            {INTEGRATIONS.concat(INTEGRATIONS).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-black/[0.06] shadow-2xs hover:border-sky-500/40 hover:shadow-xs hover:scale-[1.02] transition-all cursor-default shrink-0 group"
              >
                <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                  <item.Logo className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-900 leading-none group-hover:text-black">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-light mt-1">
                    {item.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── HEADLESS AI SIMULATOR (ZERO UGLY TAGS, PURE WORKFLOW ARCHITECTURE) ─── */}
      <section id="headless-simulator" className="py-24 sm:py-36 px-6 sm:px-10 max-w-[1300px] mx-auto relative z-10">
        <div className="space-y-4 text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-black">
            Headless AI at work.
          </h2>
          <p className="text-base sm:text-lg text-neutral-500 font-light leading-relaxed">
            No typing into a chat box. Headless AI listens to your calls, reads your drive uploads, and creates ready-to-ship deliverables in the background.
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
                <div className="text-sm font-semibold text-black mb-0.5">{wf.title}</div>
                <div className="text-xs text-neutral-500 font-light line-clamp-1">{wf.subtitle}</div>
              </button>
            ))}
          </div>

          {/* Workflow Execution Cockpit */}
          <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Raw Input Signal */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-2 font-medium">
                  RAW INPUT
                </span>
                <div className="p-5 rounded-2xl bg-neutral-900 text-white space-y-2.5 font-sans text-xs shadow-inner">
                  <div className="text-sky-400 font-medium pb-2 border-b border-white/10 text-xs">
                    {HEADLESS_WORKFLOWS[activeWorkflow].inputTitle}
                  </div>
                  <p className="text-neutral-300 font-light leading-relaxed whitespace-pre-line text-xs">
                    {HEADLESS_WORKFLOWS[activeWorkflow].rawText}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center justify-between text-xs text-sky-900 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  <span>Headless AI Processing</span>
                </div>
                <span className="text-sky-600 font-light">Automatic</span>
              </div>
            </div>

            {/* Right: Clean Deliverables (Zero ugly tags) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-2 font-medium">
                  OUTPUT DELIVERABLES
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
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center text-xs font-medium text-neutral-800 shadow-2xs shrink-0">
                          {aIdx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-black truncate group-hover:text-sky-950">
                            {act.title}
                          </div>
                          <div className="text-xs text-neutral-400 font-light mt-0.5">
                            Estimated time: {act.time}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-mono text-neutral-400 group-hover:text-black transition-colors shrink-0">
                        →
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ─── THE 3 PRINCIPLES OF THE ANTI-PRODUCTIVITY APP ─── */}
      <section className="py-24 sm:py-36 px-6 sm:px-10 bg-white border-t border-black/[0.06] relative z-10">
        <div className="max-w-[1300px] mx-auto space-y-16">
          
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-black leading-tight">
              Built for builders who refuse to do fake work.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            
            {/* Principle 1 */}
            <div className="p-8 rounded-3xl bg-[#fbfbfd] border border-black/[0.06] hover:border-black/[0.12] transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-black shadow-2xs group-hover:scale-105 transition-transform">
                <Cpu size={20} className="text-neutral-900" />
              </div>
              <h3 className="text-xl font-medium text-black tracking-tight">
                Zero Backlog Grooming
              </h3>
              <p className="text-sm text-neutral-500 font-light leading-relaxed">
                Never waste time organizing tickets or color-coding boards. Headless AI extracts tasks directly from meetings, commits, and memos automatically.
              </p>
            </div>

            {/* Principle 2 */}
            <div className="p-8 rounded-3xl bg-[#fbfbfd] border border-black/[0.06] hover:border-black/[0.12] transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-black shadow-2xs group-hover:scale-105 transition-transform">
                <Clock size={20} className="text-neutral-900" />
              </div>
              <h3 className="text-xl font-medium text-black tracking-tight">
                25-Min Deep Work Chronograph
              </h3>
              <p className="text-sm text-neutral-500 font-light leading-relaxed">
                Work happens in focused sprint blocks, not endless todo list scrolling. Every deliverable links directly to a native Pomodoro timer and updates your streak.
              </p>
            </div>

            {/* Principle 3 */}
            <div className="p-8 rounded-3xl bg-[#fbfbfd] border border-black/[0.06] hover:border-black/[0.12] transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-black shadow-2xs group-hover:scale-105 transition-transform">
                <Video size={20} className="text-neutral-900" />
              </div>
              <h3 className="text-xl font-medium text-black tracking-tight">
                Omnichannel Content Vault
              </h3>
              <p className="text-sm text-neutral-500 font-light leading-relaxed">
                Seamless pipeline from Google Drive media files to YouTube and Instagram scheduling. Analyze retention curves and verify your proof of work in one place.
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
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-black leading-tight">
              One unified surface for your entire operation.
            </h2>
            <p className="text-base text-neutral-600 font-light leading-relaxed">
              Launch focus sprints with zero distractions. The native chronograph tracks actual deep work minutes, automatically compiling daily executive summaries and 7-day velocity curves.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-neutral-700 font-light">
                <span className="w-5 h-5 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center text-xs font-semibold">✓</span>
                <span>Hardware radial arc chronograph with real minute tracking</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-700 font-light">
                <span className="w-5 h-5 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center text-xs font-semibold">✓</span>
                <span>Fathom call takeaway auto-sync to sprint queue</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-700 font-light">
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

              {/* In-App Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-semibold flex items-center justify-center font-mono">
                    C
                  </div>
                  <div>
                    <div className="text-xs font-medium text-black">Active Sprint Cockpit</div>
                    <div className="text-[11px] text-neutral-400 font-light">In Progress</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-neutral-800">
                  14-Day Streak 🔥
                </div>
              </div>

              {/* Interactive Live Pomodoro Dial */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-[#fbfbfd] to-neutral-50 border border-black/[0.04] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="text-base font-medium text-black">
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
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-light">Weekly Shipping Velocity</span>
                  <span className="font-medium text-black">18 Tasks Completed this Week</span>
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
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-black leading-tight">
              Frequently asked questions.
            </h2>
            <p className="text-sm text-neutral-500 font-light">
              Have a specific question?{' '}
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
              Get Started Free
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
                  <span>Operational</span>
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


      {/* ─── AUTH MODAL ─── */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 border border-black/[0.08]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setIsAuthOpen(false); setError(null); setConfirmationSent(false) }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 transition-colors cursor-pointer z-10"
            >
              <X size={15} />
            </button>

            <div className="p-8 sm:p-10">
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
