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
    const explicitWorkspaceId = searchParams.get('workspace_id')
    const ownerId = await getDefaultUserId(supabase)
    const workspaceId = explicitWorkspaceId || (await getDefaultWorkspaceId(supabase, ownerId))

    // 1. Fetch Projects
    let projQuery = supabase
      .from('projects')
      .select('id, name, description, status, priority, deadline, success_metric, min_shippable_version')
      .order('created_at', { ascending: false })

    // 2. Fetch Tasks
    let taskQuery = supabase
      .from('tasks')
      .select('id, title, description, status, priority, due_date, time_box_minutes, blocked_reason, project_id, created_at')
      .order('created_at', { ascending: false })

    if (workspaceId) {
      projQuery = projQuery.eq('workspace_id', workspaceId)
      taskQuery = taskQuery.eq('workspace_id', workspaceId)
    }

    const { data: projects, error: projError } = await projQuery
    if (projError) throw projError

    const { data: tasks, error: tasksError } = await taskQuery
    if (tasksError) throw tasksError

    // 3. Fetch Recent Daily Logs
    const { data: dailyLogs } = await supabase
      .from('daily_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(3)

    // 4. Fetch Recent Fathom Meetings
    let recentMeetings: any[] = []
    let totalMeetingsCount = 0
    try {
      const { fetchFathomMeetings } = await import('@/lib/fathom/client')
      const allMeetings = await fetchFathomMeetings(10)
      totalMeetingsCount = allMeetings.length
      recentMeetings = allMeetings.slice(0, 5).map((m) => ({
        id: m.recording_id || m.id,
        title: m.title,
        date: m.recorded_at,
        duration_minutes: m.duration_minutes,
        attendees: m.attendees.map((a) => a.name),
        video_url: m.video_url || m.share_url,
      }))
    } catch {}

    // Compute Summaries
    const taskList = tasks || []
    const shippedCount = taskList.filter((t) => t.status === 'shipped').length
    const completionRate = taskList.length > 0 ? Math.round((shippedCount / taskList.length) * 100) : 0

    const summary = {
      total_tasks: taskList.length,
      completion_rate_percentage: completionRate,
      todo: taskList.filter((t) => t.status === 'todo').length,
      in_progress: taskList.filter((t) => t.status === 'in_progress').length,
      blocked: taskList.filter((t) => t.status === 'blocked').length,
      shipped: shippedCount,
      killed: taskList.filter((t) => t.status === 'killed').length,
    }

    const p0p1Tasks = taskList.filter(
      (t) => (t.priority === 'p0' || t.priority === 'p1') && t.status !== 'shipped' && t.status !== 'killed'
    )

    const blockedTasks = taskList.filter((t) => t.status === 'blocked')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      urgent_tasks: p0p1Tasks,
      active_blockers: blockedTasks,
      active_projects: (projects || []).filter((p) => p.status === 'active'),
      all_projects: projects || [],
      recent_daily_logs: dailyLogs || [],
      recent_meetings: recentMeetings,
      fathom_meetings_count: totalMeetingsCount,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/overview] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
