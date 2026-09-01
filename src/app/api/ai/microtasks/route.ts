import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const dynamic = 'force-dynamic'

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null

const SYSTEM_PROMPT = `You are the Task Decomposition Engine of CallMy Mgmt.
Given a task title and description, break it down into 3 to 6 atomic, actionable micro-tasks (under 15-45 minutes each).

Return valid JSON with format:
{
  "microtasks": [
    {
      "id": "m-1",
      "title": "Clear actionable step title",
      "estimated_minutes": 20,
      "completed": false
    }
  ]
}`

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json()

    if (!title) {
      return NextResponse.json({ success: false, error: 'Task title is required' }, { status: 400 })
    }

    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Task: ${title}\nDescription: ${description || 'No description'}` }
          ],
          temperature: 0.1,
          max_tokens: 800
        })

        const content = completion.choices[0]?.message?.content
        if (content) {
          const parsed = JSON.parse(content)
          if (Array.isArray(parsed.microtasks)) {
            return NextResponse.json({ success: true, microtasks: parsed.microtasks })
          }
        }
      } catch (err) {
        console.warn('[Microtasks AI] Groq call failed, fallback to heuristic decomposition:', err)
      }
    }

    // Heuristic Fallback
    const fallbackMicrotasks = [
      { id: `m-${Date.now()}-1`, title: `Specify technical requirements for "${title.slice(0, 30)}"`, estimated_minutes: 15, completed: false },
      { id: `m-${Date.now()}-2`, title: `Execute core deliverable implementation`, estimated_minutes: 30, completed: false },
      { id: `m-${Date.now()}-3`, title: `Verify output, test edge cases & edge dependencies`, estimated_minutes: 15, completed: false },
      { id: `m-${Date.now()}-4`, title: `Package and handoff/ship completed artifact`, estimated_minutes: 10, completed: false }
    ]

    return NextResponse.json({ success: true, microtasks: fallbackMicrotasks })
  } catch (error: any) {
    console.error('[API /api/ai/microtasks] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
