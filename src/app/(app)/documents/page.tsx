'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Folder, FileText, Clock, AlertTriangle, MoreVertical, Trash2, BookOpen, Layers, CheckSquare, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime, daysSince, getInitials, cn } from '@/lib/utils'
import type { Document } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getCached, setCached } from '@/lib/cache/swrCache'

export default function DocumentsPage() {
  const router = useRouter()
  const [activeFolder, setActiveFolder] = useState<string>('all')
  const [docs, setDocs] = useState<Document[]>(() => getCached<Document[]>('documents_list') || [])
  const [loading, setLoading] = useState(() => !(getCached<Document[]>('documents_list')?.length))
  const [searchQuery, setSearchQuery] = useState('')
  const [googleFiles, setGoogleFiles] = useState<any[]>([])
  const [loadingGoogleFiles, setLoadingGoogleFiles] = useState(false)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [creatingGoogleDoc, setCreatingGoogleDoc] = useState(false)

  async function fetchGoogleFiles() {
    setLoadingGoogleFiles(true)
    try {
      const res = await fetch('/api/docs/google/files')
      const data = await res.json()
      if (data.success && data.connected) {
        setIsGoogleConnected(true)
        setGoogleFiles(data.files || [])
      } else {
        setIsGoogleConnected(false)
        setGoogleFiles([])
      }
    } catch {
      setIsGoogleConnected(false)
    } finally {
      setLoadingGoogleFiles(false)
    }
  }

  async function fetchDocs() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setDocs([])
      setLoading(false)
      return
    }

    let activeWsId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null
    if (!activeWsId) {
      const { data: userWs } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', session.user.id)
        .limit(1)

      if (userWs && userWs.length > 0) {
        activeWsId = userWs[0].id
        if (typeof window !== 'undefined') {
          localStorage.setItem('focus_active_workspace_id', userWs[0].id)
        }
      }
    }

    if (!activeWsId) {
      setDocs([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('workspace_id', activeWsId)
      .order('updated_at', { ascending: false })
    
    if (data) {
      setDocs(data)
      setCached('documents_list', data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDocs()
    fetchGoogleFiles()
  }, [])

  async function handleCreateGoogleDoc() {
    setCreatingGoogleDoc(true)
    try {
      let activeWsId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null
      const res = await fetch('/api/docs/google/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Executive Memo - ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
          workspace_id: activeWsId
        })
      })

      const data = await res.json()
      if (data.success && data.editUrl) {
        toast.success('Google Doc created! Opening in Google Docs...')
        window.open(data.editUrl, '_blank')
        fetchDocs()
        fetchGoogleFiles()
      } else {
        toast.error(data.error || 'Could not create Google Doc. Please verify Google Workspace connection.')
      }
    } catch (err: any) {
      toast.error(`Error creating Google Doc: ${err.message}`)
    } finally {
      setCreatingGoogleDoc(false)
    }
  }

  async function handleCreateDoc() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    let workspaceId = typeof window !== 'undefined' ? localStorage.getItem('focus_active_workspace_id') : null
    if (!workspaceId) {
      let { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', session.user.id).limit(1)
      workspaceId = workspaces?.[0]?.id
    }

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
    { id: 'google_docs', name: 'Google Docs & Drive', count: googleFiles.length, isGoogle: true },
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
          <div className="space-y-2 mb-6">
            <button
              onClick={handleCreateGoogleDoc}
              disabled={creatingGoogleDoc}
              className="w-full py-2.5 px-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-normal text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer font-body"
            >
              <FileText size={14} />
              <span>{creatingGoogleDoc ? 'Creating Doc...' : '+ New Google Doc'}</span>
            </button>

            <button
              onClick={handleCreateDoc}
              className="w-full py-2 px-3.5 bg-white hover:bg-neutral-50 text-black border border-black/[0.08] font-light text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer font-body"
            >
              <Plus size={13} />
              <span>+ Internal Memo</span>
            </button>
          </div>

          <div className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider mb-2 font-light px-2">
            Library
          </div>

          <div className="space-y-1 font-body">
            {folders.map((folder: any) => (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer font-light',
                  activeFolder === folder.id
                    ? folder.isGoogle ? 'bg-blue-600 text-white font-normal shadow-sm' : 'bg-black text-white font-normal shadow-sm'
                    : 'text-[#6b7280] hover:text-black hover:bg-black/[0.03]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Folder size={14} className={activeFolder === folder.id ? 'text-white' : folder.isGoogle ? 'text-blue-500' : 'text-[#9ca3af]'} />
                  <span>{folder.name}</span>
                </div>
                <span className={cn(
                  'text-[10px] font-mono px-1.5 py-0.5 rounded',
                  activeFolder === folder.id ? 'bg-white/20 text-white' : folder.isGoogle ? 'bg-blue-50 text-blue-700' : 'bg-black/[0.04] text-[#6b7280]'
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
            <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1 font-light">
              KNOWLEDGE &amp; STRATEGY
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
              <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Google Drive &amp; Docs</span>
              <div className="text-2xl font-light text-blue-700 tracking-tight">{googleFiles.length}</div>
              <div className="text-[11px] text-[#9ca3af] font-mono">Live Drive Documents</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50/50 border border-black/[0.06] shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Drive Connection</span>
              <div className="text-2xl font-light text-emerald-600 tracking-tight">
                {isGoogleConnected ? 'Active' : 'Standby'}
              </div>
              <div className="text-[11px] text-[#9ca3af] font-mono">
                {isGoogleConnected ? 'Direct 2-way Google Docs API' : 'Not authenticated in Settings'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {activeFolder === 'google_docs' ? (
          /* Google Drive / Docs View */
          loadingGoogleFiles ? (
            <div className="py-20 text-center text-xs text-[#9ca3af] font-body font-light">
              Loading Google Drive files...
            </div>
          ) : !isGoogleConnected ? (
            <div className="py-16 text-center rounded-3xl bg-white border border-black/[0.08] p-8 space-y-4">
              <FileText size={36} className="mx-auto text-blue-500 opacity-80" />
              <div>
                <h3 className="text-base font-normal text-black">Google Workspace Not Connected</h3>
                <p className="text-xs text-[#6b7280] font-light max-w-sm mx-auto mt-1">
                  Connect your Google Workspace in Settings to view and edit your Google Docs, Sheets, and Drive files directly in Cultlike.
                </p>
              </div>
              <a
                href="/api/auth/google?service=workspace"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-xs"
              >
                <span>Connect Google Workspace</span>
              </a>
            </div>
          ) : googleFiles.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white border border-dashed border-black/[0.1] p-8 space-y-3">
              <FileText size={32} className="mx-auto text-blue-400 opacity-60" />
              <p className="text-xs text-[#6b7280] font-light">No Google Docs or Drive files found.</p>
              <button
                onClick={handleCreateGoogleDoc}
                disabled={creatingGoogleDoc}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium cursor-pointer"
              >
                Create First Google Doc
              </button>
            </div>
          ) : (
            <div className="space-y-3 font-body">
              {googleFiles
                .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((file) => (
                  <a
                    key={file.id}
                    href={file.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="group p-4 px-6 rounded-3xl bg-white hover:bg-blue-50/30 border border-black/[0.06] hover:border-blue-200 shadow-sm hover:shadow-md flex items-center justify-between gap-4 transition-all block cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-medium text-black truncate group-hover:underline flex items-center gap-2">
                          <span>{file.name}</span>
                          <span className="text-[10px] text-blue-600 font-mono font-normal">↗</span>
                        </h3>
                        <span className="text-[10px] text-[#9ca3af] font-mono font-light">
                          MODIFIED {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200/50">
                        {file.isGoogleDoc ? 'Google Doc' : file.isGoogleSheet ? 'Google Sheet' : file.isPdf ? 'PDF' : 'Google Drive'}
                      </span>
                    </div>
                  </a>
                ))}
            </div>
          )
        ) : loading ? (
          <div className="py-20 text-center text-xs text-[#9ca3af] font-body font-light">
            Loading document library...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white border border-dashed border-black/[0.1] text-[#6b7280] text-xs font-body font-light">
            No documents found in this section. Click &quot;New Document&quot; to begin.
          </div>
        ) : (
          <div className="space-y-3 font-body">
            {filteredDocs.map((doc) => {
              const docContent = doc.content as any
              const isGoogle = docContent?.type === 'google_doc'
              const editUrl = docContent?.google_edit_url as string | undefined

              return isGoogle && editUrl ? (
                <a
                  href={editUrl}
                  target="_blank"
                  rel="noreferrer"
                  key={doc.id}
                  className="group p-4 px-6 rounded-3xl bg-white hover:bg-blue-50/20 border border-black/[0.06] hover:border-blue-200 shadow-sm hover:shadow-md flex items-center justify-between gap-4 transition-all block cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-normal text-black truncate group-hover:underline flex items-center gap-2">
                        <span>{doc.title}</span>
                        <span className="text-[10px] text-blue-600 font-mono">↗</span>
                      </h3>
                      <span className="text-[10px] text-[#9ca3af] font-mono font-light">
                        GOOGLE DOC • UPDATED {formatDateTime(doc.updated_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200/50">
                      Google Doc
                    </span>
                  </div>
                </a>
              ) : (
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
