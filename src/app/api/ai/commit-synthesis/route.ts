import { NextRequest, NextResponse } from 'next/server'
import { getApiClient } from '@/lib/supabase/admin'
import type { SynthesizedPlan } from '@/lib/ai/synthesizer'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { plan, selectedTaskIds }: { plan: SynthesizedPlan; selectedTaskIds?: string[] } = await req.json()

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan is required' }, { status: 400 })
    }

    const supabase = getApiClient()
    const { data: workspaces } = await supabase.from('workspaces').select('id, owner_id').limit(1).single()

    if (!workspaces) {
      return NextResponse.json({ success: false, error: 'No active workspace found' }, { status: 404 })
    }

    const workspaceId = workspaces.id
    const ownerId = workspaces.owner_id

    let createdProjectId: string | null = null

    // 1. Create Project if mode is project_with_phases or multiple tasks
    if (plan.mode === 'project_with_phases') {
      const { data: project, error: projErr } = await supabase.from('projects').insert({
        workspace_id: workspaceId,
        owner_id: ownerId,
        name: plan.project_name,
        description: plan.description,
        status: 'active',
        priority: plan.priority || 'p1',
        deadline: plan.deadline_iso || null,
        min_shippable_version: plan.phases.map(p => p.name).join(' | '),
        success_metric: `All ${plan.tasks.length} phased deliverables shipped before ${plan.deadline_label || 'deadline'}`
      }).select().single()

      if (projErr) throw projErr
      createdProjectId = project.id
    }

    // 2. Filter tasks to create
    const tasksToCreate = plan.tasks.filter(t => {
      if (selectedTaskIds && selectedTaskIds.length > 0) {
        return selectedTaskIds.includes(t.id)
      }
      return t.is_selected !== false
    })

    const insertedTasks = []
    for (const t of tasksToCreate) {
      const desc = [
        t.phase ? `[${t.phase}]` : '',
        t.dependencies.length > 0 ? `Dependencies: ${t.dependencies.join(', ')}` : '',
        t.assignee ? `Assignee: ${t.assignee}` : '',
        t.confidence === 'implied' ? `[Implied Step — Verify]` : ''
      ].filter(Boolean).join(' • ')

      const { data: createdTask, error: taskErr } = await supabase.from('tasks').insert({
        workspace_id: workspaceId,
        owner_id: ownerId,
        project_id: createdProjectId,
        title: t.title,
        description: desc || 'Synthesized from natural language directive',
        priority: t.priority || 'p1',
        status: t.status || 'todo',
        due_date: t.due_date_iso || null,
        time_box_minutes: 45
      }).select().single()

      if (!taskErr && createdTask) {
        insertedTasks.push(createdTask)
      }
    }

    return NextResponse.json({
      success: true,
      mode: plan.mode,
      project_id: createdProjectId,
      tasks_count: insertedTasks.length,
      tasks: insertedTasks
    })
  } catch (error: any) {
    console.error('[API /api/ai/commit-synthesis] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
