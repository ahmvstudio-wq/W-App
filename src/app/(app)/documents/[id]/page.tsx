'use client'

import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Heading from '@tiptap/extension-heading'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { ArrowLeft, Save, Zap, ChevronRight, CheckSquare, Plus } from 'lucide-react'
import Link from 'next/link'

export default function DocumentEditorPage({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState('Q3 Strategy Memo')
  const [status, setStatus] = useState('live')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())
  
  // AI Sidebar state
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'assistant', content: string}[]>([])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Press / for commands...' }),
      Heading.configure({ levels: [1, 2, 3] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: `
      <h2>The Problem</h2>
      <p>We are moving too slowly on core feature delivery.</p>
      <h2>The Solution</h2>
      <ul>
        <li>Cut scope by 50%</li>
        <li>Assign single owners</li>
        <li>Ship every 48 hours</li>
      </ul>
    `,
    onUpdate: () => {
      // Debounced save would go here
    }
  })

  // Mock auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSaving(true)
      setTimeout(() => {
        setIsSaving(false)
        setLastSaved(new Date())
      }, 500)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      {/* Main Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <header style={{ padding: '16px 32px', borderBottom: '1px solid #252729', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0c0d0f', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/documents" style={{ color: '#6b6e75', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <ArrowLeft size={16} />
            </Link>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              style={{ background: 'transparent', border: 'none', color: '#f0ede8', fontSize: '16px', fontWeight: 600, outline: 'none', width: '300px' }} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isSaving ? <><Save size={12} className="animate-spin" /> Saving...</> : `Saved ${lastSaved.toLocaleTimeString()}`}
            </span>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', padding: '6px 12px', fontSize: '12px', outline: 'none' }}>
              <option value="live">LIVE</option>
              <option value="reference">REFERENCE</option>
              <option value="archive">ARCHIVE</option>
            </select>
          </div>
        </header>

        <div style={{ flex: 1, padding: '48px 32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          {editor && <EditorContent editor={editor} />}
        </div>
      </div>

      {/* Right Sidebar (AI & Linked Tasks) */}
      <div style={{ width: '320px', background: '#141618', borderLeft: '1px solid #252729', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        
        {/* Linked Tasks */}
        <div style={{ padding: '20px', borderBottom: '1px solid #252729' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '13px', color: '#6b6e75', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>
              <CheckSquare size={14} /> Linked Tasks
            </h3>
            <button style={{ background: 'transparent', border: 'none', color: '#c8f135', cursor: 'pointer', display: 'flex' }}><Plus size={14} /></button>
          </div>
          <div style={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '8px', padding: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid #6b6e75', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ color: '#f0ede8', marginBottom: '4px' }}>Draft new onboarding flow</div>
                <div style={{ fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace' }}>P1 • 60m • W</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Copilot */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #252729', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} color="#c8f135" />
            <h3 style={{ fontSize: '13px', color: '#f0ede8' }}>Document Intelligence</h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {aiMessages.length === 0 ? (
              <div style={{ color: '#6b6e75', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>
                Highlight text in the document to ask questions, summarize, or extract action items.
              </div>
            ) : (
              aiMessages.map((msg, i) => (
                <div key={i} style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                  background: msg.role === 'user' ? '#1c1e22' : 'transparent',
                  border: msg.role === 'user' ? '1px solid #252729' : 'none',
                  padding: msg.role === 'user' ? '10px 14px' : '0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: msg.role === 'user' ? '#f0ede8' : '#c8f135',
                  fontFamily: msg.role === 'assistant' ? 'DM Mono, monospace' : 'Inter, sans-serif',
                  lineHeight: 1.5
                }}>
                  {msg.content}
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid #252729' }}>
            <form onSubmit={e => { e.preventDefault(); if(!aiInput) return; setAiMessages([...aiMessages, {role: 'user', content: aiInput}, {role: 'assistant', content: 'Processing text...'}]); setAiInput(''); }} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder="Ask about this doc..."
                style={{ flex: 1, background: '#1c1e22', border: '1px solid #252729', padding: '10px 14px', borderRadius: '6px', color: '#f0ede8', fontSize: '13px', outline: 'none' }}
              />
              <button type="submit" disabled={!aiInput.trim()} style={{ 
                background: '#c8f135', color: '#000', border: 'none', borderRadius: '6px', width: '40px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: !aiInput.trim() ? 'not-allowed' : 'pointer', opacity: !aiInput.trim() ? 0.5 : 1
              }}>
                <ChevronRight size={18} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
