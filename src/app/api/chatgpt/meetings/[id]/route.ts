export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { fetchFathomRecordingDetail, fetchFathomMeetings } from '@/lib/fathom/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const recordingId = params.id
    if (!recordingId) {
      return NextResponse.json({ success: false, error: 'Recording ID is required.' }, { status: 400 })
    }

    // 1. Fetch direct detail from Fathom API
    const detail = await fetchFathomRecordingDetail(recordingId)

    // 2. Fetch basic metadata from meetings list if needed
    const allMeetings = await fetchFathomMeetings(150)
    const baseMeeting = allMeetings.find(
      (m) => String(m.recording_id) === recordingId || String(m.id) === recordingId
    )

    return NextResponse.json({
      success: true,
      recording_id: recordingId,
      title: baseMeeting?.title || 'Fathom Meeting',
      recorded_at: baseMeeting?.recorded_at,
      duration_minutes: baseMeeting?.duration_minutes,
      video_url: baseMeeting?.video_url || baseMeeting?.share_url,
      attendees: baseMeeting?.attendees?.map((a) => a.name) || [],
      summary_markdown: detail.summary || baseMeeting?.summary || 'No summary available.',
      action_items: detail.action_items || baseMeeting?.action_items || [],
      transcript: detail.transcript || [],
    })
  } catch (error: any) {
    console.error(`[API /api/chatgpt/meetings/${params.id}] Error:`, error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
