'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, ShieldCheck, Zap, Activity, Clock, CheckCircle2, 
  Sparkles, X, ChevronRight, Lock, Mail, User
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
  const [auditStep, setAuditStep] = useState(1)
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

  const businessTypes = [
    { label: 'B2B services', icon: '◈' },
    { label: 'B2C services', icon: '◇' },
    { label: 'E-commerce', icon: '⬡' },
    { label: 'Real Estate', icon: '△' },
    { label: 'Professional Services', icon: '▢' },
    { label: 'Agency', icon: '○' },
  ]

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0c0d0f] font-sans selection:bg-[#c8f135]/40 relative overflow-hidden">
      {/* Top Floating Glass Navigation (Reference 5 & 6) */}
      <nav className="fixed top-6 left-0 right-0 z-40 max-w-5xl mx-auto px-6">
        <div className="bg-white/80 backdrop-blur-2xl border border-black/[0.08] shadow-glass rounded-full px-6 py-3 flex items-center justify-between">
          {/* Logo & HUD Coordinates */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tighter text-base text-black">AHMV</span>
              <span className="text-[9px] font-mono text-[#8a8d95] bg-black/[0.05] px-1.5 py-0.5 rounded">
                [0034:0075]
              </span>
            </div>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wider uppercase text-[#6b6e75]">
            <a href="#systems" className="hover:text-black transition-colors">Systems</a>
            <a href="#services" className="hover:text-black transition-colors">Services</a>
            <a href="#process" className="hover:text-black transition-colors">Process</a>
            <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setMode('login'); setIsAuthOpen(true) }}
              className="px-4 py-1.5 text-xs font-semibold text-black hover:opacity-70 transition-opacity cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setIsAuthOpen(true) }}
              className="px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Launch Focus OS ↗
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section (Reference 5 & 6) */}
      <section className="pt-40 pb-24 px-8 max-w-6xl mx-auto relative">
        {/* Subtle Topo Wave Graphic */}
        <div className="absolute inset-0 bg-topo-pattern opacity-10 pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/[0.08] text-[11px] font-mono text-[#6b6e75] uppercase">
              <span>AHMV Systems</span>
              <span>•</span>
              <span>Operations Engineering</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-black leading-[1.08]">
              Businesses don&apos;t scale. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-neutral-700 to-neutral-500">
                Systems do.
              </span>
            </h1>

            <p className="text-lg text-[#6b6e75] leading-relaxed max-w-xl">
              You are running a growing business. But underneath, it&apos;s held together by{' '}
              <span className="line-through decoration-neutral-400 text-neutral-400 font-medium">Google Sheets</span>,{' '}
              <span className="line-through decoration-neutral-400 text-neutral-400 font-medium">WhatsApp</span>, and memory.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => { setMode('signup'); setIsAuthOpen(true) }}
                className="px-7 py-3.5 rounded-full bg-black hover:bg-neutral-800 text-white text-sm font-bold shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
              >
                Book a Free Operations Review
              </button>
              <a
                href="#audit"
                className="px-6 py-3.5 rounded-full bg-white hover:bg-neutral-50 border border-black/[0.12] text-black text-sm font-semibold transition-all"
              >
                Take 60s Audit
              </a>
            </div>
          </div>

          {/* Right Floating HUD Card (Reference 5) */}
          <div className="lg:col-span-5 p-8 rounded-3xl bg-neutral-50/80 backdrop-blur-xl border border-black/[0.08] shadow-glass space-y-6">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
              <span className="text-xs font-mono text-[#8a8d95]">SYSTEM_STATUS</span>
              <span className="text-xs font-mono font-bold text-emerald-600">[HEALTHY]</span>
            </div>

            {/* Radar Circle Illustration */}
            <div className="w-28 h-28 rounded-full border border-black/[0.1] border-dashed mx-auto flex items-center justify-center relative">
              <div className="w-16 h-16 rounded-full border border-black/[0.1] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-black animate-ping"></div>
              </div>
              <div className="absolute top-0 right-0 text-[9px] font-mono text-[#8a8d95]">[0316:0483]</div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#6b6e75]">LEAD_RESPONSE_TIME</span>
                <span className="font-bold text-black">45s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6e75]">TASKS_AUTOMATED</span>
                <span className="font-bold text-black">94.6%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6e75]">WEEKLY_HOURS_SAVED</span>
                <span className="font-bold text-black">24.5h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6e75]">ACTIVE_SYSTEMS</span>
                <span className="font-bold text-black">04</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 60s Audit Section (Reference 4) */}
      <section id="audit" className="py-24 px-8 max-w-4xl mx-auto text-center border-t border-black/[0.06]">
        <div className="text-xs font-mono text-[#8a8d95] uppercase tracking-widest mb-3">
          {auditStep} / 7 • • • • • • •
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight mb-8">
          What does your business do?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
          {businessTypes.map((b) => (
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
                <span className="text-sm font-semibold">{b.label}</span>
              </div>
              <ChevronRight size={16} className="opacity-40" />
            </button>
          ))}
        </div>

        <button
          onClick={() => { setMode('signup'); setIsAuthOpen(true) }}
          className="px-8 py-3.5 rounded-full bg-black text-white text-sm font-bold hover:bg-neutral-800 shadow-md transition-all cursor-pointer"
        >
          Begin System Audit →
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
              <h3 className="text-xl font-bold text-white">
                {mode === 'login' ? 'Sign in to Focus OS' : 'Create your workspace'}
              </h3>
              <p className="text-xs text-[#8a8d95] mt-1 font-mono">
                {mode === 'login' ? 'Welcome back to your command hub' : 'Get started in under 30 seconds'}
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="text-[11px] font-mono text-[#8a8d95] block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mohammed Rehan"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.08] focus:border-[#c8f135]/50 rounded-xl text-xs text-white placeholder:text-[#6b6e75] outline-none"
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
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.08] focus:border-[#c8f135]/50 rounded-xl text-xs text-white placeholder:text-[#6b6e75] outline-none"
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
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.08] focus:border-[#c8f135]/50 rounded-xl text-xs text-white placeholder:text-[#6b6e75] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#c8f135] hover:bg-[#b8e125] text-black font-bold text-xs rounded-xl shadow-glow transition-all cursor-pointer mt-2"
              >
                {loading ? 'Processing...' : mode === 'login' ? 'Sign In →' : 'Create Workspace →'}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
                className="text-xs text-[#8a8d95] hover:text-white transition-colors cursor-pointer"
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
