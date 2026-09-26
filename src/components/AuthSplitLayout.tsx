'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, CheckCircle2, Lock, Mail, 
  User as UserIcon, Eye, EyeOff 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Persona {
  role: string
  gradient: string
}

const PERSONAS: Persona[] = [
  { role: 'creators', gradient: 'from-amber-200 via-orange-200 to-amber-400' },
  { role: 'entrepreneurs', gradient: 'from-blue-200 via-indigo-200 to-purple-400' },
  { role: 'designers', gradient: 'from-purple-200 via-pink-200 to-rose-400' },
  { role: 'freelancers', gradient: 'from-emerald-200 via-teal-200 to-cyan-400' },
]

interface AuthSplitLayoutProps {
  initialMode?: 'login' | 'signup'
}

export default function AuthSplitLayout({ initialMode = 'login' }: AuthSplitLayoutProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [personaIndex, setPersonaIndex] = useState(0)

  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard')
      }
    })
  }, [router])

  // Automatically cycle only the single role word every 3.2s
  useEffect(() => {
    const interval = setInterval(() => {
      setPersonaIndex((prev) => (prev + 1) % PERSONAS.length)
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  const currentPersona = PERSONAS[personaIndex]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (signInError) {
          setError(signInError.message)
        } else if (data.session) {
          router.replace('/dashboard')
        }
      } else {
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
          router.replace('/dashboard')
        } else {
          setConfirmationSent(true)
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white selection:bg-black/10 font-sans">
      
      {/* ─── LEFT SIDE: AESTHETIC VISUAL & EXPANDED TYPOGRAPHY (50% EQUAL SPLIT) ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0c] text-white flex-col justify-between p-10 sm:p-14 lg:p-16 xl:p-20 overflow-hidden">
        {/* Subtle Atmospheric Gradients */}
        <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-[32rem] h-[32rem] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

        {/* Technical micro dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40 pointer-events-none" />

        {/* Top Header on Left Side */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <img 
              src="/logo-cultlike.png" 
              alt="Logo" 
              className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-full group-hover:scale-105 transition-transform drop-shadow-md" 
            />
            <span className="font-semibold text-lg sm:text-xl tracking-tight text-white/95">
              Cultlike
            </span>
          </Link>
        </div>

        {/* Center Showcase: Expansive Hero Typography with Seamless Single Word Rotation */}
        <div className="relative z-10 my-auto py-10 max-w-xl">
          <div className="space-y-5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight text-white leading-[1.15]">
              The studio environment for{' '}
              <span className="inline-block relative">
                <span
                  key={currentPersona.role}
                  className={cn(
                    "inline-block font-semibold text-transparent bg-clip-text bg-gradient-to-r animate-word-in",
                    currentPersona.gradient
                  )}
                >
                  {currentPersona.role}
                </span>
              </span>.
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-neutral-400 font-light leading-relaxed max-w-md">
              Plan your ideas, edit deliverables in deep focus, and share your work.
            </p>
          </div>
        </div>

        {/* Bottom Quote on Left Side */}
        <div className="relative z-10 pt-8 border-t border-white/[0.08] flex items-center justify-between text-xs text-neutral-400 font-light">
          <span>&ldquo;Clarity of vision. Ruthless velocity. Zero fluff.&rdquo;</span>
          <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-500">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
            <span>EST. 2026</span>
          </div>
        </div>
      </div>


      {/* ─── RIGHT SIDE: SIGN IN / SIGN UP PANEL (50% EQUAL SPLIT) ─── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20 bg-[#ffffff]">
        
        {/* Top: Back to Home Link */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-black transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to home</span>
          </Link>

          {/* Mobile-only brand logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <img src="/logo-cultlike.png" alt="Logo" className="h-8 w-8 object-contain rounded-full" />
            <span className="font-semibold text-base text-black tracking-tight">Cultlike</span>
          </div>
        </div>

        {/* Center: Auth Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          
          {/* Segmented Mode Switcher */}
          <div className="p-1 bg-neutral-100 rounded-full flex items-center mb-8 border border-black/[0.04]">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setConfirmationSent(false) }}
              className={cn(
                'flex-1 py-2 text-xs font-medium rounded-full transition-all cursor-pointer',
                mode === 'login'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setConfirmationSent(false) }}
              className={cn(
                'flex-1 py-2 text-xs font-medium rounded-full transition-all cursor-pointer',
                mode === 'signup'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900'
              )}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              {mode === 'login' ? 'Welcome back' : 'Claim your workspace'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-light mt-1.5">
              {mode === 'login' 
                ? 'Enter your credentials to access your studio.' 
                : 'Start directing deliverables in under 30 seconds.'}
            </p>
          </div>

          {/* Confirmation Sent State */}
          {confirmationSent ? (
            <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">Check your email</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-light">
                We sent a confirmation link to <strong className="font-semibold text-black">{email}</strong>. Open the link to activate your workspace.
              </p>
              <button
                type="button"
                onClick={() => setConfirmationSent(false)}
                className="text-xs text-neutral-500 hover:text-black underline cursor-pointer pt-2 block mx-auto"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              {/* Name (Sign Up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Turner"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                    />
                    <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@studio.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                  />
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm text-black placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                  />
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Please wait...</span>
                  </span>
                ) : mode === 'login' ? (
                  'Sign In to Workspace'
                ) : (
                  'Create Studio Account'
                )}
              </button>
            </form>
          )}

          {/* Toggle prompt at bottom of form */}
          {!confirmationSent && (
            <div className="mt-6 text-center text-xs text-neutral-500 font-light">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(null) }}
                    className="text-black font-semibold hover:underline cursor-pointer"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null) }}
                    className="text-black font-semibold hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom Legal Links */}
        <div className="pt-6 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-light">
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
            <span>&bull;</span>
            <Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link>
          </div>
          <span>&copy; {new Date().getFullYear()} Cultlike</span>
        </div>
      </div>

    </div>
  )
}
