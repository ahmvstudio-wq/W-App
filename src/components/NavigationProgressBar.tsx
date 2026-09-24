'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function NavigationProgressBar() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const startProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    setVisible(true)
    setProgress(15)

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 85
        }
        return prev + Math.floor(Math.random() * 12) + 6
      })
    }, 120)
  }

  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setProgress(100)
    fadeTimerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => setProgress(0), 200)
    }, 280)
  }

  // Trigger on route changes
  useEffect(() => {
    completeProgress()
  }, [pathname])

  // Listen to custom async sync events across the entire application
  useEffect(() => {
    const handleSyncStart = () => startProgress()
    const handleSyncDone = () => completeProgress()

    window.addEventListener('cultlike-sync-start', handleSyncStart)
    window.addEventListener('cultlike-sync-done', handleSyncDone)

    // Global click listener on internal links for instant tactile feedback
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (href && href.startsWith('/') && !href.startsWith('//') && !target.getAttribute('target')) {
        if (href !== window.location.pathname) {
          startProgress()
        }
      }
    }

    document.addEventListener('click', handleLinkClick, { passive: true })

    return () => {
      window.removeEventListener('cultlike-sync-start', handleSyncStart)
      window.removeEventListener('cultlike-sync-done', handleSyncDone)
      document.removeEventListener('click', handleLinkClick)
      if (timerRef.current) clearInterval(timerRef.current)
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [])

  if (!visible && progress === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2.5px',
        zIndex: 99999,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.25s ease-out',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #111827 0%, #2563eb 60%, #38bdf8 100%)',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.6), 0 0 4px rgba(37, 99, 235, 0.8)',
          transition: progress === 100 ? 'width 0.2s ease-out' : 'width 0.3s cubic-bezier(0.1, 0.7, 0.1, 1)',
        }}
      />
    </div>
  )
}

/** Global helper triggers for zero-latency UI operations */
export function triggerSyncStart() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cultlike-sync-start'))
  }
}

export function triggerSyncDone() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cultlike-sync-done'))
  }
}
