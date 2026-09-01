'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, ShieldCheck, Zap, Activity, Clock, CheckCircle2, 
  Sparkles, X, ChevronRight, Lock, Mail, User, Layers, Calendar,
  BarChart2, CheckSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedAuditOption, setSelectedAuditOption] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) {
        setError(error.message)
      } else {
        if (data.session) {
          router.push('/dashboard')
        } else {
          setMessage('Account created! Please check your email to confirm your account.')
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else if (data.session) {
        router.push('/dashboard')
      }
    }
    setLoading(false)
  }

  const workspaceTypes = [
    { label: 'Engineering & Product Sprints', icon: '◈' },
    { label: 'Growth, Marketing & Campaigns', icon: '◇' },
    { label: 'Agency & Client Operations', icon: '⬡' },
    { label: 'Executive Deep Work & Strategy', icon: '△' },
    { label: 'Content, Media & Production', icon: '▢' },
    { label: 'Personal High-Leverage OS', icon: '○' },
  ]

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0c0d0f] font-sans selection:bg-[#c8f135]/40 relative overflow-hidden">
      {/* Top Floating Glass Navigation */}
      <nav className="fixed top-6 left-0 right-0 z-40 max-w-5xl mx-auto px-6">
        <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.08] shadow-glass rounded-full px-6 py-3 flex items-center justify-between">
          {/* Logo & HUD Coordinates */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-base text-black font-sans">Focus OS</span>
              <span className="text-[9px] font-mono text-[#8a8d95] bg-black/[0.05] px-1.5 py-0.5 rounded">
                [CALLMY_MGMT]
              </span>
            </div>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-normal tracking-wide text-[#6b6e75] font-body">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#ai-chief" className="hover:text-black transition-colors">AI Chief of Staff</a>
            <a href="#velocity" className="hover:text-black transition-colors">Velocity & Metrics</a>
            <a href="#setup" className="hover:text-black transition-colors">Quick Setup</a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setMode('login'); setIsAuthOpen(true) }}
              className="px-4 py-1.5 text-xs font-medium text-black hover:opacity-70 transition-opacity cursor-pointer font-body"
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setIsAuthOpen(true) }}
              className="px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium transition-all shadow-md cursor-pointer font-body"
            >
              Launch Workspace ↗
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-8 max-w-6xl mx-auto relative">
        <div className="absolute inset-0 bg-topo-pattern opacity-10 pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/[0.08] text-[11px] font-mono text-[#6b6e75] uppercase">
              <span>Focus OS</span>
              <span>•</span>
              <span>Executive Operations</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-light tracking-tight text-black leading-[1.12]">
              One workspace to run your <br />
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-black via-neutral-800 to-neutral-500">
                entire execution flow.
              </span>
            </h1>

            <p className="text-base text-[#6b6e75] font-light leading-relaxed max-w-xl font-body">
              Designed for high-leverage founders and operators. Manage tasks, active projects, focus sprints, and daily logs — connected 24/7 to your AI Chief of Staff.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 font-body">
              <button
                onClick={() => { setMode('signup'); setIsAuthOpen(true) }}
                className="px-7 py-3.5 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-medium shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
              >
                Get Started Free
              </button>
              <a
                href="#setup"
                className="px-6 py-3.5 rounded-full bg-white hover:bg-neutral-50 border border-black/[0.12] text-black text-sm font-medium transition-all"
              >
                Configure Workspace
              </a>
            </div>
          </div>

          {/* Right Floating HUD Card */}
          <div className="lg:col-span-5 p-8 rounded-3xl bg-neutral-50/80 backdrop-blur-xl border border-black/[0.08] shadow-glass space-y-6">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <span className="text-xs font-mono text-[#8a8d95]">SYSTEM_STATUS</span>
              <span className="text-xs font-mono font-semibold text-emerald-600">[OPTIMAL]</span>
            </div>

            {/* Circular Radar Graphic */}
            <div className="w-28 h-28 rounded-full border border-black/[0.1] border-dashed mx-auto flex items-center justify-center relative">
              <div className="w-16 h-16 rounded-full border border-black/[0.1] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-black animate-ping"></div>
              </div>
              <div className="absolute top-0 right-0 text-[9px] font-mono text-[#8a8d95]">[0316:0483]</div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#6b6e75]">ACTIVE_SPRINT_TASKS</span>
                <span className="font-semibold text-black">11 Tasks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6e75]">EXECUTION_VELOCITY</span>
                <span className="font-semibold text-black">8.4 / 10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6e75]">FOCUS_HOURS_LOGGED</span>
                <span className="font-semibold text-black">24.5h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6e75]">AI_CHIEF_SYNC</span>
                <span className="font-semibold text-emerald-600">CONNECTED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workspace Setup Selection Section */}
      <section id="setup" className="py-24 px-8 max-w-4xl mx-auto text-center border-t border-black/[0.06]">
        <div className="text-xs font-mono text-[#8a8d95] uppercase tracking-widest mb-3">
          WORKSPACE CONFIGURATION • • •
        </div>
        <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight mb-8">
          What is your primary focus area?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8 font-body">
          {workspaceTypes.map((b) => (
            <button
              key={b.label}
              onClick={() => setSelectedAuditOption(b.label)}
              className={cn(
                'p-5 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 cursor-pointer shadow-sm',
                selectedAuditOption === b.label
                  ? 'border-black bg-black text-white'
                  : 'border-black/[0.08] bg-white hover:border-black/[0.2] text-black'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono opacity-60">{b.icon}</span>
                <span className="text-sm font-normal">{b.label}</span>
              </div>
              <ChevronRight size={16} className="opacity-40" />
            </button>
          ))}
        </div>

        <button
          onClick={() => { setMode('signup'); setIsAuthOpen(true) }}
          className="px-8 py-3.5 rounded-full bg-black text-white text-sm font-medium hover:bg-neutral-800 shadow-md transition-all cursor-pointer font-body"
        >
          Initialize Workspace →
        </button>
      </section>

      {/* Auth Modal Overlay */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#141618] border border-white/[0.1] rounded-3xl p-8 max-w-md w-full text-white shadow-2xl relative">
            <button
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-6 right-6 p-2 text-[#8a8d95] hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#c8f135] text-black font-extrabold text-base flex items-center justify-center mx-auto mb-3 shadow-glow">
                W
              </div>
              <h3 className="text-xl font-normal text-white">
                {mode === 'login' ? 'Sign in to Focus OS' : 'Create your workspace'}
              </h3>
              <p className="text-xs text-[#8a8d95] mt-1 font-body font-light">
                {mode === 'login' ? 'Welcome back to your command hub' : 'Get started in under 30 seconds'}
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-body">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-body">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-body">
              {mode === 'signup' && (
                <div>
                  <label className="text-[11px] font-mono text-[#8a8d95] block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mohammed Rehan"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.08] focus:border-[#c8f135]/50 rounded-xl text-xs text-white placeholder:text-[#6b6e75] outline-none font-light"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-mono text-[#8a8d95] block mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@company.com"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.08] focus:border-[#c8f135]/50 rounded-xl text-xs text-white placeholder:text-[#6b6e75] outline-none font-light"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#8a8d95] block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.08] focus:border-[#c8f135]/50 rounded-xl text-xs text-white placeholder:text-[#6b6e75] outline-none font-light"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#c8f135] hover:bg-[#b8e125] text-black font-medium text-xs rounded-xl shadow-glow transition-all cursor-pointer mt-2"
              >
                {loading ? 'Processing...' : mode === 'login' ? 'Sign In →' : 'Create Workspace →'}
              </button>
            </form>

            <div className="text-center mt-4 font-body">
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
                className="text-xs text-[#8a8d95] hover:text-white transition-colors cursor-pointer font-light"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
