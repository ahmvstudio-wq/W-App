import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const { id } = params

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*, project:projects(*), owner:profiles(*)')
      .eq('id', id)
      .single()

    if (error || !task) {
      return NextResponse.json({ success: false, error: 'Task not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, task })
  } catch (error: any) {
    console.error('[API /api/chatgpt/tasks/[id] GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const { id } = params
    const updates = await req.json()

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
      message: `Task "${task.title}" updated successfully.`,
      task,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/tasks/[id] PATCH] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const { id } = params

    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Task deleted successfully.`,
      id,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/tasks/[id] DELETE] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
