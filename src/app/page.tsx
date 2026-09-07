'use client'

export const runtime = 'edge'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowRight, ShieldCheck, Zap, Activity, Clock, CheckCircle2, 
  Sparkles, X, ChevronRight, Lock, Mail, User, Layers, Calendar,
  BarChart2, CheckSquare, Video, ExternalLink, Building2, 
  FolderKanban, FileText, ChevronDown, Check, RefreshCw, HelpCircle
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
  const [selectedFocus, setSelectedFocus] = useState<string>('Engineering & Product Sprints')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check active session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      }
    })

    // Listen for instant session updates (e.g. email confirmation redirect)
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

  const focusAreas = [
    { label: 'Engineering & Product Sprints', icon: '◈', desc: 'Manage releases, task boards, and tech debt with high velocity.' },
    { label: 'Agency & Client Operations', icon: '⬡', desc: 'Isolate client workspaces, deliverable timelines, and team access.' },
    { label: 'Executive Deep Work & Strategy', icon: '△', desc: 'Focus timer, strategic roadmaps, and daily founder logs.' },
    { label: 'Growth, Marketing & Launch', icon: '◇', desc: 'Campaign initiatives, deliverables, and milestone tracking.' },
  ]

  const faqs = [
    {
      q: 'How does multi-tenant workspace isolation work?',
      a: 'Each workspace is completely separated in the database. When you invite team members or clients to a workspace, they only have access to tasks, projects, and documents inside that workspace. Users can belong to multiple workspaces and switch between them instantly.',
    },
    {
      q: 'Do I or my team need Google Cloud verification to sync calendars?',
      a: 'No! CallMy Mgmt provides a Universal Live Calendar Feed (.ics) that adheres to RFC 5545. You can subscribe with one click directly inside Google Calendar, Apple Calendar, or Outlook without needing any Google Cloud Console approvals or OAuth warnings.',
    },
    {
      q: 'How does the Fathom Video AI integration work?',
      a: 'Each workspace can connect its own Fathom account via API Key or automated Webhook. Whenever a call finishes, your meeting recordings, verbatim transcripts, and AI takeaways are automatically synced into your workspace and can be converted into tasks with 1 click.',
    },
    {
      q: 'Can I export my tasks, progress graphs, and sprint data?',
      a: 'Yes. You can export tasks to UTF-8 BOM CSV for Excel/Google Sheets, download high-resolution progress infographic PNGs, or query everything programmatically via our Custom GPT actions API.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0c0d0f] font-sans selection:bg-black/10 relative overflow-hidden">
      {/* Top Floating Glass Navigation */}
      <nav className="fixed top-5 left-0 right-0 z-40 max-w-5xl mx-auto px-6">
        <div className="bg-white/85 backdrop-blur-2xl border border-black/[0.08] shadow-sm rounded-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-normal tracking-tight text-sm text-black">Focus OS</span>
            <span className="text-[10px] font-mono text-[#8a8d95] bg-black/[0.04] px-2 py-0.5 rounded-md font-light">
              v2.4
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-light text-[#6b7280]">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#initiatives" className="hover:text-black transition-colors">Portfolios</a>
            <a href="#integrations" className="hover:text-black transition-colors">Integrations</a>
            <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setMode('login'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="px-4 py-1.5 text-xs text-black hover:opacity-75 transition-opacity cursor-pointer font-light"
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
              className="px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-normal transition-all shadow-xs cursor-pointer"
            >
              Launch Workspace ↗
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6 sm:px-10 max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.08] text-[11px] font-mono text-[#6b7280] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Multi-Tenant Executive Operations</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-black leading-[1.14]">
              One operating system for your <br />
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-black via-neutral-800 to-neutral-500">
                entire execution flow.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#6b7280] font-light leading-relaxed max-w-xl">
              Engineered for high-output founders, agency directors, and engineering leads. Manage multi-master portfolios, sprint kanban, automated Fathom meeting transcripts, and live calendar feeds in one ultra-fast workspace.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
                className="px-6 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-normal shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight size={13} />
              </button>
              <a
                href="#features"
                className="px-5 py-3 rounded-full bg-white hover:bg-neutral-50 border border-black/[0.1] text-black text-xs font-normal transition-all"
              >
                Explore Features
              </a>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs font-mono text-[#8a8d95] font-light">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Zero Credit Card Needed</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Instant Workspace Provisioning</span>
              </span>
            </div>
          </div>

          {/* Right Floating Interactive HUD */}
          <div className="lg:col-span-5 p-7 rounded-3xl bg-[#fafafa] border border-black/[0.08] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-[#6b7280]">SYSTEM_METRICS</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                EDGE LATENCY &lt;180ms
              </span>
            </div>

            {/* Radar Activity Sphere */}
            <div className="w-24 h-24 rounded-full border border-black/[0.1] border-dashed mx-auto flex items-center justify-center relative">
              <div className="w-14 h-14 rounded-full border border-black/[0.12] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
              </div>
              <div className="absolute -top-1 -right-2 text-[9px] font-mono text-[#8a8d95]">[SYNC:OK]</div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-black/[0.04]">
                <span className="text-[#6b7280]">MULTI_TENANCY</span>
                <span className="font-medium text-black">Active (Role-Based)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-black/[0.04]">
                <span className="text-[#6b7280]">FATHOM_CALLS_SYNCED</span>
                <span className="font-medium text-black">111 Recordings</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-black/[0.04]">
                <span className="text-[#6b7280]">CALENDAR_FEED</span>
                <span className="font-medium text-emerald-700">RFC 5545 iCal Live</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#6b7280]">CUSTOM_GPT_ACTIONS</span>
                <span className="font-medium text-black">OpenAPI 3.1.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20 px-6 sm:px-10 max-w-6xl mx-auto border-t border-black/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <div className="text-xs font-mono text-[#8a8d95] uppercase tracking-widest">
            CORE CAPABILITIES • • •
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight">
            Built for velocity without the clutter.
          </h2>
          <p className="text-xs sm:text-sm text-[#6b7280] font-light">
            Every feature is purpose-built to eliminate context switching and keep your team shipping.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Multi-Master Portfolios */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <FolderKanban size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Multi-Master Portfolios</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Organize complex organizations into strategic macro programs (like Tadbeer TT) with individual initiatives, deadline tracking, and kill conditions.
            </p>
          </div>

          {/* Card 2: Sprint Execution Kanban */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <CheckSquare size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Sprint Kanban &amp; Timeboxes</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Rank tasks from P0 to P3 with timebox targets. Perform point-in-time historical reviews and export clean CSVs for spreadsheets in one click.
            </p>
          </div>

          {/* Card 3: Fathom Meeting Intelligence */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <Video size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Fathom Video AI Integration</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Connect your Fathom account to automatically index recordings, verbatim transcripts, and AI summaries. Convert takeaways into workspace tasks instantly.
            </p>
          </div>

          {/* Card 4: Universal Live Calendar Feed */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <Calendar size={18} />
            </div>
            <h3 className="text-base font-normal text-black">0-Verification Calendar Feed</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              One-click live subscription into Google Calendar, Apple Calendar (iOS/Mac), and Outlook. No developer credentials or OAuth warnings required.
            </p>
          </div>

          {/* Card 5: Multi-Tenant Workspaces */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <Building2 size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Workspace Switcher &amp; Roles</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Switch effortlessly between personal ventures and client hubs. Invite collaborators as Admins, Members, or Viewers with full data isolation.
            </p>
          </div>

          {/* Card 6: ChatGPT Custom GPT API */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <Zap size={18} />
            </div>
            <h3 className="text-base font-normal text-black">ChatGPT Custom GPT Actions</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Full OpenAPI 3.1.0 support. Ask your ChatGPT Chief of Staff to query sprint health, summarize Fathom calls, or create tasks directly in your workspace.
            </p>
          </div>
        </div>
      </section>

      {/* Focus Area Selection Section */}
      <section id="initiatives" className="py-20 px-6 sm:px-10 max-w-4xl mx-auto text-center border-t border-black/[0.06]">
        <div className="text-xs font-mono text-[#8a8d95] uppercase tracking-widest mb-2">
          TAILORED ONBOARDING • • •
        </div>
        <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight mb-8">
          Choose your primary operating model.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8 text-left">
          {focusAreas.map((f) => {
            const isSelected = selectedFocus === f.label
            return (
              <button
                key={f.label}
                type="button"
                onClick={() => setSelectedFocus(f.label)}
                className={cn(
                  'p-5 rounded-2xl border text-left transition-all duration-150 cursor-pointer shadow-xs',
                  isSelected 
                    ? 'border-black bg-black text-white' 
                    : 'border-black/[0.08] bg-white hover:border-black/[0.2] text-black'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-mono opacity-70">{f.icon}</span>
                    <span className="text-xs font-normal">{f.label}</span>
                  </div>
                  {isSelected ? <Check size={14} /> : <ChevronRight size={14} className="opacity-30" />}
                </div>
                <p className={cn("text-[11px] font-light leading-relaxed", isSelected ? "text-neutral-300" : "text-[#6b7280]")}>
                  {f.desc}
                </p>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => { setMode('signup'); setConfirmationSent(false); setIsAuthOpen(true) }}
          className="px-8 py-3 rounded-full bg-black text-white text-xs font-normal hover:bg-neutral-800 shadow-sm transition-all cursor-pointer"
        >
          Initialize Workspace →
        </button>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 sm:px-10 max-w-3xl mx-auto border-t border-black/[0.06]">
        <div className="text-center mb-12 space-y-2">
          <div className="text-xs font-mono text-[#8a8d95] uppercase tracking-widest">
            FREQUENTLY ASKED QUESTIONS • • •
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
                  <ChevronDown size={14} className={cn("text-[#8a8d95] transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-[#6b7280] font-light leading-relaxed border-t border-black/[0.04] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-black/[0.06] text-center space-y-4 font-mono text-xs text-[#8a8d95] font-light">
        <div className="flex items-center justify-center gap-2 text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>All Systems Operational • Edge Multi-Tenant Engine</span>
        </div>
        <div className="text-[11px]">
          &copy; {new Date().getFullYear()} Focus OS / CallMy Mgmt. High-leverage execution infrastructure.
        </div>
      </footer>

      {/* Authentication Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-black/[0.1] rounded-3xl p-7 sm:p-8 max-w-md w-full text-black shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-[#8a8d95] hover:text-black rounded-xl hover:bg-black/[0.05] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {confirmationSent ? (
              /* Email Confirmation Sent Screen */
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                  <Mail size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-normal text-black">Confirm your email</h3>
                  <p className="text-xs text-[#6b7280] font-light leading-relaxed">
                    We sent a secure verification link to <strong className="text-black font-medium">{email}</strong>.
                  </p>
                </div>

                <div className="p-3 bg-[#fafafa] border border-black/[0.06] rounded-xl text-xs text-[#6b7280] font-light">
                  Click the link in your email to be signed in automatically to your new workspace.
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
                    className="text-xs text-[#8a8d95] hover:text-black transition-colors pt-1"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              /* Login & Sign Up Form */
              <>
                <div className="text-center mb-6 space-y-1">
                  <div className="w-10 h-10 rounded-2xl bg-black text-white font-mono text-xs flex items-center justify-center mx-auto mb-3 shadow-xs">
                    WS
                  </div>
                  <h3 className="text-lg font-normal text-black">
                    {mode === 'login' ? 'Sign in to Focus OS' : 'Initialize your workspace'}
                  </h3>
                  <p className="text-xs text-[#6b7280] font-light">
                    {mode === 'login' ? 'Access your tasks, initiatives, and Fathom records.' : 'Create your isolated workspace in seconds.'}
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
                      <label className="text-[11px] font-mono text-[#6b7280] block mb-1 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Mohammed Rehan"
                        className="w-full px-3.5 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-mono text-[#6b7280] block mb-1 uppercase tracking-wider">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="founder@company.com"
                      className="w-full px-3.5 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#6b7280] block mb-1 uppercase tracking-wider">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white font-normal text-xs rounded-xl shadow-xs transition-all cursor-pointer mt-1 flex items-center justify-center gap-2"
                  >
                    {loading && <RefreshCw size={12} className="animate-spin" />}
                    <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In →' : 'Create Workspace →'}</span>
                  </button>
                </form>

                <div className="text-center mt-5 pt-4 border-t border-black/[0.06]">
                  <button
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
                    className="text-xs text-[#6b7280] hover:text-black transition-colors cursor-pointer font-light"
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
