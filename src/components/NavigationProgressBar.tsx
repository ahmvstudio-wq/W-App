'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function NavigationProgressBar() {
  const pathname = usePathname()
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'fading'>('idle')
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startProgress = () => {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
    setStatus('loading')
  }

  const completeProgress = () => {
    setStatus('done')
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
    fadeTimeoutRef.current = setTimeout(() => {
      setStatus('fading')
      fadeTimeoutRef.current = setTimeout(() => {
        setStatus('idle')
      }, 200)
    }, 150)
  }

  // Trigger on route changes
  useEffect(() => {
    completeProgress()
  }, [pathname])

  // Listen to custom async sync events across the application
  useEffect(() => {
    const handleSyncStart = () => startProgress()
    const handleSyncDone = () => completeProgress()

    window.addEventListener('cultlike-sync-start', handleSyncStart)
    return () => {
      window.removeEventListener('cultlike-sync-start', handleSyncStart)
      window.removeEventListener('cultlike-sync-done', handleSyncDone)
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
    }
  }, [])

  if (status === 'idle') return null

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
        opacity: status === 'fading' ? 0 : 1,
        transition: 'opacity 0.2s ease-out',
      }}
    >
      <div
        style={{
          height: '100%',
          width: status === 'loading' ? '70%' : '100%',
          background: 'linear-gradient(90deg, #111827 0%, #2563eb 60%, #38bdf8 100%)',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.6), 0 0 4px rgba(37, 99, 235, 0.8)',
          transition: status === 'loading' 
            ? 'width 0.4s cubic-bezier(0.1, 0.7, 0.1, 1)' 
            : 'width 0.15s ease-out',
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
