'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { 
  Search, Plus, Briefcase, FileText, 
  Users, Clock, Calendar, X, ChevronRight 
} from 'lucide-react'
import { toast } from 'sonner'

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
      label: 'New Task', 
      icon: <Plus size={18} />, 
      category: 'Actions',
      action: () => { toast.info('Open Task Modal'); onClose(); } 
    },
    { 
      id: 'new-project', 
      label: 'New Project', 
      icon: <Briefcase size={18} />, 
      category: 'Actions',
      action: () => { toast.info('Open Project Modal'); onClose(); } 
    },
    { 
      id: 'new-document', 
      label: 'New Document', 
      icon: <FileText size={18} />, 
      category: 'Actions',
      action: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !workspaceId) return
        const { data, error } = await supabase.from('documents').insert({
          workspace_id: workspaceId,
          owner_id: user.id,
          title: 'Untitled Document',
          status: 'live'
        }).select().single()
        if (error) toast.error(error.message)
        else {
          toast.success('Document created')
          router.push(`/documents/${data.id}`)
          onClose()
        }
      } 
    },
    { 
      id: 'new-meeting', 
      label: 'New Meeting', 
      icon: <Users size={18} />, 
      category: 'Actions',
      action: () => { router.push('/meetings'); onClose(); } 
    },
    { 
      id: 'start-focus', 
      label: 'Start Focus Timer', 
      icon: <Clock size={18} />, 
      category: 'Focus',
      action: () => { window.dispatchEvent(new CustomEvent('toggle-focus-timer')); onClose(); } 
    },
    { 
      id: 'new-event', 
      label: 'New Calendar Event', 
      icon: <Calendar size={18} />, 
      category: 'Actions',
      action: () => { toast.info('Open Calendar Modal'); onClose(); } 
    }
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
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}
      onClick={onClose}
    >
      <div 
        style={{ width: '600px', background: '#141618', border: '1px solid #252729', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #252729' }}>
          <Search size={20} color="#6b6e75" />
          <input 
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Type a command..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f0ede8', fontSize: '16px' }}
          />
          <div style={{ fontSize: '10px', color: '#6b6e75', background: '#1c1e22', padding: '4px 8px', borderRadius: '4px', border: '1px solid #252729' }}>ESC</div>
        </div>

        <div style={{ padding: '8px', maxHeight: '400px', overflowY: 'auto' }}>
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6b6e75', fontSize: '14px' }}>No commands found for "{search}"</div>
          ) : (
            filteredOptions.map((opt, i) => (
              <div 
                key={opt.id}
                onClick={opt.action}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{ 
                  padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: selectedIndex === i ? '#252729' : 'transparent',
                  color: selectedIndex === i ? '#c8f135' : '#f0ede8',
                  transition: 'all 100ms'
                }}
              >
                <div style={{ color: selectedIndex === i ? '#c8f135' : '#6b6e75' }}>{opt.icon}</div>
                <div style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{opt.label}</div>
                {selectedIndex === i && <ChevronRight size={14} />}
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '12px 16px', background: '#1c1e22', borderTop: '1px solid #252729', display: 'flex', gap: '16px', color: '#6b6e75', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ background: '#252729', padding: '2px 4px', borderRadius: '4px' }}>↑↓</span> Navigate
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ background: '#252729', padding: '2px 4px', borderRadius: '4px' }}>ENTER</span> Select
          </div>
        </div>
      </div>
    </div>
  )
}
