'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, X, ChevronDown, Plus, Menu as MenuIcon
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/[0.06]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo-cultlike.png" 
              alt="Cultlike OS" 
              className="h-9 w-9 object-contain rounded-full" 
            />
            <span className="text-sm font-semibold tracking-tight text-black hidden sm:inline">Cultlike OS</span>
          </div>

          {/* Center: Menu Button (Reference Style) */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="hidden md:flex items-center gap-2.5 px-5 py-2 rounded-full border border-black/[0.12] hover:border-black/[0.25] transition-colors cursor-pointer"
          >
            <MenuIcon size={14} strokeWidth={2} />
            <span className="text-sm font-normal">Menu</span>
          </button>

          {/* Right: CTA */}
          <button
            onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
            className="px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-normal transition-all cursor-pointer"
          >
            Get Started
          </button>
        </div>

        {/* Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-black/[0.08] shadow-lg animate-fadeIn">
            <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-black mb-3 tracking-wide uppercase">Product</h4>
                <div className="space-y-2.5">
                  <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-sm text-neutral-500 hover:text-black transition-colors">How it works</a>
                  <a href="#showcase" onClick={() => setIsMenuOpen(false)} className="block text-sm text-neutral-500 hover:text-black transition-colors">Showcase</a>
                  <a href="#faq" onClick={() => setIsMenuOpen(false)} className="block text-sm text-neutral-500 hover:text-black transition-colors">FAQ</a>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-black mb-3 tracking-wide uppercase">Features</h4>
                <div className="space-y-2.5">
                  <span className="block text-sm text-neutral-500">AI Connectors</span>
                  <span className="block text-sm text-neutral-500">Deep Work Sprints</span>
                  <span className="block text-sm text-neutral-500">Meeting Intelligence</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-black mb-3 tracking-wide uppercase">Legal</h4>
                <div className="space-y-2.5">
                  <Link href="/privacy" onClick={() => setIsMenuOpen(false)} className="block text-sm text-neutral-500 hover:text-black transition-colors">Privacy Notice</Link>
                  <Link href="/terms" onClick={() => setIsMenuOpen(false)} className="block text-sm text-neutral-500 hover:text-black transition-colors">Terms of Use</Link>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-black mb-3 tracking-wide uppercase">Account</h4>
                <div className="space-y-2.5">
                  <button onClick={() => { setIsMenuOpen(false); setMode('login'); setIsAuthOpen(true) }} className="block text-sm text-neutral-500 hover:text-black transition-colors cursor-pointer">Sign In</button>
                  <button onClick={() => { setIsMenuOpen(false); setMode('signup'); setIsAuthOpen(true) }} className="block text-sm text-neutral-500 hover:text-black transition-colors cursor-pointer">Create Account</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>


      {/* ─── HERO SECTION ─── */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-6 sm:px-10 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: Text */}
          <div className="space-y-8 pt-4 lg:pt-12">
            {/* Social proof badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/[0.1] text-xs text-neutral-600 font-normal">
              Free for solo builders & creators
            </div>

            {/* Giant headline */}
            <h1 className="text-[clamp(36px,6vw,72px)] font-bold tracking-[-0.035em] leading-[1.05] text-black">
              One workspace{' '}
              <span className="text-neutral-400 font-light">
                for everything you ship.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-neutral-500 font-normal leading-relaxed max-w-lg">
              The executive operating system for founders and creators. AI connectors, 
              deep work sprints, meeting intelligence, and content scheduling — unified.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
                className="px-7 py-3.5 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-medium transition-all cursor-pointer shadow-sm"
              >
                Launch Free Workspace
              </button>
              <button
                onClick={() => { setMode('login'); setConfirmationSent(false); setIsAuthOpen(true) }}
                className="px-6 py-3.5 rounded-full border border-black/[0.12] hover:border-black/[0.3] text-sm font-normal text-black transition-all cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Right: Product Preview Cards (Fanned like reference) */}
          <div className="relative h-[400px] sm:h-[480px] lg:h-[520px]">
            {/* Card 1 - Dashboard Preview */}
            <div 
              className="absolute top-6 right-0 w-[75%] sm:w-[320px] rounded-2xl bg-[#fafafa] border border-black/[0.08] shadow-xl overflow-hidden"
              style={{ transform: 'rotate(3deg)' }}
            >
              <div className="px-4 py-3 bg-white border-b border-black/[0.05] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
                <span className="w-2 h-2 rounded-full bg-[#28c840]" />
                <span className="text-[10px] text-neutral-400 ml-2 font-mono">Dashboard</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Sprint Health</span>
                  <span className="text-[10px] font-mono text-emerald-600">84%</span>
                </div>
                <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full" style={{ width: '84%' }} />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-neutral-700">Finalize sponsor deliverable</span>
                    <span className="ml-auto text-[10px] font-mono text-neutral-400">P0</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-neutral-700">Record episode intro</span>
                    <span className="ml-auto text-[10px] font-mono text-neutral-400">P1</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-neutral-500 line-through">Publish weekly newsletter</span>
                    <span className="ml-auto text-[10px] font-mono text-emerald-600">Shipped</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 - Focus Timer */}
            <div 
              className="absolute top-32 sm:top-28 right-16 sm:right-40 w-[65%] sm:w-[280px] rounded-2xl bg-white border border-black/[0.08] shadow-xl overflow-hidden z-10"
              style={{ transform: 'rotate(-2deg)' }}
            >
              <div className="px-4 py-3 bg-white border-b border-black/[0.05] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
                <span className="w-2 h-2 rounded-full bg-[#28c840]" />
                <span className="text-[10px] text-neutral-400 ml-2 font-mono">Focus Timer</span>
              </div>
              <div className="p-5 text-center space-y-3">
                <div className="text-[10px] font-mono text-emerald-600 uppercase tracking-wider">Deep Work</div>
                <div className="text-4xl font-mono font-light text-black tracking-tighter">24:18</div>
                <div className="text-xs text-neutral-400">Sprint on: Sony color grade</div>
                <div className="flex items-center justify-center gap-1 text-xs font-mono text-orange-600">
                  <span>🔥</span>
                  <span>14 Day Streak</span>
                </div>
              </div>
            </div>

            {/* Card 3 - AI Sync */}
            <div 
              className="absolute bottom-8 sm:bottom-12 right-4 sm:right-8 w-[70%] sm:w-[300px] rounded-2xl bg-[#0c0d0f] border border-neutral-800 shadow-xl overflow-hidden z-20"
              style={{ transform: 'rotate(1.5deg)' }}
            >
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
                <span className="w-2 h-2 rounded-full bg-[#28c840]" />
                <span className="text-[10px] text-neutral-500 ml-2 font-mono">AI Context Engine</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[10px] font-mono text-emerald-400">✓ Claude connected via OpenAPI</div>
                <div className="text-xs text-neutral-400 leading-relaxed">
                  "Sprint health at 84%. 1 P0 blocker isolated. 2 low-priority items auto-rescheduled to tomorrow."
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
            Cultlike OS is the operating system for relentless execution.{' '}
            <span className="text-neutral-400 font-light">
              Projects, tasks, meetings, content, and AI — on a single surface, using zero friction.
            </span>
          </h2>
        </div>
      </section>


      {/* ─── NUMBERED FEATURES SECTION ─── */}
      <section id="features" className="py-0 px-6 sm:px-10 max-w-[1400px] mx-auto">
        {features.map((feature, idx) => (
          <div 
            key={feature.number}
            className="py-16 sm:py-20 border-t border-black/[0.08] grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start"
          >
            {/* Number + Title */}
            <div className="md:col-span-1">
              <span className="text-sm font-normal text-neutral-400">{feature.number}</span>
            </div>
            <div className="md:col-span-5">
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-black leading-tight">
                {feature.title}
              </h3>
            </div>

            {/* Description */}
            <div className="md:col-span-6">
              <p className="text-base sm:text-lg text-neutral-500 font-normal leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </section>


      {/* ─── DARK SHOWCASE SECTION (Workspace Preview) ─── */}
      <section id="showcase" className="bg-[#0c0d0f] text-white py-20 sm:py-32 px-6 sm:px-10 mt-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.15] text-white">
              Sign in, see your entire operation.
            </h2>
            <p className="text-base text-neutral-400 font-normal leading-relaxed max-w-md">
              A unified workspace appears instantly. All your projects, tasks, meetings, content, and analytics are there — organized and actionable from day one.
            </p>
          </div>

          {/* Right: Dark Product Window */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            <div className="px-5 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs font-mono text-neutral-500">Cultlike OS — Dashboard</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-neutral-500">Live</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Mock dashboard content */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/50">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Tasks Shipped</div>
                  <div className="text-xl font-semibold text-white mt-1">142</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/50">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Streak</div>
                  <div className="text-xl font-semibold text-orange-400 mt-1">14d 🔥</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/50">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Focus Hours</div>
                  <div className="text-xl font-semibold text-emerald-400 mt-1">38.5h</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-neutral-300">Finalize Q4 roadmap review</span>
                  </div>
                  <span className="text-[10px] font-mono text-red-400">P0</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs text-neutral-300">Publish YouTube episode</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400">P1</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-700/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-neutral-500 line-through">Update client proposal</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Shipped</span>
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
                  <span className="text-[10px] font-mono text-emerald-400">Published</span>
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
              <div className="flex items-center gap-2.5">
                <img 
                  src="/logo-cultlike.png" 
                  alt="Cultlike OS" 
                  className="h-10 w-10 object-contain rounded-full" 
                />
              </div>
              <p className="text-sm text-neutral-500 font-normal">
                The executive operating system.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
                  className="px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium transition-all cursor-pointer"
                >
                  Get Started
                </button>
                <button
                  onClick={() => { setMode('login'); setConfirmationSent(false); setIsAuthOpen(true) }}
                  className="px-5 py-2.5 rounded-full border border-black/[0.12] hover:border-black/[0.3] text-xs font-normal text-black transition-all cursor-pointer"
                >
                  Sign In
                </button>
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
              <div className="flex items-center gap-2.5 mb-8">
                <img src="/logo-cultlike.png" alt="Cultlike OS" className="h-9 w-9 object-contain rounded-full" />
                <span className="text-sm font-semibold tracking-tight text-black">Cultlike OS</span>
              </div>

              {confirmationSent ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
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
