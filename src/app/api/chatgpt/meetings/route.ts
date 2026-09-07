export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { fetchFathomMeetings } from '@/lib/fathom/client'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.toLowerCase()
    const date = searchParams.get('date') // YYYY-MM-DD
    const attendee = searchParams.get('attendee')?.toLowerCase()
    const limit = parseInt(searchParams.get('limit') || '25', 10)

    const allMeetings = await fetchFathomMeetings()

    let filtered = allMeetings.filter((m) => {
      // 1. Search keyword
      if (search) {
        const titleMatch = m.title.toLowerCase().includes(search)
        const summaryMatch = m.summary.toLowerCase().includes(search)
        const attendeeMatch = m.attendees.some((a) => a.name.toLowerCase().includes(search))
        if (!titleMatch && !summaryMatch && !attendeeMatch) return false
      }

      // 2. Date match (YYYY-MM-DD)
      if (date) {
        const mDate = format(new Date(m.recorded_at), 'yyyy-MM-dd')
        if (mDate !== date) return false
      }

      // 3. Attendee match
      if (attendee) {
        const hasAttendee = m.attendees.some((a) => a.name.toLowerCase().includes(attendee))
        if (!hasAttendee) return false
      }

      return true
    })

    const paginated = filtered.slice(0, limit).map((m) => ({
      id: m.id,
      recording_id: m.recording_id,
      title: m.title,
      recorded_at: m.recorded_at,
      date_formatted: format(new Date(m.recorded_at), 'yyyy-MM-dd HH:mm'),
      duration_minutes: m.duration_minutes,
      video_url: m.video_url || m.share_url,
      attendees: m.attendees.map((a) => a.name),
      summary_snippet: m.summary ? m.summary.slice(0, 300) : '',
      action_items_count: m.action_items?.length || 0,
    }))

    return NextResponse.json({
      success: true,
      total_meetings_indexed: allMeetings.length,
      filtered_count: filtered.length,
      meetings: paginated,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/meetings GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
