'use client'

import React, { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GameTutorialModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateMaster?: () => void
}

export function GameTutorialModal({ isOpen, onClose, onCreateMaster }: GameTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1)
    }
  }, [isOpen])

  if (!isOpen) return null

  const steps = [
    {
      id: 1,
      name: 'Master Projects',
      tag: 'Portfolio Scope',
    },
    {
      id: 2,
      name: 'Deliverable Projects',
      tag: 'Milestone Scope',
    },
    {
      id: 3,
      name: 'Execution Tasks',
      tag: 'Action Units',
    },
    {
      id: 4,
      name: 'Autonomous Systems',
      tag: 'Sync & AI',
    },
  ]

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fadeIn font-sans">
      <div 
        className="relative w-full max-w-2xl bg-white border border-black/[0.08] rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Header */}
        <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-neutral-400 tracking-wider uppercase block">
              System Architecture &bull; 0{currentStep} of 0{steps.length}
            </span>
            <h3 className="text-base font-normal text-black mt-0.5">
              Operating Manual
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-black/[0.08] hover:bg-neutral-50 text-neutral-400 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X size={14} />
          </button>
        </div>

        {/* Minimal Stepper Bar */}
        <div className="grid grid-cols-4 border-b border-black/[0.06] bg-[#fafafa]">
          {steps.map((s) => {
            const isActive = currentStep === s.id
            const isCompleted = currentStep > s.id
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={cn(
                  'px-4 py-3 text-left transition-all border-b-2 cursor-pointer',
                  isActive
                    ? 'border-black bg-white text-black'
                    : isCompleted
                    ? 'border-neutral-300 text-neutral-600'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                )}
              >
                <div className="text-[10px] font-mono text-neutral-400">
                  0{s.id}
                </div>
                <div className="text-xs font-normal truncate mt-0.5">
                  {s.name}
                </div>
              </button>
            )
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white">

          {/* STEP 1: MASTER PROJECTS */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                  Level 1: High-Level Portfolios
                </span>
                <h2 className="text-xl font-normal text-black">
                  What is a Master Project?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
                  A Master Project serves as the highest-level operational umbrella for an entire business entity, creative channel, or venture. It houses multiple distinct projects, keeping documents, deliverables, and metrics strictly separated.
                </p>
              </div>

              {/* Minimal Clean Visual Breakdown */}
              <div className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-4">
                <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                  Structure Overview
                </div>

                <div className="p-4 rounded-xl bg-white border border-black/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-black">Studio Channel</div>
                      <div className="text-[11px] text-neutral-400 font-light">Main creator brand &amp; media operations</div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 border border-black/[0.08] px-2 py-0.5 rounded">
                      Master Portfolio
                    </span>
                  </div>

                  <div className="pt-3 border-t border-black/[0.06] grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-neutral-50 text-[11px] font-mono text-neutral-600">
                      Weekly Episodes
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-50 text-[11px] font-mono text-neutral-600">
                      Brand Deals
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-50 text-[11px] font-mono text-neutral-600">
                      Apparel Drops
                    </div>
                  </div>
                </div>

                <div className="text-xs text-neutral-500 font-light leading-relaxed pt-1">
                  <strong>When to create one:</strong> Create one Master Project for each separate brand or business you operate (e.g., your YouTube studio, e-commerce brand, or advisory practice).
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PROJECTS */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                  Level 2: Scoped Deliverables
                </span>
                <h2 className="text-xl font-normal text-black">
                  What is a Project?
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
                  A Project is a finite, deliverable-driven initiative with a clear objective and completion criteria. Unlike ongoing master portfolios, projects have defined milestones, deadlines, and completion percentages.
                </p>
              </div>

              {/* Minimal Clean Visual Breakdown */}
              <div className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-4">
                <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                  Deliverable Hierarchy
                </div>

                <div className="space-y-2">
                  <div className="p-3.5 rounded-xl bg-white border border-black/[0.08] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-black">Q3 Brand Partnership Campaign</div>
                      <div className="text-[11px] text-neutral-400 font-light">Sponsored integration &amp; deliverable timeline</div>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <span className="text-neutral-900 font-medium">80%</span>
                      <span className="text-neutral-400 block text-[10px]">4 of 5 Tasks</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-black/[0.08] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-black">Portfolio Site Redesign</div>
                      <div className="text-[11px] text-neutral-400 font-light">Interactive case studies and booking form</div>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <span className="text-neutral-900 font-medium">35%</span>
                      <span className="text-neutral-400 block text-[10px]">2 of 6 Tasks</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-neutral-500 font-light leading-relaxed pt-1">
                  <strong>Each project contains:</strong> A dedicated interactive whiteboard canvas, living documentation specs, milestone progress tracking, and linked tasks.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TASKS */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                  Level 3: Granular Action Units
                </span>
                <h2 className="text-xl font-normal text-black">
                  How Tasks are Assigned and Executed
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
                  Tasks represent the specific, indivisible actions required to move projects forward. Tasks are tied directly to parent projects and carry prioritized execution rankings.
                </p>
              </div>

              {/* Minimal Clean Visual Breakdown */}
              <div className="p-5 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-4">
                <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                  Task Workflow &amp; Priority System
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-black/[0.08] space-y-1">
                    <div className="text-[11px] font-mono text-neutral-400">1. Assignment</div>
                    <div className="text-xs font-medium text-black">Link to Project</div>
                    <p className="text-[11px] text-neutral-400 font-light">
                      Every task connects to a parent project to update velocity automatically.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-black/[0.08] space-y-1">
                    <div className="text-[11px] font-mono text-neutral-400">2. Priority</div>
                    <div className="text-xs font-medium text-black">P0 to P3 Urgency</div>
                    <p className="text-[11px] text-neutral-400 font-light">
                      P0 items isolate blockers and surface directly in your daily agenda and focus dock.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-black/[0.08] space-y-1">
                    <div className="text-[11px] font-mono text-neutral-400">3. Resolution</div>
                    <div className="text-xs font-medium text-black">Ship &amp; Log Metrics</div>
                    <p className="text-[11px] text-neutral-400 font-light">
                      Marking tasks shipped advances your project progress and records streak data.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-black/[0.08] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-100 text-neutral-700 rounded">
                        P0 Critical
                      </span>
                      <span className="text-xs font-medium text-black">Export final color grade deliverable</span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-light block">
                      Assigned to: Q3 Brand Partnership Campaign
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500">
                    25m Sprint
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AUTONOMOUS SYSTEMS & AI */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                  Level 4: Execution &amp; Integration
                </span>
                <h2 className="text-xl font-normal text-black">
                  Autonomous Context &amp; Deep Work
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
                  Focus operates as an integrated system designed for high-output solo operators. Connect your calendar, synchronize meeting insights, and connect your favorite chat interfaces.
                </p>
              </div>

              {/* Three Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-1.5">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">Focus Timer</div>
                  <div className="text-xs font-medium text-black">Pomodoro Dock</div>
                  <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
                    Integrated 25-minute deep work intervals accessible directly from the bottom dock across any view.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-1.5">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">Shipping Metrics</div>
                  <div className="text-xs font-medium text-black">Streak Matrix</div>
                  <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
                    Automated daily execution tracking and annual velocity grid to reinforce continuous delivery.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/[0.06] space-y-1.5">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">OpenAPI Hub</div>
                  <div className="text-xs font-medium text-black">Claude &amp; ChatGPT</div>
                  <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
                    Exposes real-time workspace context so your AI chatbots know your exact active tasks and deadlines.
                  </p>
                </div>
              </div>

              {/* Ready prompt */}
              <div className="p-4 rounded-2xl bg-neutral-900 text-white flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium">Ready to initialize your workspace?</div>
                  <div className="text-[11px] text-neutral-400 font-light">
                    Start by defining your primary Master Project name.
                  </div>
                </div>
                <button
                  onClick={handleFinish}
                  className="px-4 py-2 bg-white hover:bg-neutral-100 text-black text-xs font-normal rounded-xl transition-all cursor-pointer"
                >
                  Get Started &rarr;
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 sm:px-8 py-4 bg-white border-t border-black/[0.06] flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-black disabled:opacity-25 disabled:pointer-events-none cursor-pointer font-light transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            {steps.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'h-1 rounded-full transition-all',
                  currentStep === s.id ? 'w-5 bg-black' : 'w-1.5 bg-neutral-200'
                )}
              />
            ))}
          </div>

          <div>
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer"
              >
                <span>Finish</span>
                <Check size={13} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default GameTutorialModal

