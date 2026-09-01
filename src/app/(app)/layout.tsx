'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import type { User } from '@/types'
import { getInitials, cn } from '@/lib/utils'
import {
  LayoutDashboard, FolderKanban, CheckSquare, FileText,
  Zap, Settings, LogOut, Plus, Search, Sparkles, Video
} from 'lucide-react'
import CommandPalette from '@/components/CommandPalette'
import FocusTimer from '@/components/FocusTimer'
import CreateTaskModal from '@/components/CreateTaskModal'
import NaturalLanguageInputModal from '@/components/NaturalLanguageInputModal'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/meetings', label: 'Meetings', icon: Video },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/ai', label: 'AI Assistant', icon: Zap },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [isSynthesizeOpen, setIsSynthesizeOpen] = useState(false)

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
        <div className="text-center space-y-1">
          <div className="text-sm font-normal text-black tracking-tight">CallMy Mgmt</div>
          <div className="text-[#8a8d95] text-xs font-mono tracking-wider uppercase font-light">Loading workspace...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#111827] font-sans selection:bg-black/10 flex flex-col relative">
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      {isCreateTaskOpen && (
        <CreateTaskModal onClose={() => setIsCreateTaskOpen(false)} onSuccess={() => {}} />
      )}
      <FocusTimer />

      {/* Minimalist Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-6 sm:px-10 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center group">
            <span className="font-normal text-sm tracking-tight text-black group-hover:opacity-80 transition-opacity">
              CallMy Mgmt
            </span>
          </Link>
        </div>

        {/* Center: Minimalist Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-[#f5f5f7] border border-black/[0.04] p-1 rounded-2xl font-body">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all duration-150 relative font-light',
                  active
                    ? 'bg-white text-black font-normal shadow-sm'
                    : 'text-[#6b7280] hover:text-black hover:bg-black/[0.02]'
                )}
              >
                <Icon
                  size={14}
                  className={cn(
                    'transition-colors',
                    active ? 'text-black' : 'text-[#9ca3af]'
                  )}
                />
                <span>{label}</span>
                {href === '/ai' && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-black/[0.04] text-[#6b7280]">
                    24/7
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 font-body">
          {/* Quick Search */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#f5f5f7] hover:bg-[#ebebee] border border-black/[0.04] rounded-xl text-xs text-[#6b7280] hover:text-black transition-all cursor-pointer font-light"
            title="Search workspace"
          >
            <Search size={13} className="text-[#9ca3af]" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline px-1.5 py-0.2 bg-white border border-black/[0.06] rounded text-[9px] font-mono text-[#6b7280]">
              ⌘K
            </kbd>
          </button>

          {/* Synthesize One-Input Engine */}
          <button
            onClick={() => setIsSynthesizeOpen(true)}
            className="flex items-center px-2.5 sm:px-3.5 py-1.5 bg-[#fafafa] hover:bg-[#f0f0f2] text-black border border-black/[0.08] font-normal text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            title="Synthesize project directives and tasks"
          >
            <span>Synthesize</span>
          </button>

          {/* New Task Trigger */}
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white font-normal text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Create Task</span>
          </button>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-8 h-8 rounded-full bg-black text-white font-medium text-xs flex items-center justify-center shadow-sm cursor-pointer hover:ring-2 hover:ring-black/10 transition-all"
            >
              {getInitials(user?.name)}
            </button>

            {userMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-52 bg-white border border-black/[0.08] rounded-2xl shadow-xl p-2 z-50 animate-fadeIn font-body"
                onClick={() => setUserMenuOpen(false)}
              >
                <div className="p-2.5 border-b border-black/[0.04] mb-1">
                  <div className="text-xs font-normal text-black truncate">{user?.name}</div>
                  <div className="text-[10px] text-[#9ca3af] font-mono truncate">{user?.email}</div>
                </div>

                <Link
                  href="/settings"
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-[#6b7280] hover:text-black hover:bg-black/[0.03] transition-colors"
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Full-Width Page Body with Mobile Responsive Padding */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 pb-24 md:pb-12 max-w-[1500px] w-full mx-auto overflow-x-hidden">
        {children}
      </main>

      {/* Sleek Mobile Bottom Navigation Bar (iOS/Android Native Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-black/[0.08] px-2 py-1.5 flex items-center justify-around shadow-lg font-body safe-area-bottom">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 relative min-w-[50px]',
                active
                  ? 'text-black font-semibold'
                  : 'text-[#8a8d95] hover:text-black'
              )}
            >
              <div className={cn(
                'p-1 rounded-lg transition-colors',
                active && 'bg-black text-white'
              )}>
                <Icon size={16} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{label}</span>
            </Link>
          )
        })}
      </div>

      <NaturalLanguageInputModal
        isOpen={isSynthesizeOpen}
        onClose={() => setIsSynthesizeOpen(false)}
      />
    </div>
  )
}
