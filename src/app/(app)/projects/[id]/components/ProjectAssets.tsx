'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { uploadAsset, saveAsset } from '@/lib/supabase/storage'
import { 
  Upload, File, Image as ImageIcon, Video, FileText, 
  Search, Grid, List as ListIcon, X, Download, Trash2,
  Play, Loader2
} from 'lucide-react'
import { cn, formatSize } from '@/lib/utils'
import type { Asset } from '@/types'

interface ProjectAssetsProps {
  projectId: string
  workspaceId: string
}

export default function ProjectAssets({ projectId, workspaceId }: ProjectAssetsProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAssets()
  }, [projectId])

  async function fetchAssets() {
    setLoading(true)
    const { data } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (data) setAssets(data)
    setLoading(false)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  async function handleFiles(files: FileList) {
    setIsUploading(true)
    setUploadError(null)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Size limit: 100MB
        if (file.size > 100 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 100MB limit.`)
        }

        const publicUrl = await uploadAsset(file, projectId, user.id)
        await saveAsset(file, publicUrl, projectId, workspaceId, user.id)
      }
      fetchAssets()
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  async function deleteAsset(asset: Asset) {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      // The file_path in our DB is the full URL now based on the brief's saveAsset implementation
      // We need to extract the relative path for remove()
      const urlParts = asset.url.split('/storage/v1/object/public/project-assets/')
      const relativePath = urlParts[1]

      if (relativePath) {
        await supabase.storage.from('project-assets').remove([relativePath])
      }
      
      await supabase.from('assets').delete().eq('id', asset.id)
      
      if (selectedAsset?.id === asset.id) setSelectedAsset(null)
      fetchAssets()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Upload Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ 
          border: dragActive ? '2px dashed #c8f135' : '2px dashed #252729', 
          borderRadius: '12px', padding: '48px',
          textAlign: 'center', cursor: 'pointer', marginBottom: '24px',
          background: dragActive ? 'rgba(200, 241, 53, 0.05)' : '#1c1e22', 
          transition: 'all 150ms',
          position: 'relative'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => e.target.files && handleFiles(e.target.files)} 
          multiple 
          style={{ display: 'none' }} 
        />
        
        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Loader2 size={32} className="animate-spin" color="#c8f135" style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '15px' }}>Uploading your assets...</h4>
          </div>
        ) : (
          <>
            <Upload size={32} color={dragActive ? "#c8f135" : "#6b6e75"} style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>
              {dragActive ? "Drop to upload" : "Upload Assets"}
            </h4>
            <p style={{ color: '#6b6e75', fontSize: '13px' }}>
              Drag and drop or click to browse (Max 100MB)
            </p>
          </>
        )}

        {uploadError && (
          <div style={{ marginTop: '16px', color: '#ff4444', fontSize: '12px', background: 'rgba(255, 68, 68, 0.1)', padding: '8px', borderRadius: '4px' }}>
            {uploadError}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b6e75' }} />
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            type="text" 
            placeholder="Search assets..." 
            style={{ 
              width: '100%', padding: '8px 12px 8px 32px', background: '#141618', 
              border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', 
              fontSize: '13px', outline: 'none' 
            }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setView('grid')}
            style={{ 
              padding: '6px', background: view === 'grid' ? '#252729' : 'transparent', 
              border: 'none', borderRadius: '4px', cursor: 'pointer', color: view === 'grid' ? '#f0ede8' : '#6b6e75' 
            }}
          >
            <Grid size={16} />
          </button>
          <button 
            onClick={() => setView('list')}
            style={{ 
              padding: '6px', background: view === 'list' ? '#252729' : 'transparent', 
              border: 'none', borderRadius: '4px', cursor: 'pointer', color: view === 'list' ? '#f0ede8' : '#6b6e75' 
            }}
          >
            <ListIcon size={16} />
          </button>
        </div>
      </div>

      {/* Asset Content */}
      {loading ? (
        <div style={{ color: '#6b6e75', textAlign: 'center', padding: '40px' }}>Loading library...</div>
      ) : filteredAssets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', color: '#6b6e75', background: '#141618', borderRadius: '12px', border: '1px solid #252729' }}>
          No assets in this project.
        </div>
      ) : view === 'grid' ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
          gap: '16px'
        }}>
          {filteredAssets.map(asset => (
            <div 
              key={asset.id} 
              onClick={() => setSelectedAsset(asset)}
              style={{ 
                background: '#1c1e22', border: '1px solid #252729', borderRadius: '8px', 
                overflow: 'hidden', cursor: 'pointer'
              }}
            >
              <div style={{ height: '120px', background: '#0c0d0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {asset.mime_type?.startsWith('image/') ? (
                  <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : asset.mime_type?.startsWith('video/') ? (
                  <Video size={32} color="#6b6e75" />
                ) : (
                  <FileText size={32} color="#6b6e75" />
                )}
              </div>
              <div style={{ padding: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {asset.name}
                </div>
                <div style={{ fontSize: '10px', color: '#6b6e75', marginTop: '4px' }}>
                  {formatSize(asset.file_size)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '8px', overflow: 'hidden' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#141618', borderBottom: '1px solid #252729' }}>
                <tr>
                  <th style={{ padding: '12px 16px', color: '#6b6e75', fontSize: '11px', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '12px 16px', color: '#6b6e75', fontSize: '11px', textTransform: 'uppercase' }}>Size</th>
                  <th style={{ padding: '12px 16px', color: '#6b6e75', fontSize: '11px', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => (
                  <tr key={asset.id} style={{ borderBottom: '1px solid #252729' }} onClick={() => setSelectedAsset(asset)}>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{asset.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#6b6e75' }}>{formatSize(asset.file_size)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#6b6e75' }}>{new Date(asset.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                       <button onClick={(e) => { e.stopPropagation(); deleteAsset(asset); }} style={{ background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer' }}>
                         <Trash2 size={14} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Lightbox */}
      {selectedAsset && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }}>
           <div onClick={() => setSelectedAsset(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)' }} />
           
           <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
              <button onClick={() => setSelectedAsset(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#f0ede8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
              
              {selectedAsset.mime_type?.startsWith('image/') ? (
                <img src={selectedAsset.url} alt={selectedAsset.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : selectedAsset.mime_type?.startsWith('video/') ? (
                <video src={selectedAsset.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%' }} />
              ) : (
                <div style={{ textAlign: 'center', background: '#1c1e22', padding: '48px', borderRadius: '12px', border: '1px solid #252729' }}>
                   <FileText size={64} color="#6b6e75" style={{ marginBottom: '24px' }} />
                   <h2>{selectedAsset.name}</h2>
                   <p style={{ color: '#6b6e75', margin: '16px 0 32px' }}>Preview not available for this file type.</p>
                   <a href={selectedAsset.url} download className="btn-accent" style={{ textDecoration: 'none', padding: '12px 24px', borderRadius: '6px' }}>
                     Download File
                   </a>
                </div>
              )}
           </div>

           <div style={{ width: '300px', background: '#141618', borderLeft: '1px solid #252729', padding: '24px', zIndex: 1 }}>
              <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6b6e75', textTransform: 'uppercase', marginBottom: '4px' }}>File Name</label>
                  <div style={{ fontSize: '14px', wordBreak: 'break-all' }}>{selectedAsset.name}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6b6e75', textTransform: 'uppercase', marginBottom: '4px' }}>Size</label>
                  <div style={{ fontSize: '14px' }}>{formatSize(selectedAsset.file_size)}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#6b6e75', textTransform: 'uppercase', marginBottom: '4px' }}>Mime Type</label>
                  <div style={{ fontSize: '14px' }}>{selectedAsset.mime_type}</div>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                  <a href={selectedAsset.url} download style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', textDecoration: 'none', fontSize: '13px' }}>
                    Download
                  </a>
                  <button onClick={() => deleteAsset(selectedAsset)} style={{ flex: 1, padding: '10px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff4444', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    Delete
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
