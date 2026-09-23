import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient, getDefaultWorkspaceId, getDefaultUserId } from '@/lib/supabase/admin'
import { getContentItems, saveContentItem } from '@/lib/content/store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const workspaceId = await getDefaultWorkspaceId(supabase)

    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    if (!workspaceId) {
      return NextResponse.json({ success: true, items: [], count: 0 })
    }

    const items = await getContentItems(supabase, workspaceId, platform, status)

    return NextResponse.json({
      success: true,
      items: items.slice(0, limit),
      count: items.length
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const workspaceId = await getDefaultWorkspaceId(supabase)
    const ownerId = await getDefaultUserId(supabase)

    if (!workspaceId || !ownerId) {
      return NextResponse.json({ success: false, error: 'Workspace or default user not found' }, { status: 400 })
    }

    const body = await req.json()
    const {
      title,
      caption = '',
      platform = 'youtube',
      content_type = 'video',
      status = 'draft',
      scheduled_at = null,
      media_urls = []
    } = body

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const saved = await saveContentItem(supabase, {
      workspace_id: workspaceId,
      owner_id: ownerId,
      title,
      caption,
      platform,
      content_type,
      status,
      scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : undefined,
      media_urls
    })

    return NextResponse.json({ success: true, item: saved })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
