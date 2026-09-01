export const runtime = 'edge'
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
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    let query = supabase
      .from('projects')
      .select('*, tasks(id, title, status, priority, due_date)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: projects, error } = await query
    if (error) throw error

    // Enrich projects with task stats
    const enriched = (projects || []).map((p: any) => {
      const pTasks = p.tasks || []
      return {
        ...p,
        stats: {
          total_tasks: pTasks.length,
          shipped_tasks: pTasks.filter((t: any) => t.status === 'shipped').length,
          active_tasks: pTasks.filter((t: any) => t.status === 'todo' || t.status === 'in_progress').length,
          blocked_tasks: pTasks.filter((t: any) => t.status === 'blocked').length,
        },
      }
    })

    return NextResponse.json({
      success: true,
      count: enriched.length,
      projects: enriched,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/projects GET] Error:', error)
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
      name,
      description,
      status = 'active',
      priority = 'p1',
      deadline,
      success_metric,
      kill_condition,
      min_shippable_version,
      color = '#c8f135',
      workspace_id: explicitWorkspaceId,
      owner_id: explicitOwnerId,
    } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Project name is required.' }, { status: 400 })
    }

    const workspaceId = explicitWorkspaceId || (await getDefaultWorkspaceId(supabase))
    const ownerId = explicitOwnerId || (await getDefaultUserId(supabase))

    const newProjectData: any = {
      name: name.trim(),
      description: description || null,
      status,
      priority,
      deadline: deadline || null,
      success_metric: success_metric || null,
      kill_condition: kill_condition || null,
      min_shippable_version: min_shippable_version || null,
      color,
      workspace_id: workspaceId,
      owner_id: ownerId,
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert(newProjectData)
      .select('*')
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
      message: `Project "${project.name}" created successfully.`,
      project,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/projects POST] Error:', error)
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
      return NextResponse.json({ success: false, error: 'Project ID (id) is required in the body.' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Project updated successfully.`,
      project,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/projects PATCH] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
