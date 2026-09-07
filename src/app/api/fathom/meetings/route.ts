export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { fetchFathomMeetings } from '@/lib/fathom/client'
import { getApiClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const refresh = searchParams.get('refresh') === 'true'
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    const workspaceId = searchParams.get('workspace_id') || req.headers.get('x-workspace-id')

    let customApiKey: string | undefined
    if (workspaceId) {
      try {
        const supabase = getApiClient()
        const { data: ws } = await supabase.from('workspaces').select('settings').eq('id', workspaceId).single()
        if (ws?.settings?.fathom_api_key) {
          customApiKey = ws.settings.fathom_api_key
        }
      } catch {}
    }

    const meetings = await fetchFathomMeetings(limit, refresh, customApiKey)
    return NextResponse.json({ success: true, count: meetings.length, meetings })
  } catch (error: any) {
    console.error('[API /api/fathom/meetings] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
