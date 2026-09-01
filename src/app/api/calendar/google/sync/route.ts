import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const accessToken = req.cookies.get('gcal_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Google Calendar. Please connect Google Calendar in Settings.'
      }, { status: 401 })
    }

    // Fetch active tasks from Supabase
    const { data: tasks, error: dbError } = await supabase
      .from('tasks')
      .select('*, project:projects(id, name)')
      .neq('status', 'killed')

    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }

    let syncedCount = 0
    const errors: string[] = []

    for (const task of tasks || []) {
      const startTime = task.due_date ? new Date(task.due_date) : new Date(task.created_at)
      const durationMins = task.time_box_minutes || 45
      const endTime = new Date(startTime.getTime() + durationMins * 60 * 1000)

      const eventPayload = {
        summary: task.project?.name ? `[${task.project.name}] ${task.title}` : task.title,
        description: `Priority: ${task.priority?.toUpperCase() || 'P1'}\nStatus: ${task.status}\n${task.description || ''}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC'
        }
      }

      const gcalRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      })

      if (gcalRes.ok) {
        syncedCount++
      } else {
        const errData = await gcalRes.json()
        errors.push(errData.error?.message || 'Failed to sync event')
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      totalTasks: tasks?.length || 0,
      errors: errors.length > 0 ? errors.slice(0, 3) : undefined
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
