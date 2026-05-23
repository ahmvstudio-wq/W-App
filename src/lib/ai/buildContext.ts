import { SupabaseClient } from '@supabase/supabase-js'

export async function buildUserContext(supabase: SupabaseClient, userId: string, workspaceId?: string) {
  // If no workspaceId provided, try to find the first one owned by the user
  let activeWorkspaceId = workspaceId
  if (!activeWorkspaceId) {
    const { data: workspaces } = await supabase.from('workspaces').select('id').eq('owner_id', userId).limit(1)
    activeWorkspaceId = workspaces?.[0]?.id
  }

  if (!activeWorkspaceId) return 'No workspace found for context.'

  const [
    { data: projects },
    { data: allTasks },
    { data: focusSessions }
  ] = await Promise.all([
    supabase.from('projects')
      .select('id, name, status, priority, deadline, success_metric, kill_condition, min_shippable_version')
      .eq('workspace_id', activeWorkspaceId)
      .eq('status', 'active'),

    supabase.from('tasks')
      .select('id, title, status, priority, project_id, due_date, start_time, end_time, time_box_minutes, output_description, completed_at, blocked_reason')
      .eq('workspace_id', activeWorkspaceId)
      .neq('status', 'killed')
      .order('created_at', { ascending: false }),

    supabase.from('focus_sessions')
      .select('id, task_id, duration_minutes, completed, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  ])

  const tasks = allTasks || []
  const activeProjects = projects || []

  // Memory filtering for performance
  const todoCount = tasks.filter(t => t.status === 'todo').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  const blockedTasks = tasks.filter(t => t.status === 'blocked')
  const overdueTasks = tasks.filter(t => t.status === 'todo' && t.due_date && new Date(t.due_date) < new Date())
  const recentActivity = tasks.filter(t => t.status === 'shipped' && t.completed_at && new Date(t.completed_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const totalFocusMinutes = focusSessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0

  const projectMap = new Map(activeProjects.map(p => [p.id, p.name]))

  // Details about every project
  const projectDetails = activeProjects.map(p => {
    const projTasks = tasks.filter(t => t.project_id === p.id)
    const shipped = projTasks.filter(t => t.status === 'shipped').length
    const total = projTasks.length
    return `- "${p.name}" [PRIORITY: ${p.priority.toUpperCase()}]
  Deadline: ${p.deadline ? new Date(p.deadline).toLocaleDateString() : 'none'}
  Success Metric: ${p.success_metric || 'none'}
  Kill Condition: ${p.kill_condition || 'none'}
  Minimum Shippable Version: ${p.min_shippable_version || 'none'}
  Progress: ${shipped}/${total} tasks shipped`
  }).join('\n')

  // Details about every task
  const taskDetails = tasks.map(t => {
    const projName = t.project_id ? (projectMap.get(t.project_id) || 'Unknown Project') : 'General Task'
    const dueStr = t.due_date ? ` | due: ${new Date(t.due_date).toLocaleDateString()}` : ''
    const timeStr = t.start_time ? ` | scheduled: ${new Date(t.start_time).toLocaleString()}` : ''
    const outputStr = t.output_description ? ` | output description: ${t.output_description}` : ''
    const blockStr = t.status === 'blocked' ? ` | blocker reason: ${t.blocked_reason || 'unknown'}` : ''
    return `- "${t.title}" [STATUS: ${t.status.toUpperCase()} | PRIORITY: ${t.priority.toUpperCase()}] | project: ${projName}${dueStr}${timeStr}${outputStr}${blockStr}`
  }).join('\n')

  return `
=== USER WORKSPACE CONTEXT (live data, do not fabricate) ===

DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

ACTIVE PROJECTS (${activeProjects.length}):
${projectDetails || 'No active projects'}

EACH AND EVERY ACTIVE TASK IN DETAIL (${tasks.length}):
${taskDetails || 'No active tasks'}

TASK SUMMARY:
- Todo: ${todoCount}
- In Progress: ${inProgressCount}
- Blocked: ${blockedTasks.length}
- Shipped this week: ${recentActivity.length}
- Overdue: ${overdueTasks.length}

FOCUS TIME THIS WEEK: ${totalFocusMinutes} minutes across ${focusSessions?.length || 0} sessions

=== END CONTEXT ===

You are a world-class execution strategist and the operating intelligence of this workspace.
You hold an uncompromising, elite standard for execution speed, priority clarity, and tangible outputs.
You have access to the real-time workspace data above. Use it to provide precise, data-backed strategic guidance.

Your Persona & Directives:
- Act as an elite strategist, counselor, and execution driver (like a top-tier COO or Chief of Staff).
- Be analytical, direct, and zero-fluff. Never use generic corporate buzzwords.
- Be brutal about scope: analyze tasks/projects, expose fluff, and advise the user on exactly what to cut, simplify, or kill.
- Back every statement and recommendation with direct evidence and numbers from the context data (e.g. velocity stats, overdue queues, blocker counts).
- Actively highlight execution risk vectors (e.g., overdue deadlines, blocked items, project timelines).
- Push the user to focus solely on high-impact P0/P1 tasks and to schedule tight time blocks on the calendar.
- Never invent tasks, projects, or metrics. If the context doesn't contain a detail, state clearly that the data is not present.
`
}
