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

    // 1. Check explicit per-user Fathom key passed in header or query
    let userApiKey = req.headers.get('x-fathom-key')?.trim() || searchParams.get('api_key')?.trim()

    // 2. If not in header, check authenticated user's metadata
    if (!userApiKey) {
      const authHeader = req.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        try {
          const supabase = getApiClient()
          const { data: { user } } = await supabase.auth.getUser(token)
          if (user?.user_metadata?.fathom_api_key) {
            userApiKey = (user.user_metadata.fathom_api_key as string).trim()
          }
        } catch {}
      }
    }

    // 3. Fallback to workspace-level key if set by the owner
    if (!userApiKey && workspaceId) {
      try {
        const supabase = getApiClient()
        const { data: ws } = await supabase.from('workspaces').select('settings').eq('id', workspaceId).single()
        if (ws?.settings?.fathom_api_key) {
          userApiKey = (ws.settings.fathom_api_key as string).trim()
        }
      } catch {}
    }

    // If still no key, this user has NOT connected their Fathom account.
    // Return empty list and connected: false — NEVER show another user's meetings!
    if (!userApiKey) {
      return NextResponse.json({
        success: true,
        count: 0,
        meetings: [],
        connected: false,
        message: 'No Fathom account connected for this user.'
      })
    }

    const meetings = await fetchFathomMeetings(limit, refresh, userApiKey)
    return NextResponse.json({
      success: true,
      count: meetings.length,
      meetings,
      connected: true
    })
  } catch (error: any) {
    console.error('[API /api/fathom/meetings] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
