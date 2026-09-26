'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, X, ChevronDown, Plus, Play, Pause, RotateCcw, 
  Layers, Clock, Video, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import LandingMenuModal from '@/components/LandingMenuModal'
import {
  ChatGPTLogo, ClaudeLogo, GoogleDriveLogo, YouTubeLogo, InstagramLogo,
  FathomLogo, FigmaLogo, LinearLogo, SlackLogo, NotionLogo, GitHubLogo, AppleLogo
} from '@/components/IntegrationLogos'

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Full-color partner apps list (Actual logos as-is)
const INTEGRATION_APPS = [
  { name: 'ChatGPT', Logo: ChatGPTLogo },
  { name: 'Claude', Logo: ClaudeLogo },
  { name: 'Fathom', Logo: FathomLogo },
  { name: 'Google Drive', Logo: GoogleDriveLogo },
  { name: 'YouTube', Logo: YouTubeLogo },
  { name: 'Instagram', Logo: InstagramLogo },
  { name: 'Notion', Logo: NotionLogo },
  { name: 'Figma', Logo: FigmaLogo },
  { name: 'GitHub', Logo: GitHubLogo },
  { name: 'Linear', Logo: LinearLogo },
  { name: 'Slack', Logo: SlackLogo },
  { name: 'Apple', Logo: AppleLogo }
]

// Floating app badges surrounding the hero
const FLOATING_SCATTERED_APPS = [
  { name: 'ChatGPT', Logo: ChatGPTLogo, top: '12%', left: '8%', delay: 0, floatClass: 'animate-float' },
  { name: 'Claude', Logo: ClaudeLogo, top: '18%', right: '9%', delay: 0.2, floatClass: 'animate-float-delayed' },
  { name: 'Fathom', Logo: FathomLogo, top: '68%', left: '6%', delay: 0.4, floatClass: 'animate-float-delayed' },
  { name: 'Google Drive', Logo: GoogleDriveLogo, top: '65%', right: '8%', delay: 0.1, floatClass: 'animate-float' },
  { name: 'YouTube', Logo: YouTubeLogo, top: '38%', left: '4%', delay: 0.5, floatClass: 'animate-float' },
  { name: 'Instagram', Logo: InstagramLogo, top: '40%', right: '4%', delay: 0.3, floatClass: 'animate-float-delayed' },
  { name: 'Notion', Logo: NotionLogo, top: '82%', left: '16%', delay: 0.6, floatClass: 'animate-float' },
  { name: 'Figma', Logo: FigmaLogo, top: '80%', right: '18%', delay: 0.4, floatClass: 'animate-float-delayed' },
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

  // Interactive Live Pomodoro Simulator
  const [timerSeconds, setTimerSeconds] = useState(25 * 60)
  const [timerActive, setTimerActive] = useState(false)

  // Mouse tracking spotlight coordinates
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

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
      a: 'Most apps waste your time with endless ticket grooming, subtasks, and color-coded status updates. Cultlike is built for shipping. It serves as your single source of truth, automating meeting takeaways, sprint planning, and content scheduling in one place.',
    },
    {
      q: 'How does Cultlike connect with ChatGPT and Claude?',
      a: 'Cultlike provides a direct, secure connection for ChatGPT and Claude. Your AI apps automatically understand your active sprint, tasks, projects, and meeting notes with zero copy-pasting.',
    },
    {
      q: 'How does Fathom meeting integration work?',
      a: 'When your Fathom meeting finishes, the summary and action items appear directly inside Cultlike. You can turn any spoken takeaway into a live task with one click.',
    },
    {
      q: 'What creator features are included?',
      a: 'You get an omnichannel content vault connected to Google Drive, YouTube, and Instagram, plus audience retention analysis and an annual 52-week proof-of-work heatmap.',
    },
    {
      q: 'Is Cultlike free for solo builders and creators?',
      a: 'Yes. Cultlike is 100% free for solo builders. You can launch your workspace in under 30 seconds with no credit card required.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#fafafc] text-[#0c0d0f] selection:bg-sky-500/20 relative font-sans overflow-x-hidden">

      {/* ─── STICKY HEADER ─── */}
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

          {/* Center: Iconic Pill Menu Button (Dead center) */}
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

      {/* ─── TARGETED SKY-BLUE AMBIENT LIGHTING (NO PINK / NO MULTICOLOR) ─── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(56,189,248,0.08),rgba(255,255,255,0))] pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-20 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(56,189,248,0.04),rgba(255,255,255,0))] pointer-events-none z-0" />

      {/* ─── HERO SECTION (TIGHT HEADLINE IN MIDDLE + FLOATING SCATTERED APPS) ─── */}
      <section 
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-[75vh] flex flex-col items-center justify-center pt-24 sm:pt-32 pb-14 px-6 sm:px-10 max-w-[1300px] mx-auto text-center z-10 select-none overflow-hidden"
      >
        {/* Interactive Mouse Follower Spotlight (Subtle Sky-Blue Specular Aura) */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 blur-[90px] z-0 opacity-60"
          style={{
            left: smoothMouseX,
            top: smoothMouseY,
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.14) 0%, rgba(14, 165, 233, 0.04) 45%, transparent 70%)'
          }}
        />

        {/* Floating Scattered App Badges (Clean full-color brand icons floating around hero) */}
        {FLOATING_SCATTERED_APPS.map((app, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: app.delay, duration: 0.6 }}
            className={cn(
              "hidden lg:flex absolute items-center justify-center w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-md border border-black/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:scale-110 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-all cursor-default z-10",
              app.floatClass
            )}
            style={{
              top: app.top,
              left: app.left,
              right: app.right,
            }}
            title={app.name}
          >
            <app.Logo className="w-7 h-7" />
          </motion.div>
        ))}

        {/* Center Headline & Immediate Actions (Tightly unified, zero subtext clutter) */}
        <div className="relative z-10 max-w-3xl mx-auto space-y-6 flex flex-col items-center">
          
          {/* Main Hero Headline: The anti-productivity app. */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-medium tracking-[-0.035em] leading-[1.08] text-black">
            The anti-productivity app.
          </h1>

          {/* Direct CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 w-full sm:w-auto">
            <button
              onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-medium transition-all cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <span>Get Started</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => { setMode('login'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-black/[0.1] hover:border-black/[0.25] bg-white/80 backdrop-blur-md text-sm font-normal text-black transition-all cursor-pointer shadow-xs hover:bg-white flex items-center justify-center"
            >
              <span>Sign In</span>
            </button>
          </div>

        </div>
      </section>


      {/* ─── FULL-COLOR INTEGRATION LOGOS SCROLLING MARQUEE (ACTUAL LOGOS AS-IS) ─── */}
      <section className="py-10 border-y border-black/[0.06] bg-white/70 backdrop-blur-sm relative overflow-hidden">
        {/* Infinite Kinetic Marquee of Full-Color Logos */}
        <div className="flex overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex gap-8 sm:gap-12 items-center shrink-0 animate-marquee py-2">
            {INTEGRATION_APPS.concat(INTEGRATION_APPS).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-white border border-black/[0.07] shadow-xs hover:shadow-md hover:scale-110 transition-all cursor-default shrink-0 group p-3 sm:p-4"
                title={item.name}
              >
                <item.Logo className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── ONE SOLE PLACE OF TRUTH (NARRATIVE SECTION) ─── */}
      <section className="py-20 sm:py-32 px-6 sm:px-10 max-w-[1200px] mx-auto relative z-10 text-center space-y-6">
        <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-black max-w-2xl mx-auto leading-tight">
          The single source of truth for your entire operation.
        </h2>
        <p className="text-base sm:text-xl text-neutral-500 font-light max-w-2xl mx-auto leading-relaxed">
          Stop scattering your work across 10 disconnected tabs. Cultlike connects your meetings, sprint deliverables, notes, and social publishing into one clean studio.
        </p>
      </section>


      {/* ─── 3 WORKSPACE PILLARS ─── */}
      <section className="py-12 sm:py-20 px-6 sm:px-10 bg-white border-t border-black/[0.06] relative z-10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          
          {/* Pillar 1 */}
          <div className="p-8 rounded-3xl bg-[#fbfbfd] border border-black/[0.06] hover:border-black/[0.12] transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-black shadow-2xs">
              <Layers size={22} className="text-neutral-900" />
            </div>
            <h3 className="text-xl font-medium text-black tracking-tight">
              Meetings to Tasks
            </h3>
            <p className="text-sm text-neutral-500 font-light leading-relaxed">
              When your Fathom calls end, the takeaways and action items automatically sync into your sprint. Turn any spoken point into a deliverable with one click.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 rounded-3xl bg-[#fbfbfd] border border-black/[0.06] hover:border-black/[0.12] transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-black shadow-2xs">
              <Clock size={22} className="text-neutral-900" />
            </div>
            <h3 className="text-xl font-medium text-black tracking-tight">
              25-Min Deep Work
            </h3>
            <p className="text-sm text-neutral-500 font-light leading-relaxed">
              Every deliverable has a built-in focus timer. Ship work in sprint blocks, build your daily streak, and track your annual consistency on a 52-week heatmap.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-8 rounded-3xl bg-[#fbfbfd] border border-black/[0.06] hover:border-black/[0.12] transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center text-black shadow-2xs">
              <Video size={22} className="text-neutral-900" />
            </div>
            <h3 className="text-xl font-medium text-black tracking-tight">
              Content Pipeline
            </h3>
            <p className="text-sm text-neutral-500 font-light leading-relaxed">
              Connect Google Drive, YouTube, and Instagram in one vault. Plan your schedule, inspect retention curves, and ship content without leaving your workspace.
            </p>
          </div>

        </div>
      </section>


      {/* ─── REAL IN-APP SHOWCASE (POMODORO & VELOCITY PREVIEW) ─── */}
      <section className="py-20 sm:py-32 px-6 sm:px-10 max-w-[1200px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Direct Text */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-black leading-tight">
              Everything in front of you.
            </h2>
            <p className="text-base text-neutral-500 font-light leading-relaxed">
              Open your workspace and see exactly what needs to be delivered today. Clean focus timers, sprint velocity graphs, and direct AI connectors keep you shipping.
            </p>
            
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3 text-sm text-neutral-700 font-light">
                <span className="w-5 h-5 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center text-xs font-semibold">✓</span>
                <span>Built-in 25-minute deep work timer</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-700 font-light">
                <span className="w-5 h-5 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center text-xs font-semibold">✓</span>
                <span>Direct ChatGPT and Claude workspace sync</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-700 font-light">
                <span className="w-5 h-5 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center text-xs font-semibold">✓</span>
                <span>52-Week annual shipping heatmap</span>
              </div>
            </div>
          </div>

          {/* Right: Live Interactive In-App Focus Card */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.06)] space-y-6 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />

              {/* In-App Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-semibold flex items-center justify-center font-mono">
                    C
                  </div>
                  <div>
                    <div className="text-xs font-medium text-black">Active Sprint</div>
                    <div className="text-[11px] text-neutral-400 font-light">Today&apos;s Deliverables</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-neutral-800">
                  14-Day Streak 🔥
                </div>
              </div>

              {/* Interactive Live Timer */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-[#fbfbfd] to-neutral-50 border border-black/[0.04] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-base font-medium text-black">
                    Refactor OAuth token rotation engine
                  </div>
                  <div className="text-xs text-neutral-500 font-light">
                    25-minute focused execution block
                  </div>
                </div>

                {/* Clock Controls */}
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
                  <span className="text-neutral-500 font-light">Weekly Output</span>
                  <span className="font-medium text-black">18 Tasks Completed this Week</span>
                </div>
                
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


      {/* ─── FAQ SECTION ─── */}
      <section id="faq" className="py-20 sm:py-32 px-6 sm:px-10 bg-white border-t border-black/[0.06] relative z-10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          <div className="lg:col-span-4 space-y-3 text-left">
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-black leading-tight">
              Common questions.
            </h2>
            <p className="text-sm text-neutral-500 font-light">
              Need help with setup?{' '}
              <a href="mailto:hello@cultlike.ahmvsystems.com" className="text-black underline underline-offset-4 decoration-black/30 hover:decoration-black transition-colors">
                Contact our team
              </a>
              .
            </p>
          </div>

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


      {/* ─── DARK CTA SECTION ─── */}
      <section className="bg-[#0c0d12] text-white py-20 sm:py-32 px-6 sm:px-10 rounded-t-[44px] relative overflow-hidden z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.12),transparent_70%)] pointer-events-none" />

        <div className="max-w-[900px] mx-auto text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
            Stop managing. Start shipping.
          </h2>
          
          <p className="text-base sm:text-lg text-neutral-400 font-light max-w-lg mx-auto leading-relaxed">
            Launch your workspace in under 30 seconds. Free for solo builders and creators. No credit card required.
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
                <a href="#faq" className="block text-sm text-neutral-500 hover:text-black transition-colors font-light">Pomodoro Sprints</a>
                <a href="#faq" className="block text-sm text-neutral-500 hover:text-black transition-colors font-light">Fathom Sync</a>
                <a href="#faq" className="block text-sm text-neutral-500 hover:text-black transition-colors font-light">FAQ</a>
              </div>
            </div>

            {/* Platform */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-semibold text-black uppercase tracking-wider font-mono">Integrations</h4>
              <div className="space-y-2 text-sm text-neutral-500 font-light">
                <span className="block">ChatGPT & Claude</span>
                <span className="block">Fathom Video</span>
                <span className="block">Google Drive</span>
                <span className="block">YouTube & Instagram</span>
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
