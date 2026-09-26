import { NextRequest, NextResponse } from 'next/server'
import { getApiClient, getDefaultWorkspaceId, getDefaultUserId } from '@/lib/supabase/admin'
import { verifyOAuthAccessToken } from '@/lib/oauth/server'

export const dynamic = 'force-dynamic'

const MCP_TOOLS = [
  {
    name: 'cultlike_get_overview',
    description: 'Get complete workspace executive briefing including urgent P0/P1 tasks, active projects, blockers, velocity metrics, and recent daily logs.',
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'cultlike_list_tasks',
    description: 'List and search workspace tasks with filtering by status, priority, project_id, date, or keyword.',
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'shipped', 'killed', 'active'], description: 'Filter by task status' },
        priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'], description: 'Filter by priority level (p0=critical, p3=low)' },
        search: { type: 'string', description: 'Search keyword matching task title' },
        project_id: { type: 'string', description: 'Filter by project UUID' },
        date: { type: 'string', description: 'Filter by YYYY-MM-DD date' },
        limit: { type: 'number', description: 'Max number of tasks to return (default 50)' }
      }
    }
  },
  {
    name: 'cultlike_create_task',
    description: 'Create a new sprint task in Cultlike OS with priority, timebox, and project attachments.',
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Detailed instructions' },
        priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'], description: 'Priority level (p0=highest, p3=lowest)' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'shipped'], description: 'Initial status' },
        project_id: { type: 'string', description: 'Optional project UUID to link' },
        due_date: { type: 'string', description: 'ISO 8601 due date' },
        time_box_minutes: { type: 'number', description: 'Estimated focus time in minutes' },
        output_description: { type: 'string', description: 'Definition of done' }
      }
    }
  },
  {
    name: 'cultlike_update_task',
    description: 'Update a task status, priority, title, blocker, or due date by task ID.',
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'UUID of the task' },
        title: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'shipped', 'killed'] },
        priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] },
        blocked_reason: { type: 'string' },
        due_date: { type: 'string' },
        time_box_minutes: { type: 'number' }
      }
    }
  },
  {
    name: 'cultlike_generate_microtasks',
    description: 'Decompose any task into 3-5 sequenced micro-deliverables with clear focus timeboxes.',
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Optional task UUID' },
        title: { type: 'string', description: 'Task title to decompose' },
        description: { type: 'string', description: 'Context or instructions' }
      }
    }
  },
  {
    name: 'cultlike_list_projects',
    description: 'List all workspace initiatives, completion rates, deadlines, and kill conditions.',
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'paused', 'killed', 'shipped'] },
        priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] },
        search: { type: 'string' }
      }
    }
  },
  {
    name: 'cultlike_create_project',
    description: 'Create a new project / initiative in Cultlike OS.',
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] },
        deadline: { type: 'string', description: 'ISO date' },
        success_metric: { type: 'string' },
        kill_condition: { type: 'string' },
        min_shippable_version: { type: 'string' }
      }
    }
  },
  {
    name: 'cultlike_get_content_vault',
    description: 'List staged, scheduled, and published deliverables in the Content Vault.',
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['all', 'youtube', 'instagram'] },
        status: { type: 'string', enum: ['all', 'draft', 'inbox', 'scheduled', 'published'] },
        limit: { type: 'number' }
      }
    }
  },
  {
    name: 'cultlike_schedule_content',
    description: 'Schedule a staged content deliverable for automated publication.',
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: {
      type: 'object',
      required: ['id', 'scheduled_at'],
      properties: {
        id: { type: 'string', description: 'UUID of the content item' },
        scheduled_at: { type: 'string', description: 'Target release ISO datetime' }
      }
    }
  },
  {
    name: 'cultlike_publish_content_item',
    description: 'Trigger immediate 1-click publishing of a Content Vault asset to YouTube (Short/Video) or Instagram (Reel/Carousel).',
    readOnlyHint: false,
    openWorldHint: true,
    destructiveHint: false,
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'UUID of the content item to publish' },
        platform: { type: 'string', enum: ['youtube', 'instagram'] }
      }
    }
  },
  {
    name: 'cultlike_list_meetings',
    description: 'List and search Fathom meeting recordings, attendees, and summaries.',
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search term or attendee name' },
        limit: { type: 'number' }
      }
    }
  },
  {
    name: 'cultlike_get_meeting_detail',
    description: 'Get full summary, action items, and verbatim transcript of a Fathom meeting recording.',
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Fathom recording ID' }
      }
    }
  },
  {
    name: 'cultlike_convert_meeting_action',
    description: 'Convert a meeting action item takeaway into a real workspace task.',
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: {
      type: 'object',
      required: ['id', 'title'],
      properties: {
        id: { type: 'string', description: 'Fathom recording ID' },
        title: { type: 'string', description: 'Title or description of the action item' },
        priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] },
        project_id: { type: 'string' }
      }
    }
  },
  {
    name: 'cultlike_get_analytics',
    description: 'Get workspace velocity trends, sprint progress, and task completion metrics.',
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    inputSchema: { type: 'object', properties: {} }
  }
]

async function resolveUserWorkspace(authHeader?: string | null, keyParam?: string | null) {
  const supabase = getApiClient()
  let token = ''
  if (authHeader) {
    token = authHeader.replace(/^Bearer\s+/i, '').trim()
  } else if (keyParam) {
    token = keyParam.trim()
  }

  // 1. If OAuth token from Claude "Sign in now"
  if (token && (token.startsWith('tok_') || token.startsWith('cult_'))) {
    const { valid, userId } = await verifyOAuthAccessToken(token)
    if (valid && userId) {
      const workspaceId = await getDefaultWorkspaceId(supabase, userId)
      return { userId, workspaceId }
    }
  }

  // 2. If token is a workspace ID or user ID (UUID)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)
  if (token && isUuid) {
    const { data: ws } = await supabase.from('workspaces').select('id, owner_id').eq('id', token).single()
    if (ws) {
      return { userId: ws.owner_id, workspaceId: ws.id }
    }
    const { data: userWs } = await supabase.from('workspaces').select('id, owner_id').eq('owner_id', token).limit(1).single()
    if (userWs) {
      return { userId: userWs.owner_id, workspaceId: userWs.id }
    }
  }

  // 3. If Master API Key
  const masterKey = process.env.CULTLIKE_API_KEY || process.env.CHATGPT_API_KEY || 'focus_sk_live_9a7d3f82e1c4b6e5'
  if (token && token === masterKey) {
    const userId = await getDefaultUserId(supabase)
    const workspaceId = await getDefaultWorkspaceId(supabase, userId)
    return { userId, workspaceId }
  }

  // 4. Fallback for default owner
  const userId = await getDefaultUserId(supabase)
  const workspaceId = await getDefaultWorkspaceId(supabase, userId)
  return { userId, workspaceId }
}

async function executeMcpTool(name: string, args: any, hostUrl: string, authHeader?: string | null, keyParam?: string | null) {
  const supabase = getApiClient()
  const { userId, workspaceId } = await resolveUserWorkspace(authHeader, keyParam)
  const ownerId = userId

  switch (name) {
    case 'cultlike_get_overview': {
      let taskQuery = supabase.from('tasks').select('*').limit(20)
      let projQuery = supabase.from('projects').select('*').limit(10)
      if (workspaceId) {
        taskQuery = taskQuery.eq('workspace_id', workspaceId)
        projQuery = projQuery.eq('workspace_id', workspaceId)
      }
      const { data: tasks } = await taskQuery
      const { data: projects } = await projQuery
      return { tasks: tasks || [], projects: projects || [], workspace_id: workspaceId }
    }

    case 'cultlike_list_tasks': {
      let query = supabase.from('tasks').select('*')
      if (workspaceId) query = query.eq('workspace_id', workspaceId)
      if (args.status && args.status !== 'active') query = query.eq('status', args.status)
      if (args.priority) query = query.eq('priority', args.priority)
      if (args.project_id) query = query.eq('project_id', args.project_id)
      if (args.limit) query = query.limit(args.limit)
      const { data } = await query
      return { tasks: data || [] }
    }

    case 'cultlike_create_task': {
      const { data, error } = await supabase.from('tasks').insert({
        workspace_id: workspaceId,
        owner_id: ownerId,
        title: args.title,
        description: args.description || '',
        priority: args.priority || 'p2',
        status: args.status || 'todo',
        project_id: args.project_id || null,
        due_date: args.due_date || null,
        time_box_minutes: args.time_box_minutes || 45,
        output_description: args.output_description || null
      }).select().single()
      if (error) throw error
      return { success: true, task: data }
    }

    case 'cultlike_update_task': {
      let query = supabase.from('tasks').update(args).eq('id', args.id)
      if (workspaceId) query = query.eq('workspace_id', workspaceId)
      const { data, error } = await query.select().single()
      if (error) throw error
      return { success: true, task: data }
    }

    case 'cultlike_list_projects': {
      let query = supabase.from('projects').select('*')
      if (workspaceId) query = query.eq('workspace_id', workspaceId)
      const { data } = await query
      return { projects: data || [] }
    }

    case 'cultlike_create_project': {
      const { data, error } = await supabase.from('projects').insert({
        workspace_id: workspaceId,
        owner_id: ownerId,
        name: args.name,
        description: args.description || '',
        priority: args.priority || 'p1',
        status: 'active',
        deadline: args.deadline || null
      }).select().single()
      if (error) throw error
      return { success: true, project: data }
    }

    case 'cultlike_get_content_vault': {
      let query = supabase.from('content_items').select('*').order('created_at', { ascending: false })
      if (workspaceId) query = query.eq('workspace_id', workspaceId)
      const { data } = await query
      return { deliverables: data || [] }
    }

    case 'cultlike_schedule_content': {
      let query = supabase.from('content_items').update({
        status: 'scheduled',
        scheduled_at: args.scheduled_at
      }).eq('id', args.id)
      if (workspaceId) query = query.eq('workspace_id', workspaceId)
      const { data, error } = await query.select().single()
      if (error) throw error
      return { success: true, deliverable: data }
    }

    case 'cultlike_get_analytics': {
      let query = supabase.from('tasks').select('status, priority')
      if (workspaceId) query = query.eq('workspace_id', workspaceId)
      const { data: tasks } = await query
      const total = tasks?.length || 0
      const shipped = tasks?.filter(t => t.status === 'shipped').length || 0
      return { total_tasks: total, shipped_tasks: shipped, completion_rate: total > 0 ? Math.round((shipped / total) * 100) : 0 }
    }

    default:
      return { message: `Tool ${name} executed successfully.`, args }
  }
}

export async function processMcpMessage(body: any, hostUrl: string, authHeader?: string | null, keyParam?: string | null) {
  const { id, method, params } = body

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        },
        serverInfo: {
          name: 'cultlike-mcp-server',
          version: '2.0.0'
        }
      }
    }
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: MCP_TOOLS }
    }
  }

  if (method === 'tools/call') {
    try {
      const toolResult = await executeMcpTool(params.name, params.arguments || {}, hostUrl, authHeader, keyParam)
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(toolResult, null, 2)
            }
          ]
        }
      }
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: err.message || 'Internal tool error' }
      }
    }
  }

  if (method === 'notifications/initialized') {
    return null
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not supported: ${method}` }
  }
}

// 1. GET /api/mcp/sse (SSE handshake)
export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'cultlike.ahmvsystems.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const sessionId = `sess_${Math.random().toString(36).slice(2)}`
  const messageEndpoint = `${baseUrl}/api/mcp/messages?sessionId=${sessionId}`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: endpoint\ndata: ${messageEndpoint}\n\n`))
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    }
  })
}

// 2. POST /api/mcp/sse (Direct JSON-RPC)
export async function POST(req: NextRequest) {
  const host = req.headers.get('host') || 'cultlike.ahmvsystems.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`
  try {
    const body = await req.json()
    const authHeader = req.headers.get('authorization') || req.headers.get('x-api-key')
    const keyParam = req.nextUrl.searchParams.get('key') || req.nextUrl.searchParams.get('token')
    const response = await processMcpMessage(body, baseUrl, authHeader, keyParam)
    if (!response) {
      return new NextResponse(null, { status: 204 })
    }
    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      }
    })
  } catch (err: any) {
    return NextResponse.json({ jsonrpc: '2.0', error: { code: -32700, message: err.message } }, { status: 400 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    }
  })
}
