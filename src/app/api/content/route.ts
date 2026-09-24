import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApiClient, getDefaultWorkspaceId, getDefaultUserId } from '@/lib/supabase/admin'
import { getContentItems, saveContentItem } from '@/lib/content/store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')
    const workspaceIdParam = searchParams.get('workspace_id')

    let client = supabase
    let workspaceId = workspaceIdParam

    if (!user) {
      client = getApiClient() as any
      if (!workspaceId) {
        workspaceId = await getDefaultWorkspaceId(client)
      }
    } else if (!workspaceId) {
      const { data: wsData } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .single()
      workspaceId = wsData?.id || null
    }

    if (!workspaceId) {
      return NextResponse.json({ success: true, items: [] })
    }

    const items = await getContentItems(client, workspaceId, platform, status)
    return NextResponse.json({ success: true, items })
  } catch (error: any) {
    console.error('[API /api/content GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await req.json()
    const {
      title,
      caption = '',
      platform = 'youtube',
      content_type = 'video',
      status = 'draft',
      media_urls = [],
      thumbnail_url = null,
      scheduled_at = null,
      workspace_id: bodyWsId
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    let client = supabase
    let userId: string | null = user?.id || null
    let workspaceId: string | null = bodyWsId || null

    if (!user) {
      client = getApiClient() as any
      userId = await getDefaultUserId(client)
      workspaceId = workspaceId || (await getDefaultWorkspaceId(client))
    } else if (!workspaceId) {
      const { data: wsData } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .single()
      workspaceId = wsData?.id || null
    }

    if (!workspaceId || !userId) {
      return NextResponse.json({ success: false, error: 'Workspace or user not found' }, { status: 400 })
    }

    const saved = await saveContentItem(client, {
      title: title.trim(),
      caption: caption.trim(),
      platform,
      content_type,
      status,
      media_urls,
      thumbnail_url: thumbnail_url || undefined,
      scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : undefined,
      workspace_id: workspaceId,
      owner_id: userId
    })

    return NextResponse.json({ success: true, item: saved })
  } catch (error: any) {
    console.error('[API /api/content POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
