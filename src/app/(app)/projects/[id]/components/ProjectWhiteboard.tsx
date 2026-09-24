'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
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
  applyEdgeChanges,
  MarkerType,
  ConnectionLineType
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { supabase } from '@/lib/supabase/client'
import { 
  MousePointer2, StickyNote, Type, Square, 
  Circle, Diamond, Triangle, Database, Frame, 
  CheckSquare, Save, Trash2, Maximize, Copy,
  ChevronRight, Search, Plus, Download, X, Activity,
  Undo2, Redo2, Grid, Sparkles, Image as ImageIcon,
  Palette, Move
} from 'lucide-react'
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG, getInitials } from '@/lib/utils'
import { useDebouncedCallback } from 'use-debounce'
import { toPng } from 'html-to-image'
import type { Project, Task, Priority, TaskStatus } from '@/types'
import { uploadAsset, saveAsset } from '@/lib/supabase/storage'
import { toast } from 'sonner'

// --- COLOR PRESETS ---
export const MIRO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  white: { bg: '#ffffff', text: '#111827', border: '#e2e8f0' },
  yellow: { bg: '#fef08a', text: '#713f12', border: '#facc15' },
  rose: { bg: '#fce7f3', text: '#831843', border: '#f472b6' },
  blue: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
  green: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  purple: { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
  orange: { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
  neon: { bg: '#d9f99d', text: '#14532d', border: '#a3e635' },
  dark: { bg: '#18181b', text: '#ffffff', border: '#27272a' },
}

// --- UNIVERSAL HANDLE STYLES ---
const handleStyle: React.CSSProperties = {
  width: '10px',
  height: '10px',
  background: '#ffffff',
  border: '2px solid #000000',
  borderRadius: '50%',
  zIndex: 10
}

// --- CUSTOM NODES ---

// 1. STICKY NOTE NODE
const StickyNoteNode = ({ id, data, selected }: any) => {
  const colorKey = data.color || 'yellow'
  const theme = MIRO_COLORS[colorKey] || MIRO_COLORS.yellow

  return (
    <div style={{ 
      background: theme.bg, 
      color: theme.text,
      border: selected ? '2px solid #000' : `1px solid ${theme.border}`,
      borderRadius: '4px',
      padding: '16px',
      boxShadow: selected ? '0 12px 28px rgba(0,0,0,0.25)' : '0 4px 14px rgba(0,0,0,0.12)',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      minWidth: '160px',
      minHeight: '160px',
      transition: 'box-shadow 0.15s ease',
      fontFamily: 'Inter, sans-serif'
    }}>
      <NodeResizer minWidth={140} minHeight={140} isVisible={selected} lineStyle={{ borderColor: '#000' }} />
      
      {/* 4 Connected Handles */}
      <Handle type="target" position={Position.Top} id="t" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="r" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="b" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="l" style={handleStyle} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', opacity: 0.7 }}>
        <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em' }}>STICKY</span>
        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>
          {data.author || 'OS'}
        </div>
      </div>

      <textarea 
        defaultValue={data.text || ''} 
        onChange={(e) => data.onChange && data.onChange(id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="Type a quick idea, blocker, or insight..."
        style={{ 
          flex: 1, 
          border: 'none', 
          background: 'transparent', 
          resize: 'none', 
          outline: 'none', 
          fontSize: '14px', 
          fontWeight: 500,
          lineHeight: '1.4',
          color: 'inherit',
          width: '100%'
        }} 
      />
    </div>
  )
}

// 2. SHAPE NODE (Rectangle, Circle, Diamond, Triangle, Cylinder)
const ShapeNode = ({ id, data, selected }: any) => {
  const shapeType = data.shapeType || 'rectangle'
  const colorKey = data.color || 'white'
  const theme = MIRO_COLORS[colorKey] || MIRO_COLORS.white

  const isCircle = shapeType === 'circle'
  const isDiamond = shapeType === 'diamond'
  const isTriangle = shapeType === 'triangle'
  const isCylinder = shapeType === 'cylinder'

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      minWidth: '120px',
      minHeight: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px'
    }}>
      <NodeResizer minWidth={100} minHeight={80} isVisible={selected} lineStyle={{ borderColor: '#000000' }} />

      {/* Handles */}
      <Handle type="target" position={Position.Top} id="t" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="r" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="b" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="l" style={handleStyle} />

      {/* Shape Background */}
      {isDiamond ? (
        <div style={{
          position: 'absolute',
          inset: '8px',
          background: theme.bg,
          transform: 'rotate(45deg)',
          border: selected ? '2px solid #000000' : `1.5px solid ${theme.border}`,
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 1
        }} />
      ) : isCircle ? (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: theme.bg,
          border: selected ? '2px solid #000000' : `1.5px solid ${theme.border}`,
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 1
        }} />
      ) : isCylinder ? (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: theme.bg,
          border: selected ? '2px solid #000000' : `1.5px solid ${theme.border}`,
          borderRadius: '24px / 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 1
        }} />
      ) : isTriangle ? (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon 
            points="50,5 95,95 5,95" 
            fill={theme.bg} 
            stroke={selected ? '#000000' : theme.border} 
            strokeWidth="2" 
          />
        </svg>
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: theme.bg,
          border: selected ? '2px solid #000000' : `1.5px solid ${theme.border}`,
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 1
        }} />
      )}

      {/* Editable Content */}
      <div style={{ position: 'relative', zIndex: 2, width: '85%', textAlign: 'center' }}>
        <textarea
          defaultValue={data.text || ''}
          onChange={(e) => data.onChange && data.onChange(id, e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Shape label..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.text,
            fontSize: '13px',
            fontWeight: 600,
            textAlign: 'center',
            width: '100%',
            resize: 'none',
            fontFamily: 'Inter, sans-serif'
          }}
        />
      </div>
    </div>
  )
}

// 3. TASK CARD NODE
const TaskCardNode = ({ id, data, selected }: any) => {
  const task = data.task as Task
  if (!task) return null

  const priorityColor = PRIORITY_CONFIG[task.priority as Priority]?.color || '#6b6e75'
  const priorityLabel = PRIORITY_CONFIG[task.priority as Priority]?.label || task.priority
  const statusLabel = TASK_STATUS_CONFIG[task.status as TaskStatus]?.label || task.status

  return (
    <div style={{ 
      background: '#ffffff', 
      borderLeft: `4px solid ${priorityColor}`, 
      borderRadius: '12px', 
      padding: '16px', 
      width: '280px', 
      boxShadow: selected ? '0 12px 28px rgba(0,0,0,0.12), 0 0 0 2px #000000' : '0 4px 14px rgba(0, 0, 0, 0.06)',
      border: selected ? '1px solid #000000' : '1px solid rgba(0,0,0,0.08)',
      position: 'relative',
      fontFamily: 'Inter, sans-serif'
    }}>
      <NodeResizer minWidth={240} minHeight={120} isVisible={selected} lineStyle={{ borderColor: '#000000' }} />

      <Handle type="target" position={Position.Top} id="t" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="r" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="b" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="l" style={handleStyle} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: priorityColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {priorityLabel}
        </span>
        <div style={{ 
          fontSize: '10px', 
          color: task.status === 'shipped' ? '#059669' : task.status === 'blocked' ? '#dc2626' : '#6b7280', 
          background: task.status === 'shipped' ? '#ecfdf5' : task.status === 'blocked' ? '#fef2f2' : '#f4f4f5', 
          padding: '2px 8px', 
          borderRadius: '4px', 
          border: '1px solid rgba(0,0,0,0.06)',
          fontWeight: 600
        }}>
          {statusLabel}
        </div>
      </div>

      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '14px', lineHeight: 1.4 }}>
        {task.title}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f4f4f5', paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#ffffff' }}>
            {getInitials(task.owner?.name || 'U')}
          </div>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>{task.owner?.name?.split(' ')[0] || 'Unassigned'}</span>
        </div>
        <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
          {task.time_box_minutes || 45}m
        </span>
      </div>
    </div>
  )
}

// 4. TEXT NODE
const TextNode = ({ id, data, selected }: any) => {
  const textColor = (!data.color || data.color === '#f3f4f6' || data.color === '#ffffff') ? '#111827' : data.color

  return (
    <div style={{ 
      padding: '8px', 
      minWidth: '120px', 
      position: 'relative', 
      border: selected ? '1px dashed #000000' : 'none',
      borderRadius: '4px'
    }}>
      <NodeResizer isVisible={selected} lineStyle={{ borderColor: '#000000' }} />
      <Handle type="target" position={Position.Left} id="l" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="r" style={handleStyle} />

      <textarea
        defaultValue={data.text || ''}
        onChange={(e) => data.onChange && data.onChange(id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: textColor,
          fontSize: data.fontSize || '20px',
          fontWeight: data.fontWeight || 600,
          width: '100%',
          resize: 'none',
          textAlign: data.textAlign || 'left',
          fontFamily: 'Inter, sans-serif',
          lineHeight: '1.3'
        }}
        placeholder="Header or label..."
      />
    </div>
  )
}

// 5. FRAME NODE (Miro Deliverable Container)
const FrameNode = ({ id, data, selected }: any) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: 'rgba(244, 244, 246, 0.4)', 
      border: selected ? '2px solid #000000' : '2px dashed #cbd5e1', 
      borderRadius: '14px',
      position: 'relative',
      minWidth: '250px',
      minHeight: '200px'
    }}>
      <NodeResizer minWidth={200} minHeight={150} isVisible={selected} lineStyle={{ borderColor: '#000000' }} />
      
      <div style={{ 
        position: 'absolute', 
        top: '-32px', 
        left: 0, 
        background: '#ffffff', 
        border: '1px solid #e2e8f0',
        borderBottom: 'none',
        color: '#111827', 
        padding: '4px 12px', 
        borderRadius: '8px 8px 0 0', 
        fontSize: '11px', 
        fontWeight: 700,
        letterSpacing: '0.05em',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <Frame size={12} className="text-neutral-500" />
        <input
          defaultValue={data.title || 'FRAME'}
          onChange={(e) => data.onChangeTitle && data.onChangeTitle(id, e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#111827',
            fontWeight: 700,
            fontSize: '11px',
            width: '140px'
          }}
        />
      </div>
    </div>
  )
}

// 6. IMAGE NODE
const ImageNode = ({ id, data, selected }: any) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      border: selected ? '2px solid #000000' : '1px solid #e2e8f0',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      position: 'relative',
      minWidth: '100px',
      minHeight: '100px',
      background: '#ffffff'
    }}>
      <NodeResizer minWidth={100} minHeight={100} isVisible={selected} lineStyle={{ borderColor: '#000000' }} />
      <Handle type="target" position={Position.Top} id="t" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="r" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="b" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="l" style={handleStyle} />

      <img 
        src={data.url} 
        alt={data.name || 'Whiteboard asset'} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} 
      />
    </div>
  )
}

const nodeTypes = {
  stickyNote: StickyNoteNode,
  shape: ShapeNode,
  taskCard: TaskCardNode,
  text: TextNode,
  frame: FrameNode,
  image: ImageNode
}

// --- MAIN PROJECT WHITEBOARD COMPONENT ---

interface ProjectWhiteboardProps {
  project: Project
}

export default function ProjectWhiteboard({ project }: ProjectWhiteboardProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [activeTool, setActiveTool] = useState<'select' | 'sticky' | 'shape' | 'text' | 'frame'>('select')
  const [selectedShape, setSelectedShape] = useState<'rectangle' | 'circle' | 'diamond' | 'triangle' | 'cylinder'>('rectangle')
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [isShapePickerOpen, setIsShapePickerOpen] = useState(false)
  const [activeColor, setActiveColor] = useState('yellow')
  const [uploading, setUploading] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [gridVariant, setGridVariant] = useState<BackgroundVariant>(BackgroundVariant.Dots)

  // Undo / Redo History
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([])
  const historyIdxRef = useRef<number>(-1)

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pushHistory = useCallback((nds: Node[], eds: Edge[]) => {
    const nextHistory = historyRef.current.slice(0, historyIdxRef.current + 1)
    nextHistory.push({ nodes: JSON.parse(JSON.stringify(nds)), edges: JSON.parse(JSON.stringify(eds)) })
    if (nextHistory.length > 25) nextHistory.shift()
    historyRef.current = nextHistory
    historyIdxRef.current = nextHistory.length - 1
  }, [])

  const handleUndo = () => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current -= 1
      const state = historyRef.current[historyIdxRef.current]
      setNodes(state.nodes)
      setEdges(state.edges)
      debouncedSave(state.nodes, state.edges)
    }
  }

  const handleRedo = () => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      historyIdxRef.current += 1
      const state = historyRef.current[historyIdxRef.current]
      setNodes(state.nodes)
      setEdges(state.edges)
      debouncedSave(state.nodes, state.edges)
    }
  }

  // Load saved state from project
  useEffect(() => {
    if (project.whiteboard_state) {
      const { nodes: savedNodes, edges: savedEdges } = project.whiteboard_state as any
      if (savedNodes && Array.isArray(savedNodes)) {
        // Rehydrate onChange callbacks on nodes
        const hydratedNodes = savedNodes.map((n: Node) => ({
          ...n,
          data: {
            ...n.data,
            onChange: handleNodeTextChange,
            onChangeTitle: handleNodeTitleChange
          }
        }))
        setNodes(hydratedNodes)
        setEdges(savedEdges || [])
        pushHistory(hydratedNodes, savedEdges || [])
      }
    }
  }, [project.id])

  // Debounced auto-save to Supabase
  const debouncedSave = useDebouncedCallback(async (nds: Node[], eds: Edge[]) => {
    setSaving(true)
    const cleanNodes = nds.map(({ data, ...rest }) => {
      const { onChange, onChangeTitle, ...cleanData } = data as any
      return { ...rest, data: cleanData }
    })

    const { error } = await supabase
      .from('projects')
      .update({ 
        whiteboard_state: { nodes: cleanNodes, edges: eds },
        whiteboard_updated_at: new Date().toISOString()
      })
      .eq('id', project.id)
    
    if (!error) setLastSaved(new Date())
    setSaving(false)
  }, 1500)

  const handleNodeTextChange = useCallback((id: string, text: string) => {
    setNodes((nds) => {
      const next = nds.map((node) => node.id === id ? { ...node, data: { ...node.data, text } } : node)
      debouncedSave(next, edges)
      return next
    })
  }, [edges, debouncedSave, setNodes])

  const handleNodeTitleChange = useCallback((id: string, title: string) => {
    setNodes((nds) => {
      const next = nds.map((node) => node.id === id ? { ...node, data: { ...node.data, title } } : node)
      debouncedSave(next, edges)
      return next
    })
  }, [edges, debouncedSave, setNodes])

  // Edge Connection with Miro-style arrowheads
  const onConnect = useCallback((params: Connection) => {
    const newEdge: Edge = {
      ...params,
      id: `edge-${Date.now()}`,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#374151', width: 14, height: 14 },
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      animated: false
    } as Edge

    const nextEdges = addEdge(newEdge, edges)
    setEdges(nextEdges)
    pushHistory(nodes, nextEdges)
    debouncedSave(nodes, nextEdges)
  }, [nodes, edges, debouncedSave, setEdges, pushHistory])

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

  // Add New Node
  const addNode = useCallback((type: string, data: any = {}) => {
    const id = `${type}-${Date.now()}`
    const position = {
      x: 100 + Math.random() * 300,
      y: 100 + Math.random() * 250
    }

    let defaultDimensions: { width?: number; height?: number } = {}
    if (type === 'stickyNote') defaultDimensions = { width: 180, height: 180 }
    if (type === 'shape') {
      defaultDimensions = { width: 160, height: 110 }
      if (!data.color) data.color = 'white'
    }
    if (type === 'text') {
      if (!data.color) data.color = '#111827'
    }
    if (type === 'frame') defaultDimensions = { width: 450, height: 320 }

    const newNode: Node = {
      id,
      type,
      position,
      data: { 
        ...data,
        onChange: handleNodeTextChange,
        onChangeTitle: handleNodeTitleChange
      },
      style: defaultDimensions
    }

    const nextNodes = nodes.concat(newNode)
    setNodes(nextNodes)
    pushHistory(nextNodes, edges)
    debouncedSave(nextNodes, edges)
    toast.success(`Added ${type.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
  }, [nodes, edges, debouncedSave, setNodes, pushHistory, handleNodeTextChange, handleNodeTitleChange])

  // File Upload
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
      toast.error('Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  // Task selection
  const handleTaskSelect = (task: Task) => {
    addNode('taskCard', { task })
    setIsTaskPickerOpen(false)
  }

  // Export Canvas
  const exportAsImage = async () => {
    const element = document.querySelector('.react-flow') as HTMLElement
    if (element) {
      toast.info('Rendering whiteboard image...')
      try {
        const dataUrl = await toPng(element, {
          backgroundColor: '#ffffff',
          filter: (node) => !node.classList?.contains('react-flow__panel')
        })
        const link = document.createElement('a')
        link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-whiteboard.png`
        link.href = dataUrl
        link.click()
        toast.success('Whiteboard exported!')
      } catch {
        toast.error('Export failed.')
      }
    }
  }

  // Auto-generate project dependency flowchart
  const generateDependencyGraph = () => {
    if (!project.tasks || project.tasks.length === 0) {
      toast.info('No tasks in project to diagram.')
      return
    }

    const newNodes: Node[] = []
    const newEdges: Edge[] = []

    project.tasks.forEach((task, index) => {
      const id = `task-${task.id}`
      newNodes.push({
        id,
        type: 'taskCard',
        position: { x: (index % 3) * 320 + 80, y: Math.floor(index / 3) * 200 + 80 },
        data: { task, onChange: handleNodeTextChange },
        style: { width: 280 }
      })

      if (task.blocked_by_task_id) {
        newEdges.push({
          id: `edge-${task.blocked_by_task_id}-${task.id}`,
          source: `task-${task.blocked_by_task_id}`,
          target: id,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
          animated: task.status === 'blocked',
          style: { stroke: '#ef4444', strokeWidth: 2 }
        })
      }
    })

    setNodes(newNodes)
    setEdges(newEdges)
    pushHistory(newNodes, newEdges)
    debouncedSave(newNodes, newEdges)
    toast.success('Generated project dependency graph!')
  }

  // Delete Selected Elements
  const deleteSelected = useCallback(() => {
    const nextNodes = nodes.filter((n) => !n.selected)
    const nextEdges = edges.filter((e) => !e.selected)
    setNodes(nextNodes)
    setEdges(nextEdges)
    pushHistory(nextNodes, nextEdges)
    debouncedSave(nextNodes, nextEdges)
  }, [nodes, edges, setNodes, setEdges, debouncedSave, pushHistory])

  // Duplicate Selected Element
  const duplicateSelected = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected)
    if (selectedNodes.length === 0) return

    const newClones: Node[] = selectedNodes.map(n => ({
      ...n,
      id: `${n.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      position: { x: n.position.x + 30, y: n.position.y + 30 },
      selected: true,
      data: {
        ...n.data,
        onChange: handleNodeTextChange,
        onChangeTitle: handleNodeTitleChange
      }
    }))

    const unselectedOriginals = nodes.map(n => ({ ...n, selected: false }))
    const combined = [...unselectedOriginals, ...newClones]
    setNodes(combined)
    pushHistory(combined, edges)
    debouncedSave(combined, edges)
    toast.success(`Duplicated ${selectedNodes.length} item(s)`)
  }, [nodes, edges, setNodes, pushHistory, debouncedSave, handleNodeTextChange, handleNodeTitleChange])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in textarea/input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

      if (e.key === 'v' || e.key === 'V') setActiveTool('select')
      if (e.key === 's' || e.key === 'S') addNode('stickyNote', { color: activeColor })
      if (e.key === 'r' || e.key === 'R') addNode('shape', { shapeType: 'rectangle', color: 'white' })
      if (e.key === 'c' || e.key === 'C') addNode('shape', { shapeType: 'circle', color: 'white' })
      if (e.key === 'd' || e.key === 'D') addNode('shape', { shapeType: 'diamond', color: 'white' })
      if (e.key === 't' || e.key === 'T') addNode('text', { text: '', fontSize: '20px', color: '#111827' })
      if (e.key === 'f' || e.key === 'F') addNode('frame', { title: 'PHASE DELIVERABLE' })
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected()
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        handleRedo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        duplicateSelected()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeColor, addNode, deleteSelected, duplicateSelected])

  // Change color of selected nodes
  const applyColorToSelected = (colorKey: string) => {
    setActiveColor(colorKey)
    setNodes(nds => {
      const next = nds.map(n => n.selected ? { ...n, data: { ...n.data, color: colorKey } } : n)
      debouncedSave(next, edges)
      return next
    })
    setIsColorPickerOpen(false)
  }

  const selectedCount = nodes.filter(n => n.selected).length

  return (
    <div ref={reactFlowWrapper} style={{ height: '100%', width: '100%', position: 'relative', background: '#ffffff' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        snapToGrid={snapToGrid}
        snapGrid={[16, 16]}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#374151' },
          style: { stroke: '#94a3b8', strokeWidth: 2 }
        }}
        fitView
      >
        <Background color="#e2e8f0" variant={gridVariant} gap={20} size={1.5} />
        <Controls style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }} />
        <MiniMap 
          nodeColor={(n) => {
            if (n.type === 'taskCard') return '#3b82f6'
            if (n.type === 'stickyNote') return '#facc15'
            if (n.type === 'frame') return '#cbd5e1'
            return '#94a3b8'
          }}
          maskColor="rgba(244, 244, 246, 0.7)"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}
        />

        {/* TOP-LEFT PROJECT STATUS & SHORTCUTS PILL */}
        <Panel position="top-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(12px)',
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            padding: '6px 14px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{project.name}</span>
            </div>
            <div style={{ height: '14px', width: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
              {nodes.length} items • {edges.length} connections
            </span>
          </div>
        </Panel>

        {/* TOP-RIGHT CONTROLS & EXPORT */}
        <Panel position="top-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Grid Toggle */}
          <button
            onClick={() => {
              const next = gridVariant === BackgroundVariant.Dots ? BackgroundVariant.Lines : BackgroundVariant.Dots
              setGridVariant(next)
            }}
            title="Toggle Grid Style"
            style={{ ...iconBtnStyle }}
          >
            <Grid size={15} color="#4b5563" />
          </button>

          {/* Snap to Grid */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            title={`Snap to Grid (${snapToGrid ? 'ON' : 'OFF'})`}
            style={{ 
              ...iconBtnStyle, 
              color: snapToGrid ? '#000000' : '#6b7280',
              background: snapToGrid ? '#f4f4f5' : '#ffffff',
              border: snapToGrid ? '1px solid #000000' : '1px solid #e2e8f0'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>16px</span>
          </button>

          {/* Save Status Badge */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(12px)',
            border: '1px solid #e2e8f0', 
            borderRadius: '10px', 
            padding: '6px 12px', 
            fontSize: '11px', 
            color: '#6b7280', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontFamily: 'monospace',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#000000' }}>
                <span className="animate-spin">◌</span> SAVING...
              </span>
            ) : lastSaved ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669' }}>
                <Save size={12} color="#059669" /> SAVED {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              'AUTOSAVE READY'
            )}
          </div>

          {/* Export PNG */}
          <button 
            onClick={exportAsImage} 
            style={{ 
              background: '#000000', 
              border: '1px solid #000000', 
              borderRadius: '10px', 
              color: '#ffffff', 
              padding: '6px 14px', 
              fontSize: '12px', 
              fontWeight: 500,
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'opacity 0.15s'
            }}
          >
            <Download size={13} /> EXPORT
          </button>
        </Panel>

        {/* SELECTED ELEMENT FLOATING TOOLBAR */}
        {selectedCount > 0 && (
          <Panel position="top-center" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(255, 255, 255, 0.98)', 
            backdropFilter: 'blur(12px)',
            padding: '6px 12px', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            zIndex: 100
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>
              {selectedCount} SELECTED
            </span>

            {/* Color Palette Popover Button */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)} 
                title="Change Color"
                style={{ ...iconBtnStyle }}
              >
                <Palette size={14} color="#111827" />
              </button>

              {isColorPickerOpen && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  left: '0',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '8px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px',
                  zIndex: 200,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)'
                }}>
                  {Object.entries(MIRO_COLORS).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => applyColorToSelected(key)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: val.bg,
                        border: `1.5px solid ${val.border}`,
                        cursor: 'pointer'
                      }}
                      title={key}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Duplicate */}
            <button 
              onClick={duplicateSelected} 
              title="Duplicate (Ctrl+D)"
              style={{ ...iconBtnStyle }}
            >
              <Copy size={14} color="#111827" />
            </button>

            {/* Delete */}
            <button 
              onClick={deleteSelected} 
              title="Delete (Backspace)"
              style={{ ...iconBtnStyle, color: '#ef4444' }}
            >
              <Trash2 size={14} color="#ef4444" />
            </button>
          </Panel>
        )}

        {/* MIRO-STYLE FLOATING BOTTOM CREATION DOCK */}
        <Panel position="bottom-center" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          background: 'rgba(255, 255, 255, 0.98)', 
          backdropFilter: 'blur(16px)',
          padding: '8px 12px', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0',
          boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
          zIndex: 50
        }}>
          {/* Select Tool (V) */}
          <button 
            onClick={() => setActiveTool('select')} 
            title="Select & Pan (V)" 
            style={{ 
              ...dockBtnStyle, 
              background: activeTool === 'select' ? '#111827' : 'transparent',
              color: activeTool === 'select' ? '#ffffff' : '#64748b'
            }}
          >
            <MousePointer2 size={16} />
          </button>

          <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />

          {/* Sticky Note Tool (S) */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => addNode('stickyNote', { color: activeColor })} 
              title="Sticky Note (S)" 
              style={{ ...dockBtnStyle }}
            >
              <StickyNote size={16} color="#eab308" />
            </button>
          </div>

          {/* Shapes Tool Dropdown (R, C, D) */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsShapePickerOpen(!isShapePickerOpen)} 
              title="Shapes (R)" 
              style={{ ...dockBtnStyle, color: isShapePickerOpen ? '#111827' : '#64748b' }}
            >
              <Square size={16} />
            </button>

            {isShapePickerOpen && (
              <div style={{
                position: 'absolute',
                bottom: '46px',
                left: '-40px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '6px',
                display: 'flex',
                gap: '6px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                zIndex: 200
              }}>
                <button 
                  onClick={() => { addNode('shape', { shapeType: 'rectangle', color: 'white' }); setIsShapePickerOpen(false) }} 
                  title="Rectangle (R)"
                  style={dockBtnStyle}
                >
                  <Square size={16} />
                </button>
                <button 
                  onClick={() => { addNode('shape', { shapeType: 'circle', color: 'white' }); setIsShapePickerOpen(false) }} 
                  title="Circle (C)"
                  style={dockBtnStyle}
                >
                  <Circle size={16} />
                </button>
                <button 
                  onClick={() => { addNode('shape', { shapeType: 'diamond', color: 'white' }); setIsShapePickerOpen(false) }} 
                  title="Decision Diamond (D)"
                  style={dockBtnStyle}
                >
                  <Diamond size={16} />
                </button>
                <button 
                  onClick={() => { addNode('shape', { shapeType: 'triangle', color: 'white' }); setIsShapePickerOpen(false) }} 
                  title="Triangle"
                  style={dockBtnStyle}
                >
                  <Triangle size={16} />
                </button>
                <button 
                  onClick={() => { addNode('shape', { shapeType: 'cylinder', color: 'white' }); setIsShapePickerOpen(false) }} 
                  title="Database / Cylinder"
                  style={dockBtnStyle}
                >
                  <Database size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Text Tool (T) */}
          <button 
            onClick={() => addNode('text', { text: '', fontSize: '20px' })} 
            title="Text Header (T)" 
            style={dockBtnStyle}
          >
            <Type size={16} color="#64748b" />
          </button>

          {/* Frame Tool (F) */}
          <button 
            onClick={() => addNode('frame', { title: 'PHASE DELIVERABLE' })} 
            title="Deliverable Frame (F)" 
            style={dockBtnStyle}
          >
            <Frame size={16} color="#64748b" />
          </button>

          {/* Task Card Picker */}
          <button 
            onClick={() => setIsTaskPickerOpen(true)} 
            title="Insert Task from Project" 
            style={dockBtnStyle}
          >
            <CheckSquare size={16} color="#2563eb" />
          </button>

          {/* Upload Image */}
          <button 
            onClick={() => fileInputRef.current?.click()} 
            title="Upload Image Asset" 
            disabled={uploading} 
            style={dockBtnStyle}
          >
            {uploading ? (
              <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid #cbd5e1', borderTopColor: '#111827', borderRadius: '50%' }} />
            ) : (
              <ImageIcon size={16} color="#64748b" />
            )}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            multiple 
            style={{ display: 'none' }} 
          />

          <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />

          {/* Auto-Diagram Dependency Graph */}
          <button 
            onClick={generateDependencyGraph} 
            title="Auto-Diagram Task Dependencies" 
            style={{ ...dockBtnStyle, background: 'rgba(0, 0, 0, 0.05)' }}
          >
            <Activity size={16} color="#111827" />
          </button>

          <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />

          {/* Undo (Ctrl+Z) */}
          <button 
            onClick={handleUndo} 
            title="Undo (Ctrl+Z)" 
            style={dockBtnStyle}
          >
            <Undo2 size={15} color="#64748b" />
          </button>

          {/* Redo (Ctrl+Y) */}
          <button 
            onClick={handleRedo} 
            title="Redo (Ctrl+Y)" 
            style={dockBtnStyle}
          >
            <Redo2 size={15} color="#64748b" />
          </button>
        </Panel>
      </ReactFlow>

      {/* TASK SELECTOR MODAL */}
      {isTaskPickerOpen && (
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'rgba(0,0,0,0.4)', 
          backdropFilter: 'blur(4px)',
          zIndex: 200, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div style={{ 
            width: '440px', 
            background: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px', 
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(0,0,0,0.12)'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Insert Task to Whiteboard</h3>
                <p style={{ fontSize: '11px', color: '#64748b' }}>Select any deliverable to place on the canvas</p>
              </div>
              <button 
                onClick={() => setIsTaskPickerOpen(false)} 
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
              {!project.tasks || project.tasks.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No tasks found in this project.
                </div>
              ) : (
                project.tasks.map(task => {
                  const pColor = PRIORITY_CONFIG[task.priority as Priority]?.color || '#64748b'
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => handleTaskSelect(task)}
                      style={{ 
                        padding: '12px 14px', 
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        marginBottom: '4px',
                        border: '1px solid transparent'
                      }}
                      className="hover:bg-slate-50 hover:border-slate-200"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: pColor, textTransform: 'uppercase' }}>
                          {task.priority}
                        </span>
                        <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                          {task.time_box_minutes || 45}m
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{task.title}</div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const dockBtnStyle: React.CSSProperties = {
  padding: '8px',
  background: 'transparent',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#64748b'
}

const iconBtnStyle: React.CSSProperties = {
  padding: '6px 8px',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  transition: 'all 0.15s ease'
}
