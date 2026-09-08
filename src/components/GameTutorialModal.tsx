'use client'

import React, { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, CheckCircle2, Target, FolderKanban, ListTodo, Flame, Timer, Sparkles, Building2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GameTutorialModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateMaster?: () => void
}

export default function GameTutorialModal({ isOpen, onClose, onCreateMaster }: GameTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [taskDemoShipped, setTaskDemoShipped] = useState(false)
  const [demoProgress, setDemoProgress] = useState(60)

  useEffect(() => {
    if (isOpen) {
      // Reset interactive state when opened
      setTaskDemoShipped(false)
      setDemoProgress(60)
    }
  }, [isOpen])

  if (!isOpen) return null

  const steps = [
    {
      id: 1,
      title: 'Master Campaign',
      subtitle: 'The Umbrella Brand',
      badge: 'LEVEL 1: THE FOUNDATION',
      icon: Building2,
    },
    {
      id: 2,
      title: 'Project Missions',
      subtitle: 'Specific Deliverables',
      badge: 'LEVEL 2: ACTIVE MISSIONS',
      icon: FolderKanban,
    },
    {
      id: 3,
      title: 'Quest Tasks',
      subtitle: 'Assign & Ship',
      badge: 'LEVEL 3: ACTION STEPS',
      icon: ListTodo,
    },
    {
      id: 4,
      title: 'Solo Power-Ups',
      subtitle: 'Timer, Streak & AI',
      badge: 'LEVEL 4: DAILY EXECUTION',
      icon: Sparkles,
    },
  ]

  function handleShipTaskDemo() {
    setTaskDemoShipped(true)
    setDemoProgress(100)
  }

  function handleFinish() {
    try {
      localStorage.setItem('focus_game_tutorial_completed', 'true')
    } catch (e) {}
    onClose()
    if (onCreateMaster) {
      onCreateMaster()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn font-sans">
      <div 
        className="relative w-full max-w-3xl bg-white border border-black/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Video Game HUD Header */}
        <div className="px-6 py-4 bg-[#0c0d0f] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400">
              <Target size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
                  SOLO OS FIELD GUIDE
                </span>
                <span className="text-white/30 text-xs">•</span>
                <span className="text-[10px] font-mono text-white/60 uppercase">
                  STEP {currentStep} OF {steps.length}
                </span>
              </div>
              <h3 className="text-sm font-medium tracking-tight text-white">
                How Focus Works (In 60 Seconds)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close tutorial"
          >
            <X size={15} />
          </button>
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-4 border-b border-black/[0.06] bg-[#fafafa]">
          {steps.map((s) => {
            const Icon = s.icon
            const isActive = currentStep === s.id
            const isCompleted = currentStep > s.id
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={cn(
                  'px-3 py-3 text-left transition-all border-b-2 cursor-pointer flex flex-col justify-between gap-1',
                  isActive
                    ? 'border-black bg-white shadow-xs'
                    : isCompleted
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
                    : 'border-transparent text-[#9ca3af] hover:text-black hover:bg-black/[0.02]'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={cn('text-[9px] font-mono font-semibold', isActive ? 'text-black' : isCompleted ? 'text-emerald-700' : 'text-[#9ca3af]')}>
                    LVL 0{s.id}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 size={12} className="text-emerald-600" />
                  ) : (
                    <Icon size={12} className={isActive ? 'text-black' : 'text-[#9ca3af]'} />
                  )}
                </div>
                <div className="text-xs font-medium truncate hidden sm:block">
                  {s.title}
                </div>
              </button>
            )
          })}
        </div>

        {/* Main Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-gradient-to-b from-white to-[#fafafa]">
          
          {/* ========================================================================= */}
          {/* STEP 1: MASTER CAMPAIGN                                                   */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-mono text-[10px] uppercase font-bold tracking-wider">
                  STEP 1: THE UMBRELLA
                </span>
                <h2 className="text-2xl font-light text-black tracking-tight">
                  What is a <span className="font-semibold text-black">Master Project</span>?
                </h2>
                <p className="text-sm text-[#4b5563] leading-relaxed max-w-xl font-light">
                  Think of this as your <strong>Main Campaign</strong> or umbrella business. If you run a YouTube channel, a clothing brand, and client freelancing, each one is a separate Master Project.
                </p>
                <p className="text-xs text-[#6b7280] font-light">
                  It keeps all your work clean. No client tasks leak into your YouTube videos.
                </p>
              </div>

              {/* Video Game Zoom-in Simulation */}
              <div className="relative p-6 rounded-3xl bg-[#0c0d0f] text-white overflow-hidden shadow-xl border border-black/20">
                <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>ZOOM-IN VIEW: YOUR MASTER CAMPAIGN CARD</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Simulated Zoom-In Card */}
                  <div className="p-5 rounded-2xl bg-white text-black border-2 border-emerald-500 shadow-2xl scale-[1.02] transform transition-transform relative ring-4 ring-emerald-500/20">
                    <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-mono uppercase font-bold tracking-wider">
                      ★ Active Campaign
                    </div>
                    <span className="text-[9px] font-mono text-emerald-700 uppercase font-bold tracking-wider">
                      MASTER CAMPAIGN
                    </span>
                    <h3 className="text-base font-semibold text-black mt-1">
                      YouTube Studio 🎙️
                    </h3>
                    <p className="text-[11px] text-[#6b7280] mt-0.5">
                      Main creator channel, weekly uploads, and sponsorships.
                    </p>

                    <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs font-mono">
                      <span className="text-[#6b7280]">3 Active Projects</span>
                      <span className="text-emerald-700 font-bold">75% Complete</span>
                    </div>
                  </div>

                  {/* Gamer Tip Box */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-amber-300 uppercase tracking-wider font-semibold">
                        QUICK RULE OF THUMB
                      </span>
                      <p className="text-xs text-white/80 leading-relaxed font-light">
                        Create <strong>1 Master Project</strong> for each distinct business or creative brand you operate.
                      </p>
                    </div>
                    <div className="text-[11px] font-mono text-white/60 space-y-1">
                      <div>• YouTube Channel</div>
                      <div>• Clothing Brand</div>
                      <div>• Freelance Studio</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PROJECT MISSIONS                                                  */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-950 font-mono text-[10px] uppercase font-bold tracking-wider">
                  STEP 2: THE MISSIONS
                </span>
                <h2 className="text-2xl font-light text-black tracking-tight">
                  What is a <span className="font-semibold text-black">Project</span>?
                </h2>
                <p className="text-sm text-[#4b5563] leading-relaxed max-w-xl font-light">
                  A Project is a <strong>specific mission or launch</strong> under that campaign. While your Master Campaign lasts forever, a project has a concrete finish line.
                </p>
                <p className="text-xs text-[#6b7280] font-light">
                  Examples: <em>Launch Spring Collection</em>, <em>Film 10 YouTube Shorts</em>, or <em>Redesign Portfolio Site</em>.
                </p>
              </div>

              {/* Video Game Zoom-in Simulation */}
              <div className="relative p-6 rounded-3xl bg-[#0c0d0f] text-white overflow-hidden shadow-xl border border-black/20">
                <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <span>ZOOM-IN VIEW: PROJECT MISSIONS UNDER YOUR CAMPAIGN</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white text-black border-2 border-blue-500 shadow-xl scale-[1.03] transition-transform">
                    <span className="text-[9px] font-mono text-blue-600 font-bold uppercase">
                      MISSION 01
                    </span>
                    <h4 className="text-xs font-semibold mt-1 truncate">
                      Film 5-Part AI Series
                    </h4>
                    <p className="text-[10px] text-[#6b7280] mt-0.5 line-clamp-1 font-light">
                      Scripts, camera shoot, and edits.
                    </p>
                    <div className="mt-3 pt-2 border-t border-black/[0.06] flex items-center justify-between text-[10px] font-mono">
                      <span>4/5 Tasks</span>
                      <span className="text-emerald-700 font-bold">80%</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-white/80">
                    <span className="text-[9px] font-mono text-white/50 uppercase">
                      MISSION 02
                    </span>
                    <h4 className="text-xs font-medium mt-1 truncate">
                      Sponsor Pitch Deck
                    </h4>
                    <p className="text-[10px] text-white/50 mt-0.5 line-clamp-1 font-light">
                      Media kit and rates for Q2.
                    </p>
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/60">
                      <span>1/3 Tasks</span>
                      <span>33%</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-white/80">
                    <span className="text-[9px] font-mono text-white/50 uppercase">
                      MISSION 03
                    </span>
                    <h4 className="text-xs font-medium mt-1 truncate">
                      Merch Store Rebrand
                    </h4>
                    <p className="text-[10px] text-white/50 mt-0.5 line-clamp-1 font-light">
                      New hoodies and shop layout.
                    </p>
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/60">
                      <span>0/4 Tasks</span>
                      <span>0%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="text-[11px] font-mono text-white/60">
                    Hierarchy: <strong>YouTube Studio</strong> (Master) → <strong>Film 5-Part Series</strong> (Project)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: TASKS ASSIGNMENT & SHIPPING                                       */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-950 font-mono text-[10px] uppercase font-bold tracking-wider">
                  STEP 3: ACTION STEPS
                </span>
                <h2 className="text-2xl font-light text-black tracking-tight">
                  How <span className="font-semibold text-black">Tasks</span> Work &amp; Assign
                </h2>
                <p className="text-sm text-[#4b5563] leading-relaxed max-w-xl font-light">
                  Tasks are your step-by-step checklist to finish the mission.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-black/[0.06]">
                    <strong>1. Assign:</strong> Pick the Project it belongs to.
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-black/[0.06]">
                    <strong>2. Priority:</strong> Set P0 (Urgent) to P3 (Normal).
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-black/[0.06]">
                    <strong>3. Ship:</strong> Complete it to fill your project bar.
                  </div>
                </div>
              </div>

              {/* Interactive Task Shipping Simulation */}
              <div className="relative p-6 rounded-3xl bg-[#0c0d0f] text-white overflow-hidden shadow-xl border border-black/20 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>INTERACTIVE DEMO: TRY SHIPPING A TASK BELOW</span>
                  </span>
                  <span className="text-white/60">
                    Project Progress: <strong className="text-emerald-400">{demoProgress}%</strong>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${demoProgress}%` }}
                  />
                </div>

                {/* Task Card Demo */}
                <div className={cn(
                  'p-4 sm:p-5 rounded-2xl transition-all border flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  taskDemoShipped 
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-white'
                    : 'bg-white text-black border-white shadow-2xl scale-[1.01]'
                )}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-mono font-bold">
                        P0 URGENT
                      </span>
                      <span className="text-[10px] font-mono text-[#6b7280]">
                        Assigned to: <strong>Film 5-Part Series</strong>
                      </span>
                    </div>
                    <div className={cn('text-sm font-semibold', taskDemoShipped ? 'text-emerald-300 line-through' : 'text-black')}>
                      Record final voiceover &amp; sound effects
                    </div>
                  </div>

                  <div>
                    {taskDemoShipped ? (
                      <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold">
                        <CheckCircle2 size={15} />
                        <span>SHIPPED! (+25 XP)</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleShipTaskDemo}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-md cursor-pointer whitespace-nowrap"
                      >
                        <Play size={13} />
                        <span>Click to Ship Task</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-mono text-white/50 text-center">
                  {taskDemoShipped 
                    ? '✨ Great job! In the real app, completing a task instantly updates your project completion rate.'
                    : '👆 Click the green button above to see what happens when you ship a task.'}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: SOLO POWER-UPS                                                    */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-950 font-mono text-[10px] uppercase font-bold tracking-wider">
                  STEP 4: DAILY EXECUTION
                </span>
                <h2 className="text-2xl font-light text-black tracking-tight">
                  Your <span className="font-semibold text-black">Solo Power-Ups</span>
                </h2>
                <p className="text-sm text-[#4b5563] leading-relaxed max-w-xl font-light">
                  Built specifically for solo creators and entrepreneurs to get work done without clutter.
                </p>
              </div>

              {/* Power-ups Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Pomodoro */}
                <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Timer size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-black">Focus Timer</h4>
                    <p className="text-[11px] text-[#6b7280] font-light mt-1">
                      Lock in with 25-minute Pomodoro sprints right from the bottom dock.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded-lg">
                    25m sprint // 5m rest
                  </div>
                </div>

                {/* 2. Daily Streaks */}
                <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Flame size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-black">Daily Streak</h4>
                    <p className="text-[11px] text-[#6b7280] font-light mt-1">
                      Ship at least 1 task every single day to build compounding momentum.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-amber-700 bg-amber-50/80 px-2 py-1 rounded-lg">
                    Tracked on your dashboard
                  </div>
                </div>

                {/* 3. AI Copilot */}
                <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-black">Context Copilot</h4>
                    <p className="text-[11px] text-[#6b7280] font-light mt-1">
                      Ask anything. It already knows your active campaigns, projects, and deadlines.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-purple-700 bg-purple-50/80 px-2 py-1 rounded-lg">
                    Available on ⌘K or AI tab
                  </div>
                </div>
              </div>

              {/* Ready to build callout */}
              <div className="p-5 rounded-2xl bg-black text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-medium">You&apos;re Ready to Build</h4>
                  <p className="text-xs text-white/70 font-light mt-0.5">
                    Start by naming your first Master Project (e.g. your main brand or channel).
                  </p>
                </div>
                <button
                  onClick={handleFinish}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
                >
                  Let&apos;s Start →
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-white border-t border-black/[0.06] flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6b7280] hover:text-black disabled:opacity-30 disabled:pointer-events-none cursor-pointer font-light"
          >
            <ArrowLeft size={13} />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            {steps.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  currentStep === s.id ? 'w-6 bg-black' : 'bg-black/20'
                )}
              />
            ))}
          </div>

          <div>
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer"
              >
                <span>Next Level</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
              >
                <span>Complete Tutorial</span>
                <CheckCircle2 size={14} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
