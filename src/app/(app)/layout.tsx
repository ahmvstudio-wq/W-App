'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import type { User } from '@/types'
import { getInitials, cn } from '@/lib/utils'
import {
  LayoutDashboard, FolderKanban, CheckSquare, FileText,
  Zap, Settings, LogOut, ChevronDown, Plus, Search,
  Activity, ShieldCheck, Clock, Sparkles
} from 'lucide-react'
import CommandPalette from '@/components/CommandPalette'
import FocusTimer from '@/components/FocusTimer'
import CreateTaskModal from '@/components/CreateTaskModal'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/ai', label: 'AI Assistant', icon: Zap },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)

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

  useEffect(() => {
    const handleOpenModal = () => setIsCreateTaskOpen(true)
    window.addEventListener('open-create-task-modal', handleOpenModal)
    return () => window.removeEventListener('open-create-task-modal', handleOpenModal)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      }
    }

    const handleOpenPalette = () => setIsCommandPaletteOpen(true)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleOpenPalette)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleOpenPalette)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0d0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8b5cf6] to-[#c8f135] flex items-center justify-center mx-auto mb-4 animate-pulseGlow shadow-glow">
            <span className="font-extrabold text-black text-xl">W</span>
          </div>
          <div className="text-[#8a8d95] text-xs font-mono tracking-widest uppercase">INITIALIZING SYSTEM...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0c0d0f] text-[#f0ede8] selection:bg-[#c8f135]/20 relative">
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      {isCreateTaskOpen && (
        <CreateTaskModal onClose={() => setIsCreateTaskOpen(false)} onSuccess={() => {}} />
      )}
      <FocusTimer />

      {/* Modern Frosted Sidebar */}
      <aside className="w-[260px] flex-shrink-0 bg-[#121316]/90 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col fixed top-0 left-0 bottom-0 z-40">
        {/* Brand Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#c8f135] text-black font-extrabold text-sm flex items-center justify-center shadow-glow">
                W
              </div>
              <div>
                <span className="font-bold text-[15px] tracking-tight text-white block">Focus OS</span>
                <span className="text-[10px] text-[#6b6e75] font-mono block tracking-wider">AHMV SYSTEMS</span>
              </div>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE
            </div>
          </div>

          {/* Workspace Pill Selector */}
          <button className="w-full p-2.5 bg-[#181a1e] hover:bg-[#202226] border border-white/[0.06] rounded-xl flex items-center gap-2.5 cursor-pointer transition-all duration-200 group text-left">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px]">
              {user?.name?.[0]?.toUpperCase() || 'W'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-white text-xs font-semibold block truncate">Production Hub</span>
              <span className="text-[10px] text-[#6b6e75] block truncate font-mono">callmy-mgmt</span>
            </div>
            <ChevronDown size={14} className="text-[#6b6e75] group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#52545a]">
            Core Navigation
          </div>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative',
                  active
                    ? 'bg-white/[0.08] text-white shadow-sm font-semibold'
                    : 'text-[#8a8d95] hover:text-white hover:bg-white/[0.03]'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#c8f135] rounded-r-full shadow-glow"></span>
                )}
                <Icon
                  size={16}
                  className={cn(
                    'transition-colors duration-200',
                    active ? 'text-[#c8f135]' : 'text-[#6b6e75] group-hover:text-white'
                  )}
                />
                <span className="flex-1">{label}</span>
                {href === '/ai' && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-[#8b5cf6]/20 text-[#a594f9] border border-[#8b5cf6]/30">
                    24/7
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* HUD System Telemetry Badge */}
        <div className="mx-4 mb-3 p-3 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06]">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[#6b6e75] font-mono text-[10px]">STATUS</span>
            <span className="text-emerald-400 font-mono text-[10px] font-semibold">[OPTIMAL]</span>
          </div>
          <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-[#c8f135] h-full w-[94%] rounded-full"></div>
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] text-[#6b6e75] font-mono">
            <span>SYNC: SUPABASE</span>
            <span className="text-white">99.9%</span>
          </div>
        </div>

        {/* Bottom User Card */}
        <div className="p-3 border-t border-white/[0.06] bg-[#101114]">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8b5cf6] to-[#c8f135] text-black font-bold text-xs flex items-center justify-center shadow-sm flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user?.name}</div>
              <div className="text-[#6b6e75] text-[10px] truncate font-mono">{user?.email}</div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/settings"
                className="p-1.5 text-[#6b6e75] hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
                title="Settings"
              >
                <Settings size={14} />
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-[#6b6e75] hover:text-red-400 hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Top Header */}
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        {/* Floating Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#0c0d0f]/80 backdrop-blur-xl border-b border-white/[0.06] px-8 flex items-center justify-between">
          {/* Quick Search */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#141618] hover:bg-[#1c1e22] border border-white/[0.08] rounded-xl text-xs text-[#8a8d95] hover:text-white transition-all duration-200 cursor-pointer w-72"
          >
            <Search size={14} className="text-[#6b6e75]" />
            <span className="flex-1 text-left">Search anything...</span>
            <kbd className="px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.1] rounded text-[10px] font-mono text-[#8a8d95]">
              ⌘K
            </kbd>
          </button>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#c8f135] hover:bg-[#b8e125] text-black font-semibold text-xs rounded-xl shadow-glow transition-all duration-200 cursor-pointer hover:scale-[1.02]"
            >
              <Plus size={14} />
              <span>New Task</span>
            </button>

            <Link
              href="/ai"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-xs text-[#f0ede8] font-medium transition-all"
            >
              <Sparkles size={13} className="text-[#a594f9]" />
              <span>ChatGPT Live</span>
            </Link>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-8 max-w-[1500px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
