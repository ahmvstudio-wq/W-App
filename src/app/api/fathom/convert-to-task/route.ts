export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getApiClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ status: 'Fathom Convert-to-Task Endpoint Active' })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, priority = 'p1', projectId, workspaceId } = body

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const supabase = getApiClient()
    
    // Resolve user from token if available
    let userId: string | null = req.headers.get('x-user-id')
    const authHeader = req.headers.get('authorization')
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { data: { user } } = await supabase.auth.getUser(token)
        if (user?.id) userId = user.id
      } catch {}
    }

    // Resolve workspace
    const targetWorkspaceId = workspaceId || req.headers.get('x-workspace-id')
    let wsData: any = null
    if (targetWorkspaceId) {
      const { data: ws } = await supabase.from('workspaces').select('id, owner_id').eq('id', targetWorkspaceId).single()
      wsData = ws
    }
    if (!wsData && userId) {
      const { data: ws } = await supabase.from('workspaces').select('id, owner_id').eq('owner_id', userId).limit(1).single()
      wsData = ws
    }
    if (!wsData) {
      const { data: ws } = await supabase.from('workspaces').select('id, owner_id').limit(1).single()
      wsData = ws
    }

    if (!wsData) {
      return NextResponse.json({ success: false, error: 'No active workspace found' }, { status: 404 })
    }

    const taskOwnerId = userId || wsData.owner_id

    const { data: task, error } = await supabase.from('tasks').insert({
      workspace_id: wsData.id,
      owner_id: taskOwnerId,
      project_id: projectId || null,
      title,
      description: description || 'Extracted from Fathom AI meeting notes',
      priority,
      status: 'todo',
      time_box_minutes: 45
    }).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Task created from Fathom action item', task })
  } catch (error: any) {
    console.error('[API /api/fathom/convert-to-task] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
