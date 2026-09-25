import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApiClient, getDefaultWorkspaceId, getDefaultUserId } from '@/lib/supabase/admin'
import { saveContentItem } from '@/lib/content/store'
import type { ContentItem } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await req.json()
    const { items = [], workspace_id: bodyWsId } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items provided for import' }, { status: 400 })
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

    const importedItems: ContentItem[] = []

    for (const rawItem of items) {
      // Clean title from filename extensions like .mp4, .mov, .m4v
      let cleanTitle = (rawItem.title || rawItem.name || 'Untitled Deliverable')
        .replace(/\.(mp4|mov|m4v|avi|mkv|webm)$/i, '')
        .replace(/^[_-\s]+|[_-\s]+$/g, '')

      // Determine platform & content type
      const isShortVertical =
        rawItem.aspectRatio === '9:16' ||
        (rawItem.duration_seconds && rawItem.duration_seconds <= 90) ||
        rawItem.content_type === 'reel' ||
        rawItem.content_type === 'short'

      const platform = rawItem.platform || (isShortVertical ? 'instagram' : 'youtube')
      const contentType = rawItem.content_type || (isShortVertical ? 'reel' : 'video')

      const saved = await saveContentItem(client, {
        title: cleanTitle,
        caption: rawItem.caption || '',
        platform,
        content_type: contentType,
        status: 'inbox',
        media_urls: rawItem.media_urls || (rawItem.webContentLink ? [rawItem.webContentLink] : []),
        thumbnail_url: rawItem.thumbnail_url || rawItem.thumbnailUrl || undefined,
        drive_file_id: rawItem.id || rawItem.drive_file_id || undefined,
        drive_web_view_link: rawItem.webViewLink || rawItem.drive_web_view_link || undefined,
        drive_download_link: rawItem.webContentLink || rawItem.drive_download_link || undefined,
        transcript: rawItem.transcript || undefined,
        hook: rawItem.hook || undefined,
        angle: rawItem.angle || undefined,
        cta: rawItem.cta || undefined,
        tags: rawItem.tags || [],
        duration_seconds: rawItem.duration_seconds || rawItem.durationSeconds || undefined,
        file_size_bytes: rawItem.file_size_bytes || rawItem.size || undefined,
        workspace_id: workspaceId,
        owner_id: userId,
      })

      importedItems.push(saved)
    }

    return NextResponse.json({
      success: true,
      count: importedItems.length,
      items: importedItems,
    })
  } catch (error: any) {
    console.error('[API /api/content/drive/import POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
