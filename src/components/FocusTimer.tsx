'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Play, Pause, X, Maximize2, 
  Minimize2, CheckCircle2, Clock, 
  Target, Volume2, VolumeX 
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function FocusTimer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null)
  const [linkedTaskTitle, setLinkedTaskTitle] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const playSound = useCallback((type: 'start' | 'complete') => {
    if (isMuted) return
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      if (type === 'start') {
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
      } else if (type === 'complete') {
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.2)
      }
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } catch {}
  }, [isMuted])

  const handleComplete = useCallback(async () => {
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
      if (!error) toast.success('Focus sprint logged!')
    }
  }, [linkedTaskId, timeLeft, playSound])

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
  }, [isActive, timeLeft, handleComplete])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  if (!isOpen) return null

  return (
    <>
      {/* Floating Bottom Pill */}
      {!isExpanded && (
        <div 
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-black/[0.1] rounded-full px-4 py-2 flex items-center gap-3 z-50 cursor-pointer shadow-lg font-sans animate-fadeIn"
        >
          <span className={cn(
            'w-2 h-2 rounded-full',
            isActive ? 'bg-black animate-ping' : 'bg-[#9ca3af]'
          )} />
          <span className="font-mono text-xs font-semibold text-black">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-xs text-[#6b7280] font-body font-light truncate max-w-[140px]">
            {linkedTaskTitle || 'Focus Sprint'}
          </span>
        </div>
      )}

      {/* Expanded Focus Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex items-center justify-center font-sans animate-fadeIn">
          <div className="w-full max-w-md text-center p-8 relative">
            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute top-0 right-0 p-2 text-[#9ca3af] hover:text-black rounded-xl transition-colors cursor-pointer"
            >
              <Minimize2 size={20} />
            </button>

            <div className="mb-8 space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#6b7280] uppercase tracking-wider font-light">
                <Clock size={14} />
                <span>ACTIVE FOCUS SPRINT</span>
              </div>
              <h2 className="text-2xl font-light text-black tracking-tight">
                {linkedTaskTitle || 'Deep Work Session'}
              </h2>
              <p className="text-xs text-[#6b7280] font-body font-light">
                One clear deliverable. Zero distractions.
              </p>
            </div>

            {/* Giant Timer Clock */}
            <div className="text-7xl sm:text-8xl font-extralight font-mono text-black mb-10 tracking-tighter">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>

            {/* Controls */}
            <div className="flex justify-center items-center gap-4">
              <button 
                onClick={() => setIsActive(!isActive)}
                className="w-16 h-16 rounded-full bg-black hover:bg-neutral-800 text-white flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-105"
              >
                {isActive ? <Pause size={24} fill="#fff" /> : <Play size={24} fill="#fff" className="ml-1" />}
              </button>
              
              <button 
                onClick={() => { setIsOpen(false); setIsActive(false); }}
                className="w-12 h-12 rounded-full bg-[#fafafa] border border-black/[0.08] flex items-center justify-center text-[#6b7280] hover:text-black cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>

              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="w-12 h-12 rounded-full bg-[#fafafa] border border-black/[0.08] flex items-center justify-center text-[#6b7280] hover:text-black cursor-pointer transition-colors"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>

            {isActive && (
              <div className="mt-8 text-[11px] font-mono text-[#9ca3af] uppercase tracking-wider">
                DEEP FOCUS ACTIVE
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
