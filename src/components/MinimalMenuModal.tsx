'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Search } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { User } from '@/types'

interface MinimalMenuModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onOpenSearch: () => void
  onOpenSynthesize: () => void
  onOpenTutorial: () => void
  onOpenCreateTask: () => void
  onLogout: () => void
}

export default function MinimalMenuModal({
  isOpen,
  onClose,
  user,
  onOpenSearch,
  onOpenSynthesize,
  onOpenTutorial,
  onOpenCreateTask,
  onLogout,
}: MinimalMenuModalProps) {
  const pathname = usePathname()

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
        {/* Top Centered Close Pill Button (exact match to Screenshot 2) */}
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
            <div className="flex flex-col space-y-5">
              {/* Creator Studio with Sub-items */}
              <div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-2">
                  Creator Studio
                </div>
                <div className="flex flex-col space-y-2 pl-0.5 mt-1">
                  <Link
                    href="/content"
                    onClick={onClose}
                    className="text-sm sm:text-[15px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors flex items-center justify-between"
                  >
                    <span>Content Vault</span>
                    <span className="text-[10px] text-neutral-400 font-mono uppercase">Video Hub</span>
                  </Link>
                  <Link
                    href="/create"
                    onClick={onClose}
                    className="text-sm sm:text-[15px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors flex items-center justify-between"
                  >
                    <span>Cultlike Create</span>
                    <span className="text-[10px] text-neutral-400 font-mono uppercase">Scorecard</span>
                  </Link>
                  <Link
                    href="/create?tab=analytics"
                    onClick={onClose}
                    className="text-sm sm:text-[15px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors flex items-center justify-between"
                  >
                    <span>Cross-Platform Analytics</span>
                    <span className="text-[10px] text-neutral-400 font-mono uppercase">IG & YT</span>
                  </Link>
                  <Link
                    href="/content?tab=drive"
                    onClick={onClose}
                    className="text-sm sm:text-[15px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors flex items-center justify-between"
                  >
                    <span>Google Drive Sourcing</span>
                    <span className="text-[10px] text-neutral-400 font-mono uppercase">Assets</span>
                  </Link>
                </div>
              </div>

              {/* Synthesize One-Input Engine */}
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenSynthesize()
                }}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 hover:text-neutral-400 transition-colors text-left flex items-center justify-between group cursor-pointer"
              >
                <span>Synthesize</span>
                <span className="text-[10px] font-mono font-normal uppercase text-neutral-400 border border-neutral-200 px-2 py-0.5 rounded-md group-hover:border-neutral-400 transition-colors">
                  AI Directives
                </span>
              </button>

              {/* Interactive Game Tutorial Guide */}
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenTutorial()
                }}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 hover:text-neutral-400 transition-colors text-left flex items-center justify-between group cursor-pointer"
              >
                <span>System Guide</span>
                <span className="text-[10px] font-mono font-normal uppercase text-neutral-400 border border-neutral-200 px-2 py-0.5 rounded-md group-hover:border-neutral-400 transition-colors">
                  Tutorial
                </span>
              </button>

              {/* Settings */}
              <Link
                href="/settings"
                onClick={onClose}
                className={`text-2xl sm:text-3xl font-bold tracking-tight transition-colors ${
                  pathname === '/settings' ? 'text-black' : 'text-neutral-900 hover:text-neutral-400'
                }`}
              >
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Crisp Divider Line (matching Screenshot 2 bottom rule) */}
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
