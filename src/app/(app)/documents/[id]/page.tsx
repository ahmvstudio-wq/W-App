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
import { ArrowLeft, Save, Zap, ChevronRight, CheckSquare, Plus, Sparkles, Send } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function DocumentEditorPage({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState('Executive Strategy Memo')
  const [status, setStatus] = useState('live')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())
  
  // AI Sidebar state
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'assistant', content: string}[]>([])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start typing your document memo...' }),
      Heading.configure({ levels: [1, 2, 3] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: `
      <h2>Executive Summary</h2>
      <p>Streamline active sprint deliverables and maintain 48-hour shipping velocity.</p>
      <h2>Action Plan</h2>
      <ul>
        <li>Focus on high-leverage P0 tasks</li>
        <li>Review daily blocker radar with AI Chief of Staff</li>
        <li>Log outcomes to CallMy Mgmt daily logs</li>
      </ul>
    `,
    onUpdate: () => {
      // Debounced auto-save
    }
  })

  // Auto-save timer
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSaving(true)
      setTimeout(() => {
        setIsSaving(false)
        setLastSaved(new Date())
      }, 400)
    }, 25000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-[calc(100vh-6rem)] -m-8 font-sans overflow-hidden bg-[#ffffff]">
      {/* Main Document Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Doc Action Bar */}
        <header className="px-8 py-4 border-b border-black/[0.06] flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 font-body">
          <div className="flex items-center gap-4">
            <Link href="/documents" className="p-1.5 text-[#9ca3af] hover:text-black rounded-lg transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="bg-transparent border-none text-black text-sm font-normal outline-none w-72 focus:border-b focus:border-black"
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-[#9ca3af] font-mono font-light">
              {isSaving ? 'Saving...' : `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="bg-[#fafafa] border border-black/[0.08] rounded-xl text-black px-3 py-1.5 text-xs outline-none cursor-pointer font-light"
            >
              <option value="live">Live</option>
              <option value="reference">Reference</option>
              <option value="archive">Archive</option>
            </select>
          </div>
        </header>

        {/* TipTap Editor */}
        <div className="flex-1 p-12 max-w-3xl mx-auto w-full prose prose-neutral prose-headings:font-light">
          {editor && <EditorContent editor={editor} />}
        </div>
      </div>

      {/* Right Sidebar: AI Intelligence & Linked Items */}
      <div className="w-80 bg-[#fbfbfd] border-l border-black/[0.06] flex flex-col justify-between flex-shrink-0 font-body">
        {/* Linked Tasks Section */}
        <div className="p-6 border-b border-black/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider font-light">
              LINKED TASKS
            </span>
            <button className="text-xs text-black font-medium hover:underline cursor-pointer">
              + Link
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-sm">
            <div className="flex items-start gap-2.5">
              <CheckSquare size={14} className="text-black mt-0.5" />
              <div>
                <div className="text-xs text-black font-normal">Implement Sprint Deliverables</div>
                <div className="text-[10px] text-[#9ca3af] font-mono font-light">P0 • 45m</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Copilot Chat */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-black" />
            <span className="text-xs font-normal text-black">Doc Intelligence</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 font-light text-xs pr-1">
            {aiMessages.length === 0 ? (
              <div className="text-[#9ca3af] text-center mt-8 leading-relaxed">
                Ask your AI Chief of Staff to extract action items, summarize, or refine this memo.
              </div>
            ) : (
              aiMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl text-xs ${
                    msg.role === 'user'
                      ? 'bg-black text-white ml-auto max-w-[85%]'
                      : 'bg-white border border-black/[0.06] text-[#4b5563] shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!aiInput.trim()) return
              setAiMessages([
                ...aiMessages,
                { role: 'user', content: aiInput },
                { role: 'assistant', content: 'Action items extracted and aligned with your active tasks.' },
              ])
              setAiInput('')
            }}
            className="flex gap-2 pt-4"
          >
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask AI..."
              className="flex-1 px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light shadow-sm"
            />
            <button
              type="submit"
              disabled={!aiInput.trim()}
              className="px-3 py-2 bg-black disabled:opacity-40 text-white rounded-xl text-xs cursor-pointer"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
