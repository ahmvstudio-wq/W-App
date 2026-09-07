export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient, getDefaultWorkspaceId, getDefaultUserId } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const recordingId = params.id
    const body = await req.json()

    const {
      title,
      action_text,
      assignee,
      priority = 'p1',
      project_id,
      due_date,
      time_box_minutes = 45,
    } = body

    const taskTitle = (title || action_text || '').trim()
    if (!taskTitle) {
      return NextResponse.json({ success: false, error: 'Task title or action_text is required.' }, { status: 400 })
    }

    const supabase = getApiClient()
    const workspaceId = await getDefaultWorkspaceId(supabase)
    const ownerId = await getDefaultUserId(supabase)

    const descParts = [
      `Extracted from Fathom meeting recording #${recordingId}`,
      assignee ? `Assignee: ${assignee}` : null,
    ].filter(Boolean)

    const { data: createdTask, error } = await supabase
      .from('tasks')
      .insert({
        workspace_id: workspaceId,
        owner_id: ownerId,
        title: taskTitle,
        description: descParts.join(' • '),
        status: 'todo',
        priority,
        project_id: project_id || null,
        due_date: due_date || null,
        time_box_minutes,
      })
      .select('*, project:projects(id, name)')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Action item successfully converted into workspace task',
      task: createdTask,
    })
  } catch (error: any) {
    console.error(`[API /api/chatgpt/meetings/${params.id}/convert-action] Error:`, error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
