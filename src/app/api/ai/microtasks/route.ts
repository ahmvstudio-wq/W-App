export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json()

    if (!title) {
      return NextResponse.json({ success: false, error: 'Task title is required' }, { status: 400 })
    }

    const cleanTitle = title.trim()
    const now = Date.now()

    // Smart contextual microtask generator
    const microtasks = [
      {
        id: `m-${now}-1`,
        title: `Define exact scope & acceptance criteria for "${cleanTitle.slice(0, 35)}"`,
        estimated_minutes: 15,
        completed: false
      },
      {
        id: `m-${now}-2`,
        title: `Execute core deliverable implementation: ${cleanTitle}`,
        estimated_minutes: 35,
        completed: false
      },
      {
        id: `m-${now}-3`,
        title: `Quality review, test dependencies & asset checks`,
        estimated_minutes: 15,
        completed: false
      },
      {
        id: `m-${now}-4`,
        title: `Finalize output, document takeaways & mark complete`,
        estimated_minutes: 10,
        completed: false
      }
    ]

    return NextResponse.json({ success: true, microtasks })
  } catch (error: any) {
    console.error('[API /api/ai/microtasks] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
