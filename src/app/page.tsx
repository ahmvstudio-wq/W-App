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
      <section className="py-20 sm:py-24 border-y border-black/[0.06] bg-white relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto text-center px-6 mb-12">
           <h2 className="text-3xl font-semibold tracking-tight text-black mb-4 uppercase">YOUR AI. YOUR TOOLS.<br/>YOUR OPERATING SYSTEM.</h2>
           <p className="text-lg text-neutral-500 max-w-2xl mx-auto">Cultlike doesn't ask you to replace the tools you already use. It connects them.</p>
        </div>
        <div className="flex overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex gap-8 sm:gap-12 items-center shrink-0 animate-marquee py-2">
            {INTEGRATION_APPS.concat(INTEGRATION_APPS).map((item, idx) => (
              <div key={idx} className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-[#fafafc] border border-black/[0.07] shadow-xs hover:shadow-md hover:scale-110 transition-all cursor-default shrink-0 group p-3 sm:p-4" title={item.name}>
                <item.Logo className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto text-center px-6 mt-12">
           <p className="text-xl font-semibold text-black">Your AI becomes the interface. Cultlike becomes the engine underneath it.</p>
        </div>
      </section>

      {/* ─── THE PROBLEM ─── */}
      <section className="py-20 sm:py-32 px-6 sm:px-10 max-w-[1000px] mx-auto relative z-10 text-center space-y-8">
        <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-black leading-tight">
          Your ideas shouldn't disappear between apps.
        </h2>
        <div className="text-lg sm:text-xl text-neutral-500 font-light max-w-2xl mx-auto leading-relaxed space-y-4">
          <p>Your best ideas live in conversations.</p>
          <p>Your assets live somewhere else.</p>
          <p>Your publishing schedule is in another tool.</p>
          <p>Your tasks are scattered across notes, chats, calendars and spreadsheets.</p>
          <p className="font-semibold text-black">And somehow, you're still the one holding everything together.</p>
        </div>
        <div className="pt-10 border-t border-black/[0.06]">
          <h3 className="text-2xl font-semibold mb-4 text-black">Cultlike changes that.</h3>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-6">
            It becomes the persistent layer underneath your work — keeping your projects, content, assets, schedules and execution connected while you keep using the tools you already love.
          </p>
          <p className="text-xl font-bold text-black">You think. Cultlike operates.</p>
        </div>
      </section>

      {/* ─── PERSONAS ─── */}
      <section className="py-20 sm:py-32 px-6 sm:px-10 bg-[#fafafc] border-t border-black/[0.06] relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-black mb-4 uppercase">BUILT FOR PEOPLE WHO SHIP.</h2>
            <p className="text-xl text-neutral-500">Not people who want to organize their lives. <span className="text-black font-medium">People building something.</span></p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="p-10 rounded-3xl bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all shadow-sm">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400 mb-3">CREATOR</h3>
              <h4 className="text-2xl font-medium text-black mb-3">Turn ideas into content.</h4>
              <p className="text-neutral-500">Keep your entire content operation in one place — from the first idea to the final publish.</p>
            </div>
            <div className="p-10 rounded-3xl bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all shadow-sm">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400 mb-3">FOUNDER</h3>
              <h4 className="text-2xl font-medium text-black mb-3">Keep the company moving.</h4>
              <p className="text-neutral-500">Projects, decisions, deadlines, documents and execution stay connected instead of disappearing into scattered tools.</p>
            </div>
            <div className="p-10 rounded-3xl bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all shadow-sm">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400 mb-3">AGENCY</h3>
              <h4 className="text-2xl font-medium text-black mb-3">Run the machine behind the work.</h4>
              <p className="text-neutral-500">Manage clients, content pipelines, deadlines, assets and delivery without turning your operation into a mess of tabs.</p>
            </div>
            <div className="p-10 rounded-3xl bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all shadow-sm">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400 mb-3">CREATOR MANAGER</h3>
              <h4 className="text-2xl font-medium text-black mb-3">Keep talent moving.</h4>
              <p className="text-neutral-500">See what's being created, what's blocked, what's scheduled and what's actually shipping.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MEMORY ─── */}
      <section className="py-20 sm:py-32 px-6 sm:px-10 max-w-[1000px] mx-auto relative z-10 text-center border-t border-black/[0.06]">
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-12 uppercase text-black">STOP STARTING FROM ZERO.</h2>
        <div className="space-y-4 text-xl sm:text-2xl text-neutral-500 mb-12">
          <p>Every conversation shouldn't become another dead-end chat.</p>
          <p>Every idea shouldn't become another forgotten note.</p>
          <p>Every piece of content shouldn't require rebuilding the same process.</p>
        </div>
        <div className="space-y-2 text-lg text-black font-medium mb-12 bg-[#fafafc] p-8 rounded-3xl border border-black/[0.04]">
          <p className="text-2xl font-bold mb-4">Cultlike gives your work memory.</p>
          <p>Your projects know what happened.</p>
          <p>Your content knows where it is.</p>
          <p>Your schedule knows what's coming.</p>
          <p>Your AI knows what matters.</p>
        </div>
        <p className="text-2xl font-bold text-black">Your system keeps moving.</p>
      </section>

      {/* ─── THE CONTENT MACHINE ─── */}
      <section className="py-20 sm:py-32 px-6 sm:px-10 bg-white border-y border-black/[0.06] relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6 uppercase text-black">THE CONTENT MACHINE.</h2>
            <div className="flex items-center justify-center gap-2 flex-wrap text-neutral-400 font-medium text-lg mb-6">
              <span>Ideas</span><span>→</span>
              <span>Assets</span><span>→</span>
              <span>Drafts</span><span>→</span>
              <span>Review</span><span>→</span>
              <span>Schedule</span><span>→</span>
              <span>Publish</span><span>→</span>
              <span className="text-black">Learn.</span>
            </div>
            <p className="text-2xl font-bold text-black">All connected.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-10 rounded-[32px] bg-[#fafafc] border border-black/[0.06] shadow-sm flex flex-col justify-between">
              <div className="mb-12">
                <h3 className="text-2xl font-semibold text-black uppercase mb-3">Content Vault</h3>
                <h4 className="text-lg font-medium text-black mb-3">Your content has a home.</h4>
                <p className="text-neutral-500 max-w-sm leading-relaxed">Upload videos, images and creative assets. Keep drafts organized. Connect content to projects and execution. No more digging through folders to find the thing you need.</p>
              </div>
              <div className="p-4 bg-white border border-black/[0.04] rounded-2xl flex gap-4 shadow-sm w-fit">
                <div className="w-16 h-24 rounded-lg bg-black relative overflow-hidden shrink-0">
                  <div className="absolute top-1 left-1 bg-rose-500 text-white text-[8px] font-bold px-1 rounded">YT</div>
                </div>
                <div className="py-1 pr-4">
                  <div className="text-sm font-semibold text-black mb-2">The Discipline Myth</div>
                  <div className="text-[10px] font-mono text-neutral-400 mb-1">3S HOOK</div>
                  <div className="text-xs text-black italic">"You're relying on motivation..."</div>
                </div>
              </div>
            </div>

            <div className="p-10 rounded-[32px] bg-[#fafafc] border border-black/[0.06] shadow-sm">
              <h3 className="text-xl font-semibold text-black uppercase mb-3">Publishing Engine</h3>
              <h4 className="text-base font-medium text-black mb-3">Create the schedule once.</h4>
              <p className="text-sm text-neutral-500 mb-6">Cultlike handles the operational layer behind distribution — connecting your content to the platforms where it needs to go.</p>
              <div className="space-y-1.5 text-sm font-medium mb-6 text-neutral-700">
                <p>YouTube.</p><p>Instagram.</p><p>Your schedule.</p><p>Your pipeline.</p>
              </div>
              <p className="font-bold text-black text-sm">From planned to published.</p>
            </div>

            <div className="md:col-span-3 p-10 rounded-[32px] bg-[#fafafc] border border-black/[0.06] shadow-sm text-center">
              <h3 className="text-2xl font-semibold text-black uppercase mb-3">Performance Loop</h3>
              <h4 className="text-lg font-medium text-black mb-4">Publishing isn't the finish line. It's feedback.</h4>
              <p className="text-neutral-500 mb-8 max-w-2xl mx-auto">Cultlike brings performance data back into the system so you can understand what happened, what worked, and what needs to change.</p>
              <div className="bg-white p-6 rounded-2xl border border-black/[0.04] shadow-sm inline-block text-left">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Ask your AI</p>
                <p className="text-lg font-semibold text-black mb-1">“How did this sprint perform?”</p>
                <p className="text-sm text-neutral-500">Get the answer from the actual data. Not a guess.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EVIDENCE / PROOF ─── */}
      <section className="py-20 sm:py-32 px-6 sm:px-10 max-w-[1200px] mx-auto relative z-10">
        <div className="p-12 md:p-16 rounded-[48px] bg-black shadow-2xl text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-6 uppercase">YOUR WORK SHOULD LEAVE EVIDENCE.</h3>
              <p className="text-neutral-400 text-lg mb-8">Most platforms measure activity. Cultlike measures <strong className="text-white">output.</strong></p>
              <div className="space-y-2 text-neutral-400 text-sm mb-10">
                <p>How much did you ship?</p>
                <p>How consistently did you create?</p>
                <p>How quickly did you move?</p>
                <p>What did you improve?</p>
                <p>What are your personal bests?</p>
              </div>
              <h4 className="text-amber-500 font-bold tracking-widest uppercase text-xs mb-4">CULTLIKE CREATE</h4>
              <p className="font-medium mb-6">Your execution becomes visible.</p>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wider text-neutral-300 mb-8">
                <span className="px-3 py-1 bg-white/10 rounded-full">Content shipped</span>
                <span className="px-3 py-1 bg-white/10 rounded-full">Shipping streaks</span>
                <span className="px-3 py-1 bg-white/10 rounded-full">Deep work</span>
                <span className="px-3 py-1 bg-white/10 rounded-full">Velocity</span>
              </div>
              <p className="text-xl font-semibold">Not vanity metrics. Proof of work.</p>
            </div>
            
            <div className="p-10 rounded-[32px] border border-white/10 bg-[#0c0d12] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="relative z-10">
                <div className="text-xs text-neutral-500 font-mono uppercase tracking-widest mb-2">Current Streak</div>
                <div className="text-6xl font-light text-amber-500 tracking-tight">14<span className="text-2xl text-amber-500/50"> DAYS</span></div>
                
                <div className="grid grid-cols-2 gap-6 pt-8 mt-8 border-t border-white/10">
                  <div>
                    <div className="text-xs text-neutral-500 font-mono uppercase tracking-widest mb-2">Peak Velocity</div>
                    <div className="text-3xl font-light">8<span className="text-base text-neutral-500"> /day</span></div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 font-mono uppercase tracking-widest mb-2">Total Shipped</div>
                    <div className="text-3xl font-light">142</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROOF IS CURRENCY ─── */}
      <section className="py-20 sm:py-32 px-6 sm:px-10 max-w-[1000px] mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-12 text-black uppercase">FOR CREATORS, PROOF IS CURRENCY.</h2>
        <div className="space-y-4 text-xl sm:text-2xl text-neutral-500 mb-12">
          <p>Sponsors don't just want followers.</p>
          <p>Clients don't just want promises.</p>
          <p>Agencies don't just want presentations.</p>
        </div>
        <p className="text-2xl sm:text-3xl font-medium text-black mb-8">They want to know: <br/><span className="font-bold text-4xl sm:text-5xl block mt-4">Can you actually execute?</span></p>
        <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-12">Cultlike turns your work into a clean, verifiable proof layer you can share.</p>
        <div className="flex justify-center items-center gap-4 text-xl font-bold text-black flex-wrap">
          <span>Your output.</span><span>•</span>
          <span>Your consistency.</span><span>•</span>
          <span>Your record.</span><span>•</span>
          <span className="text-3xl">Your proof.</span>
        </div>
      </section>

      {/* ─── ALIVE WORKSPACE ─── */}
      <section className="py-20 sm:py-32 px-6 sm:px-10 bg-[#fafafc] border-t border-black/[0.06] text-center">
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-black uppercase mb-6">YOUR WORKSPACE SHOULD FEEL ALIVE.</h2>
        <p className="text-xl text-neutral-500 max-w-2xl mx-auto mb-12">Not another dashboard full of numbers. A living environment where your work exists.</p>
        <div className="flex flex-wrap justify-center gap-4 text-lg font-medium text-black mb-12 max-w-3xl mx-auto">
          <span>Projects.</span><span className="text-neutral-400">Whiteboards.</span>
          <span>Content.</span><span className="text-neutral-400">Assets.</span>
          <span>Schedules.</span><span className="text-neutral-400">Deadlines.</span>
          <span>Ideas.</span>
        </div>
        <p className="text-2xl font-bold text-black mb-2">Everything connected to everything else.</p>
        <p className="text-lg text-neutral-500">Move something once. The system understands what changed.</p>
      </section>

      {/* ─── NEVER LEAVE YOUR AI ─── */}
      <section className="py-20 sm:py-32 px-6 sm:px-10 bg-white border-y border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-black uppercase mb-6">AND YOU NEVER HAVE TO LEAVE YOUR AI.</h2>
            <p className="text-xl font-medium text-black mb-8">This is the difference.</p>
            <div className="space-y-4 text-lg text-neutral-500 mb-8">
              <p>You don't need to constantly open Cultlike to tell it what to do.</p>
              <p>Ask ChatGPT. Ask Claude.</p>
              <p>Tell your AI what you're working on. Cultlike can become the system that actually carries it out.</p>
            </div>
            <div className="space-y-4 font-medium text-black bg-[#fafafc] p-6 rounded-2xl border border-black/[0.06] mb-8">
              <p>“Find the latest draft for the campaign.”</p>
              <p>“Move this content to next week's schedule.”</p>
              <p>“What is blocking this project?”</p>
              <p>“Show me how the last sprint performed.”</p>
            </div>
            <p className="text-2xl font-bold text-black">Your AI handles the conversation.<br/>Cultlike handles the state.</p>
          </div>
          <div className="bg-[#f5f5f5] rounded-3xl p-8 border border-black/[0.06] shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-black/[0.04] overflow-hidden">
               <div className="p-4 border-b border-black/[0.04] bg-[#fafafc] flex items-center gap-2">
                 <ChatGPTLogo className="w-5 h-5"/>
                 <span className="font-semibold text-sm text-black">ChatGPT (Cultlike Connected)</span>
               </div>
               <div className="p-6 space-y-6">
                 <div className="flex justify-end">
                   <div className="bg-black text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-none">Move the brand assets to next Tuesday.</div>
                 </div>
                 <div className="flex gap-4">
                   <ChatGPTLogo className="w-6 h-6 shrink-0"/>
                   <div className="space-y-2">
                     <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">System Updated</div>
                     <p className="text-sm text-neutral-700 leading-relaxed">Done. I've rescheduled the brand assets for next Tuesday in your Cultlike pipeline.</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MOMENTUM / DARK CTA ─── */}
      <section className="bg-[#0c0d12] text-white py-24 sm:py-32 px-6 sm:px-10 rounded-t-[44px] relative overflow-hidden z-10 mt-12 text-center max-w-[1400px] mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.1),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight uppercase mb-8">BUILT FOR MOMENTUM.</h2>
          <p className="text-xl text-neutral-400 mb-12">Because the goal isn't to have a beautifully organized workspace. <strong className="text-white block mt-2">The goal is to ship.</strong></p>
          
          <div className="text-2xl sm:text-3xl font-medium text-neutral-500 space-y-2 mb-12">
            <p>One idea. One asset. One project.</p>
            <p>One publish. One sprint.</p>
            <p className="text-white">Then another. And another.</p>
            <p className="text-3xl sm:text-4xl font-bold text-white mt-6">Until the output becomes undeniable.</p>
          </div>

          <div className="border-t border-white/10 pt-16 mb-16">
            <h3 className="text-3xl font-semibold mb-6 uppercase">YOU DON'T NEED MORE TOOLS.</h3>
            <p className="text-xl text-neutral-400 mb-8">You need fewer things sitting between <strong className="text-white">thinking</strong> and <strong className="text-white">doing.</strong></p>
            <p className="text-2xl font-bold mb-8">Cultlike connects the pieces.</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-bold tracking-widest uppercase text-neutral-500 mb-8">
              <span>Your AI</span><span>Your Projects</span><span>Your Content</span>
              <span>Your Schedule</span><span>Your Execution</span><span>Your Proof</span>
            </div>
            <p className="text-2xl font-medium text-sky-400">One operating layer.</p>
          </div>

          <h3 className="text-4xl sm:text-5xl font-bold uppercase mb-8">BUILD WITHOUT LOSING THE THREAD.</h3>
          
          <button
            onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
            className="px-10 py-4 rounded-full bg-white hover:bg-neutral-200 text-black text-sm font-bold transition-all shadow-xl active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
          >
            Enter Cultlike <ArrowRight size={16} />
          </button>
          
          <div className="mt-12 text-sm text-neutral-500 space-y-2 font-medium">
            <p>No productivity hacks. No complicated methodology. No endless setup.</p>
            <p className="text-white text-base">Just your work — connected, persistent, and moving.</p>
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
