'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

interface LandingMenuModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenAuth: (mode: 'login' | 'signup') => void
}

export default function LandingMenuModal({
  isOpen,
  onClose,
  onOpenAuth,
}: LandingMenuModalProps) {
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

  // Prevent background scrolling when open
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

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    onClose()
    if (targetId === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const targetElement = document.querySelector(targetId)
    if (targetElement) {
      e.preventDefault()
      targetElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

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
              <a
                href="#"
                onClick={(e) => handleAnchorClick(e, '#')}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 hover:text-neutral-400 transition-colors"
              >
                Home
              </a>

              <a
                href="#features"
                onClick={(e) => handleAnchorClick(e, '#features')}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 hover:text-neutral-400 transition-colors"
              >
                Features
              </a>

              <a
                href="#showcase"
                onClick={(e) => handleAnchorClick(e, '#showcase')}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 hover:text-neutral-400 transition-colors"
              >
                Showcase
              </a>

              <a
                href="#faq"
                onClick={(e) => handleAnchorClick(e, '#faq')}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 hover:text-neutral-400 transition-colors"
              >
                FAQ
              </a>

              <Link
                href="/privacy"
                onClick={onClose}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 hover:text-neutral-400 transition-colors"
              >
                Privacy & Legal
              </Link>
            </div>
          </div>

          {/* Column 2: SOLUTIONS */}
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 tracking-[0.14em] uppercase mb-4 sm:mb-5 block">
              Solutions
            </span>
            <div className="flex flex-col space-y-5">
              {/* Creator Studio & Sub-items */}
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

              {/* Deep Work Execution */}
              <a
                href="#features"
                onClick={(e) => handleAnchorClick(e, '#features')}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 hover:text-neutral-400 transition-colors text-left flex items-center justify-between group cursor-pointer"
              >
                <span>Deep Work Sprints</span>
                <span className="text-[10px] font-mono font-normal uppercase text-neutral-400 border border-neutral-200 px-2 py-0.5 rounded-md group-hover:border-neutral-400 transition-colors">
                  Streaks
                </span>
              </a>

              {/* Fathom Call Sync */}
              <a
                href="#showcase"
                onClick={(e) => handleAnchorClick(e, '#showcase')}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 hover:text-neutral-400 transition-colors text-left flex items-center justify-between group cursor-pointer"
              >
                <span>Meeting Intelligence</span>
                <span className="text-[10px] font-mono font-normal uppercase text-neutral-400 border border-neutral-200 px-2 py-0.5 rounded-md group-hover:border-neutral-400 transition-colors">
                  Fathom
                </span>
              </a>

              {/* Enterprise Directives */}
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenAuth('signup')
                }}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 hover:text-neutral-400 transition-colors text-left"
              >
                Enterprise Workspace
              </button>
            </div>
          </div>
        </div>

        {/* Crisp Divider Line (matching Screenshot 2 bottom rule) */}
        <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-cultlike.png" 
              alt="Cultlike OS" 
              className="h-8 w-8 object-contain rounded-full border border-black/[0.08]" 
            />
            <div>
              <div className="text-xs font-semibold text-neutral-900">Cultlike OS</div>
              <div className="text-[11px] text-neutral-400 font-mono">The Executive Operating System</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenAuth('login')
              }}
              className="px-4 py-1.5 rounded-full border border-neutral-200 hover:border-black/30 text-xs font-medium text-neutral-700 hover:text-black transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenAuth('signup')
              }}
              className="px-4 py-1.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
            >
              Launch Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
