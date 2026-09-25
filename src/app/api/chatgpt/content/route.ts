export const runtime = 'edge'
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
    const { searchParams } = new URL(req.url)

    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const workspaceIdParam = searchParams.get('workspace_id')

    const ownerId = await getDefaultUserId(supabase)
    const workspaceId = workspaceIdParam || (await getDefaultWorkspaceId(supabase, ownerId))

    if (!workspaceId) {
      return NextResponse.json({ success: true, count: 0, items: [] })
    }

    const items = await getContentItems(supabase, workspaceId, platform, status)

    return NextResponse.json({
      success: true,
      count: items.length,
      workspace_id: workspaceId,
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        platform: item.platform,
        content_type: item.content_type,
        caption: item.caption,
        hook: item.hook,
        angle: item.angle,
        cta: item.cta,
        tags: item.tags,
        scheduled_at: item.scheduled_at,
        published_at: item.published_at,
        drive_file_id: item.drive_file_id,
        drive_web_view_link: item.drive_web_view_link,
        duration_seconds: item.duration_seconds,
        created_at: item.created_at,
      })),
    })
  } catch (error: any) {
    console.error('[ChatGPT Content API GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const body = await req.json()
    const {
      title,
      caption = '',
      platform = 'instagram',
      content_type = 'reel',
      status = 'inbox',
      scheduled_at,
      hook,
      angle,
      cta,
      tags = [],
      drive_file_id,
      drive_web_view_link,
      workspace_id: bodyWsId,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'title is required' }, { status: 400 })
    }

    const ownerId = await getDefaultUserId(supabase)
    const workspaceId = bodyWsId || (await getDefaultWorkspaceId(supabase, ownerId))

    if (!ownerId || !workspaceId) {
      return NextResponse.json({ success: false, error: 'Workspace or owner ID not found' }, { status: 400 })
    }

    const item = await saveContentItem(supabase, {
      title: title.trim(),
      caption: caption.trim(),
      platform,
      content_type,
      status,
      scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : undefined,
      hook: hook || undefined,
      angle: angle || undefined,
      cta: cta || undefined,
      tags: tags || [],
      drive_file_id: drive_file_id || undefined,
      drive_web_view_link: drive_web_view_link || undefined,
      workspace_id: workspaceId,
      owner_id: ownerId,
    })

    return NextResponse.json({
      success: true,
      message: 'Content deliverable created/updated successfully',
      item,
    })
  } catch (error: any) {
    console.error('[ChatGPT Content API POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
