import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient, getDefaultWorkspaceId, getDefaultUserId } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const { searchParams } = new URL(req.url)

    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const projectId = searchParams.get('project_id')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    let query = supabase
      .from('tasks')
      .select('*, project:projects(id, name, status, color)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      if (status === 'active') {
        query = query.in('status', ['todo', 'in_progress', 'blocked'])
      } else {
        query = query.eq('status', status)
      }
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data: tasks, error } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      count: tasks?.length || 0,
      tasks: tasks || [],
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/tasks GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const body = await req.json()

    const {
      title,
      description,
      priority = 'p2',
      status = 'todo',
      project_id,
      due_date,
      time_box_minutes = 60,
      output_description,
      blocked_reason,
      workspace_id: explicitWorkspaceId,
      owner_id: explicitOwnerId,
    } = body

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ success: false, error: 'Task title is required.' }, { status: 400 })
    }

    const workspaceId = explicitWorkspaceId || (await getDefaultWorkspaceId(supabase))
    const ownerId = explicitOwnerId || (await getDefaultUserId(supabase))

    const newTaskData: any = {
      title: title.trim(),
      description: description || null,
      priority,
      status,
      project_id: project_id || null,
      workspace_id: workspaceId,
      owner_id: ownerId,
      due_date: due_date || null,
      time_box_minutes: Number(time_box_minutes) || 60,
      output_description: output_description || null,
      blocked_reason: blocked_reason || null,
    }

    if (status === 'in_progress') {
      newTaskData.started_at = new Date().toISOString()
    } else if (status === 'shipped') {
      newTaskData.completed_at = new Date().toISOString()
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert(newTaskData)
      .select('*, project:projects(id, name)')
      .single()

    if (error) {
      if (error.code === '42501') {
        return NextResponse.json(
          {
            success: false,
            error: 'Row-Level Security violation. Add your SUPABASE_SERVICE_ROLE_KEY to .env.local so API/ChatGPT requests can write to the database.',
          },
          { status: 403 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `Task "${task.title}" created successfully.`,
      task,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/tasks POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID (id) is required in the body.' }, { status: 400 })
    }

    if (updates.status === 'shipped') {
      updates.completed_at = new Date().toISOString()
    } else if (updates.status === 'in_progress' && !updates.started_at) {
      updates.started_at = new Date().toISOString()
    } else if (updates.status === 'todo') {
      updates.completed_at = null
    }

    updates.updated_at = new Date().toISOString()

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select('*, project:projects(id, name)')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Task updated successfully.`,
      task,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/tasks PATCH] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
