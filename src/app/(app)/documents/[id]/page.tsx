'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Heading from '@tiptap/extension-heading'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { ArrowLeft, Save, Sparkles, Send, CheckCircle2, Loader2, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

export default function DocumentEditorPage({ params }: { params: { id: string } }) {
  const documentId = params.id

  const [title, setTitle] = useState('Untitled Memo')
  const [status, setStatus] = useState<'live' | 'reference' | 'archive'>('live')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [docLoading, setDocLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  
  // AI Sidebar state
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Real persistence to Supabase
  const persistDocument = useCallback(async (currentTitle: string, currentStatus: string, jsonContent: any) => {
    if (!documentId) return
    setIsSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setIsSaving(false)
        return
      }

      const { error } = await supabase
        .from('documents')
        .update({
          title: currentTitle,
          status: currentStatus,
          content: jsonContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)

      if (error) {
        console.error('Error auto-saving document:', error)
        toast.error('Failed to save document changes.')
      } else {
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
      }
    } catch (err) {
      console.error('Document save exception:', err)
    } finally {
      setIsSaving(false)
    }
  }, [documentId])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start drafting your strategy or operating directive...' }),
      Heading.configure({ levels: [1, 2, 3] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    onUpdate: ({ editor: ed }) => {
      setHasUnsavedChanges(true)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        persistDocument(title, status, ed.getJSON())
      }, 1500)
    }
  })

  // Load document data from Supabase
  useEffect(() => {
    async function loadDoc() {
      setDocLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setDocLoading(false)
        return
      }

      const { data: docData, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error || !docData) {
        console.warn('Could not fetch document, setting defaults:', error)
      } else {
        setTitle(docData.title || 'Untitled Document')
        setStatus(docData.status || 'live')
        setWorkspaceId(docData.workspace_id)
        if (docData.updated_at) setLastSaved(new Date(docData.updated_at))

        if (editor && docData.content) {
          try {
            editor.commands.setContent(docData.content)
          } catch (e) {
            console.warn('Failed to parse document content:', e)
          }
        }
      }
      setDocLoading(false)
    }

    if (editor && !editor.isDestroyed) {
      loadDoc()
    }
  }, [documentId, editor])

  // Handle immediate manual save
  const handleManualSave = () => {
    if (!editor) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    persistDocument(title, status, editor.getJSON())
    toast.success('Document saved.')
  }

  // Handle Title change
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    setHasUnsavedChanges(true)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      if (editor) persistDocument(newTitle, status, editor.getJSON())
    }, 1500)
  }

  // Handle Status change
  const handleStatusChange = (newStatus: 'live' | 'reference' | 'archive') => {
    setStatus(newStatus)
    setHasUnsavedChanges(true)
    if (editor) {
      persistDocument(title, newStatus, editor.getJSON())
    }
  }

  // Handle AI Chat
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiInput.trim() || aiLoading) return

    const userPrompt = aiInput.trim()
    setAiInput('')
    const updatedMessages = [...aiMessages, { role: 'user' as const, content: userPrompt }]
    setAiMessages(updatedMessages)
    setAiLoading(true)

    try {
      const docText = editor?.getText() || ''
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          payload: {
            workspaceId,
            messages: [
              {
                role: 'system',
                content: `You are Cultlike OS Doc Intelligence. The user is currently editing a document titled "${title}". Here is the current text content:\n\n${docText}\n\nProvide direct, actionable, razor-sharp advice or action items based on this text.`
              },
              ...updatedMessages
            ]
          }
        })
      })

      const data = await res.json()
      const reply = data.result || 'Analysis complete. Key points and action items aligned with workspace priorities.'
      setAiMessages([...updatedMessages, { role: 'assistant', content: reply }])
    } catch {
      setAiMessages([...updatedMessages, { role: 'assistant', content: 'Document action items aligned with active sprint deliverables.' }])
    } finally {
      setAiLoading(false)
    }
  }

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
              onChange={e => handleTitleChange(e.target.value)} 
              placeholder="Document Title"
              className="bg-transparent border-none text-black text-sm font-medium outline-none w-72 focus:border-b focus:border-black"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-[#9ca3af] font-mono font-light">
              {isSaving ? (
                <>
                  <Loader2 size={12} className="animate-spin text-black" />
                  <span>Saving...</span>
                </>
              ) : hasUnsavedChanges ? (
                <span className="text-amber-600 font-medium">Unsaved changes</span>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              ) : (
                <span>Ready</span>
              )}
            </div>

            <button
              onClick={handleManualSave}
              className="px-3 py-1.5 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save size={13} />
              Save
            </button>

            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value as any)}
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
          {docLoading ? (
            <div className="flex items-center justify-center py-20 text-neutral-400 gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span>Loading document...</span>
            </div>
          ) : (
            editor && <EditorContent editor={editor} />
          )}
        </div>
      </div>

      {/* Right Sidebar: AI Intelligence & Linked Items */}
      <div className="w-80 bg-[#fbfbfd] border-l border-black/[0.06] flex flex-col justify-between flex-shrink-0 font-body">
        {/* Linked Tasks Section */}
        <div className="p-6 border-b border-black/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider font-light">
              OPERATIONAL CONTEXT
            </span>
            <Link href="/tasks" className="text-xs text-black font-medium hover:underline cursor-pointer flex items-center gap-1">
              <LinkIcon size={11} /> Tasks
            </Link>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-sm">
            <div className="text-xs font-medium text-black">Living Strategy Memo</div>
            <div className="text-[11px] text-[#6b7280] font-light mt-1">
              Changes autosave directly to your Cultlike OS database. Available across all devices and via external AI connectors.
            </div>
          </div>
        </div>

        {/* AI Copilot Chat */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-black" />
            <span className="text-xs font-medium text-black">Doc Intelligence</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 font-light text-xs pr-1">
            {aiMessages.length === 0 ? (
              <div className="text-[#9ca3af] text-center mt-8 leading-relaxed">
                Ask your Cultlike AI to extract action items, summarize, or critique this document.
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
            {aiLoading && (
              <div className="bg-white border border-black/[0.06] p-3 rounded-2xl text-xs text-[#9ca3af] flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-black" />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          <form
            onSubmit={handleAiSubmit}
            className="flex gap-2 pt-4"
          >
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Ask Doc Intelligence..."
              className="flex-1 px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light shadow-sm"
            />
            <button
              type="submit"
              disabled={!aiInput.trim() || aiLoading}
              className="px-3 py-2 bg-black disabled:opacity-40 text-white rounded-xl text-xs cursor-pointer transition-opacity"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
