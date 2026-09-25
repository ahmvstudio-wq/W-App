'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, ChevronDown } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { User } from '@/types'

interface MinimalMenuModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onOpenSearch: () => void
  onOpenCreateTask: () => void
  onLogout: () => void
}

export default function MinimalMenuModal({
  isOpen,
  onClose,
  user,
  onOpenSearch,
  onOpenCreateTask,
  onLogout,
}: MinimalMenuModalProps) {
  const pathname = usePathname()
  // Creator Studio collapsed by default, expands on click
  const [isCreatorOpen, setIsCreatorOpen] = useState(false)

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Auto-close on pathname change
  useEffect(() => {
    if (isOpen) {
      onClose()
    }
  }, [pathname])

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-14 px-4 sm:px-6">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Card Container matching Screenshot 2 */}
      <div 
        className="relative z-10 w-full max-w-2xl sm:max-w-3xl bg-white rounded-3xl border border-neutral-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] p-6 sm:p-10 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Centered Close Pill Button */}
        <div className="flex justify-center pb-6 sm:pb-8">
          <button
            onClick={onClose}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-[0.98] text-neutral-800 text-sm font-medium shadow-xs transition-all cursor-pointer"
          >
            <X size={13} className="stroke-[2.2] text-neutral-700" />
            <span>Close</span>
          </button>
        </div>

        {/* 2-Column Clean Multi-Menu Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 pt-1 pb-8">
          {/* Column 1: PRODUCT */}
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 tracking-[0.14em] uppercase mb-4 sm:mb-5 block">
              Product
            </span>
            <div className="flex flex-col space-y-3 sm:space-y-4">
              <Link
                href="/dashboard"
                onClick={onClose}
                className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors ${
                  pathname === '/dashboard' ? 'text-black' : 'text-neutral-900 hover:text-neutral-400'
                }`}
              >
                Home
              </Link>

              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenSearch()
                }}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 hover:text-neutral-400 transition-colors text-left flex items-center justify-between group cursor-pointer"
              >
                <span>Search</span>
                <span className="text-xs font-mono font-normal text-neutral-400 border border-neutral-200 px-2 py-0.5 rounded-md group-hover:border-neutral-400 transition-colors">
                  ⌘K
                </span>
              </button>

              <Link
                href="/projects"
                onClick={onClose}
                className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors ${
                  pathname?.startsWith('/projects') ? 'text-black' : 'text-neutral-900 hover:text-neutral-400'
                }`}
              >
                Projects
              </Link>

              <Link
                href="/tasks"
                onClick={onClose}
                className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors ${
                  pathname?.startsWith('/tasks') ? 'text-black' : 'text-neutral-900 hover:text-neutral-400'
                }`}
              >
                Tasks
              </Link>

              <Link
                href="/documents"
                onClick={onClose}
                className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors ${
                  pathname?.startsWith('/documents') ? 'text-black' : 'text-neutral-900 hover:text-neutral-400'
                }`}
              >
                Documents
              </Link>

              <Link
                href="/meetings"
                onClick={onClose}
                className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors ${
                  pathname?.startsWith('/meetings') ? 'text-black' : 'text-neutral-900 hover:text-neutral-400'
                }`}
              >
                Meetings
              </Link>
            </div>
          </div>

          {/* Column 2: SOLUTIONS */}
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 tracking-[0.14em] uppercase mb-4 sm:mb-5 block">
              Solutions
            </span>
            <div className="flex flex-col space-y-4">
              {/* Creator Studio with Soft Ambient Lighting & Accordion Collapse */}
              <div className="relative group">
                {/* Soft ambient lighting halo */}
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-indigo-500/20 blur-md opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="relative z-10 bg-white/95 rounded-2xl p-2.5 -m-2.5 border border-purple-500/20 transition-all">
                  <button
                    type="button"
                    onClick={() => setIsCreatorOpen(prev => !prev)}
                    className="w-full flex items-center justify-between text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors text-left cursor-pointer select-none"
                  >
                    <span>Creator Studio</span>
                    <ChevronDown
                      size={20}
                      className={`text-neutral-400 transition-transform duration-200 ${
                        isCreatorOpen ? 'rotate-180 text-black' : ''
                      }`}
                    />
                  </button>

                  {/* Expandable Sub-items on click - clean, simple, zero tags */}
                  {isCreatorOpen && (
                    <div className="flex flex-col space-y-2.5 pt-3 pl-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      <Link
                        href="/content"
                        onClick={onClose}
                        className="text-base font-medium text-neutral-600 hover:text-black transition-colors"
                      >
                        Content Vault
                      </Link>
                      <Link
                        href="/create"
                        onClick={onClose}
                        className="text-base font-medium text-neutral-600 hover:text-black transition-colors"
                      >
                        Daily Create
                      </Link>
                      <Link
                        href="/create?tab=analytics"
                        onClick={onClose}
                        className="text-base font-medium text-neutral-600 hover:text-black transition-colors"
                      >
                        Analytics
                      </Link>
                      <Link
                        href="/content?tab=drive"
                        onClick={onClose}
                        className="text-base font-medium text-neutral-600 hover:text-black transition-colors"
                      >
                        Drive Storage
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings */}
              <Link
                href="/settings"
                onClick={onClose}
                className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors pt-2 ${
                  pathname === '/settings' ? 'text-black' : 'text-neutral-900 hover:text-neutral-400'
                }`}
              >
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Crisp Divider Line */}
        <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black text-white font-medium text-xs flex items-center justify-center shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-neutral-900 truncate">{user?.name || 'Creator'}</div>
              <div className="text-[11px] text-neutral-400 font-mono truncate">{user?.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenCreateTask()
              }}
              className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-full shadow-xs transition-all cursor-pointer"
            >
              + Create Task
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                onLogout()
              }}
              className="px-3.5 py-1.5 bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-600 text-xs font-medium rounded-full transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
