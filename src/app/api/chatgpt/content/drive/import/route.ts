export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient, getDefaultWorkspaceId, getDefaultUserId } from '@/lib/supabase/admin'
import { saveContentItem } from '@/lib/content/store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const workspaceId = await getDefaultWorkspaceId(supabase)
    const ownerId = await getDefaultUserId(supabase)

    const body = await req.json()
    const { items = [] } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No Drive items provided for import' }, { status: 400 })
    }

    const importedItems = []

    for (const rawItem of items) {
      let cleanTitle = (rawItem.title || rawItem.name || 'Untitled Deliverable')
        .replace(/\.(mp4|mov|m4v|avi|mkv|webm)$/i, '')
        .replace(/^[_-\s]+|[_-\s]+$/g, '')

      const isShortVertical =
        rawItem.aspectRatio === '9:16' ||
        (rawItem.duration_seconds && rawItem.duration_seconds <= 90) ||
        rawItem.content_type === 'reel' ||
        rawItem.content_type === 'short'

      const platform = rawItem.platform || (isShortVertical ? 'instagram' : 'youtube')
      const contentType = platform === 'youtube'
        ? (rawItem.content_type === 'video' ? 'video' : 'short')
        : (rawItem.content_type || (isShortVertical ? 'reel' : 'video'))

      const saved = await saveContentItem(supabase, {
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
        workspace_id: workspaceId || '',
        owner_id: ownerId || '',
      })

      importedItems.push(saved)
    }

    return NextResponse.json({
      success: true,
      count: importedItems.length,
      items: importedItems,
      message: `Successfully imported ${importedItems.length} deliverable(s) into Content Vault.`
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/content/drive/import POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
