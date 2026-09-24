import { NextRequest, NextResponse } from 'next/server'
import { fetchFathomRecordingDetail } from '@/lib/fathom/client'
import { getApiClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    let userApiKey = req.headers.get('x-fathom-key')?.trim() || req.nextUrl.searchParams.get('api_key')?.trim()

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

    if (!userApiKey) {
      return NextResponse.json({
        success: false,
        error: 'No Fathom connection found for this user.'
      }, { status: 401 })
    }

    const detail = await fetchFathomRecordingDetail(id, userApiKey)
    return NextResponse.json({ success: true, detail })
  } catch (error: any) {
    console.error(`[API /api/fathom/recording/${params.id}] Error:`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
