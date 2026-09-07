export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient } from '@/lib/supabase/admin'
import { fetchFathomMeetings } from '@/lib/fathom/client'
import { format, subDays, isSameDay } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()

    // 1. Fetch all tasks
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, started_at, completed_at, created_at, time_box_minutes, project_id')
      .order('created_at', { ascending: false })

    if (taskError) throw taskError

    // 2. Fetch projects
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('id, name, status, priority, deadline')
      .order('created_at', { ascending: false })

    if (projError) throw projError

    // 3. Fetch Fathom meetings summary
    let fathomCount = 0
    let fathomTotalMins = 0
    try {
      const meetings = await fetchFathomMeetings(150)
      fathomCount = meetings.length
      fathomTotalMins = meetings.reduce((sum, m) => sum + (m.duration_minutes || 0), 0)
    } catch {}

    const taskList = tasks || []
    const total = taskList.length
    const shipped = taskList.filter((t) => t.status === 'shipped')
    const inProgress = taskList.filter((t) => t.status === 'in_progress')
    const todo = taskList.filter((t) => t.status === 'todo')
    const blocked = taskList.filter((t) => t.status === 'blocked')
    const killed = taskList.filter((t) => t.status === 'killed')

    const completionRate = total > 0 ? Math.round((shipped.length / total) * 100) : 0

    // Focus hours
    const totalMinutes = taskList.reduce((sum, t) => {
      if (t.started_at && t.completed_at) {
        const diff = Math.round((new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 60000)
        if (diff > 0) return sum + diff
      }
      return sum + (t.time_box_minutes || 0)
    }, 0)
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10

    // Priority Breakdown
    const priorities = {
      p0: taskList.filter((t) => t.priority === 'p0').length,
      p1: taskList.filter((t) => t.priority === 'p1').length,
      p2: taskList.filter((t) => t.priority === 'p2').length,
      p3: taskList.filter((t) => t.priority === 'p3').length,
    }

    // 7-Day Velocity
    const today = new Date()
    const last7DaysVelocity = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(today, 6 - i)
      const count = shipped.filter((t) => {
        const dStr = t.completed_at || t.created_at
        return dStr && isSameDay(new Date(dStr), d)
      }).length
      return {
        date: format(d, 'yyyy-MM-dd'),
        day: format(d, 'EEE'),
        shipped_count: count,
      }
    })

    // Project breakdown
    const projectBreakdown = (projects || []).map((p) => {
      const projTasks = taskList.filter((t) => (t as any).project_id === p.id)
      const projShipped = projTasks.filter((t) => t.status === 'shipped').length
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        total_tasks: projTasks.length,
        shipped_tasks: projShipped,
        completion_rate: projTasks.length > 0 ? Math.round((projShipped / projTasks.length) * 100) : 0,
      }
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sprint_health: {
        total_tasks: total,
        shipped_count: shipped.length,
        in_progress_count: inProgress.length,
        todo_count: todo.length,
        blocked_count: blocked.length,
        killed_count: killed.length,
        completion_rate_percentage: completionRate,
        total_focus_hours: totalHours,
        total_focus_minutes: totalMinutes,
      },
      priorities,
      last_7_days_velocity: last7DaysVelocity,
      project_velocity: projectBreakdown,
      fathom_meetings_summary: {
        total_recorded_calls: fathomCount,
        total_minutes: fathomTotalMins,
        total_hours: Math.round((fathomTotalMins / 60) * 10) / 10,
      },
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/analytics] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
