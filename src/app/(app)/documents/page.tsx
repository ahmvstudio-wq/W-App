'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Folder, FileText, Clock, AlertTriangle, MoreVertical, Trash2, BookOpen, Layers, CheckSquare, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime, daysSince, getInitials, cn } from '@/lib/utils'
import type { Document } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function DocumentsPage() {
  const router = useRouter()
  const [activeFolder, setActiveFolder] = useState<string>('all')
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  async function fetchDocs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (data) setDocs(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchDocs()
  }, [])

  async function handleCreateDoc() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    let { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', session.user.id).limit(1)
    let workspaceId = workspaces?.[0]?.id

    if (!workspaceId) {
      const { data: newWs } = await supabase.from('workspaces').insert({
        owner_id: session.user.id,
        name: 'My Workspace'
      }).select().single()
      workspaceId = newWs?.id
    }

    if (workspaceId) {
      const { data, error } = await supabase.from('documents').insert({
        workspace_id: workspaceId,
        owner_id: session.user.id,
        title: 'Untitled Strategy Document',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Start writing your document memo...' }] }] },
        status: 'live',
        last_opened_at: new Date().toISOString()
      }).select().single()

      if (data) {
        toast.success('Document created')
        router.push(`/documents/${data.id}`)
      } else {
        toast.error('Failed to create document')
      }
    }
  }

  const folders = [
    { id: 'all', name: 'All Documents', count: docs.length },
    { id: 'live', name: 'Live Working Docs', count: docs.filter(d => d.status === 'live').length },
    { id: 'reference', name: 'Reference', count: docs.filter(d => d.status === 'reference').length },
    { id: 'archive', name: 'Archive', count: docs.filter(d => d.status === 'archive').length },
  ]

  const liveDocsCount = docs.filter(d => d.status === 'live').length
  const refDocsCount = docs.filter(d => d.status === 'reference').length

  const filteredDocs = (activeFolder === 'all' ? docs : docs.filter(d => d.status === activeFolder))
    .filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex h-[calc(100vh-6rem)] -m-8 font-sans overflow-hidden">
      {/* Sidebar Library Filter */}
      <div className="w-64 bg-white border-r border-black/[0.06] p-6 flex flex-col justify-between flex-shrink-0">
        <div>
          <button
            onClick={handleCreateDoc}
            className="w-full mb-6 py-2.5 px-4 bg-black hover:bg-neutral-800 text-white font-normal text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer font-body"
          >
            <Plus size={14} />
            <span>New Document</span>
          </button>

          <div className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider mb-2 font-light px-2">
            Library
          </div>

          <div className="space-y-1 font-body">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer font-light',
                  activeFolder === folder.id
                    ? 'bg-black text-white font-normal shadow-sm'
                    : 'text-[#6b7280] hover:text-black hover:bg-black/[0.03]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Folder size={14} className={activeFolder === folder.id ? 'text-white' : 'text-[#9ca3af]'} />
                  <span>{folder.name}</span>
                </div>
                <span className={cn(
                  'text-[10px] font-mono px-1.5 py-0.5 rounded',
                  activeFolder === folder.id ? 'bg-white/20 text-white' : 'bg-black/[0.04] text-[#6b7280]'
                )}>
                  {folder.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Documents Area */}
      <div className="flex-1 p-8 overflow-y-auto bg-[#fbfbfd] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#6b7280] uppercase tracking-wider mb-1 font-light">
              CALLMY_MGMT • KNOWLEDGE & STRATEGY
            </div>
            <h1 className="text-2xl font-light text-black tracking-tight">
              {folders.find((f) => f.id === activeFolder)?.name}
            </h1>
          </div>

          <div className="relative w-72 font-body">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search strategy memos & docs..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black placeholder:text-[#9ca3af] outline-none shadow-sm font-light"
            />
          </div>
        </div>

        {/* Top Documents Analytics with Ambient Lighting */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-body">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-blue-50/50 border border-black/[0.06] shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Live Working Docs</span>
              <div className="text-2xl font-light text-black tracking-tight">{liveDocsCount}</div>
              <div className="text-[11px] text-[#9ca3af] font-mono">Active Memos in Edit</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-purple-50/50 border border-black/[0.06] shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Knowledge Base</span>
              <div className="text-2xl font-light text-purple-700 tracking-tight">{refDocsCount}</div>
              <div className="text-[11px] text-[#9ca3af] font-mono">Reference & Specs</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Layers size={18} />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50/50 border border-black/[0.06] shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">AI Extraction</span>
              <div className="text-2xl font-light text-emerald-600 tracking-tight">100%</div>
              <div className="text-[11px] text-[#9ca3af] font-mono">Action Items Synced</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#9ca3af] font-body font-light">
            Loading document library...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white border border-dashed border-black/[0.1] text-[#6b7280] text-xs font-body font-light">
            No documents found in this section. Click &quot;New Document&quot; to begin.
          </div>
        ) : (
          <div className="space-y-3 font-body">
            {filteredDocs.map((doc) => (
              <Link
                href={`/documents/${doc.id}`}
                key={doc.id}
                className="group p-4 px-6 rounded-3xl bg-white hover:bg-[#ffffff] border border-black/[0.06] hover:border-black/[0.16] shadow-sm hover:shadow-md flex items-center justify-between gap-4 transition-all block"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-black/[0.04] flex items-center justify-center text-black flex-shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-normal text-black truncate group-hover:underline">
                      {doc.title}
                    </h3>
                    <span className="text-[10px] text-[#9ca3af] font-mono font-light">
                      UPDATED {formatDateTime(doc.updated_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-black/[0.04] text-[#6b7280]">
                    {doc.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
