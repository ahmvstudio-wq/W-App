import { NextRequest, NextResponse } from 'next/server'
import { getApiClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ status: 'Fathom Convert-to-Task Endpoint Active' })
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, priority = 'p1', projectId } = await req.json()

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const supabase = getApiClient()
    const { data: workspaces } = await supabase.from('workspaces').select('id, owner_id').limit(1).single()

    if (!workspaces) {
      return NextResponse.json({ success: false, error: 'No active workspace found' }, { status: 404 })
    }

    const { data: task, error } = await supabase.from('tasks').insert({
      workspace_id: workspaces.id,
      owner_id: workspaces.owner_id,
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
