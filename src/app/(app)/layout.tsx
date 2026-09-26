'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import type { User } from '@/types'
import { getInitials } from '@/lib/utils'
import {
  Settings, LogOut, Plus, Search, Target
} from 'lucide-react'
import CommandPalette from '@/components/CommandPalette'
import FocusTimer from '@/components/FocusTimer'
import CreateTaskModal from '@/components/CreateTaskModal'
import NaturalLanguageInputModal from '@/components/NaturalLanguageInputModal'
import GameTutorialModal from '@/components/GameTutorialModal'
import MinimalMenuModal from '@/components/MinimalMenuModal'
import { WorkspaceProvider } from '@/context/WorkspaceContext'
import NavigationProgressBar from '@/components/NavigationProgressBar'
import AppleLoadingScreen from '@/components/ui/AppleLoadingScreen'
import { getCached, setCached } from '@/lib/cache/swrCache'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [isSynthesizeOpen, setIsSynthesizeOpen] = useState(false)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const cachedUser = getCached<User>('auth_user')
    if (cachedUser) {
      setUser(cachedUser)
      setLoading(false)
    }

    let isMounted = true

    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!isMounted) return

      if (!session) {
        setUser(null)
        setCached('auth_user', null)
        router.replace('/')
      } else {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          created_at: session.user.created_at,
        }
        setUser(userData)
        setCached('auth_user', userData)
        setLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setCached('auth_user', null)
        router.replace('/')
      } else if (session) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          created_at: session.user.created_at,
        }
        setUser(userData)
        setCached('auth_user', userData)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router])

  async function handleLogout() {
    setCached('auth_user', null)
    await supabase.auth.signOut()
    router.push('/')
  }

  useEffect(() => {
    const handleOpenModal = () => setIsCreateTaskOpen(true)
    const handleOpenTutorial = () => setIsTutorialOpen(true)
    window.addEventListener('open-create-task-modal', handleOpenModal)
    window.addEventListener('open-game-tutorial', handleOpenTutorial)
    return () => {
      window.removeEventListener('open-create-task-modal', handleOpenModal)
      window.removeEventListener('open-game-tutorial', handleOpenTutorial)
    }
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

  // Auto-close dropdowns on route change
  useEffect(() => {
    setUserMenuOpen(false)
    setIsMenuModalOpen(false)
  }, [pathname])

  // Click outside to close user profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!mounted || loading) {
    return <AppleLoadingScreen fullScreen />
  }

  return (
    <WorkspaceProvider>
      <NavigationProgressBar />
      <div className="min-h-screen bg-[#fbfbfd] text-[#111827] font-sans selection:bg-black/10 flex flex-col relative overflow-x-hidden">
        {/* Vibrant Ambient Studio Lighting */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px] bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(99,102,241,0.14),rgba(255,255,255,0))] pointer-events-none z-0" />
        <div className="fixed -bottom-20 right-10 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(245,158,11,0.08),rgba(255,255,255,0))] pointer-events-none z-0" />
        <div className="fixed top-1/2 -left-20 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(168,85,247,0.08),rgba(255,255,255,0))] pointer-events-none z-0" />

        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
        {isCreateTaskOpen && (
          <CreateTaskModal onClose={() => setIsCreateTaskOpen(false)} onSuccess={() => {}} />
        )}
        <FocusTimer />

        {/* Minimalist Clean Header */}
        <header className="sticky top-0 z-40 h-16 bg-white/85 backdrop-blur-xl border-b border-black/[0.06] px-4 sm:px-10 flex items-center justify-between relative">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center group">
              <img src="/logo-cultlike.png" alt="Logo" className="h-9 w-9 object-contain rounded-full hover:scale-105 transition-transform" />
            </Link>
          </div>

          {/* Center: Iconic Pill Menu Button (Dead center via absolute positioning) */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto">
            <button
              onClick={() => setIsMenuModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-2.5 px-5 py-1.5 sm:py-2 rounded-full border border-neutral-200/90 bg-white hover:bg-neutral-50 active:scale-[0.98] text-neutral-900 text-sm font-medium shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all cursor-pointer select-none"
              title="Open Navigation Menu"
            >
              {/* 2 horizontal bars from Screenshot 1 */}
              <svg className="w-4 h-2.5 text-neutral-900" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="1" y1="2" x2="15" y2="2" />
                <line x1="1" y1="8" x2="15" y2="8" />
              </svg>
              <span>Menu</span>
            </button>
          </div>

          {/* Right Actions & User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 font-body">
            {/* Quick Search - Minimal Icon Button */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              type="button"
              className="w-9 h-9 rounded-full bg-[#f5f5f7] hover:bg-[#ebebee] border border-black/[0.04] flex items-center justify-center text-[#6b7280] hover:text-black transition-all cursor-pointer"
              title="Search workspace (⌘K)"
              aria-label="Search"
            >
              <Search size={15} />
            </button>

            {/* New Task Trigger - Minimal Icon Button */}
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              type="button"
              className="w-9 h-9 rounded-full bg-black hover:bg-neutral-800 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer"
              title="Create Task"
              aria-label="Create Task"
            >
              <Plus size={16} />
            </button>

            {/* User Profile Avatar with Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                type="button"
                className="w-9 h-9 rounded-full bg-black text-white font-medium text-xs flex items-center justify-center shadow-sm cursor-pointer hover:ring-2 hover:ring-black/10 transition-all"
                title={user?.name || 'Account'}
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

                  <button
                    type="button"
                    onClick={() => setIsTutorialOpen(true)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-[#6b7280] hover:text-black hover:bg-black/[0.03] transition-colors cursor-pointer text-left"
                  >
                    <Target size={14} className="text-amber-500" />
                    <span>How It Works (Guide)</span>
                  </button>

                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-[#6b7280] hover:text-black hover:bg-black/[0.03] transition-colors"
                  >
                    <Settings size={14} />
                    <span>Settings</span>
                  </Link>

                  <button
                    type="button"
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

        {/* Main Full-Width Page Body */}
        <main className="flex-1 px-4 sm:px-8 lg:px-10 pt-2 sm:pt-3 pb-12 max-w-[1500px] w-full mx-auto overflow-x-hidden">
          {children}
        </main>

        {/* Minimal Modal Menu matching Screenshot 2 */}
        <MinimalMenuModal
          isOpen={isMenuModalOpen}
          onClose={() => setIsMenuModalOpen(false)}
          user={user}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          onLogout={handleLogout}
        />

        <NaturalLanguageInputModal
          isOpen={isSynthesizeOpen}
          onClose={() => setIsSynthesizeOpen(false)}
        />

        <GameTutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
          onCreateMaster={() => {
            setIsTutorialOpen(false)
            window.dispatchEvent(new CustomEvent('open-create-master-modal'))
          }}
        />
      </div>
    </WorkspaceProvider>
  )
}
