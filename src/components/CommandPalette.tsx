'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { 
  Search, Plus, Briefcase, FileText, 
  Users, Clock, Calendar, X, ChevronRight, Sparkles 
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CommandOption {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  category: string
}

export default function CommandPalette({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 10)
      fetchWorkspace()
    }
  }, [isOpen])

  async function fetchWorkspace() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1).single()
    if (data) setWorkspaceId(data.id)
  }

  const options: CommandOption[] = [
    { 
      id: 'new-task', 
      label: 'Create New Task', 
      icon: <Plus size={16} />, 
      category: 'Actions',
      action: () => { window.dispatchEvent(new CustomEvent('open-create-task-modal')); onClose(); } 
    },
    { 
      id: 'new-project', 
      label: 'Create New Project', 
      icon: <Briefcase size={16} />, 
      category: 'Actions',
      action: () => { router.push('/projects'); onClose(); } 
    },
    { 
      id: 'new-document', 
      label: 'New Strategy Document', 
      icon: <FileText size={16} />, 
      category: 'Actions',
      action: async () => {
        router.push('/documents')
        onClose()
      } 
    },
    { 
      id: 'ai-assistant', 
      label: 'Consult AI Chief of Staff', 
      icon: <Sparkles size={16} />, 
      category: 'AI',
      action: () => { router.push('/ai'); onClose(); } 
    },
    { 
      id: 'start-focus', 
      label: 'Toggle Focus Sprint Timer', 
      icon: <Clock size={16} />, 
      category: 'Focus',
      action: () => { window.dispatchEvent(new CustomEvent('toggle-focus-timer')); onClose(); } 
    },
  ]

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
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
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24 p-4 font-sans animate-fadeIn"
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
            placeholder="Type a command or search workspace..."
            className="flex-1 bg-transparent border-none outline-none text-black text-sm font-light placeholder:text-[#9ca3af]"
          />
          <kbd className="text-[10px] font-mono text-[#9ca3af] bg-black/[0.04] px-2 py-0.5 rounded">ESC</kbd>
        </div>

        <div className="p-2 max-h-72 overflow-y-auto space-y-1">
          {filteredOptions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9ca3af] font-light">No commands matching &quot;{search}&quot;</div>
          ) : (
            filteredOptions.map((opt, i) => (
              <div 
                key={opt.id}
                onClick={opt.action}
                onMouseEnter={() => setSelectedIndex(i)}
                className={cn(
                  'px-4 py-3 rounded-2xl cursor-pointer flex items-center gap-3 transition-all text-xs',
                  selectedIndex === i ? 'bg-black text-white' : 'text-[#4b5563] hover:bg-black/[0.03]'
                )}
              >
                <div>{opt.icon}</div>
                <span className="flex-1 font-normal">{opt.label}</span>
                {selectedIndex === i && <ChevronRight size={13} />}
              </div>
            ))
          )}
        </div>

        <div className="p-3 px-6 bg-[#fafafa] border-t border-black/[0.04] flex gap-4 text-[10px] font-mono text-[#9ca3af]">
          <span>↑↓ NAVIGATE</span>
          <span>ENTER SELECT</span>
        </div>
      </div>
    </div>
  )
}
