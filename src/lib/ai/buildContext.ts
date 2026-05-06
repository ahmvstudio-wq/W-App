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
    { data: tasks },
    { data: blockedTasks },
    { data: overdueTasks },
    { data: recentActivity },
    { data: meetings },
    { data: focusSessions }
  ] = await Promise.all([
    supabase.from('projects')
      .select('id, name, status, priority, deadline, success_metric')
      .eq('workspace_id', activeWorkspaceId)
      .eq('status', 'active'),

    supabase.from('tasks')
      .select('id, title, status, priority, project_id, due_date, time_box_minutes, completed_at')
      .eq('workspace_id', activeWorkspaceId)
      .neq('status', 'killed')
      .order('created_at', { ascending: false })
      .limit(50),

    supabase.from('tasks')
      .select('id, title, blocked_reason, project_id')
      .eq('workspace_id', activeWorkspaceId)
      .eq('status', 'blocked'),

    supabase.from('tasks')
      .select('id, title, due_date, priority, project_id')
      .eq('workspace_id', activeWorkspaceId)
      .eq('status', 'todo')
      .lt('due_date', new Date().toISOString())
      .not('due_date', 'is', null),

    supabase.from('tasks')
      .select('id, title, status, completed_at, output_description')
      .eq('workspace_id', activeWorkspaceId)
      .eq('status', 'shipped')
      .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('completed_at', { ascending: false }),

    supabase.from('meetings')
      .select('id, title, decision_to_make, decision_reached, scheduled_at')
      .eq('workspace_id', activeWorkspaceId)
      .gte('scheduled_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

    supabase.from('focus_sessions')
      .select('id, task_id, duration_minutes, completed, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  ])

  const todoCount = tasks?.filter(t => t.status === 'todo').length || 0
  const inProgressCount = tasks?.filter(t => t.status === 'in_progress').length || 0
  const shippedThisWeek = recentActivity?.length || 0
  const totalFocusMinutes = focusSessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0

  return `
=== USER WORKSPACE CONTEXT (live data, do not fabricate) ===

DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

ACTIVE PROJECTS (${projects?.length || 0}):
${projects?.map(p => `- ${p.name} | priority: ${p.priority} | deadline: ${p.deadline ? new Date(p.deadline).toLocaleDateString() : 'none'} | goal: ${p.success_metric || 'not set'}`).join('\n') || 'No active projects'}

TASK SUMMARY:
- Todo: ${todoCount}
- In Progress: ${inProgressCount}
- Blocked: ${blockedTasks?.length || 0}
- Shipped this week: ${shippedThisWeek}
- Overdue: ${overdueTasks?.length || 0}

BLOCKED TASKS RIGHT NOW (${blockedTasks?.length || 0}):
${blockedTasks?.map(t => `- "${t.title}" — reason: ${t.blocked_reason || 'no reason given'}`).join('\n') || 'None blocked'}

OVERDUE TASKS:
${overdueTasks?.map(t => `- "${t.title}" — was due ${new Date(t.due_date!).toLocaleDateString()} | priority: ${t.priority}`).join('\n') || 'None overdue'}

SHIPPED THIS WEEK:
${recentActivity?.map(t => `- "${t.title}" — output: ${t.output_description || 'no output logged'}`).join('\n') || 'Nothing shipped yet this week'}

FOCUS TIME THIS WEEK: ${totalFocusMinutes} minutes across ${focusSessions?.length || 0} sessions

=== END CONTEXT ===

You are the operating intelligence of this workspace.
You have the real data above. Use it. Only it.
Never invent tasks, projects, or metrics that are not in the context.
If you do not know something, say so. Do not guess.
Keep every response under 150 words unless writing a document.
Be direct. Challenge scope. Demand owners. Push for specificity.
`
}
