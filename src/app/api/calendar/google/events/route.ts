import { NextRequest, NextResponse } from 'next/server'
import { getValidGoogleAccessToken, fetchGoogleCalendarEvents } from '@/lib/google/calendar'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const accessToken = await getValidGoogleAccessToken(req)

    if (!accessToken) {
      return NextResponse.json({
        success: true,
        connected: false,
        events: []
      })
    }

    const events = await fetchGoogleCalendarEvents(accessToken)

    return NextResponse.json({
      success: true,
      connected: true,
      count: events.length,
      events
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
