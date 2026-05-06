'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Play, Pause, X, Maximize2, 
  Minimize2, CheckCircle2, Clock, 
  Target, Volume2, VolumeX 
} from 'lucide-react'
import { toast } from 'sonner'

export default function FocusTimer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null)
  const [linkedTaskTitle, setLinkedTaskTitle] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleToggle = (e: any) => {
      setIsOpen(true)
      setIsExpanded(true)
      if (e.detail?.taskId) {
        setLinkedTaskId(e.detail.taskId)
        setLinkedTaskTitle(e.detail.taskTitle)
        setTimeLeft((e.detail.timeBox || 25) * 60)
      }
    }
    window.addEventListener('toggle-focus-timer', handleToggle)
    return () => window.removeEventListener('toggle-focus-timer', handleToggle)
  }, [])

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleComplete()
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isActive, timeLeft])

  async function handleComplete() {
    setIsActive(false)
    playSound('complete')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('focus_sessions').insert({
        user_id: user.id,
        task_id: linkedTaskId,
        duration_minutes: Math.ceil((25 * 60 - timeLeft) / 60) || 25,
        completed: true
      })
      if (!error) toast.success('Focus session recorded')
    }

    if (linkedTaskId) {
      // Potentially mark task as done or status updated
    }
  }

  function playSound(type: 'start' | 'complete' | 'tick') {
    if (isMuted) return
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    if (type === 'start') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
    } else if (type === 'complete') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.2)
    }
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
    
    osc.start()
    osc.stop(ctx.currentTime + 0.2)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  if (!isOpen) return null

  return (
    <>
      {/* Floating Pill */}
      {!isExpanded && (
        <div 
          onClick={() => setIsExpanded(true)}
          style={{ 
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', 
            background: '#141618', border: '1px solid #c8f135', borderRadius: '100px', 
            padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', 
            zIndex: 999, cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? '#c8f135' : '#6b6e75', boxShadow: isActive ? '0 0 8px #c8f135' : 'none' }} />
          <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: '14px', color: '#f0ede8' }}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          <span style={{ color: '#6b6e75', fontSize: '11px', textTransform: 'uppercase' }}>
            {linkedTaskTitle ? `Focus: ${linkedTaskTitle}` : 'Focus Mode'}
          </span>
        </div>
      )}

      {/* Expanded Modal */}
      {isExpanded && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
          <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '40px' }}>
            <button 
              onClick={() => setIsExpanded(false)}
              style={{ position: 'absolute', top: '32px', right: '32px', background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer' }}
            >
              <Minimize2 size={24} />
            </button>

            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px', color: '#c8f135' }}>
                <Clock size={20} /> <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase' }}>Current Sprint</span>
              </div>
              <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>{linkedTaskTitle || 'General Focus Session'}</h2>
              <p style={{ color: '#6b6e75', fontSize: '14px' }}>One goal. No distractions. Ship it.</p>
            </div>

            <div style={{ fontSize: '120px', fontWeight: 800, fontFamily: 'DM Mono, monospace', color: isActive ? '#c8f135' : '#f0ede8', marginBottom: '48px', letterSpacing: '-0.05em' }}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', alignItems: 'center' }}>
              <button 
                onClick={() => setIsActive(!isActive)}
                style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#c8f135', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {isActive ? <Pause size={32} color="#000" fill="#000" /> : <Play size={32} color="#000" fill="#000" />}
              </button>
              
              <button 
                onClick={() => { setIsOpen(false); setIsActive(false); }}
                style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1c1e22', border: '1px solid #252729', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6e75', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              <button 
                onClick={() => setIsMuted(!isMuted)}
                style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1c1e22', border: '1px solid #252729', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6e75', cursor: 'pointer' }}
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
            </div>

            {isActive && (
              <div style={{ marginTop: '48px', color: '#6b6e75', fontSize: '12px', fontFamily: 'DM Mono, monospace', animation: 'pulse 2s infinite' }}>
                FOCUS ACTIVE • ALL SYSTEM NOTIFICATIONS SUPPRESSED
              </div>
            )}
          </div>

          <style jsx>{`
            @keyframes pulse {
              0% { opacity: 0.3; }
              50% { opacity: 0.7; }
              100% { opacity: 0.3; }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
