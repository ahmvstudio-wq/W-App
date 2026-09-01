import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()

    // 1. Fetch Projects
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('id, name, description, status, priority, deadline, success_metric, min_shippable_version')
      .order('created_at', { ascending: false })

    if (projError) throw projError

    // 2. Fetch Tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority, due_date, time_box_minutes, blocked_reason, project_id, created_at')
      .order('created_at', { ascending: false })

    if (tasksError) throw tasksError

    // 3. Fetch Recent Daily Logs
    const { data: dailyLogs } = await supabase
      .from('daily_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(3)

    // Compute Summaries
    const taskList = tasks || []
    const summary = {
      total_tasks: taskList.length,
      todo: taskList.filter((t) => t.status === 'todo').length,
      in_progress: taskList.filter((t) => t.status === 'in_progress').length,
      blocked: taskList.filter((t) => t.status === 'blocked').length,
      shipped: taskList.filter((t) => t.status === 'shipped').length,
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
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/overview] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
