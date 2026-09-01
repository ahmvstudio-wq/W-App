import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { synthesizeHeuristic, type SynthesizedPlan } from '@/lib/ai/synthesizer'

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

You MUST return a JSON object with this exact schema (NO Markdown, NO code blocks, ONLY valid JSON):
{
  "mode": "project_with_phases" | "single_task" | "task_group",
  "project_name": "Concise Executive Title",
  "description": "Short summary of goal",
  "deadline_label": "e.g. Tomorrow 1:30 PM",
  "deadline_iso": "ISO string",
  "priority": "p0" | "p1" | "p2",
  "phases": [
    { "id": "ph-1", "name": "PHASE 1 — ...", "task_count": number }
  ],
  "tasks": [
    {
      "id": "t-1",
      "title": "Deliverable title",
      "phase": "PHASE 1 — ...",
      "priority": "p0" | "p1" | "p2",
      "due_date_label": "e.g. Tomorrow 11:30 AM",
      "due_date_iso": "ISO string",
      "assignee": "Name or Role",
      "dependencies": ["Task title required beforehand"],
      "confidence": "explicit" | "implied",
      "status": "todo",
      "type": "core_deliverable" | "follow_up" | "review" | "handoff",
      "is_selected": true
    }
  ],
  "backlog_ideas": ["Future idea 1"],
  "clarifications_needed": ["Question 1"],
  "conflicts_detected": []
}`

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Input text is required' }, { status: 400 })
    }

    // Try Groq LLM if configured
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: text.trim() }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 2500
        })

        const content = completion.choices[0]?.message?.content
        if (content) {
          const parsed = JSON.parse(content) as SynthesizedPlan
          parsed.raw_input = text.trim()
          return NextResponse.json({ success: true, plan: parsed })
        }
      } catch (err) {
        console.warn('[Synthesizer] Groq call failed, falling back to heuristic engine:', err)
      }
    }

    // Fallback to high-precision heuristic engine
    const plan = synthesizeHeuristic(text)
    return NextResponse.json({ success: true, plan })
  } catch (error: any) {
    console.error('[API /api/ai/synthesize] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
