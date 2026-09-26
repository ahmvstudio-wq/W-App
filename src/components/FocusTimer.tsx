'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Play, Pause, X, Minimize2, Maximize2,
  CheckCircle2, Clock, Volume2, VolumeX,
  Radio, Sliders
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Pure Web Audio API Brown Noise Generator
class BrownNoiseGenerator {
  private ctx: AudioContext | null = null
  private noiseNode: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  public isPlaying = false

  start(volume = 0.5) {
    if (this.isPlaying) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      this.ctx = new AudioCtx()
      const bufferSize = this.ctx.sampleRate * 5
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let lastOut = 0.0

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = data[i]
        data[i] *= 3.2
      }

      this.noiseNode = this.ctx.createBufferSource()
      this.noiseNode.buffer = buffer
      this.noiseNode.loop = true

      this.gainNode = this.ctx.createGain()
      const targetGain = Math.max(0.001, volume * 0.35)
      this.gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime)
      this.gainNode.gain.exponentialRampToValueAtTime(targetGain, this.ctx.currentTime + 0.3)

      this.noiseNode.connect(this.gainNode)
      this.gainNode.connect(this.ctx.destination)
      this.noiseNode.start()
      this.isPlaying = true
    } catch (e) {
      console.warn('AudioContext error:', e)
    }
  }

  setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      try {
        const targetGain = Math.max(0.001, volume * 0.35)
        this.gainNode.gain.setValueAtTime(targetGain, this.ctx.currentTime)
      } catch {}
    }
  }

  stop() {
    if (!this.isPlaying) return
    try {
      if (this.gainNode && this.ctx) {
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2)
      }
      setTimeout(() => {
        try {
          this.noiseNode?.stop()
          this.ctx?.close()
        } catch {}
        this.noiseNode = null
        this.gainNode = null
        this.ctx = null
        this.isPlaying = false
      }, 250)
    } catch {
      this.isPlaying = false
    }
  }
}

export default function FocusTimer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [initialMinutes, setInitialMinutes] = useState(25)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null)
  const [linkedTaskTitle, setLinkedTaskTitle] = useState<string | null>(null)
  
  // Custom Settings
  const [customInput, setCustomInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [zenMode, setZenMode] = useState(false)

  // Brown Noise State
  const [brownNoiseActive, setBrownNoiseActive] = useState(false)
  const [noiseVolume, setNoiseVolume] = useState(0.5)
  const noiseGenRef = useRef<BrownNoiseGenerator | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Noise Generator instance
  useEffect(() => {
    noiseGenRef.current = new BrownNoiseGenerator()
    return () => {
      noiseGenRef.current?.stop()
    }
  }, [])

  // Manage Brown Noise playback
  useEffect(() => {
    if (brownNoiseActive && (isActive || isExpanded)) {
      if (!noiseGenRef.current?.isPlaying) {
        noiseGenRef.current?.start(noiseVolume)
      } else {
        noiseGenRef.current?.setVolume(noiseVolume)
      }
    } else {
      if (noiseGenRef.current?.isPlaying) {
        noiseGenRef.current?.stop()
      }
    }
  }, [brownNoiseActive, isActive, isExpanded, noiseVolume])

  const playChime = useCallback((type: 'start' | 'complete') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      if (type === 'start') {
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
      } else {
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.2)
      }
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } catch {}
  }, [])

  const handleComplete = useCallback(async () => {
    setIsActive(false)
    playChime('complete')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const elapsedMinutes = Math.max(1, Math.ceil((initialMinutes * 60 - timeLeft) / 60))
      await supabase.from('focus_sessions').insert({
        user_id: user.id,
        task_id: linkedTaskId,
        duration_minutes: elapsedMinutes,
        completed: true
      })
      toast.success('Focus session completed and logged!')
    }
  }, [linkedTaskId, timeLeft, initialMinutes, playChime])

  // Mark task as shipped directly from timer
  const handleMarkTaskShipped = async () => {
    if (!linkedTaskId) return
    try {
      await supabase.from('tasks').update({
        status: 'shipped',
        completed_at: new Date().toISOString()
      }).eq('id', linkedTaskId)
      toast.success('Task marked as done!')
      window.dispatchEvent(new CustomEvent('task-updated'))
      handleComplete()
    } catch (e: any) {
      toast.error('Failed to update task')
    }
  }

  // Listen to toggle-focus-timer events across the app
  useEffect(() => {
    const handleToggle = (e: any) => {
      setIsOpen(true)
      setIsExpanded(true)
      const minutes = e.detail?.timeBox ? Number(e.detail.timeBox) : 25
      setInitialMinutes(minutes)
      setTimeLeft(minutes * 60)
      if (e.detail?.taskId) {
        setLinkedTaskId(e.detail.taskId)
        setLinkedTaskTitle(e.detail.taskTitle || 'Focus Sprint')
      } else {
        setLinkedTaskId(null)
        setLinkedTaskTitle('Deep Work Session')
      }
    }
    window.addEventListener('toggle-focus-timer', handleToggle)
    return () => window.removeEventListener('toggle-focus-timer', handleToggle)
  }, [])

  // Timer Tick
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

  const setDuration = (mins: number) => {
    setInitialMinutes(mins)
    setTimeLeft(mins * 60)
    setIsActive(false)
  }

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseInt(customInput)
    if (!isNaN(val) && val > 0 && val <= 360) {
      setDuration(val)
      setCustomInput('')
      setShowSettings(false)
    } else {
      toast.error('Please enter a duration between 1 and 360 minutes')
    }
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const totalSeconds = initialMinutes * 60
  const elapsedSeconds = Math.max(0, totalSeconds - timeLeft)
  const progressRatio = totalSeconds > 0 ? Math.min(1, Math.max(0, elapsedSeconds / totalSeconds)) : 0
  const progressPercent = Math.round(progressRatio * 100)
  const radius = 135
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progressRatio)

  if (!isOpen) return null

  return (
    <>
      {/* Floating Bottom Pill (Minimized View) */}
      {!isExpanded && !zenMode && (
        <div 
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-black/[0.1] rounded-full px-5 py-2.5 flex items-center gap-3.5 z-50 cursor-pointer shadow-xl font-sans hover:shadow-2xl transition-all"
        >
          <span className={cn(
            'w-2.5 h-2.5 rounded-full',
            isActive ? 'bg-black animate-ping' : 'bg-neutral-400'
          )} />
          <span className="font-mono text-sm font-semibold text-black">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-xs text-neutral-600 truncate max-w-[160px] font-medium">
            {linkedTaskTitle || 'Focus Sprint'}
          </span>
          {brownNoiseActive && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Radio size={10} className="animate-pulse" />
              <span>Brown Noise</span>
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setZenMode(true)
            }}
            className="p-1 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors ml-1"
            title="Open Pure Fullscreen Timer"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      )}

      {/* Expanded Focus Modal */}
      {isExpanded && !zenMode && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-neutral-200 shadow-2xl p-6 sm:p-10 relative overflow-hidden">
            {/* Top Bar with Controls */}
            <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-wider">
                <Clock size={14} className="text-neutral-600" />
                <span>Focus Sprint</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZenMode(true)}
                  className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:text-black hover:bg-neutral-50 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Open Pure Fullscreen Timer"
                >
                  <Maximize2 size={14} />
                  <span className="hidden sm:inline">Pure Timer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn(
                    'p-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5',
                    showSettings 
                      ? 'bg-black text-white border-black' 
                      : 'border-neutral-200 text-neutral-600 hover:text-black hover:bg-neutral-50'
                  )}
                  title="Customize timebox & audio"
                >
                  <Sliders size={14} />
                  <span className="hidden sm:inline">Settings</span>
                </button>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                  title="Minimize"
                >
                  <Minimize2 size={16} />
                </button>
                <button 
                  onClick={() => {
                    setIsActive(false)
                    setBrownNoiseActive(false)
                    setIsOpen(false)
                  }}
                  className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Close timer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Task Title Context */}
            <div className="text-center pt-6 pb-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 line-clamp-2">
                {linkedTaskTitle || 'Deep Work Sprint'}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Single-task execution. Eliminate noise.
              </p>
            </div>

            {/* Custom Settings Panel (Collapsible) */}
            {showSettings && (
              <div className="my-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-4 animate-in fade-in duration-150">
                {/* Duration Presets */}
                <div>
                  <div className="text-xs font-medium text-neutral-700 mb-2">Duration Presets</div>
                  <div className="flex flex-wrap gap-2">
                    {[15, 25, 45, 60, 90].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDuration(m)}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer',
                          initialMinutes === m && !isActive
                            ? 'bg-black text-white border-black'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:border-black/30'
                        )}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Minutes Input */}
                <form onSubmit={handleApplyCustom} className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Custom minutes (e.g. 35)"
                    min="1"
                    max="360"
                    className="flex-1 px-3.5 py-1.5 bg-white border border-neutral-200 focus:border-black rounded-xl text-xs text-black outline-none font-normal"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    Set
                  </button>
                </form>

                {/* Brown Noise Toggle & Volume */}
                <div className="pt-3 border-t border-neutral-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio size={14} className={brownNoiseActive ? 'text-amber-600' : 'text-neutral-400'} />
                      <span className="text-xs font-medium text-neutral-800">Brown Noise for Focus</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBrownNoiseActive(!brownNoiseActive)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer',
                        brownNoiseActive
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                      )}
                    >
                      {brownNoiseActive ? 'Active' : 'Turn On'}
                    </button>
                  </div>

                  {brownNoiseActive && (
                    <div className="flex items-center gap-3 pt-1">
                      <Volume2 size={13} className="text-neutral-400 shrink-0" />
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={noiseVolume}
                        onChange={(e) => setNoiseVolume(parseFloat(e.target.value))}
                        className="w-full accent-black cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-neutral-500 shrink-0 w-8">
                        {Math.round(noiseVolume * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Giant Timer Display */}
            <div className="text-center my-8">
              <div className="text-7xl sm:text-8xl font-extralight font-mono text-neutral-950 tracking-tighter select-none">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </div>
            </div>

            {/* Quick Brown Noise Toggle Button in Main View */}
            <div className="flex justify-center mb-8">
              <button
                type="button"
                onClick={() => setBrownNoiseActive(!brownNoiseActive)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-all cursor-pointer',
                  brownNoiseActive
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                    : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-600'
                )}
              >
                <Radio size={13} className={brownNoiseActive ? 'text-amber-600 animate-pulse' : 'text-neutral-400'} />
                <span>{brownNoiseActive ? 'Brown Noise: Playing' : 'Play Brown Noise'}</span>
              </button>
            </div>

            {/* Play / Pause / Reset Controls */}
            <div className="flex justify-center items-center gap-4">
              <button 
                onClick={() => {
                  if (!isActive) playChime('start')
                  setIsActive(!isActive)
                }}
                className="w-16 h-16 rounded-full bg-black hover:bg-neutral-800 text-white flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-95"
                title={isActive ? 'Pause' : 'Start'}
              >
                {isActive ? <Pause size={24} fill="#fff" /> : <Play size={24} fill="#fff" className="ml-1" />}
              </button>

              <button 
                onClick={() => {
                  setIsActive(false)
                  setTimeLeft(initialMinutes * 60)
                }}
                className="w-12 h-12 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center cursor-pointer transition-colors text-xs font-medium"
                title="Reset timer"
              >
                Reset
              </button>

              {linkedTaskId && (
                <button
                  type="button"
                  onClick={handleMarkTaskShipped}
                  className="h-12 px-4 rounded-full bg-black hover:bg-neutral-800 text-white flex items-center gap-2 cursor-pointer transition-colors text-xs font-medium"
                  title="Mark linked task as done"
                >
                  <CheckCircle2 size={16} className="text-white" />
                  <span>Mark Done</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Pure Timer Screen (Only Timer, Progress Circle, and Pure Focus) */}
      {zenMode && (
        <div className="fixed inset-0 z-[100] bg-[#07080b] text-white flex flex-col justify-between p-6 sm:p-12 animate-fadeIn font-sans selection:bg-white/10">
          {/* Subtle Ambient Backlight Glow centered on the timer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-white/[0.04] via-white/[0.02] to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar: Minimal context & Exit */}
          <div className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn(
                "w-2.5 h-2.5 rounded-full",
                isActive ? "bg-white animate-ping" : "bg-neutral-600"
              )} />
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                {linkedTaskTitle || 'Pure Focus Session'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZenMode(false)}
                className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-xs font-medium text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                title="Exit Pure Timer View"
              >
                <Minimize2 size={13} />
                <span>Exit Pure Mode</span>
              </button>
            </div>
          </div>

          {/* Center: The Hypnotic Circular Progress Ring & Numbers */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center">
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
              {/* SVG Circular Progress Track */}
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 320 320">
                {/* Background Ring Track */}
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  className="stroke-white/[0.06]"
                  strokeWidth="7"
                  fill="transparent"
                />
                {/* Dynamic Active Progress Ring */}
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-[stroke-dashoffset] duration-700 ease-linear"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#9ca3af" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Inside the Circle: Giant Digit Display & Progress */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-7xl sm:text-8xl font-extralight font-mono text-white tracking-tighter select-none">
                  {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-xs font-mono text-neutral-300 font-medium tracking-widest mt-2 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>{progressPercent}% Elapsed</span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500 mt-1">
                  {Math.round(elapsedSeconds / 60)}m of {initialMinutes}m
                </div>
              </div>
            </div>

            {/* Presets Row */}
            <div className="flex items-center gap-2 mt-8">
              {[15, 25, 45, 60, 90].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDuration(m)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer',
                    initialMinutes === m && !isActive
                      ? 'bg-white text-black font-semibold shadow-xs'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/[0.08]'
                  )}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Bar: Action Controls & Brown Noise */}
          <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  if (!isActive) playChime('start')
                  setIsActive(!isActive)
                }}
                className="w-16 h-16 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center cursor-pointer shadow-xl transition-transform active:scale-95"
                title={isActive ? 'Pause' : 'Start'}
              >
                {isActive ? <Pause size={24} fill="#000" /> : <Play size={24} fill="#000" className="ml-1" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsActive(false)
                  setTimeLeft(initialMinutes * 60)
                }}
                className="w-12 h-12 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors text-xs font-medium border border-white/[0.1]"
                title="Reset timer"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => setBrownNoiseActive(!brownNoiseActive)}
                className={cn(
                  'h-12 px-4 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer',
                  brownNoiseActive
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-xs'
                    : 'bg-white/[0.04] border-white/[0.08] text-neutral-400 hover:text-white'
                )}
                title="Toggle Brown Noise"
              >
                <Radio size={14} className={brownNoiseActive ? 'text-amber-400 animate-pulse' : 'text-neutral-500'} />
                <span>{brownNoiseActive ? 'Brown Noise ON' : 'Brown Noise'}</span>
              </button>

              {linkedTaskId && (
                <button
                  type="button"
                  onClick={handleMarkTaskShipped}
                  className="h-12 px-4 rounded-full bg-white hover:bg-neutral-200 text-black border border-white flex items-center gap-2 cursor-pointer transition-colors text-xs font-medium"
                >
                  <CheckCircle2 size={16} className="text-black" />
                  <span>Done</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
