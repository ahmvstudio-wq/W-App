'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { 
  Search, Plus, FileText, Clock, ChevronRight, 
  Layers, Activity, BarChart2, FolderOpen, 
  FolderKanban, CheckSquare, Video, Settings, HelpCircle,
  LayoutDashboard
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandOption {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  category: string
}

export default function CommandPalette({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [isOpen])

  const options: CommandOption[] = [
    { 
      id: 'dashboard', 
      label: 'Home Dashboard', 
      description: 'Workspace overview and recent activity',
      icon: <LayoutDashboard size={16} />, 
      category: 'Navigation',
      action: () => { router.push('/dashboard'); onClose(); } 
    },
    { 
      id: 'new-task', 
      label: 'Create Task', 
      description: 'Add a new deliverable or to-do',
      icon: <Plus size={16} />, 
      category: 'Actions',
      action: () => { window.dispatchEvent(new CustomEvent('open-create-task-modal')); onClose(); } 
    },
    { 
      id: 'content-vault', 
      label: 'Content Vault', 
      description: 'Social video scheduler and queue',
      icon: <Layers size={16} />, 
      category: 'Creator Studio',
      action: () => { router.push('/content'); onClose(); } 
    },
    { 
      id: 'cultlike-create', 
      label: 'Cultlike Create', 
      description: 'Daily scorecard and shipping streaks',
      icon: <Activity size={16} />, 
      category: 'Creator Studio',
      action: () => { router.push('/create'); onClose(); } 
    },
    { 
      id: 'analytics', 
      label: 'Analytics & Insights', 
      description: 'Live Instagram and YouTube telemetry',
      icon: <BarChart2 size={16} />, 
      category: 'Creator Studio',
      action: () => { router.push('/create?tab=analytics'); onClose(); } 
    },
    { 
      id: 'drive-storage', 
      label: 'Google Drive Storage', 
      description: 'Ingest raw media assets directly from Drive',
      icon: <FolderOpen size={16} />, 
      category: 'Creator Studio',
      action: () => { router.push('/content?tab=drive'); onClose(); } 
    },
    { 
      id: 'projects', 
      label: 'Projects', 
      description: 'Manage active deliverables and milestones',
      icon: <FolderKanban size={16} />, 
      category: 'Navigation',
      action: () => { router.push('/projects'); onClose(); } 
    },
    { 
      id: 'tasks', 
      label: 'Tasks', 
      description: 'Task board and deliverable list',
      icon: <CheckSquare size={16} />, 
      category: 'Navigation',
      action: () => { router.push('/tasks'); onClose(); } 
    },
    { 
      id: 'documents', 
      label: 'Documents', 
      description: 'Strategy docs and notes',
      icon: <FileText size={16} />, 
      category: 'Navigation',
      action: () => { router.push('/documents'); onClose(); } 
    },
    { 
      id: 'meetings', 
      label: 'Meetings', 
      description: 'Fathom call recordings and synced action items',
      icon: <Video size={16} />, 
      category: 'Navigation',
      action: () => { router.push('/meetings'); onClose(); } 
    },
    { 
      id: 'start-focus', 
      label: 'Focus Timer', 
      description: 'Toggle 25-minute deep work sprint',
      icon: <Clock size={16} />, 
      category: 'Tools',
      action: () => { window.dispatchEvent(new CustomEvent('toggle-focus-timer')); onClose(); } 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      description: 'Workspace and account integrations',
      icon: <Settings size={16} />, 
      category: 'System',
      action: () => { router.push('/settings'); onClose(); } 
    },
    { 
      id: 'guide', 
      label: 'System Guide', 
      description: 'Interactive walkthrough tutorial',
      icon: <HelpCircle size={16} />, 
      category: 'System',
      action: () => { window.dispatchEvent(new CustomEvent('open-game-tutorial')); onClose(); } 
    },
  ]

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(search.toLowerCase())) ||
    opt.category.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => (i + 1) % filteredOptions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => (i - 1 + filteredOptions.length) % filteredOptions.length)
      } else if (e.key === 'Enter') {
        filteredOptions[selectedIndex]?.action()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredOptions, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 p-4 font-sans animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white border border-black/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col font-body"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 px-6 flex items-center gap-3 border-b border-black/[0.06]">
          <Search size={18} className="text-[#9ca3af]" />
          <input 
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search workspace or run a command..."
            className="flex-1 bg-transparent border-none outline-none text-black text-sm font-normal placeholder:text-[#9ca3af]"
          />
          <kbd className="text-[10px] font-mono text-[#9ca3af] bg-black/[0.04] px-2 py-0.5 rounded">ESC</kbd>
        </div>

        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filteredOptions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9ca3af] font-light">No results found for &quot;{search}&quot;</div>
          ) : (
            filteredOptions.map((opt, i) => (
              <div 
                key={opt.id}
                onClick={opt.action}
                onMouseEnter={() => setSelectedIndex(i)}
                className={cn(
                  'px-4 py-2.5 rounded-2xl cursor-pointer flex items-center gap-3.5 transition-all text-xs',
                  selectedIndex === i ? 'bg-black text-white' : 'text-[#374151] hover:bg-black/[0.03]'
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-xl transition-colors',
                  selectedIndex === i ? 'text-white' : 'text-[#6b7280]'
                )}>
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm leading-tight">{opt.label}</div>
                  {opt.description && (
                    <div className={cn(
                      'text-[11px] truncate mt-0.5',
                      selectedIndex === i ? 'text-neutral-300' : 'text-neutral-400'
                    )}>
                      {opt.description}
                    </div>
                  )}
                </div>
                {selectedIndex === i && <ChevronRight size={14} className="text-neutral-300 shrink-0" />}
              </div>
            ))
          )}
        </div>

        <div className="p-3 px-6 bg-[#fafafa] border-t border-black/[0.04] flex items-center justify-between text-[11px] font-mono text-[#9ca3af]">
          <span>↑↓ Navigate</span>
          <span>Enter Select</span>
        </div>
      </div>
    </div>
  )
}
