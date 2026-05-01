'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import type { User } from '@/types'
import { getInitials } from '@/lib/utils'
import {
  LayoutDashboard, FolderKanban, CheckSquare, FileText, 
  Users, Zap, BarChart2, Settings, LogOut, ChevronDown
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/meetings', label: 'Meetings', icon: Users },
  { href: '/ai', label: 'AI', icon: Zap },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (!session) {
        router.replace('/')
      } else {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          created_at: session.user.created_at,
        })
        setLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        router.replace('/')
      } else if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          created_at: session.user.created_at,
        })
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0c0d0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', background: '#c8f135', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ color: '#000', fontWeight: 800, fontFamily: 'Syne, sans-serif', fontSize: '16px' }}>F</span>
          </div>
          <div style={{ color: '#6b6e75', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0c0d0f' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px', flexShrink: 0, background: '#141618',
        borderRight: '1px solid #252729', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      }}>
        {/* Logo + workspace */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '28px', height: '28px', background: '#c8f135', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#000', fontWeight: 800, fontFamily: 'Syne, sans-serif', fontSize: '13px' }}>F</span>
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '15px', letterSpacing: '-0.02em' }}>FOCUS OS</span>
          </div>

          {/* Workspace pill */}
          <button style={{
            width: '100%', padding: '8px 10px', background: '#1c1e22', border: '1px solid #252729',
            borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', marginBottom: '24px',
          }}>
            <div style={{ width: '20px', height: '20px', background: '#c8f135', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#000', fontSize: '9px', fontWeight: 800 }}>W</span>
            </div>
            <span style={{ color: '#f0ede8', fontSize: '12px', fontWeight: 500, flex: 1, textAlign: 'left' }}>My Workspace</span>
            <ChevronDown size={12} color="#6b6e75" />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 10px', borderRadius: '6px', marginBottom: '2px',
                color: active ? '#f0ede8' : '#6b6e75',
                background: active ? '#1c1e22' : 'transparent',
                textDecoration: 'none', fontSize: '13px', fontWeight: active ? 500 : 400,
                transition: 'all 150ms',
                borderLeft: active ? '2px solid #c8f135' : '2px solid transparent',
              }}>
                <Icon size={15} color={active ? '#c8f135' : '#6b6e75'} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom user */}
        <div style={{ padding: '16px', borderTop: '1px solid #252729' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%', background: '#c8f135',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ color: '#000', fontSize: '11px', fontWeight: 700, fontFamily: 'DM Mono, monospace' }}>
                {getInitials(user?.name)}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#f0ede8', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ color: '#6b6e75', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Link href="/settings" style={{
              flex: 1, padding: '6px', background: 'transparent', border: '1px solid #252729',
              borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none',
            }}>
              <Settings size={13} color="#6b6e75" />
            </Link>
            <button onClick={handleLogout} style={{
              flex: 1, padding: '6px', background: 'transparent', border: '1px solid #252729',
              borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <LogOut size={13} color="#6b6e75" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: '240px', minHeight: '100vh', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
