'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useWorkspace } from '@/context/WorkspaceContext'
import { 
  Building2, Check, ChevronDown, Plus, Settings, 
  Users, Shield, ArrowRight, X, Loader2 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function WorkspaceSwitcher() {
  const { 
    workspaces, 
    currentWorkspace, 
    setCurrentWorkspace, 
    userRole, 
    createWorkspace 
  } = useWorkspace()

  const [isOpen, setIsOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newWsName, setNewWsName] = useState('')
  const [creating, setCreating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectWorkspace = (ws: any) => {
    setCurrentWorkspace(ws)
    setIsOpen(false)
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWsName.trim() || creating) return

    setCreating(true)
    try {
      const created = await createWorkspace(newWsName.trim())
      if (created) {
        setNewWsName('')
        setIsCreateModalOpen(false)
      }
    } finally {
      setCreating(false)
    }
  }

  const roleLabel = userRole ? userRole.toUpperCase() : 'MEMBER'

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition-all duration-150 cursor-pointer border",
            isOpen 
              ? "bg-black/[0.04] border-black/[0.12] shadow-xs" 
              : "bg-transparent hover:bg-black/[0.03] border-transparent hover:border-black/[0.06]"
          )}
          title="Switch Workspace"
        >
          <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center text-[10px] font-mono font-medium shrink-0 shadow-xs">
            {currentWorkspace?.name ? currentWorkspace.name.substring(0, 2).toUpperCase() : 'WS'}
          </div>

          <div className="flex flex-col min-w-0 pr-0.5">
            <span className="text-xs font-normal text-black truncate max-w-[130px] leading-tight">
              {currentWorkspace?.name || 'My Workspace'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-mono tracking-wider text-[#8a8d95] uppercase font-light">
                {roleLabel}
              </span>
            </div>
          </div>

          <ChevronDown 
            size={12} 
            className={cn("text-[#8a8d95] transition-transform duration-200 shrink-0", isOpen && "rotate-180")} 
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-64 rounded-2xl bg-white border border-black/[0.08] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-2 border-b border-black/[0.05] flex items-center justify-between">
              <span className="text-[10px] font-mono font-medium tracking-wider text-[#8a8d95] uppercase">
                Workspaces ({workspaces.length})
              </span>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Multi-Tenant
              </span>
            </div>

            {/* List of Workspaces */}
            <div className="py-1 max-h-56 overflow-y-auto space-y-0.5">
              {workspaces.map((ws) => {
                const isCurrent = ws.id === currentWorkspace?.id
                return (
                  <button
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer",
                      isCurrent 
                        ? "bg-black/[0.04] text-black font-medium" 
                        : "text-[#4b5563] hover:bg-black/[0.02] hover:text-black"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-mono font-medium shrink-0",
                        isCurrent ? "bg-black text-white" : "bg-black/[0.06] text-[#4b5563]"
                      )}>
                        {ws.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[140px] text-xs">
                        {ws.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {ws.role && (
                        <span className="text-[9px] font-mono uppercase text-[#8a8d95] px-1 py-0.2 rounded bg-black/[0.03]">
                          {ws.role}
                        </span>
                      )}
                      {isCurrent && (
                        <Check size={13} className="text-black stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Actions Divider */}
            <div className="pt-1 mt-1 border-t border-black/[0.06] space-y-0.5">
              <button
                onClick={() => {
                  setIsOpen(false)
                  setIsCreateModalOpen(true)
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-black hover:bg-black/[0.03] transition-colors cursor-pointer"
              >
                <Plus size={13} className="text-[#6b7280]" />
                <span>Create New Workspace</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/settings?tab=workspace')
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-[#6b7280] hover:text-black hover:bg-black/[0.03] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Settings size={13} />
                  <span>Workspace Settings &amp; Team</span>
                </div>
                <ArrowRight size={11} className="text-[#9ca3af]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-normal text-black">Create Workspace</h3>
                  <p className="text-xs text-[#6b7280] font-light">
                    Set up an isolated workspace for a new client, agency, or team.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full hover:bg-black/[0.05] text-[#8a8d95] hover:text-black transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-[#6b7280] block mb-1.5 uppercase tracking-wider">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Creator Studio, Personal Projects, Main Hub"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                  autoFocus
                />
              </div>

              <div className="p-3.5 bg-black/[0.02] border border-black/[0.05] rounded-xl text-xs text-[#6b7280] font-light flex items-center gap-2">
                <Shield size={14} className="text-black shrink-0" />
                <span>You will be assigned as the <strong>Owner</strong> with full administrative privileges.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#6b7280] hover:text-black transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newWsName.trim()}
                  className="px-5 py-2.5 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-xs flex items-center gap-2"
                >
                  {creating && <Loader2 size={13} className="animate-spin" />}
                  <span>{creating ? 'Creating...' : 'Create Workspace'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
