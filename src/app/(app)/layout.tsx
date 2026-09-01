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
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center mx-auto mb-3 shadow-sm font-normal text-sm">
            CM
          </div>
          <div className="text-[#8a8d95] text-xs font-mono tracking-wider uppercase font-light">Loading CallMy Mgmt...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#fbfbfd] text-[#111827] font-sans selection:bg-black/10 relative">
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      {isCreateTaskOpen && (
        <CreateTaskModal onClose={() => setIsCreateTaskOpen(false)} onSuccess={() => {}} />
      )}
      <FocusTimer />

      {/* Minimal Clean White Sidebar */}
      <aside className="w-[250px] flex-shrink-0 bg-[#ffffff] border-r border-black/[0.06] flex flex-col fixed top-0 left-0 bottom-0 z-40">
        {/* Brand Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-black text-white font-medium text-xs flex items-center justify-center shadow-sm">
                CM
              </div>
              <div>
                <span className="font-normal text-sm tracking-tight text-black block">CallMy Mgmt</span>
                <span className="text-[10px] text-[#8a8d95] font-mono block tracking-wider">callmy-mgmt</span>
              </div>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-black/[0.04] border border-black/[0.06] text-black text-[10px] font-mono">
              v1.0
            </div>
          </div>

          {/* Workspace Pill Selector */}
          <div className="w-full p-2.5 bg-[#f5f5f7] border border-black/[0.04] rounded-xl flex items-center gap-2.5 text-left">
            <div className="w-5 h-5 rounded-md bg-black text-white flex items-center justify-center flex-shrink-0 font-medium text-[9px]">
              {user?.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-black text-xs font-normal block truncate">Main Workspace</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto font-body font-light">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#9ca3af]">
            Navigation
          </div>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 relative',
                  active
                    ? 'bg-black text-white font-normal shadow-sm'
                    : 'text-[#6b7280] hover:text-black hover:bg-black/[0.03]'
                )}
              >
                <Icon
                  size={15}
                  className={cn(
                    'transition-colors',
                    active ? 'text-white' : 'text-[#9ca3af]'
                  )}
                />
                <span className="flex-1">{label}</span>
                {href === '/ai' && (
                  <span className={cn(
                    "px-1.5 py-0.2 rounded text-[9px] font-mono",
                    active ? "bg-white/20 text-white" : "bg-black/[0.05] text-[#6b7280]"
                  )}>
                    24/7
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom User Profile */}
        <div className="p-3 border-t border-black/[0.06] bg-[#fdfdfe]">
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/[0.03] transition-colors">
            <div className="w-7 h-7 rounded-full bg-black text-white font-medium text-xs flex items-center justify-center shadow-sm flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-black text-xs font-normal truncate">{user?.name}</div>
              <div className="text-[#9ca3af] text-[10px] truncate font-mono">{user?.email}</div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/settings"
                className="p-1.5 text-[#9ca3af] hover:text-black hover:bg-black/[0.05] rounded-lg transition-colors"
                title="Settings"
              >
                <Settings size={13} />
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-[#9ca3af] hover:text-red-600 hover:bg-black/[0.05] rounded-lg transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-[250px] flex flex-col min-h-screen">
        {/* Floating Minimal Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#fbfbfd]/80 backdrop-blur-xl border-b border-black/[0.06] px-8 flex items-center justify-between">
          {/* Quick Search */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 bg-white hover:bg-[#f5f5f7] border border-black/[0.08] rounded-xl text-xs text-[#6b7280] hover:text-black transition-all cursor-pointer w-72 shadow-sm font-body font-light"
          >
            <Search size={14} className="text-[#9ca3af]" />
            <span className="flex-1 text-left">Search tasks, projects, docs...</span>
            <kbd className="px-1.5 py-0.5 bg-black/[0.04] border border-black/[0.06] rounded text-[10px] font-mono text-[#6b7280]">
              ⌘K
            </kbd>
          </button>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 font-body">
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white font-normal text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Create Task</span>
            </button>

            <Link
              href="/ai"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#f5f5f7] border border-black/[0.08] rounded-xl text-xs text-black font-normal transition-all shadow-sm"
            >
              <Sparkles size={13} className="text-black" />
              <span>ChatGPT Action</span>
            </Link>
          </div>
        </header>

        {/* Main Page Body */}
        <main className="flex-1 p-8 max-w-[1500px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
