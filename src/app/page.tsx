'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, X, ChevronDown, Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import LandingMenuModal from '@/components/LandingMenuModal'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const wordAnimation: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { ease, duration: 0.8 }
  }
};

const AnimatedText = ({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) => {
  const words = text.split(" ");
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
        <span key={index} className="inline-block overflow-hidden mr-[0.25em] pb-1">
          <motion.span variants={wordAnimation} className="inline-block">
            {word}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
};

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
      q: 'What is Cultlike OS?',
      a: 'Cultlike OS is a unified executive operating system for founders, creators, and solo builders. It combines project management, task execution, meeting intelligence, content scheduling, and AI connectors into a single cohesive workspace.',
    },
    {
      q: 'How do the Claude and ChatGPT connectors work?',
      a: 'Cultlike OS exposes a live, secure OpenAPI 3.1 endpoint. You can connect it directly to Claude or ChatGPT custom GPTs. Your AI assistants automatically inherit full real-time context of your tasks, projects, blockers, and meeting takeaways.',
    },
    {
      q: 'How does the Pomodoro and streak tracking work?',
      a: 'Every task has a native 25-minute deep work timer built in. As you complete sessions and ship tasks, the system builds your consecutive daily streak and charts your annual execution velocity heatmap.',
    },
    {
      q: 'How does Fathom meeting intelligence integrate?',
      a: 'When you finish a call on Fathom, your recording, summary, and action items sync into your workspace. You can convert any takeaway into an actionable task with one click.',
    },
    {
      q: 'What creator features are supported?',
      a: 'Cultlike OS includes a content vault for multi-platform scheduling, Google Drive media import, YouTube and Instagram integration, and a proof-of-work scorecard for tracking your shipping consistency.',
    },
    {
      q: 'Is Cultlike OS free to use?',
      a: 'Yes. You can launch your free workspace right now in under 30 seconds. No credit card required.',
    },
  ]

  const features = [
    {
      number: '01',
      title: 'AI-powered execution',
      description: 'Connect Claude and ChatGPT directly to your workspace. Your AI assistants operate with full, real-time context of every active task, project, blocker, and meeting transcript. No more copy-pasting.',
    },
    {
      number: '02',
      title: 'Deep work sprints and streaks',
      description: 'Built-in 25-minute Pomodoro timers linked to specific deliverables. Track consecutive daily shipping streaks and visualize your annual execution velocity with a GitHub-style heatmap.',
    },
    {
      number: '03',
      title: 'Meeting intelligence to tasks',
      description: 'Fathom call recordings, summaries, and action items sync automatically. Convert any spoken takeaway into an executable P0 task with one click. Your meetings become deliverables.',
    },
  ]

  return (
    <div className="min-h-screen bg-white text-[#0c0d0f] selection:bg-black/10 relative">

      {/* ─── STICKY NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-black/[0.06]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-10 h-16 flex items-center justify-between relative">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <img 
                src="/logo-cultlike.png" 
                alt="Logo" 
                className="h-11 w-11 sm:h-12 sm:w-12 object-contain rounded-full hover:scale-105 transition-transform" 
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
              {/* 2 horizontal bars from Screenshot 1 */}
              <svg className="w-4 h-2.5 text-neutral-900" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="1" y1="2" x2="15" y2="2" />
                <line x1="1" y1="8" x2="15" y2="8" />
              </svg>
              <span>Menu</span>
            </button>
          </div>

          {/* Right: CTA & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-block text-xs font-medium text-neutral-600 hover:text-black px-3 py-1.5 transition-colors cursor-pointer"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-normal shadow-xs transition-all cursor-pointer"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Minimalist Multi-Column Menu Modal matching Screenshot 2 */}
      <LandingMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenAuth={(authMode) => {
          setMode(authMode)
          setConfirmationSent(false)
          setIsAuthOpen(true)
        }}
      />


      {/* ─── VIBRANT AMBIENT STUDIO LIGHTING BACKDROPS (PRESERVED) ─── */}
      <div className="fixed top-0 left-1/4 w-[700px] h-[600px] bg-gradient-to-br from-indigo-500/25 via-purple-500/20 to-pink-500/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-amber-400/25 via-orange-500/20 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-10 left-10 w-[700px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-indigo-500/20 to-purple-500/15 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* ─── HERO SECTION ─── */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-6 sm:px-10 max-w-[1400px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Text (Pure Monochrome) */}
          <div className="lg:col-span-6 space-y-8 pt-4">
            {/* Social proof badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-black/[0.08] bg-white/80 backdrop-blur-md text-xs text-neutral-800 font-normal shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
              <span className="font-medium">Free for solo builders &amp; creators</span>
            </div>

            {/* Giant headline (Pure Monochrome) */}
            <h1 className="text-[clamp(36px,5.5vw,72px)] font-bold tracking-[-0.035em] leading-[1.05] text-black">
              <AnimatedText text="One workspace" />
              <span className="text-neutral-400 font-light block">
                <AnimatedText text="for everything you ship." delay={0.2} />
              </span>
            </h1>

            {/* Subtitle */}
            <div className="text-base sm:text-lg text-neutral-500 font-normal leading-relaxed max-w-lg">
              <AnimatedText text="The studio operating system for founders and creators. AI connectors, deep work sprints, meeting intelligence, and content scheduling — unified." delay={0.4} />
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
                className="px-7 py-3.5 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-medium transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Launch Free Workspace
              </button>
              <button
                onClick={() => { setMode('login'); setConfirmationSent(false); setIsAuthOpen(true) }}
                className="px-6 py-3.5 rounded-full border border-black/[0.12] hover:border-black/[0.3] bg-white/70 backdrop-blur-xs text-sm font-normal text-black transition-all cursor-pointer shadow-xs"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Right: High-End Interactive Telemetry & Graphs Cockpit (Monochrome Hardware Deck) */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl bg-[#0c0d12]/95 backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.2)] p-6 space-y-5 text-white overflow-hidden">
              
              {/* Top Bar: System Status & Live Velocity */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-300 font-medium">CULTLIKE TELEMETRY</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-200 border border-white/15 text-[10px] font-mono font-medium">
                    99.8% On-Time
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/20 text-[10px] font-mono font-medium">
                    +34% WoW Velocity
                  </span>
                </div>
              </div>

              {/* Main Graph 1: 7-Day Velocity Spline Curve (Monochrome) */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Shipping Velocity (7-Day Trend)</div>
                    <div className="text-xl font-light text-white tracking-tight mt-0.5">
                      42.5 <span className="text-xs text-neutral-400 font-normal">hours focused</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-medium text-white">18 Deliverables</span>
                    <div className="text-[10px] text-neutral-400 font-mono">Peak: 6.8h / day</div>
                  </div>
                </div>

                {/* SVG Spline Graph (Pure Monochrome) */}
                <div className="relative h-28 w-full pt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="monoGradientDark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="400" y2="25" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <line x1="0" y1="65" x2="400" y2="65" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                    {/* Area under curve */}
                    <path
                      d="M 0,80 Q 40,65 80,75 T 160,40 T 240,55 T 320,20 T 400,15 L 400,100 L 0,100 Z"
                      fill="url(#monoGradientDark)"
                    />

                    {/* Monochrome Stroke line */}
                    <path
                      d="M 0,80 Q 40,65 80,75 T 160,40 T 240,55 T 320,20 T 400,15"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Monochrome Data Nodes */}
                    <circle cx="80" cy="75" r="3.5" fill="#0c0d12" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="160" cy="40" r="3.5" fill="#0c0d12" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="240" cy="55" r="3.5" fill="#0c0d12" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="320" cy="20" r="4.5" fill="#ffffff" stroke="#0c0d12" strokeWidth="1.5" className="animate-pulse" />
                    <circle cx="400" cy="15" r="4.5" fill="#ffffff" stroke="#0c0d12" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* Day labels */}
                <div className="flex justify-between text-[10px] font-mono text-neutral-400 pt-1 border-t border-white/[0.06]">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span className="font-semibold text-white">Sun (Today)</span>
                </div>
              </div>

              {/* Bottom Split: Radial Focus Dial + Annual Execution Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                
                {/* Left Mini: Radial Chronograph (Monochrome) */}
                <div className="sm:col-span-5 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-3.5">
                  <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-white/10"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-white"
                        strokeDasharray="84, 100"
                        strokeLinecap="round"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-mono font-medium text-white">24:18</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block font-medium">DEEP WORK</span>
                    <span className="text-xs font-normal text-white block leading-tight">Sprint: Product Reel</span>
                    <span className="text-[10px] font-mono text-neutral-300 font-medium mt-0.5 block">14-Day Streak 🔥</span>
                  </div>
                </div>

                {/* Right Mini: 12-Week Annual Execution Matrix Heatmap (Monochrome) */}
                <div className="sm:col-span-7 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase text-neutral-400 font-medium">ANNUAL CADENCE</span>
                    <span className="text-[10px] font-mono text-neutral-200 font-medium">142 Shipped</span>
                  </div>
                  {/* Heatmap Grid (Monochrome Levels) */}
                  <div className="grid grid-cols-12 gap-1">
                    {[
                      [1,2,3,2,1,0,3], [2,3,4,3,2,1,2], [3,4,4,4,3,2,3], [1,2,3,1,0,1,2],
                      [2,3,4,4,3,2,4], [3,4,4,4,4,3,3], [0,1,2,3,2,1,2], [2,3,3,4,3,2,3],
                      [3,4,4,4,3,2,4], [4,4,4,4,4,3,4], [3,4,4,4,4,4,3], [4,4,4,4,4,4,4]
                    ].map((col, cIdx) => (
                      <div key={cIdx} className="flex flex-col gap-1">
                        {col.map((lvl, rIdx) => {
                          const bg = lvl === 4 ? 'bg-white' :
                                     lvl === 3 ? 'bg-neutral-400' :
                                     lvl === 2 ? 'bg-neutral-600' :
                                     lvl === 1 ? 'bg-neutral-800' : 'bg-white/5';
                          return (
                            <div 
                              key={rIdx} 
                              className={cn("w-full h-1.5 rounded-2xs transition-all", bg)} 
                              title={`Week ${cIdx + 1}, Day ${rIdx + 1}: ${lvl} commits`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400 pt-1.5">
                    <span>12 Weeks Ago</span>
                    <span className="font-semibold text-white">Active Sprint</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>


      {/* ─── FULL-WIDTH STATEMENT SECTION ─── */}
      <section className="py-20 sm:py-32 px-6 sm:px-10 border-t border-black/[0.06]">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-[clamp(28px,5vw,56px)] font-bold tracking-[-0.03em] leading-[1.15] text-black max-w-4xl">
            <AnimatedText text="Cultlike OS is the operating system for relentless execution." />
            <span className="text-neutral-400 font-light block mt-2">
              <AnimatedText text="Projects, tasks, meetings, content, and AI — on a single surface, using zero friction." delay={0.3} />
            </span>
          </h2>
        </div>
      </section>


      {/* ─── NUMBERED FEATURES SECTION ─── */}
      <section id="features" className="py-0 px-6 sm:px-10 max-w-[1400px] mx-auto">
        {features.map((feature, idx) => (
          <motion.div 
            key={feature.number}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ ease, duration: 0.8, delay: idx * 0.1 }}
            className="py-16 sm:py-20 border-t border-black/[0.08] grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start group"
          >
            {/* Number + Title */}
            <div className="md:col-span-1 overflow-hidden">
              <motion.span 
                className="inline-block text-sm font-normal text-neutral-400 group-hover:text-black transition-colors duration-500"
                whileHover={{ x: 10, transition: { ease, duration: 0.4 } }}
              >
                {feature.number}
              </motion.span>
            </div>
            <div className="md:col-span-5">
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-black leading-tight group-hover:-translate-y-1 transition-transform duration-500 ease-out">
                {feature.title}
              </h3>
            </div>

            {/* Description */}
            <div className="md:col-span-6">
              <p className="text-base sm:text-lg text-neutral-500 font-normal leading-relaxed group-hover:text-neutral-800 transition-colors duration-500">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </section>


      {/* ─── DARK SHOWCASE SECTION (Workspace Preview with Neon Ambient Glow) ─── */}
      <section id="showcase" className="bg-[#090a0f] text-white py-20 sm:py-32 px-6 sm:px-10 mt-16 relative overflow-hidden">
        {/* Atmospheric Backlight Orbs */}
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          {/* Left: Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>LIVE WORKSPACE SYNTHESIS</span>
            </div>
            <h2 className="text-3xl sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.15] text-white">
              Sign in, see your entire operation.
            </h2>
            <p className="text-base text-neutral-400 font-normal leading-relaxed max-w-md">
              A unified workspace appears instantly. All your projects, tasks, meetings, content, and analytics are there — organized and actionable from day one.
            </p>
          </div>

          {/* Right: Dark Product Window */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-3xl blur-xl" />
            <div className="relative rounded-2xl border border-white/10 bg-[#0e1017]/95 shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="px-5 py-3.5 bg-black/40 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-xs font-mono text-neutral-400 font-medium">Cultlike OS — Dashboard</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
                  <span className="text-[10px] font-mono text-amber-300">Live</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Mock dashboard content */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                    <div className="text-[10px] font-mono text-indigo-300 uppercase font-semibold">Tasks Shipped</div>
                    <div className="text-2xl font-semibold text-white mt-1">142</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="text-[10px] font-mono text-amber-300 uppercase font-semibold">Streak</div>
                    <div className="text-2xl font-semibold text-amber-400 mt-1">14d 🔥</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <div className="text-[10px] font-mono text-purple-300 uppercase font-semibold">Focus Hours</div>
                    <div className="text-2xl font-semibold text-purple-300 mt-1">38.5h</div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                      <span className="text-xs text-neutral-200">Finalize Q4 roadmap review</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">P0</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                      <span className="text-xs text-neutral-200">Publish YouTube episode</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">P1</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      <span className="text-xs text-neutral-400 line-through">Update client proposal</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Shipped</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ─── DARK SHOWCASE 2 (Content Vault) ─── */}
      <section className="bg-[#0c0d0f] text-white py-20 sm:py-32 px-6 sm:px-10">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Product Window */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden order-2 lg:order-1">
            <div className="px-5 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="text-xs font-mono text-neutral-500 ml-2">Content Vault — Scheduler</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-400 text-[10px] font-mono">Instagram</span>
                <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-mono">YouTube</span>
                <span className="px-2.5 py-1 rounded-lg bg-neutral-700 text-neutral-400 text-[10px] font-mono">TikTok</span>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/40 flex items-center justify-between">
                  <span className="text-xs text-neutral-300">Behind the scenes — studio tour</span>
                  <span className="text-[10px] font-mono text-amber-400">Scheduled</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/40 flex items-center justify-between">
                  <span className="text-xs text-neutral-300">Product launch teaser reel</span>
                  <span className="text-[10px] font-mono text-indigo-400">Published</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/40 flex items-center justify-between">
                  <span className="text-xs text-neutral-300">Weekly vlog — episode 47</span>
                  <span className="text-[10px] font-mono text-neutral-500">Draft</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Text */}
          <div className="space-y-6 order-1 lg:order-2">
            <h2 className="text-3xl sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.15] text-white">
              Schedule and ship across every platform.
            </h2>
            <p className="text-base text-neutral-400 font-normal leading-relaxed max-w-md">
              Manage your YouTube, Instagram, and TikTok content from a single vault. Import media from Google Drive, schedule posts, and track performance metrics — all without leaving your workspace.
            </p>
          </div>
        </div>
      </section>


      {/* ─── FAQ SECTION (Split Layout) ─── */}
      <section id="faq" className="py-20 sm:py-32 px-6 sm:px-10 bg-white">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left: Heading */}
          <div className="lg:col-span-4">
            <h2 className="text-3xl sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.15] text-black">
              Common questions
            </h2>
            <p className="text-sm text-neutral-500 mt-4 font-normal">
              Still have a question?{' '}
              <a href="mailto:hello@cultlike.os" className="text-black underline underline-offset-4 decoration-black/30 hover:decoration-black transition-colors">
                Write to the team
              </a>
              . We&apos;ll read it.
            </p>
          </div>

          {/* Right: Accordion */}
          <div className="lg:col-span-8">
            <div className="divide-y divide-black/[0.08]">
              {faqs.map((faq, idx) => (
                <div key={idx}>
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between py-6 text-left cursor-pointer group"
                  >
                    <span className="text-base sm:text-lg font-medium text-black pr-8 group-hover:text-neutral-600 transition-colors">
                      {faq.q}
                    </span>
                    <span className="text-neutral-400 shrink-0">
                      {activeFaq === idx ? (
                        <X size={18} strokeWidth={1.5} />
                      ) : (
                        <Plus size={18} strokeWidth={1.5} />
                      )}
                    </span>
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300 ease-out',
                      activeFaq === idx ? 'max-h-60 pb-6' : 'max-h-0'
                    )}
                  >
                    <p className="text-sm sm:text-base text-neutral-500 font-normal leading-relaxed max-w-2xl">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ─── DARK CTA SECTION ─── */}
      <section className="bg-[#0c0d0f] text-white py-24 sm:py-32 px-6 sm:px-10 rounded-t-[40px]">
        <div className="max-w-[1400px] mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-[52px] font-semibold tracking-[-0.03em] leading-[1.15] text-white max-w-3xl mx-auto">
            Ready to build with Cultlike OS?
          </h2>
          <p className="text-base text-neutral-400 font-normal max-w-lg mx-auto">
            Launch your workspace in under 30 seconds. Free forever for solo builders. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="px-8 py-4 rounded-full bg-white hover:bg-neutral-100 text-black text-sm font-medium transition-all cursor-pointer shadow-sm"
            >
              Launch Free Workspace
            </button>
            <button
              onClick={() => { setMode('login'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="px-7 py-4 rounded-full border border-neutral-700 hover:border-neutral-500 text-sm font-normal text-white transition-all cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>


      {/* ─── FOOTER ─── */}
      <footer className="bg-white border-t border-black/[0.06] py-16 px-6 sm:px-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-12">
            {/* Logo + Tagline */}
            <div className="col-span-2 md:col-span-4 space-y-4">
              <div className="flex items-center">
                <img 
                  src="/logo-cultlike.png" 
                  alt="Logo" 
                  className="h-10 w-10 object-contain rounded-full" 
                />
              </div>
              <p className="text-sm text-neutral-500 font-normal">
                The studio workspace for high-agency creators.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Link
                  href="/signup"
                  className="px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium transition-all cursor-pointer"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-full border border-black/[0.12] hover:border-black/[0.3] text-xs font-normal text-black transition-all cursor-pointer"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Product */}
            <div className="md:col-span-2">
              <h4 className="text-xs font-semibold text-black mb-4">Product</h4>
              <div className="space-y-2.5">
                <a href="#features" className="block text-sm text-neutral-500 hover:text-black transition-colors">Overview</a>
                <a href="#features" className="block text-sm text-neutral-500 hover:text-black transition-colors">How it works</a>
                <a href="#faq" className="block text-sm text-neutral-500 hover:text-black transition-colors">FAQ</a>
              </div>
            </div>

            {/* Company */}
            <div className="md:col-span-2">
              <h4 className="text-xs font-semibold text-black mb-4">Company</h4>
              <div className="space-y-2.5">
                <span className="block text-sm text-neutral-500">Blog</span>
                <span className="block text-sm text-neutral-500">Changelog</span>
                <span className="block text-sm text-neutral-500">Contact</span>
              </div>
            </div>

            {/* Legal */}
            <div className="md:col-span-2">
              <h4 className="text-xs font-semibold text-black mb-4">Legal</h4>
              <div className="space-y-2.5">
                <Link href="/privacy" className="block text-sm text-neutral-500 hover:text-black transition-colors">Privacy Notice</Link>
                <Link href="/terms" className="block text-sm text-neutral-500 hover:text-black transition-colors">Terms of Use</Link>
                <Link href="/data-deletion" className="block text-sm text-neutral-500 hover:text-black transition-colors">Data Deletion</Link>
              </div>
            </div>

            {/* Social */}
            <div className="md:col-span-2">
              <h4 className="text-xs font-semibold text-black mb-4">Social</h4>
              <div className="space-y-2.5">
                <span className="block text-sm text-neutral-500">X</span>
                <span className="block text-sm text-neutral-500">Instagram</span>
                <span className="block text-sm text-neutral-500">YouTube</span>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-16 pt-8 border-t border-black/[0.06] text-xs text-neutral-400 font-normal">
            © {new Date().getFullYear()} Cultlike OS. All rights reserved.
          </div>
        </div>
      </footer>


      {/* ─── AUTH MODAL ─── */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn relative">
            {/* Close button */}
            <button
              onClick={() => { setIsAuthOpen(false); setError(null); setConfirmationSent(false) }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 transition-colors cursor-pointer z-10"
            >
              <X size={16} />
            </button>

            <div className="p-8 sm:p-10">
              {/* Logo */}
              <div className="flex items-center mb-8">
                <img src="/logo-cultlike.png" alt="Logo" className="h-10 w-10 object-contain rounded-full" />
              </div>

              {confirmationSent ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                    ✓
                  </div>
                  <h3 className="text-lg font-semibold text-black">Check your email</h3>
                  <p className="text-sm text-neutral-500">
                    We sent a confirmation link to <strong className="text-black">{email}</strong>. Click it to activate your workspace.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold text-black tracking-tight mb-1">
                    {mode === 'signup' ? 'Create your workspace' : 'Welcome back'}
                  </h2>
                  <p className="text-sm text-neutral-500 mb-8">
                    {mode === 'signup' ? 'Free forever for solo builders.' : 'Sign in to your workspace.'}
                  </p>

                  {error && (
                    <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1.5">Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          required
                          className="w-full px-4 py-3 bg-neutral-50 border border-black/[0.1] rounded-xl text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 transition-all"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-4 py-3 bg-neutral-50 border border-black/[0.1] rounded-xl text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-4 py-3 bg-neutral-50 border border-black/[0.1] rounded-xl text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-medium transition-all disabled:opacity-50 cursor-pointer mt-2"
                    >
                      {loading ? 'Processing...' : mode === 'signup' ? 'Create Workspace' : 'Sign In'}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(null) }}
                      className="text-xs text-neutral-500 hover:text-black transition-colors cursor-pointer"
                    >
                      {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Mobile Menu Overlay */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-black/[0.08] px-6 py-3 flex items-center justify-between safe-area-bottom">
        <a href="#features" className="text-xs text-neutral-500 hover:text-black transition-colors">Features</a>
        <a href="#showcase" className="text-xs text-neutral-500 hover:text-black transition-colors">Showcase</a>
        <a href="#faq" className="text-xs text-neutral-500 hover:text-black transition-colors">FAQ</a>
        <button
          onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
          className="px-4 py-2 rounded-full bg-black text-white text-xs font-medium cursor-pointer"
        >
          Get Started
        </button>
      </div>
    </div>
  )
}
