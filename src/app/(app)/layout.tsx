'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import type { User } from '@/types'
import { getInitials, cn } from '@/lib/utils'
import {
  LayoutDashboard, FolderKanban, CheckSquare, FileText,
  Zap, Settings, LogOut, Plus, Search, Sparkles, Video, Target,
  Layers, Activity, ChevronDown,
  type LucideIcon
} from 'lucide-react'
import CommandPalette from '@/components/CommandPalette'
import FocusTimer from '@/components/FocusTimer'
import CreateTaskModal from '@/components/CreateTaskModal'
import NaturalLanguageInputModal from '@/components/NaturalLanguageInputModal'
import GameTutorialModal from '@/components/GameTutorialModal'
import { WorkspaceProvider } from '@/context/WorkspaceContext'
import NavigationProgressBar from '@/components/NavigationProgressBar'
import AppleLoadingScreen from '@/components/ui/AppleLoadingScreen'
import { getCached, setCached } from '@/lib/cache/swrCache'

const CORE_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/meetings', label: 'Meetings', icon: Video },
]

const CREATOR_TOOLS: { href: string; label: string; description: string; icon: LucideIcon; badge?: string }[] = [
  { 
    href: '/content', 
    label: 'Content Vault', 
    description: 'Multi-platform social scheduler & video hub',
    icon: Layers,
    badge: 'Hub'
  },
  { 
    href: '/create', 
    label: 'Cultlike Create', 
    description: 'Proof of work scorecard & shipping streaks',
    icon: Activity,
    badge: 'Scorecard'
  },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [creatorMenuOpen, setCreatorMenuOpen] = useState(false)
  const creatorMenuRef = useRef<HTMLDivElement>(null)
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

  // Auto-close menus on route change
  useEffect(() => {
    setCreatorMenuOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  // Click outside to close menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (creatorMenuRef.current && !creatorMenuRef.current.contains(event.target as Node)) {
        setCreatorMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isCreatorActive = pathname === '/content' || pathname?.startsWith('/content') || pathname === '/create' || pathname?.startsWith('/create')

  if (!mounted || loading) {
    return <AppleLoadingScreen fullScreen />
  }

  return (
    <WorkspaceProvider>
      <NavigationProgressBar />
      <div className="min-h-screen bg-[#fbfbfd] text-[#111827] font-sans selection:bg-black/10 flex flex-col relative">
        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
        {isCreateTaskOpen && (
          <CreateTaskModal onClose={() => setIsCreateTaskOpen(false)} onSuccess={() => {}} />
        )}
        <FocusTimer />

        {/* Minimalist Top Navigation Bar */}
        <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-6 sm:px-10 flex items-center justify-between">
          {/* Left: Brand Identity & Workspace Switcher */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center group">
              <img src="/logo.png" alt="Cultlike OS" className="h-10 w-auto object-contain hover:opacity-80 transition-opacity" />
            </Link>
          </div>

        {/* Center: Minimalist Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-[#f5f5f7] border border-black/[0.04] p-1 rounded-2xl font-body">
          {CORE_NAV.map(({ href, label, icon: Icon }) => {
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
              </Link>
            )
          })}

          {/* Elegant subtle divider separating Core OS tools from Creator Suite */}
          <div className="h-4 w-px bg-black/[0.08] mx-1" />

          {/* Dedicated Creator Studio Dropdown with Ambient Lighting */}
          <div className="relative" ref={creatorMenuRef}>
            <button
              onClick={() => setCreatorMenuOpen(!creatorMenuOpen)}
              className={cn(
                'relative group flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all duration-300 cursor-pointer select-none font-light',
                isCreatorActive
                  ? 'bg-white text-black font-normal shadow-[0_0_18px_rgba(168,85,247,0.35),0_0_6px_rgba(99,102,241,0.25)] border border-purple-400/40 ring-1 ring-purple-400/30'
                  : 'text-[#4b5563] hover:text-black bg-gradient-to-r from-violet-500/[0.06] via-fuchsia-500/[0.06] to-indigo-500/[0.06] hover:from-violet-500/[0.12] hover:via-fuchsia-500/[0.12] hover:to-indigo-500/[0.12] border border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.12)] hover:shadow-[0_0_18px_rgba(168,85,247,0.22)]'
              )}
            >
              {/* Soft Ambient Light Halo Behind Button */}
              <span
                className={cn(
                  "absolute -inset-0.5 rounded-xl bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-indigo-500/30 blur-xs -z-10 transition-opacity duration-300 pointer-events-none",
                  isCreatorActive ? "opacity-100" : "opacity-40 group-hover:opacity-80"
                )}
              />

              <span className="relative z-10 tracking-tight font-normal">Creator Studio</span>
              <ChevronDown
                size={11}
                className={cn(
                  'transition-transform duration-200 text-[#9ca3af] relative z-10',
                  creatorMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {creatorMenuOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 bg-white border border-black/[0.08] rounded-2xl shadow-xl p-2 z-50 animate-fadeIn font-body">
                <div className="px-3 py-2 border-b border-black/[0.04] mb-1">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-[#9ca3af]">Creator Studio</div>
                  <div className="text-[11px] text-[#6b7280]">Dedicated tooling for media & brand creators</div>
                </div>
                {CREATOR_TOOLS.map((tool) => {
                  const isToolActive = pathname === tool.href || pathname?.startsWith(tool.href)
                  const ToolIcon = tool.icon
                  return (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() => setCreatorMenuOpen(false)}
                      className={cn(
                        'flex items-start gap-3 p-2.5 rounded-xl transition-all group',
                        isToolActive ? 'bg-black/[0.04] text-black' : 'hover:bg-black/[0.02] text-[#4b5563] hover:text-black'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-lg mt-0.5 transition-colors',
                        isToolActive ? 'bg-black text-white' : 'bg-black/[0.04] text-black group-hover:bg-black group-hover:text-white'
                      )}>
                        <ToolIcon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-black">{tool.label}</span>
                          {tool.badge && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-black/[0.05] text-[#4b5563]">
                              {tool.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#9ca3af] truncate mt-0.5">{tool.description}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
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

          {/* Interactive Game Tutorial Guide */}
          <button
            onClick={() => setIsTutorialOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#f5f5f7] hover:bg-[#ebebee] border border-black/[0.05] text-black font-normal text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            title="Interactive Video Game Tutorial & System Guide"
          >
            <Target size={13} className="text-amber-500" />
            <span className="hidden sm:inline">Guide</span>
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
          <div className="relative" ref={userMenuRef}>
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

                <button
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
        {CORE_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-150 relative min-w-[45px]',
                active
                  ? 'text-black font-semibold'
                  : 'text-[#8a8d95] hover:text-black'
              )}
            >
              <div className={cn(
                'p-1 rounded-lg transition-colors',
                active && 'bg-black text-white'
              )}>
                <Icon size={15} />
              </div>
              <span className="text-[9px] tracking-tight mt-0.5">{label}</span>
            </Link>
          )
        })}

        {/* Mobile Creator Tools Trigger */}
        <div className="relative">
          <button
            onClick={() => setCreatorMenuOpen(!creatorMenuOpen)}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-150 relative min-w-[45px]',
              isCreatorActive
                ? 'text-black font-semibold'
                : 'text-[#8a8d95] hover:text-black'
            )}
          >
            <div className={cn(
              'p-1 rounded-lg transition-all flex items-center justify-center',
              isCreatorActive && 'shadow-[0_0_12px_rgba(168,85,247,0.45)]'
            )}>
              <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-indigo-500 block shadow-xs" />
            </div>
            <span className="text-[9px] tracking-tight mt-0.5">Creator</span>
          </button>

          {creatorMenuOpen && (
            <div className="fixed bottom-16 left-4 right-4 bg-white border border-black/[0.08] rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/[0.04]">
                <div>
                  <div className="text-xs font-semibold text-black">Creator Studio</div>
                  <div className="text-[10px] text-[#9ca3af]">Content Vault & Proof Scorecard</div>
                </div>
                <button 
                  onClick={() => setCreatorMenuOpen(false)} 
                  className="text-xs font-medium text-neutral-500 hover:text-black px-2 py-1 bg-neutral-100 rounded-lg"
                >
                  Close
                </button>
              </div>
              <div className="space-y-1">
                {CREATOR_TOOLS.map((tool) => {
                  const ToolIcon = tool.icon
                  const isToolActive = pathname === tool.href || pathname?.startsWith(tool.href)
                  return (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() => setCreatorMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-xl text-xs transition-colors',
                        isToolActive ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-100'
                      )}
                    >
                      <ToolIcon size={16} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{tool.label}</div>
                        <div className={cn("text-[10px] truncate", isToolActive ? "text-neutral-300" : "text-neutral-400")}>{tool.description}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

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
