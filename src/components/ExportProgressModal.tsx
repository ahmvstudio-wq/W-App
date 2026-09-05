'use client'

import React, { useRef, useState, useMemo } from 'react'
import { toPng } from 'html-to-image'
import { 
  Download, X, Check, Sparkles, TrendingUp, CheckCircle2, 
  Clock, Flame, Target, Layers, Copy, Share2, Eye, Sun, Moon
} from 'lucide-react'
import { format, subDays, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'
import { toast } from 'sonner'

interface ExportProgressModalProps {
  tasks: Task[]
  onClose: () => void
}

export default function ExportProgressModal({ tasks, onClose }: ExportProgressModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [copied, setCopied] = useState(false)

  // Compute key execution metrics
  const metrics = useMemo(() => {
    const total = tasks.length
    const shipped = tasks.filter(t => t.status === 'shipped')
    const inProgress = tasks.filter(t => t.status === 'in_progress')
    const todo = tasks.filter(t => t.status === 'todo')
    const blocked = tasks.filter(t => t.status === 'blocked')
    const killed = tasks.filter(t => t.status === 'killed')

    const shippedCount = shipped.length
    const inProgressCount = inProgress.length
    const todoCount = todo.length
    const blockedCount = blocked.length
    const killedCount = killed.length

    const completionRate = total > 0 ? Math.round((shippedCount / total) * 100) : 0

    // Priority breakdown
    const p0Count = tasks.filter(t => t.priority === 'p0').length
    const p1Count = tasks.filter(t => t.priority === 'p1').length
    const p2Count = tasks.filter(t => t.priority === 'p2').length
    const p3Count = tasks.filter(t => t.priority === 'p3').length

    // Focus time
    const totalMinutes = tasks.reduce((sum, t) => {
      if (t.started_at && t.completed_at) {
        const diff = Math.round((new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 60000)
        if (diff > 0) return sum + diff
      }
      return sum + (t.time_box_minutes || 0)
    }, 0)
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10

    // 7-Day Velocity Trend
    const today = new Date()
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(today, 6 - i)
      const shippedOnDay = shipped.filter(t => {
        const dateStr = t.completed_at || t.updated_at || t.created_at
        return dateStr && isSameDay(new Date(dateStr), d)
      }).length
      return {
        dayLabel: format(d, 'EEE'),
        dateStr: format(d, 'MMM d'),
        count: shippedOnDay,
        isToday: i === 6
      }
    })

    // Project breakdown
    const projectMap: Record<string, { total: number; shipped: number }> = {}
    tasks.forEach(t => {
      const pName = t.project?.name || 'General'
      if (!projectMap[pName]) projectMap[pName] = { total: 0, shipped: 0 }
      projectMap[pName].total++
      if (t.status === 'shipped') projectMap[pName].shipped++
    })
    const projectBreakdown = Object.entries(projectMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)

    // Key Highlights: Recently shipped or high priority active
    const topDeliverables = tasks
      .filter(t => t.status === 'shipped' || t.status === 'in_progress')
      .slice(0, 5)

    return {
      total,
      shippedCount,
      inProgressCount,
      todoCount,
      blockedCount,
      killedCount,
      completionRate,
      p0Count,
      p1Count,
      p2Count,
      p3Count,
      totalHours,
      totalMinutes,
      last7Days,
      projectBreakdown,
      topDeliverables
    }
  }, [tasks])

  const handleDownload = async () => {
    if (!cardRef.current) return
    setIsExporting(true)
    try {
      // Use 2x pixel ratio for retina crystal clarity
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      })
      const link = document.createElement('a')
      link.download = `callmy-progress-${format(new Date(), 'yyyy-MM-dd')}.png`
      link.href = dataUrl
      link.click()
      toast.success('Progress report image downloaded!')
    } catch (err: any) {
      toast.error('Failed to export image: ' + (err.message || 'Unknown error'))
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopy = async () => {
    if (!cardRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      })
      
      // Convert dataUrl to blob
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob })
        ])
        setCopied(true)
        toast.success('Image copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      } else {
        // Fallback: download if clipboard API is not available
        const link = document.createElement('a')
        link.download = `callmy-progress-${format(new Date(), 'yyyy-MM-dd')}.png`
        link.href = dataUrl
        link.click()
        toast.success('Image downloaded (clipboard unavailable in browser)')
      }
    } catch (err: any) {
      toast.error('Copy failed: ' + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Modal Toolbar */}
        <div className="p-4 px-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white">
              <Sparkles size={16} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <span>Export Progress Snapshot</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                  Retina 2X PNG
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400 font-light">
                High-definition visual infographic of current workspace execution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <div className="flex bg-neutral-800 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5',
                  theme === 'dark' ? 'bg-white text-black font-semibold shadow-xs' : 'text-neutral-400 hover:text-white'
                )}
              >
                <Moon size={12} />
                <span>Dark</span>
              </button>
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5',
                  theme === 'light' ? 'bg-white text-black font-semibold shadow-xs' : 'text-neutral-400 hover:text-white'
                )}
              >
                <Sun size={12} />
                <span>Light</span>
              </button>
            </div>

            <button
              onClick={handleCopy}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-mono transition-colors border border-white/10 cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-neutral-200 text-black rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download size={13} />
              <span>{isExporting ? 'Rendering...' : 'Download PNG'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Card Preview Container */}
        <div className="p-6 overflow-y-auto bg-neutral-950 flex items-center justify-center">
          {/* THE CAPTURED REPORT CARD */}
          <div
            ref={cardRef}
            className={cn(
              'w-[820px] rounded-3xl p-8 transition-colors select-none font-sans relative overflow-hidden',
              theme === 'dark' 
                ? 'bg-[#0c0d10] text-white border border-white/10 shadow-2xl' 
                : 'bg-white text-black border border-black/10 shadow-2xl'
            )}
          >
            {/* Ambient Lighting Gradient */}
            <div 
              className={cn(
                'absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20',
                theme === 'dark' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-blue-400 to-indigo-300'
              )}
            />

            {/* Header */}
            <div className="flex items-start justify-between border-b pb-6 relative z-10 border-inherit">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'px-2.5 py-0.5 rounded-md font-mono text-[10px] font-semibold tracking-wider uppercase',
                    theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black text-white'
                  )}>
                    CALLMY // EXECUTION INTELLIGENCE
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono text-[10px] font-medium uppercase">
                    ● Active Sprint Status
                  </span>
                </div>
                <h1 className="text-2xl font-light tracking-tight mt-1">
                  Workspace Execution &amp; Progress Report
                </h1>
                <p className={cn('text-xs font-mono', theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500')}>
                  Snapshot generated on {format(new Date(), 'EEEE, MMMM d, yyyy • hh:mm a')}
                </p>
              </div>

              <div className="text-right font-mono space-y-1">
                <div className={cn(
                  'text-3xl font-light tracking-tight',
                  metrics.completionRate >= 75 ? 'text-emerald-500' : 'text-amber-500'
                )}>
                  {metrics.completionRate}%
                </div>
                <span className={cn('text-[10px] uppercase block tracking-wider', theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500')}>
                  SPRINT COMPLETION RATE
                </span>
              </div>
            </div>

            {/* 4 Primary KPI Summary Cards */}
            <div className="grid grid-cols-4 gap-3 my-6 relative z-10">
              <div className={cn(
                'p-4 rounded-2xl border space-y-1',
                theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.02] border-black/[0.06]'
              )}>
                <div className="flex items-center justify-between">
                  <span className={cn('text-[10px] font-mono uppercase tracking-wider', theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500')}>
                    TOTAL TASKS
                  </span>
                  <Layers size={13} className={theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'} />
                </div>
                <div className="text-2xl font-light">{metrics.total}</div>
                <span className={cn('text-[10px] font-mono block', theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400')}>
                  Across all active projects
                </span>
              </div>

              <div className={cn(
                'p-4 rounded-2xl border space-y-1',
                theme === 'dark' ? 'bg-emerald-500/[0.04] border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    SHIPPED
                  </span>
                  <CheckCircle2 size={13} className="text-emerald-500" />
                </div>
                <div className="text-2xl font-light text-emerald-600 dark:text-emerald-400">{metrics.shippedCount}</div>
                <span className="text-[10px] font-mono text-emerald-600/70 dark:text-emerald-400/70 block">
                  {metrics.completionRate}% completion rate
                </span>
              </div>

              <div className={cn(
                'p-4 rounded-2xl border space-y-1',
                theme === 'dark' ? 'bg-blue-500/[0.04] border-blue-500/20' : 'bg-blue-50 border-blue-200'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    IN FLIGHT
                  </span>
                  <Flame size={13} className="text-blue-500" />
                </div>
                <div className="text-2xl font-light text-blue-600 dark:text-blue-400">{metrics.inProgressCount}</div>
                <span className="text-[10px] font-mono text-blue-600/70 dark:text-blue-400/70 block">
                  {metrics.todoCount} pending in backlog
                </span>
              </div>

              <div className={cn(
                'p-4 rounded-2xl border space-y-1',
                theme === 'dark' ? 'bg-indigo-500/[0.04] border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    FOCUS HOURS
                  </span>
                  <Clock size={13} className="text-indigo-500" />
                </div>
                <div className="text-2xl font-light text-indigo-600 dark:text-indigo-400">{metrics.totalHours}h</div>
                <span className="text-[10px] font-mono text-indigo-600/70 dark:text-indigo-400/70 block">
                  {metrics.totalMinutes}m tracked duration
                </span>
              </div>
            </div>

            {/* Pipeline Bar & Priority Graphs */}
            <div className="grid grid-cols-3 gap-6 my-6 relative z-10">
              {/* Task Pipeline Funnel */}
              <div className="col-span-2 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={cn('uppercase tracking-wider font-medium', theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700')}>
                    WORKFLOW PIPELINE DISTRIBUTION
                  </span>
                  <span className={cn(theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400')}>
                    {metrics.total} items
                  </span>
                </div>

                {/* Multi-segment Progress Bar */}
                <div className={cn(
                  'h-3.5 rounded-full flex overflow-hidden p-0.5 border',
                  theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                )}>
                  {metrics.shippedCount > 0 && (
                    <div 
                      className="bg-emerald-500 rounded-l-full" 
                      style={{ width: `${(metrics.shippedCount / metrics.total) * 100}%` }}
                      title={`Shipped: ${metrics.shippedCount}`}
                    />
                  )}
                  {metrics.inProgressCount > 0 && (
                    <div 
                      className="bg-blue-500" 
                      style={{ width: `${(metrics.inProgressCount / metrics.total) * 100}%` }}
                      title={`In Progress: ${metrics.inProgressCount}`}
                    />
                  )}
                  {metrics.blockedCount > 0 && (
                    <div 
                      className="bg-amber-500" 
                      style={{ width: `${(metrics.blockedCount / metrics.total) * 100}%` }}
                      title={`Blocked: ${metrics.blockedCount}`}
                    />
                  )}
                  {metrics.todoCount > 0 && (
                    <div 
                      className={cn(theme === 'dark' ? 'bg-neutral-600' : 'bg-neutral-300')} 
                      style={{ width: `${(metrics.todoCount / metrics.total) * 100}%` }}
                      title={`To Do: ${metrics.todoCount}`}
                    />
                  )}
                  {metrics.killedCount > 0 && (
                    <div 
                      className="bg-rose-500 rounded-r-full" 
                      style={{ width: `${(metrics.killedCount / metrics.total) * 100}%` }}
                      title={`Killed: ${metrics.killedCount}`}
                    />
                  )}
                </div>

                {/* Pipeline Legend */}
                <div className="grid grid-cols-5 text-[10px] font-mono pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Shipped ({metrics.shippedCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>In Prog ({metrics.inProgressCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Blocked ({metrics.blockedCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('w-2 h-2 rounded-full', theme === 'dark' ? 'bg-neutral-600' : 'bg-neutral-300')} />
                    <span>To-Do ({metrics.todoCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Killed ({metrics.killedCount})</span>
                  </div>
                </div>
              </div>

              {/* 7-Day Velocity Chart */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={cn('uppercase tracking-wider font-medium', theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700')}>
                    7-DAY SHIPPED VELOCITY
                  </span>
                  <TrendingUp size={13} className="text-emerald-500" />
                </div>

                {/* Mini Bar Chart */}
                <div className={cn(
                  'h-16 flex items-end justify-between gap-1.5 p-2 rounded-xl border',
                  theme === 'dark' ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/10'
                )}>
                  {(() => {
                    const maxVal = Math.max(...metrics.last7Days.map(d => d.count), 1)
                    return metrics.last7Days.map((d, idx) => {
                      const hPct = Math.max(14, Math.round((d.count / maxVal) * 100))
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          <span className={cn(
                            'text-[9px] font-mono font-medium leading-none',
                            d.count > 0 ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : (theme === 'dark' ? 'text-neutral-600' : 'text-neutral-400')
                          )}>
                            {d.count}
                          </span>
                          <div 
                            className={cn(
                              'w-full rounded-xs transition-all',
                              d.count > 0 
                                ? 'bg-emerald-500' 
                                : (theme === 'dark' ? 'bg-white/10' : 'bg-black/10'),
                              d.isToday && 'ring-1 ring-white/50'
                            )}
                            style={{ height: `${hPct}%` }}
                          />
                          <span className={cn(
                            'text-[8px] font-mono leading-none',
                            d.isToday ? 'font-bold text-emerald-500' : (theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400')
                          )}>
                            {d.dayLabel}
                          </span>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            </div>

            {/* Key Deliverables & Projects */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t relative z-10 border-inherit">
              {/* Deliverables Highlights */}
              <div className="col-span-2 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={cn('uppercase tracking-wider font-medium', theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700')}>
                    RECENT KEY DELIVERABLES
                  </span>
                  <span className={cn('text-[10px]', theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400')}>
                    Active / Shipped
                  </span>
                </div>

                <div className="space-y-1.5">
                  {metrics.topDeliverables.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className={cn(
                        'p-2.5 px-3 rounded-xl border flex items-center justify-between text-xs gap-3',
                        theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.02] border-black/5'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full flex-shrink-0',
                          item.status === 'shipped' ? 'bg-emerald-500' : 'bg-blue-500'
                        )} />
                        <span className="font-light truncate text-[11px]">{item.title}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[10px]">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded uppercase',
                          theme === 'dark' ? 'bg-white/10 text-neutral-300' : 'bg-black/5 text-neutral-600'
                        )}>
                          {item.project?.name || 'General'}
                        </span>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded uppercase font-semibold',
                          item.status === 'shipped' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        )}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects Breakdown */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={cn('uppercase tracking-wider font-medium', theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700')}>
                    PROJECT VELOCITY
                  </span>
                  <Target size={13} className={theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'} />
                </div>

                <div className="space-y-2">
                  {metrics.projectBreakdown.map((p, idx) => {
                    const pRate = Math.round((p.shipped / Math.max(p.total, 1)) * 100)
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="truncate max-w-[120px] font-light">{p.name}</span>
                          <span className={cn(theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500')}>
                            {p.shipped}/{p.total} ({pRate}%)
                          </span>
                        </div>
                        <div className={cn(
                          'h-1.5 rounded-full overflow-hidden',
                          theme === 'dark' ? 'bg-white/10' : 'bg-black/10'
                        )}>
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${pRate}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className={cn(
              'mt-6 pt-4 border-t flex items-center justify-between text-[10px] font-mono border-inherit',
              theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'
            )}>
              <span>CALLMY • WORKSPACE EXECUTIVE REPORT</span>
              <span>VERIFIED SNAPSHOT • HIGH FIDELITY RENDER</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
