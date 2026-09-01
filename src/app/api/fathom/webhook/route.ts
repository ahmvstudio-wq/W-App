import { NextRequest, NextResponse } from 'next/server'
import { getApiClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ status: 'Fathom Webhook Endpoint Active' })
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    
    let payload: any = {}
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 })
    }

    console.log('[FATHOM WEBHOOK RECEIVED]', {
      event: payload.event || payload.type,
      recording_id: payload.recording_id || payload.id,
      meeting_title: payload.meeting_title || payload.title
    })

    const supabase = getApiClient()

    if (Array.isArray(payload.action_items) && payload.action_items.length > 0) {
      const { data: workspaces } = await supabase.from('workspaces').select('id, owner_id').limit(1).single()
      if (workspaces) {
        for (const item of payload.action_items) {
          const taskTitle = typeof item === 'string' ? item : item.text || item.description
          await supabase.from('tasks').insert({
            workspace_id: workspaces.id,
            owner_id: workspaces.owner_id,
            title: taskTitle,
            description: `Extracted from Fathom Meeting: ${payload.meeting_title || 'Recent Meeting'}`,
            priority: 'p1',
            status: 'todo',
            time_box_minutes: 45
          })
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Fathom webhook processed successfully' })
  } catch (error: any) {
    console.error('[API /api/fathom/webhook] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
