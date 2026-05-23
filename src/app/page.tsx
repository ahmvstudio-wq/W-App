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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) {
        setError(error.message)
      } else {
        // If session was returned immediately (email confirm disabled), create their default workspace!
        if (data.session) {
          const user = data.session.user
          const { data: ws } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1)
          if (!ws || ws.length === 0) {
            await supabase.from('workspaces').insert({
              owner_id: user.id,
              name: `${name || user.email?.split('@')[0] || 'My'}'s Workspace`
            })
          }
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
        const user = data.session.user
        // Check and ensure workspace exists
        const { data: ws } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1)
        if (!ws || ws.length === 0) {
          await supabase.from('workspaces').insert({
            owner_id: user.id,
            name: `${user.user_metadata?.name || user.email?.split('@')[0] || 'My'}'s Workspace`
          })
        }
        router.push('/dashboard')
      }
    }
    setLoading(false)
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
