'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Folder, FileText, Clock, AlertTriangle, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime, daysSince, getInitials, DOCUMENT_STATUS_CONFIG } from '@/lib/utils'
import type { Document } from '@/types'

export default function DocumentsPage() {
  const [activeFolder, setActiveFolder] = useState<string>('all')

  const mockDocs: Document[] = [
    { id: '1', workspace_id: '1', title: 'Q3 Strategy Memo', status: 'live', owner_id: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_opened_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), owner: { id: '1', email: 'w@focus.os', name: 'W', created_at: '' } },
    { id: '2', workspace_id: '1', title: 'Engineering Onboarding', status: 'reference', owner_id: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_opened_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), owner: { id: '1', email: 'w@focus.os', name: 'W', created_at: '' } },
    { id: '3', workspace_id: '1', title: 'Old pricing research', status: 'archive', owner_id: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_opened_at: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(), owner: { id: '1', email: 'w@focus.os', name: 'W', created_at: '' } },
  ]

  const folders = [
    { id: 'all', name: 'All Documents', count: mockDocs.length },
    { id: 'live', name: 'Live Working Docs', count: mockDocs.filter(d => d.status === 'live').length },
    { id: 'reference', name: 'Reference', count: mockDocs.filter(d => d.status === 'reference').length },
    { id: 'archive', name: 'Archive', count: mockDocs.filter(d => d.status === 'archive').length },
    { id: 'delete', name: 'Pending Deletion', count: mockDocs.filter(d => d.status === 'delete').length },
  ]

  const filteredDocs = activeFolder === 'all' ? mockDocs : mockDocs.filter(d => d.status === activeFolder)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <div style={{ width: '260px', background: '#141618', borderRight: '1px solid #252729', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px' }}>
          <button className="btn-accent" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', marginBottom: '24px' }}>
            <Plus size={16} /> New Document
          </button>
          
          <div style={{ fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '8px' }}>
            Library
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {folders.map(folder => (
              <button key={folder.id} onClick={() => setActiveFolder(folder.id)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', background: activeFolder === folder.id ? '#1c1e22' : 'transparent',
                border: 'none', borderRadius: '6px', color: activeFolder === folder.id ? '#f0ede8' : '#6b6e75',
                cursor: 'pointer', transition: 'all 150ms', fontSize: '13px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Folder size={14} /> {folder.name}
                </div>
                <span style={{ fontSize: '11px', background: activeFolder === folder.id ? '#252729' : 'transparent', padding: '2px 6px', borderRadius: '4px' }}>
                  {folder.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>
              {folders.find(f => f.id === activeFolder)?.name}
            </h1>
            <p style={{ color: '#6b6e75', fontSize: '13px' }}>Documents older than 60 days are auto-queued for deletion.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b6e75' }} />
              <input type="text" placeholder="Search..." style={{ width: '100%', padding: '8px 12px 8px 32px', background: '#141618', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '13px', outline: 'none' }} />
            </div>
            <button style={{ padding: '8px 12px', background: '#141618', border: '1px solid #252729', borderRadius: '6px', color: '#6b6e75', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Filter size={14} /> Sort
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredDocs.map(doc => {
            const daysUnopened = doc.last_opened_at ? daysSince(doc.last_opened_at) : 0
            const needsAttention = daysUnopened > 30 && doc.status !== 'archive' && doc.status !== 'delete'
            const critical = daysUnopened > 60 && doc.status !== 'archive' && doc.status !== 'delete'

            return (
              <Link href={`/documents/${doc.id}`} key={doc.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card-hover" style={{ 
                  background: '#141618', border: `1px solid ${critical ? '#ff4444' : needsAttention ? '#f5a623' : '#252729'}`, 
                  borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '20px' 
                }}>
                  <div style={{ width: '40px', height: '40px', background: '#1c1e22', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8f135', flexShrink: 0 }}>
                    <FileText size={20} />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</span>
                      <span className="status-pill" style={{ background: '#1c1e22', color: DOCUMENT_STATUS_CONFIG[doc.status].color }}>
                        {DOCUMENT_STATUS_CONFIG[doc.status].label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#6b6e75', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#252729', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: '#f0ede8' }}>
                          {getInitials(doc.owner?.name)}
                        </div>
                        {doc.owner?.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: critical ? '#ff4444' : needsAttention ? '#f5a623' : '#6b6e75' }}>
                        <Clock size={12} /> Last opened {daysUnopened} days ago
                      </div>
                    </div>
                  </div>

                  {(needsAttention || critical) && (
                    <div style={{ padding: '6px 12px', background: critical ? 'rgba(255, 68, 68, 0.1)' : 'rgba(245, 166, 35, 0.1)', color: critical ? '#ff4444' : '#f5a623', borderRadius: '6px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={12} /> {critical ? 'QUEUED FOR DELETION' : 'STALE'}
                    </div>
                  )}

                  <button style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', color: '#6b6e75', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', cursor: 'pointer', transition: 'background 150ms' }} onClick={e => { e.preventDefault(); /* open menu */ }}>
                    <MoreVertical size={16} />
                  </button>
                </div>
              </Link>
            )
          })}
          {filteredDocs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px', background: '#141618', border: '1px dashed #252729', borderRadius: '12px', color: '#6b6e75' }}>
              <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '16px', color: '#f0ede8', marginBottom: '8px' }}>No documents found</h3>
              <p style={{ fontSize: '13px' }}>Start writing to clarify your thoughts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
