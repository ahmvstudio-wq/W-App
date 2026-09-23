export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { synthesizeHeuristic } from '@/lib/ai/synthesizer'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Input text is required' }, { status: 400 })
    }

    // High-precision, zero-latency deterministic synthesis engine
    const plan = synthesizeHeuristic(text.trim())
    return NextResponse.json({ success: true, plan })
  } catch (error: any) {
    console.error('[API /api/ai/synthesize] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
