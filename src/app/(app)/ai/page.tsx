'use client'

import { useState } from 'react'
import { Zap, ChevronRight, MessageSquare, Plus, Trash2, Sparkles, Send, Activity, ShieldCheck, TrendingUp, CheckSquare } from 'lucide-react'
import { callGroq, buildWorkspaceContext } from '@/lib/groq/client'
import { getInitials } from '@/lib/utils'

export default function AIPage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: 'CallMy Mgmt Intelligence initialized. Ready to challenge scope, review blockers, and prioritize your active sprint tasks. What is the priority focus?' }
  ])
  const [loading, setLoading] = useState(false)

  const quickPrompts = [
    "What should I be working on right now?",
    "Stress test my most important project",
    "What tasks should I eliminate or delegate?",
    "What is blocking shipping velocity right now?",
  ]

  async function handleSubmit(e?: React.FormEvent, promptOverride?: string) {
    if (e) e.preventDefault()
    const content = promptOverride || input
    if (!content.trim() || loading) return

    const newMessages = [...messages, { role: 'user' as const, content }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const context = buildWorkspaceContext({
      projects: [{ name: 'Active Sprints', status: 'active', tasksTotal: 5, tasksShipped: 2 }],
      tasks: [{ title: 'Deliver core features', priority: 'p0', status: 'in_progress' }],
      blockers: []
    })

    try {
      const response = await callGroq(newMessages, context)
      setMessages([...newMessages, { role: 'assistant', content: response }])
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Connection temporarily unavailable. Please retry.' }])
    }
    setLoading(false)
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] -m-8 font-sans overflow-hidden bg-[#ffffff]">
      {/* Sidebar - Sessions & Intelligence Stats */}
      <div className="w-72 bg-white border-r border-black/[0.06] p-6 flex flex-col justify-between flex-shrink-0 font-body">
        <div className="space-y-6">
          <button
            onClick={() => setMessages([messages[0]])}
            className="w-full py-2.5 px-4 bg-black hover:bg-neutral-800 text-white font-normal text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={14} />
            <span>New Session</span>
          </button>

          {/* AI Decision Metrics Card with Ambient Soft Lighting */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100/60 space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-900 font-medium">
              <Activity size={12} className="text-indigo-600" />
              <span>SYSTEM REASONING</span>
            </div>
            <div className="space-y-1.5 text-xs font-light text-[#4b5563]">
              <div className="flex justify-between">
                <span>Scope Audits</span>
                <span className="font-mono text-black font-medium">24 / 24</span>
              </div>
              <div className="flex justify-between">
                <span>Blockers Isolated</span>
                <span className="font-mono text-black font-medium">94.6%</span>
              </div>
              <div className="flex justify-between">
                <span>Model Latency</span>
                <span className="font-mono text-emerald-600 font-medium">0.45s</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider mb-2 font-light px-2">
              Intelligence Sessions
            </div>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs bg-black text-white font-normal shadow-sm text-left">
                <MessageSquare size={13} className="text-white" />
                <span className="truncate">Current Session</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col justify-between bg-[#fbfbfd]">
        {/* Header */}
        <header className="px-8 py-4 border-b border-black/[0.06] bg-white flex items-center justify-between font-body">
          <h1 className="text-sm font-normal text-black">Executive Chief of Staff</h1>
          <span className="text-[10px] font-mono text-[#6b7280] bg-black/[0.04] px-2 py-0.5 rounded font-light">
            SYNCED TO WORKSPACE
          </span>
        </header>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-4xl mx-auto w-full font-body">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 max-w-2xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-medium ${
                msg.role === 'user' ? 'bg-black text-white' : 'bg-black/[0.05] text-black'
              }`}>
                {msg.role === 'user' ? 'You' : 'AI'}
              </div>

              <div className={`p-4 rounded-3xl text-xs leading-relaxed font-light ${
                msg.role === 'user'
                  ? 'bg-black text-white'
                  : 'bg-white border border-black/[0.06] text-[#1f2937] shadow-sm whitespace-pre-wrap'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-2xl mr-auto">
              <div className="w-7 h-7 rounded-full bg-black/[0.05] text-black flex items-center justify-center text-xs flex-shrink-0 font-medium">
                AI
              </div>
              <div className="p-4 rounded-3xl bg-white border border-black/[0.06] text-xs text-[#9ca3af] font-mono font-light shadow-sm">
                Thinking & analyzing workspace...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-6 px-8 bg-white border-t border-black/[0.06] font-body">
          <div className="max-w-3xl mx-auto space-y-3">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSubmit(undefined, prompt)}
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-neutral-50 border border-black/[0.08] text-xs text-[#6b7280] hover:text-black transition-all cursor-pointer font-light"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about tasks, priorities, or request a blocker analysis..."
                className="w-full px-4 py-3 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-2xl text-xs text-black placeholder:text-[#9ca3af] outline-none font-light shadow-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 top-2 bottom-2 px-4 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white rounded-xl text-xs font-normal transition-all cursor-pointer flex items-center justify-center"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
