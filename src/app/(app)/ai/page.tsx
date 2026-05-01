'use client'

import { useState } from 'react'
import { Zap, ChevronRight, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { callGroq, buildWorkspaceContext } from '@/lib/groq/client'
import { getInitials } from '@/lib/utils'

export default function AIPage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: 'FOCUS OS System Intelligence initialized. I hold the standard for output, speed, and ownership. I will challenge your scope and cut your fluff. What is the priority?' }
  ])
  const [loading, setLoading] = useState(false)

  const quickPrompts = [
    "What should I be working on right now?",
    "Stress test my most important project",
    "What should I delete from my task list?",
    "Am I measuring the right things?",
    "What is blocking the most work right now?",
    "Turn this into a proper project"
  ]

  async function handleSubmit(e?: React.FormEvent, promptOverride?: string) {
    if (e) e.preventDefault()
    const content = promptOverride || input
    if (!content.trim() || loading) return

    const newMessages = [...messages, { role: 'user' as const, content }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Mock full context injection
    const context = buildWorkspaceContext({
      projects: [{ name: 'V1 Launch', status: 'active', tasksTotal: 5, tasksShipped: 2 }],
      tasks: [{ title: 'Finalize pricing', priority: 'p0', status: 'in_progress' }],
      blockers: []
    })

    try {
      const response = await callGroq(newMessages, context)
      setMessages([...newMessages, { role: 'assistant', content: response }])
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Connection failed. Reload system.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      {/* Sidebar - History */}
      <div style={{ width: '260px', background: '#141618', borderRight: '1px solid #252729', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px' }}>
          <button onClick={() => setMessages([messages[0]])} className="btn-accent" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', marginBottom: '24px' }}>
            <Plus size={16} /> New Session
          </button>
          
          <div style={{ fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '8px' }}>
            Recent Sessions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#1c1e22', border: 'none', borderRadius: '6px', color: '#f0ede8', cursor: 'pointer', fontSize: '13px', textAlign: 'left' }}>
              <MessageSquare size={14} color="#c8f135" />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Current Session</span>
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#6b6e75', cursor: 'pointer', fontSize: '13px', textAlign: 'left', transition: 'all 150ms' }} onMouseEnter={e => { e.currentTarget.style.background = '#1c1e22'; e.currentTarget.style.color = '#f0ede8' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b6e75' }}>
              <MessageSquare size={14} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Project stress test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Header */}
        <header style={{ padding: '16px 32px', borderBottom: '1px solid #252729', background: '#0c0d0f', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
          <Zap color="#c8f135" size={20} />
          <h1 style={{ fontSize: '18px', margin: 0 }}>System Intelligence</h1>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', background: '#1c1e22', padding: '4px 8px', borderRadius: '4px' }}>
            MODEL: CLAUDE-SONNET-4
          </span>
        </header>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              display: 'flex', gap: '16px', maxWidth: '800px', 
              margin: msg.role === 'user' ? '0 0 0 auto' : '0 auto 0 0',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: msg.role === 'user' ? '#252729' : '#c8f135', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: msg.role === 'user' ? '#f0ede8' : '#000', fontWeight: 800, fontSize: '14px', fontFamily: 'Syne, sans-serif' }}>
                {msg.role === 'user' ? getInitials('W') : 'F'}
              </div>

              <div style={{ 
                background: msg.role === 'user' ? '#1c1e22' : 'transparent',
                border: msg.role === 'user' ? '1px solid #252729' : 'none',
                padding: msg.role === 'user' ? '16px 20px' : '6px 0',
                borderRadius: '12px',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '12px',
                borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
                color: '#f0ede8',
                fontSize: '15px',
                lineHeight: 1.6,
                fontFamily: msg.role === 'assistant' ? 'DM Mono, monospace' : 'Inter, sans-serif'
              }}>
                {msg.content}
              </div>

            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '16px', maxWidth: '800px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#c8f135', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#000', fontWeight: 800, fontSize: '14px', fontFamily: 'Syne, sans-serif' }}>F</div>
              <div style={{ padding: '6px 0', color: '#6b6e75', fontSize: '15px', fontFamily: 'DM Mono, monospace' }}>Processing intelligence...</div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '24px 32px', background: 'linear-gradient(transparent, #0c0d0f 20%)', paddingTop: '40px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            {/* Quick Prompts */}
            {messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {quickPrompts.map(prompt => (
                  <button key={prompt} onClick={() => handleSubmit(undefined, prompt)} style={{ padding: '8px 16px', background: '#141618', border: '1px solid #252729', borderRadius: '100px', color: '#f0ede8', fontSize: '12px', cursor: 'pointer', transition: 'all 150ms' }} onMouseEnter={e => { e.currentTarget.style.background = '#1c1e22'; e.currentTarget.style.borderColor = '#c8f135' }} onMouseLeave={e => { e.currentTarget.style.background = '#141618'; e.currentTarget.style.borderColor = '#252729' }}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Command the system..."
                style={{ width: '100%', background: '#1c1e22', border: '1px solid #252729', padding: '16px 20px', paddingRight: '60px', borderRadius: '12px', color: '#f0ede8', fontSize: '15px', outline: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', transition: 'border-color 200ms' }}
                onFocus={e => e.target.style.borderColor = '#c8f135'}
                onBlur={e => e.target.style.borderColor = '#252729'}
              />
              <button type="submit" disabled={!input.trim() || loading} style={{ 
                position: 'absolute', right: '8px', top: '8px', bottom: '8px', width: '40px',
                background: '#c8f135', color: '#000', border: 'none', borderRadius: '8px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer', opacity: (!input.trim() || loading) ? 0.5 : 1,
                transition: 'transform 100ms'
              }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                <ChevronRight size={20} />
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace' }}>
              System has full access to workspace context. It never validates, it only challenges.
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
