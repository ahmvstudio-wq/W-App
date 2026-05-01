'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Panel,
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeResizer,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { supabase } from '@/lib/supabase/client'
import { 
  MousePointer2, StickyNote, Type, Square, 
  ArrowUpRight, Image as ImageIcon, Frame, 
  CheckSquare, Save, Trash2, Maximize, 
  ChevronRight, Search, Plus, Download, X, Activity
} from 'lucide-react'
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG, getInitials } from '@/lib/utils'
import { useDebouncedCallback } from 'use-debounce'
import { toPng } from 'html-to-image'
import type { Project, Task } from '@/types'

// --- CUSTOM NODES ---

const StickyNoteNode = ({ data, selected }: any) => {
  const colors = {
    yellow: '#fef3c7',
    pink: '#fce7f3',
    blue: '#dbeafe',
    green: '#dcfce7',
    purple: '#ede9fe'
  }
  
  return (
    <div style={{ 
      background: colors[data.color as keyof typeof colors] || colors.yellow, 
      padding: '16px', 
      borderRadius: '2px',
      boxShadow: '2px 4px 12px rgba(0,0,0,0.15)',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontSize: '13px',
      color: '#000',
      position: 'relative',
      minWidth: '150px',
      minHeight: '150px'
    }}>
      <NodeResizer minWidth={150} minHeight={150} isVisible={selected} />
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{ position: 'absolute', top: '8px', right: '8px', width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>
        {data.author || '??'}
      </div>
      <textarea 
        defaultValue={data.text} 
        onChange={(e) => data.onChange(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="Type something..."
        style={{ 
          flex: 1, border: 'none', background: 'transparent', resize: 'none', 
          outline: 'none', fontSize: '14px', fontFamily: 'inherit', fontWeight: 500,
          color: 'inherit'
        }} 
      />
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  )
}

const TaskCardNode = ({ data, selected }: any) => {
  const task = data.task
  if (!task) return null

  return (
    <div style={{ 
      background: '#1c1e22', borderLeft: `4px solid ${PRIORITY_CONFIG[task.priority]?.color || '#6b6e75'}`, 
      borderRadius: '8px', padding: '16px', width: '280px', 
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      border: selected ? '1px solid #c8f135' : '1px solid #252729'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: PRIORITY_CONFIG[task.priority]?.color, textTransform: 'uppercase' }}>
          {PRIORITY_CONFIG[task.priority]?.label}
        </span>
        <div style={{ fontSize: '10px', color: '#6b6e75', background: '#141618', padding: '2px 8px', borderRadius: '4px', border: '1px solid #252729' }}>
          {TASK_STATUS_CONFIG[task.status]?.label}
        </div>
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0ede8', marginBottom: '16px', lineHeight: 1.4 }}>{task.title}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #252729', paddingTop: '12px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#c8f135', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#000' }}>
              {getInitials(task.owner?.name || 'U')}
           </div>
           <span style={{ fontSize: '11px', color: '#6b6e75' }}>{task.owner?.name?.split(' ')[0]}</span>
         </div>
         <span style={{ fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace' }}>{task.time_box_minutes}m</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  )
}

const TextNode = ({ data, selected }: any) => (
  <div style={{ padding: '8px', minWidth: '100px' }}>
    <NodeResizer isVisible={selected} />
    <textarea
      defaultValue={data.text}
      onChange={(e) => data.onChange(e.target.value)}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        background: 'transparent', border: 'none', outline: 'none',
        color: '#f0ede8', fontSize: data.fontSize || '16px',
        width: '100%', resize: 'none', fontWeight: data.fontWeight || 400,
        textAlign: data.textAlign || 'left', fontFamily: 'inherit'
      }}
      placeholder="Text..."
    />
  </div>
)

const FrameNode = ({ data, selected }: any) => (
  <div style={{ 
    width: '100%', height: '100%', 
    background: 'rgba(200, 241, 53, 0.03)', 
    border: '2px solid rgba(200, 241, 53, 0.2)', 
    borderRadius: '12px',
    position: 'relative'
  }}>
    <NodeResizer minWidth={200} minHeight={200} isVisible={selected} />
    <div style={{ position: 'absolute', top: '-28px', left: 0, background: 'rgba(200, 241, 53, 0.2)', color: '#c8f135', padding: '2px 12px', borderRadius: '4px 4px 0 0', fontSize: '12px', fontWeight: 600 }}>
       {data.title || 'FRAME'}
    </div>
  </div>
)

const ImageNode = ({ data, selected }: any) => (
  <div style={{ 
    width: '100%', height: '100%', 
    border: selected ? '2px solid #c8f135' : 'none',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  }}>
    <NodeResizer minWidth={100} minHeight={100} isVisible={selected} />
    <img 
      src={data.url} 
      alt={data.name} 
      style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} 
    />
  </div>
)

const nodeTypes = {
  stickyNote: StickyNoteNode,
  taskCard: TaskCardNode,
  text: TextNode,
  frame: FrameNode,
  image: ImageNode
}

// --- MAIN COMPONENT ---

interface ProjectWhiteboardProps {
  project: Project
}

import { uploadAsset, saveAsset } from '@/lib/supabase/storage'

export default function ProjectWhiteboard({ project }: ProjectWhiteboardProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [tool, setTool] = useState<'select' | 'sticky' | 'task' | 'text' | 'frame'>('select')
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !project.workspace_id) return

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const publicUrl = await uploadAsset(file, project.id, user.id)
        await saveAsset(file, publicUrl, project.id, project.workspace_id, user.id)
        
        addNode('image', { url: publicUrl, name: file.name })
      }
    } catch (err) {
      console.error('Whiteboard upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (project.whiteboard_state) {
      const { nodes: savedNodes, edges: savedEdges } = project.whiteboard_state as any
      if (savedNodes) setNodes(savedNodes)
      if (savedEdges) setEdges(savedEdges)
    }
  }, [project.id])

  const debouncedSave = useDebouncedCallback(async (nds, eds) => {
    setSaving(true)
    const { error } = await supabase
      .from('projects')
      .update({ 
        whiteboard_state: { nodes: nds, edges: eds },
        whiteboard_updated_at: new Date().toISOString()
      })
      .eq('id', project.id)
    
    if (!error) setLastSaved(new Date())
    setSaving(false)
  }, 2000)

  const onConnect = useCallback((params: Connection) => {
    const newEdges = addEdge(params, edges)
    setEdges(newEdges)
    debouncedSave(nodes, newEdges)
  }, [nodes, edges, debouncedSave, setEdges])

  const onNodesChangeInternal = useCallback((changes: any) => {
    onNodesChange(changes)
    const nextNodes = applyNodeChanges(changes, nodes)
    debouncedSave(nextNodes, edges)
  }, [nodes, edges, onNodesChange, debouncedSave])

  const onEdgesChangeInternal = useCallback((changes: any) => {
    onEdgesChange(changes)
    const nextEdges = applyEdgeChanges(changes, edges)
    debouncedSave(nodes, nextEdges)
  }, [nodes, edges, onEdgesChange, debouncedSave])

  const addNode = useCallback((type: string, data: any = {}) => {
    const id = `${type}-${Date.now()}`
    const newNode: Node = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        ...data,
        onChange: (val: string) => {
          setNodes((nds) => {
            const next = nds.map((node) => node.id === id ? { ...node, data: { ...node.data, text: val } } : node)
            debouncedSave(next, edges)
            return next
          })
        }
      },
      style: type === 'stickyNote' ? { width: 200, height: 200 } : type === 'frame' ? { width: 400, height: 300 } : undefined
    }
    const nextNodes = nodes.concat(newNode)
    setNodes(nextNodes)
    debouncedSave(nextNodes, edges)
  }, [nodes, edges, debouncedSave, setNodes])

  const handleTaskSelect = (task: Task) => {
    addNode('taskCard', { task })
    setIsTaskPickerOpen(false)
  }

  const exportAsImage = async () => {
    const element = document.querySelector('.react-flow') as HTMLElement
    if (element) {
      const dataUrl = await toPng(element, {
        backgroundColor: '#0c0d0f',
        filter: (node) => {
          return !node.classList?.contains('react-flow__panel')
        }
      })
      const link = document.createElement('a')
      link.download = `${project.name}-whiteboard.png`
      link.href = dataUrl
      link.click()
    }
  }

  const generateDependencyGraph = () => {
    if (!project.tasks) return

    const newNodes: Node[] = []
    const newEdges: Edge[] = []

    project.tasks.forEach((task, index) => {
      const id = `task-${task.id}`
      newNodes.push({
        id,
        type: 'taskCard',
        position: { x: (index % 3) * 350, y: Math.floor(index / 3) * 250 },
        data: { task },
        style: { border: task.status === 'blocked' ? '2px dashed #ff4444' : undefined }
      })

      if (task.blocked_by_task_id) {
        newEdges.push({
          id: `edge-${task.blocked_by_task_id}-${task.id}`,
          source: `task-${task.blocked_by_task_id}`,
          target: id,
          animated: task.status === 'blocked',
          style: { stroke: '#ff4444', strokeWidth: 2 }
        })
      }
    })

    setNodes(newNodes)
    setEdges(newEdges)
    debouncedSave(newNodes, newEdges)
  }

  return (
    <div ref={reactFlowWrapper} style={{ height: '100%', width: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#252729" variant={BackgroundVariant.Dots} />
        <Controls style={{ background: '#141618', border: '1px solid #252729', borderRadius: '4px' }} />

        <Panel position="left" style={{ 
          display: 'flex', flexDirection: 'column', gap: '8px', 
          background: '#141618', padding: '8px', borderRadius: '12px', border: '1px solid #252729',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'
        }}>
          <button onClick={() => setTool('select')} style={{ ...toolButtonStyle, background: tool === 'select' ? 'rgba(200,241,53,0.1)' : 'transparent' }}>
            <MousePointer2 size={18} color={tool === 'select' ? '#c8f135' : '#6b6e75'} />
          </button>
          <div style={{ width: '20px', height: '1px', background: '#252729', margin: '4px auto' }} />
          <button onClick={() => addNode('stickyNote', { color: 'yellow', text: '' })} title="Sticky Note" style={toolButtonStyle}>
            <StickyNote size={18} color="#6b6e75" />
          </button>
          <button onClick={() => setIsTaskPickerOpen(true)} title="Task Card" style={toolButtonStyle}>
            <CheckSquare size={18} color="#6b6e75" />
          </button>
          <button onClick={() => addNode('text', { text: '', fontSize: '18px' })} title="Text" style={toolButtonStyle}>
            <Type size={18} color="#6b6e75" />
          </button>
          <button onClick={() => addNode('frame', { title: 'New Frame' })} title="Frame" style={toolButtonStyle}>
            <Frame size={18} color="#6b6e75" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} title="Upload Image" disabled={uploading} style={toolButtonStyle}>
            {uploading ? <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid #6b6e75', borderTopColor: '#c8f135', borderRadius: '50%' }} /> : <ImageIcon size={18} color="#6b6e75" />}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            multiple 
            style={{ display: 'none' }} 
          />
          <div style={{ width: '20px', height: '1px', background: '#252729', margin: '4px auto' }} />
          <button onClick={generateDependencyGraph} title="Auto-Generate Dependency Graph" style={{ ...toolButtonStyle, background: 'rgba(200,241,53,0.05)' }}>
            <Activity size={18} color="#c8f135" />
          </button>
        </Panel>

        <Panel position="top-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', color: '#6b6e75', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'DM Mono, monospace' }}>
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="animate-spin">◌</span> SAVING...
              </span>
            ) : lastSaved ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Save size={12} color="#c8f135" /> SAVED {lastSaved.toLocaleTimeString()}
              </span>
            ) : (
              'READY'
            )}
          </div>
          <button onClick={exportAsImage} style={{ background: '#141618', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', padding: '8px 12px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={14} /> EXPORT
          </button>
        </Panel>
      </ReactFlow>

      {isTaskPickerOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{ width: '400px', background: '#141618', border: '1px solid #252729', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #252729', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px' }}>Add Task to Whiteboard</h3>
                <button onClick={() => setIsTaskPickerOpen(false)} style={{ background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {project.tasks?.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#6b6e75', fontSize: '13px' }}>No tasks found in project.</div>
                ) : (
                  project.tasks?.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => handleTaskSelect(task)}
                      style={{ padding: '12px 16px', borderBottom: '1px solid #252729', cursor: 'pointer' }}
                      className="hover:bg-[#1c1e22] transition-colors"
                    >
                      <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#f0ede8' }}>{task.title}</div>
                      <div style={{ fontSize: '10px', color: '#6b6e75' }}>{task.status.toUpperCase()} • {task.priority.toUpperCase()}</div>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

const toolButtonStyle: React.CSSProperties = {
  padding: '10px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 150ms',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}
