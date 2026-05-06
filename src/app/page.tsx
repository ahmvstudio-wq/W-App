'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0c0d0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(#252729 1px, transparent 1px), linear-gradient(90deg, #252729 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        opacity: 0.3,
      }} />

      {/* Accent glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '300px', zIndex: 0,
        background: 'radial-gradient(ellipse, rgba(200, 241, 53, 0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
          }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '48px', letterSpacing: '-0.02em', color: '#c8f135' }}>
              W
            </span>
          </div>
          <p style={{ color: '#6b6e75', fontSize: '13px' }}>
            {mode === 'login' ? 'Pick up where you left off.' : 'Join the ones who ship.'}
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: '#141618', border: '1px solid #252729', borderRadius: '12px', padding: '32px',
        }}>
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#6b6e75', fontSize: '12px', marginBottom: '6px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  style={{
                    width: '100%', padding: '10px 12px', background: '#1c1e22',
                    border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8',
                    fontSize: '14px', outline: 'none', transition: 'border-color 150ms',
                  }}
                  onFocus={e => e.target.style.borderColor = '#c8f135'}
                  onBlur={e => e.target.style.borderColor = '#252729'}
                />
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#6b6e75', fontSize: '12px', marginBottom: '6px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={{
                  width: '100%', padding: '10px 12px', background: '#1c1e22',
                  border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8',
                  fontSize: '14px', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#c8f135'}
                onBlur={e => e.target.style.borderColor = '#252729'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#6b6e75', fontSize: '12px', marginBottom: '6px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '10px 12px', background: '#1c1e22',
                  border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8',
                  fontSize: '14px', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#c8f135'}
                onBlur={e => e.target.style.borderColor = '#252729'}
              />
            </div>

            {error && (
              <div style={{ marginBottom: '16px', padding: '10px 12px', background: 'rgba(255, 68, 68, 0.08)', border: '1px solid rgba(255, 68, 68, 0.3)', borderRadius: '6px', color: '#ff4444', fontSize: '13px' }}>
                {error}
              </div>
            )}

            {message && (
              <div style={{ marginBottom: '16px', padding: '10px 12px', background: 'rgba(0, 200, 83, 0.08)', border: '1px solid rgba(0, 200, 83, 0.3)', borderRadius: '6px', color: '#00c853', fontSize: '13px' }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-accent"
              style={{
                width: '100%', padding: '11px', borderRadius: '6px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Working...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ position: 'relative', margin: '20px 0', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#252729' }} />
            <span style={{ position: 'relative', background: '#141618', padding: '0 12px', color: '#6b6e75', fontSize: '12px' }}>OR</span>
          </div>

          <button
            onClick={handleGoogle}
            style={{
              width: '100%', padding: '11px', background: 'transparent',
              border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8',
              cursor: 'pointer', fontSize: '14px', fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'border-color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#6b6e75')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#252729')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b6e75', fontSize: '13px' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }}
              style={{ color: '#c8f135', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#6b6e75', fontSize: '12px' }}>
          Output over activity. Speed over safety. Ship or kill.
        </p>
      </div>
    </div>
  )
}
