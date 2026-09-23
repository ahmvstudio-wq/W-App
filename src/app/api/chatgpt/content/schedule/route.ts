import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient } from '@/lib/supabase/admin'
import { updateContentItem } from '@/lib/content/store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const { id, scheduled_at } = await req.json()

    if (!id || !scheduled_at) {
      return NextResponse.json({ success: false, error: 'id and scheduled_at (ISO datetime) are required' }, { status: 400 })
    }

    const scheduledIso = new Date(scheduled_at).toISOString()
    const success = await updateContentItem(supabase, id, {
      scheduled_at: scheduledIso,
      status: 'scheduled'
    })

    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to update schedule' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      item: { id, scheduled_at: scheduledIso, status: 'scheduled' }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
