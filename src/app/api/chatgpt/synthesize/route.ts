export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient, getDefaultWorkspaceId, getDefaultUserId } from '@/lib/supabase/admin'
import { synthesizeHeuristic, type SynthesizedPlan } from '@/lib/ai/synthesizer'
import Groq from 'groq-sdk'

export const dynamic = 'force-dynamic'

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null

const SYSTEM_PROMPT = `You are the Executive Operating System of CallMy Mgmt.
Your job is to take a natural language brain dump or directive and decompose it into a structured, multi-phase project or task plan.

CRITICAL RULES:
1. Grounding: Do NOT invent made-up details.
- Explicitly stated items -> mark confidence as "explicit".
- Strongly implied logical steps -> mark confidence as "implied".
- Missing information -> add to "clarifications_needed".
- Contradictory information -> add to "conflicts_detected".
- Future/nice-to-have ideas -> add to "backlog_ideas".

2. Mode Detection:
- If this describes a multi-step project with multiple domains -> "project_with_phases".
- If this is a single task, reminder, or follow-up -> "single_task".

Return valid JSON with keys: mode, project_name, description, deadline_label, deadline_iso, priority, phases, tasks (id, title, phase, priority, due_date_label, due_date_iso, assignee, dependencies, confidence, status, type), backlog_ideas, clarifications_needed, conflicts_detected.`

export async function POST(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const { text, auto_commit = false } = await req.json()

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ success: false, error: 'Text input is required.' }, { status: 400 })
    }

    let plan: SynthesizedPlan

    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: text.trim() }
          ],
          temperature: 0.1,
          max_tokens: 2500
        })
        const content = completion.choices[0]?.message?.content
        if (content) {
          plan = JSON.parse(content)
          plan.raw_input = text.trim()
        } else {
          plan = synthesizeHeuristic(text.trim())
        }
      } catch {
        plan = synthesizeHeuristic(text.trim())
      }
    } else {
      plan = synthesizeHeuristic(text.trim())
    }

    // If auto_commit is requested, immediately commit to database
    if (auto_commit) {
      const supabase = getApiClient()
      const workspaceId = await getDefaultWorkspaceId(supabase)
      const ownerId = await getDefaultUserId(supabase)

      let createdProjectId: string | null = null

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
          success_metric: `All ${plan.tasks.length} phased deliverables shipped`
        }).select().single()

        if (projErr) throw projErr
        createdProjectId = project.id
      }

      const insertedTasks = []
      for (const t of plan.tasks) {
        const desc = [
          t.phase ? `[${t.phase}]` : '',
          t.dependencies.length > 0 ? `Dependencies: ${t.dependencies.join(', ')}` : '',
          t.assignee ? `Assignee: ${t.assignee}` : ''
        ].filter(Boolean).join(' • ')

        const { data: createdTask } = await supabase.from('tasks').insert({
          workspace_id: workspaceId,
          owner_id: ownerId,
          project_id: createdProjectId,
          title: t.title,
          description: desc,
          priority: t.priority || 'p1',
          status: t.status || 'todo',
          due_date: t.due_date_iso || null,
          time_box_minutes: 45
        }).select().single()

        if (createdTask) insertedTasks.push(createdTask)
      }

      return NextResponse.json({
        success: true,
        committed: true,
        project_id: createdProjectId,
        tasks_count: insertedTasks.length,
        plan
      })
    }

    return NextResponse.json({
      success: true,
      committed: false,
      plan
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/synthesize] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
