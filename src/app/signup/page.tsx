'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

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

    try {
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
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#0c0d0f] flex flex-col items-center justify-center p-4 selection:bg-black/10">
      <Link 
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back to home</span>
      </Link>

      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-black/[0.08] p-8 sm:p-10">
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
              Create your workspace
            </h2>
            <p className="text-sm text-neutral-500 mb-8">
              Free forever for solo builders.
            </p>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                {loading ? 'Processing...' : 'Create Workspace'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-xs text-neutral-500 hover:text-black transition-colors"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
