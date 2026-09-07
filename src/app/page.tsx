'use client'

export const runtime = 'edge'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowRight, Clock, CheckCircle2, 
  X, ChevronRight, Mail, Calendar,
  CheckSquare, Video, ExternalLink, Building2, 
  FolderKanban, ChevronDown, Check, RefreshCw
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
  const [selectedFocus, setSelectedFocus] = useState<string>('Product & Engineering')
  
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
    { label: 'Product & Engineering', icon: '◈', desc: 'Manage sprint boards, track releases, and squash bugs with high speed.' },
    { label: 'Agencies & Freelancers', icon: '⬡', desc: 'Organize client deliverables, isolate client workspaces, and stay on schedule.' },
    { label: 'Founders & Small Teams', icon: '△', desc: 'Prioritize daily high-impact tasks, track big goals, and keep everyone aligned.' },
    { label: 'Marketing & Operations', icon: '◇', desc: 'Coordinate launches, run campaigns, and manage recurring workflows.' },
  ]

  const faqs = [
    {
      q: 'Is it free to use?',
      a: 'Yes, you can sign up for free and start organizing projects and tasks immediately. No credit card is required.',
    },
    {
      q: 'How does calendar sync work?',
      a: 'Focus OS gives you a private calendar subscription link. With one click, your tasks and upcoming deadlines appear inside Google Calendar, Apple Calendar, or Outlook without needing complicated developer setups.',
    },
    {
      q: 'Can I invite teammates and clients?',
      a: 'Yes! You can create multiple workspaces and invite colleagues or clients. Each workspace is private, so members only see the projects and tasks within their assigned workspace.',
    },
    {
      q: 'How does the Fathom meeting integration work?',
      a: 'If you record calls with Fathom, you can link your Fathom key or webhook in Settings. Your call recordings, full transcripts, and takeaways will automatically appear inside your workspace so you can convert them to tasks.',
    },
    {
      q: 'Can I export my tasks and reports?',
      a: 'Yes. You can export your tasks to a CSV file for Excel or Google Sheets at any time, or generate a clean visual progress summary image to share with your team.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0c0d0f] font-sans selection:bg-black/10 relative overflow-hidden">
      {/* Top Floating Clean Navigation */}
      <nav className="fixed top-5 left-0 right-0 z-40 max-w-5xl mx-auto px-6">
        <div className="bg-white/90 backdrop-blur-xl border border-black/[0.08] shadow-xs rounded-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium tracking-tight text-sm text-black">Focus OS</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-light text-[#6b7280]">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-black transition-colors">How Teams Use It</a>
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
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6 sm:px-10 max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 border border-black/[0.06] text-xs text-[#52525b]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Simple, calm project management</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-black leading-[1.15]">
              Everything your team works on, <br />
              <span className="font-semibold text-black">
                all in one place.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#6b7280] font-light leading-relaxed max-w-xl">
              Organize projects, plan daily tasks, review meeting notes, and sync your calendar — without bouncing between five different tabs.
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
                See Features ↓
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-3 text-xs text-[#71717a] font-light">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Free to use</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>No credit card required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Ready in 30 seconds</span>
              </span>
            </div>
          </div>

          {/* Right Authentic Product Preview Card */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-[#fafafa] border border-black/[0.08] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-medium text-xs">
                  AC
                </div>
                <div>
                  <div className="text-xs font-medium text-black">Acme Studio</div>
                  <div className="text-[11px] text-[#8a8d95]">Workspace • Today</div>
                </div>
              </div>
              <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>In Sync</span>
              </span>
            </div>

            {/* Task List Preview */}
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">
                Today&apos;s Priorities
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-white border border-black/[0.06] rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </div>
                    <span className="text-xs text-[#6b7280] line-through font-light">Deliver client proposal deck</span>
                  </div>
                  <span className="text-[10px] bg-black/[0.04] text-[#6b7280] px-2 py-0.5 rounded font-mono">Done</span>
                </div>

                <div className="p-3 bg-white border border-black/[0.08] rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-md border border-black/[0.3] flex items-center justify-center" />
                    <span className="text-xs text-black font-normal">Review user onboarding feedback</span>
                  </div>
                  <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-mono font-medium">P0 High</span>
                </div>

                <div className="p-3 bg-white border border-black/[0.06] rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-md border border-black/[0.3] flex items-center justify-center" />
                    <span className="text-xs text-black font-light">Prep notes for tomorrow&apos;s team call</span>
                  </div>
                  <span className="text-[10px] text-[#6b7280]">Tomorrow</span>
                </div>
              </div>
            </div>

            {/* Connected Tools Strip */}
            <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs text-[#6b7280] font-light">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-black" />
                <span>Google Calendar Synced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Video size={13} className="text-black" />
                <span>Fathom Notes Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20 px-6 sm:px-10 max-w-6xl mx-auto border-t border-black/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <div className="text-xs font-mono text-[#8a8d95] uppercase tracking-widest">
            FEATURES
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight">
            Everything you need to get work done.
          </h2>
          <p className="text-xs sm:text-sm text-[#6b7280] font-light">
            Simple, fast, and organized so you can focus on building and delivering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Projects & Milestones */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <FolderKanban size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Projects &amp; Milestones</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Group related tasks into clear projects, track progress towards deadlines, and know who is working on what.
            </p>
          </div>

          {/* Card 2: Simple Task Boards */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <CheckSquare size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Simple Task Boards</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Drag-and-drop kanban boards and clean list views. Set priority tags from P0 to P3 so you always know what comes next.
            </p>
          </div>

          {/* Card 3: Meeting Notes & Transcripts */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <Video size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Meeting Notes &amp; Transcripts</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Connect Fathom to automatically import call recordings, full transcripts, and key action items directly into your workspace.
            </p>
          </div>

          {/* Card 4: Calendar Sync */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <Calendar size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Live Calendar Sync</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Subscribe with one click in Google Calendar, Apple Calendar, or Outlook. Your tasks and deadlines appear automatically on your calendar.
            </p>
          </div>

          {/* Card 5: Team & Client Workspaces */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <Building2 size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Workspaces &amp; Team Roles</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Create separate workspaces for different companies or clients. Invite teammates with clear roles like Admin, Member, or Viewer.
            </p>
          </div>

          {/* Card 6: Exports & Sharing */}
          <div className="p-6 rounded-3xl bg-[#fafafa] border border-black/[0.06] space-y-4 hover:border-black/[0.15] transition-all">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
              <ExternalLink size={18} />
            </div>
            <h3 className="text-base font-normal text-black">Exports &amp; Progress Sharing</h3>
            <p className="text-xs text-[#6b7280] font-light leading-relaxed">
              Export your task lists to CSV for spreadsheets anytime, or download clean visual progress cards to share with stakeholders.
            </p>
          </div>
        </div>
      </section>

      {/* Focus Area / How Teams Use It */}
      <section id="how-it-works" className="py-20 px-6 sm:px-10 max-w-4xl mx-auto text-center border-t border-black/[0.06]">
        <div className="text-xs font-mono text-[#8a8d95] uppercase tracking-widest mb-2">
          HOW TEAMS USE IT
        </div>
        <h2 className="text-3xl sm:text-4xl font-light text-black tracking-tight mb-8">
          Built for how modern teams work.
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
          Open Your Workspace →
        </button>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 sm:px-10 max-w-3xl mx-auto border-t border-black/[0.06]">
        <div className="text-center mb-12 space-y-2">
          <div className="text-xs font-mono text-[#8a8d95] uppercase tracking-widest">
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
      <footer className="py-12 px-6 border-t border-black/[0.06] text-center space-y-3 text-xs text-[#8a8d95] font-light">
        <div className="flex items-center justify-center gap-2 text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>All systems running smoothly</span>
        </div>
        <div className="text-[11px]">
          &copy; {new Date().getFullYear()} Focus OS. Simple, fast project management for modern teams.
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
                  <h3 className="text-base font-normal text-black">Check your email</h3>
                  <p className="text-xs text-[#6b7280] font-light leading-relaxed">
                    We sent a sign-in link to <strong className="text-black font-medium">{email}</strong>.
                  </p>
                </div>

                <div className="p-3 bg-[#fafafa] border border-black/[0.06] rounded-xl text-xs text-[#6b7280] font-light">
                  Click the link in your email to open your new workspace instantly.
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
                  <div className="w-10 h-10 rounded-2xl bg-black text-white font-medium text-xs flex items-center justify-center mx-auto mb-3 shadow-xs">
                    FO
                  </div>
                  <h3 className="text-lg font-normal text-black">
                    {mode === 'login' ? 'Sign in to Focus OS' : 'Create your free workspace'}
                  </h3>
                  <p className="text-xs text-[#6b7280] font-light">
                    {mode === 'login' ? 'Access your projects, tasks, and notes.' : 'Takes less than 30 seconds.'}
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
                      <label className="text-xs font-medium text-[#4b5563] block mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full px-3.5 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-[#4b5563] block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full px-3.5 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#4b5563] block mb-1">
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
                    <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In →' : 'Create Free Workspace →'}</span>
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
