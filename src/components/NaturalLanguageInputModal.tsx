'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, ArrowRight, Check, X, Layers, Clock, AlertTriangle, 
  HelpCircle, CheckSquare, Plus, Edit2, ListTree, User, ChevronDown, Flag, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { SynthesizedPlan, SynthesizedTaskItem } from '@/lib/ai/synthesizer'

interface NaturalLanguageInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const SAMPLE_PROMPTS = [
  {
    title: 'Client CRM & E-Commerce Proposal',
    text: "For the client CRM project, we need to finish the production demo by tomorrow, prepare the three package options with Standard, Gold and Premium pricing, calculate technology costs, estimate development hours for each package, prepare the client-facing timeline, and send everything to Ismail before the 1:30 PM discussion. The e-commerce demo also needs to be prepared using the existing codebase and 2–4 of the client's products."
  },
  {
    title: 'Follow-up with Ismail',
    text: "Follow up with Ismail about the CRM costing if he hasn't responded by tomorrow afternoon."
  }
]

export default function NaturalLanguageInputModal({
  isOpen,
  onClose,
  onSuccess
}: NaturalLanguageInputModalProps) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [plan, setPlan] = useState<SynthesizedPlan | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Record<string, boolean>>({})
  const [editingTask, setEditingTask] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSynthesize() {
    if (!input.trim()) {
      toast.error('Please enter what needs to get done')
      return
    }

    setIsSynthesizing(true)
    try {
      const res = await fetch('/api/ai/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim() })
      })

      const data = await res.json()
      if (data.success && data.plan) {
        setPlan(data.plan)
        const initialSelected: Record<string, boolean> = {}
        data.plan.tasks.forEach((t: SynthesizedTaskItem) => {
          initialSelected[t.id] = true
        })
        setSelectedTaskIds(initialSelected)
        toast.success('Decomposed into structured plan!')
      } else {
        toast.error(data.error || 'Failed to synthesize plan')
      }
    } catch (err: any) {
      toast.error(`Synthesis error: ${err.message}`)
    } finally {
      setIsSynthesizing(false)
    }
  }

  async function handleCommit() {
    if (!plan) return

    setIsCommitting(true)
    try {
      const selectedIds = Object.keys(selectedTaskIds).filter(id => selectedTaskIds[id])
      const res = await fetch('/api/ai/commit-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          selectedTaskIds: selectedIds
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Created ${data.mode === 'project_with_phases' ? 'Project &' : ''} ${data.tasks_count} tasks!`)
        onClose()
        if (onSuccess) onSuccess()
        if (data.project_id) {
          router.push(`/projects/${data.project_id}`)
        } else {
          router.push('/tasks')
        }
      } else {
        toast.error(data.error || 'Failed to commit plan')
      }
    } catch (err: any) {
      toast.error(`Commit error: ${err.message}`)
    } finally {
      setIsCommitting(false)
    }
  }

  function toggleTaskSelection(id: string) {
    setSelectedTaskIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const selectedCount = Object.values(selectedTaskIds).filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn font-sans">
      <div className="bg-white border border-black/[0.08] rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden font-body">
        {/* Header */}
        <div className="p-6 border-b border-black/[0.06] flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-xs font-mono text-[#6b7280] uppercase tracking-wider font-light">
                EXECUTIVE SYNTHESIS ENGINE
              </div>
              <h2 className="text-base font-normal text-black tracking-tight">
                {plan ? 'Review & Confirm Staged Execution Plan' : 'What needs to get done?'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#9ca3af] hover:text-black hover:bg-black/[0.04] rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fbfbfd]">
          {!plan ? (
            /* Input View */
            <div className="space-y-5">
              <div>
                <label className="text-xs font-mono text-[#6b7280] uppercase tracking-wider block mb-2 font-light">
                  TYPE OR PASTE YOUR NATURAL LANGUAGE DIRECTIVE
                </label>
                <textarea
                  rows={6}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. For the client CRM project, we need to finish the production demo by tomorrow, prepare the three package options with Standard, Gold and Premium pricing, estimate development hours, and send everything to Ismail before 1:30 PM..."
                  className="w-full p-4 bg-white border border-black/[0.1] focus:border-black rounded-2xl text-sm text-black placeholder:text-[#9ca3af] outline-none shadow-sm resize-none font-light leading-relaxed transition-all"
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      handleSynthesize()
                    }
                  }}
                />
              </div>

              {/* Sample Prompts */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider block">
                  TRY AN EXAMPLE DIRECTIVE
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(sample.text)}
                      className="px-3.5 py-2 bg-white hover:bg-black/[0.03] border border-black/[0.08] rounded-xl text-xs text-black font-light text-left transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                    >
                      <Sparkles size={12} className="text-indigo-600" />
                      <span>{sample.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] text-xs text-[#6b7280] font-light leading-relaxed space-y-1">
                <span className="text-black font-normal block">How the Executive OS works:</span>
                <p>• <strong>Explicit items</strong> are converted to core deliverables.</p>
                <p>• <strong>Logical dependencies</strong> are deduced without inventing fake data.</p>
                <p>• <strong>Staged for confirmation:</strong> You inspect and approve all phases, tasks, and assignees before anything is committed to your workspace.</p>
              </div>
            </div>
          ) : (
            /* Staging & Confirmation Screen */
            <div className="space-y-6">
              {/* Understood Blueprint Summary Banner */}
              <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase bg-indigo-50 text-indigo-700">
                      {plan.mode === 'project_with_phases' ? 'MULTI-PHASE PROJECT' : 'TARGETED TASK / FOLLOW-UP'}
                    </span>
                    <span className="text-xs font-mono text-[#9ca3af]">•</span>
                    <span className="text-xs font-mono text-[#6b7280]">
                      Deadline: <strong className="text-black">{plan.deadline_label || 'Flexible'}</strong>
                    </span>
                    <span className="text-xs font-mono text-[#9ca3af]">•</span>
                    <span className="text-xs font-mono text-[#6b7280]">
                      Priority: <strong className="text-black uppercase">{plan.priority}</strong>
                    </span>
                  </div>

                  <span className="text-xs font-mono text-emerald-600 font-medium">
                    {selectedCount} of {plan.tasks.length} deliverables selected
                  </span>
                </div>

                <div className="text-lg font-normal text-black tracking-tight">
                  {plan.project_name}
                </div>
                <p className="text-xs text-[#6b7280] font-light leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Tasks Matrix Grouped by Phase */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block font-light">
                    STRUCTURED WORKSTREAMS & DELIVERABLES MATRIX
                  </span>
                  <button
                    onClick={() => {
                      const allSelected = plan.tasks.every(t => selectedTaskIds[t.id])
                      const nextState: Record<string, boolean> = {}
                      plan.tasks.forEach(t => {
                        nextState[t.id] = !allSelected
                      })
                      setSelectedTaskIds(nextState)
                    }}
                    className="text-xs font-mono text-indigo-600 hover:underline cursor-pointer font-light"
                  >
                    Toggle All
                  </button>
                </div>

                {/* Phased Breakdown */}
                {plan.phases.map((phase) => {
                  const phaseTasks = plan.tasks.filter(t => t.phase === phase.name)
                  if (phaseTasks.length === 0) return null

                  return (
                    <div key={phase.id} className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between pb-1 border-b border-black/[0.04]">
                        <div className="flex items-center gap-2">
                          <Layers size={13} className="text-black" />
                          <span className="text-xs font-mono font-medium text-black uppercase tracking-wide">
                            {phase.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#9ca3af]">
                          {phaseTasks.length} tasks
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {phaseTasks.map((task) => {
                          const isSelected = selectedTaskIds[task.id] !== false
                          return (
                            <div
                              key={task.id}
                              className={cn(
                                'p-3 rounded-xl border transition-all flex items-center justify-between gap-3',
                                isSelected
                                  ? 'bg-[#fafbff] border-black/[0.08]'
                                  : 'bg-white border-black/[0.04] opacity-50'
                              )}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleTaskSelection(task.id)}
                                  className="w-4 h-4 rounded accent-black cursor-pointer"
                                />

                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <div className="text-xs font-normal text-black truncate">
                                    {task.title}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#9ca3af]">
                                    {task.assignee && (
                                      <span className="text-black">@{task.assignee}</span>
                                    )}
                                    {task.due_date_label && (
                                      <span>• {task.due_date_label}</span>
                                    )}
                                    {task.dependencies.length > 0 && (
                                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                                        Dep: {task.dependencies.join(', ')}
                                      </span>
                                    )}
                                    <span className={cn(
                                      'px-1.5 py-0.2 rounded uppercase font-medium',
                                      task.confidence === 'implied' ? 'bg-amber-100 text-amber-800' : 'bg-black/[0.04] text-[#6b7280]'
                                    )}>
                                      {task.confidence === 'implied' ? 'Implied' : 'Explicit'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <span className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-mono uppercase font-medium',
                                task.priority === 'p0' ? 'bg-red-50 text-red-600' :
                                task.priority === 'p1' ? 'bg-amber-50 text-amber-600' :
                                'bg-black/[0.04] text-[#6b7280]'
                              )}>
                                {task.priority}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Clarifications & Blind Spots */}
              {plan.clarifications_needed.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-medium text-xs">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Clarifications & Blind Spots Detected</span>
                  </div>
                  <ul className="space-y-1">
                    {plan.clarifications_needed.map((item, idx) => (
                      <li key={idx} className="text-xs text-amber-950 font-light flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Backlog Ideas */}
              {plan.backlog_ideas.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-2">
                  <span className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider block">
                    FUTURE BACKLOG IDEAS (NOT IN ACTIVE SPRINT)
                  </span>
                  <ul className="space-y-1">
                    {plan.backlog_ideas.map((item, idx) => (
                      <li key={idx} className="text-xs text-[#6b7280] font-light flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-black/[0.06] flex items-center justify-between bg-white flex-shrink-0">
          {!plan ? (
            <>
              <span className="text-[11px] font-mono text-[#9ca3af]">
                Press <strong>⌘ + Enter</strong> to synthesize
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-black transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSynthesize}
                  disabled={isSynthesizing || !input.trim()}
                  className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSynthesizing ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Decomposing Blueprint...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Synthesize Plan</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setPlan(null)}
                className="px-4 py-2 text-xs text-[#6b7280] hover:text-black transition-colors cursor-pointer font-light"
              >
                ← Edit Directive Input
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-black transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={handleCommit}
                  disabled={isCommitting || selectedCount === 0}
                  className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isCommitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Committing to Database...</span>
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      <span>{plan.mode === 'project_with_phases' ? `Create Project & ${selectedCount} Tasks` : `Create ${selectedCount} Tasks`}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
