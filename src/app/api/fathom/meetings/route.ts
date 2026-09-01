import { NextRequest, NextResponse } from 'next/server'
import { fetchFathomMeetings } from '@/lib/fathom/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const meetings = await fetchFathomMeetings()
    return NextResponse.json({ success: true, meetings })
  } catch (error: any) {
    console.error('[API /api/fathom/meetings] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
