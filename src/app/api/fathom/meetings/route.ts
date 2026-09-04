export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { fetchFathomMeetings } from '@/lib/fathom/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const refresh = searchParams.get('refresh') === 'true'
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    const meetings = await fetchFathomMeetings(limit, refresh)
    return NextResponse.json({ success: true, count: meetings.length, meetings })
  } catch (error: any) {
    console.error('[API /api/fathom/meetings] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
