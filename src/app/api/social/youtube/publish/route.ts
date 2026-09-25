import { NextRequest, NextResponse } from 'next/server'
import { getApiClient } from '@/lib/supabase/admin'
import { publishToYouTube } from '@/lib/social/youtube'
import { getContentItemById, updateContentItem } from '@/lib/content/store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { content_item_id } = await req.json()
    if (!content_item_id) {
      return NextResponse.json({ success: false, error: 'content_item_id is required' }, { status: 400 })
    }

    const admin = getApiClient()
    const item = await getContentItemById(admin, content_item_id)

    if (!item) {
      return NextResponse.json({ success: false, error: 'Content item not found' }, { status: 404 })
    }

    // Set status to publishing
    await updateContentItem(admin, content_item_id, { status: 'publishing' })

    const mediaUrl = item.media_urls?.[0] || item.thumbnail_url || 'https://placehold.co/1920x1080.mp4'

    const accessToken = req.cookies.get('youtube_access_token')?.value || req.cookies.get('google_access_token')?.value
    const refreshToken = req.cookies.get('youtube_refresh_token')?.value || req.cookies.get('google_refresh_token')?.value

    const result = await publishToYouTube({
      title: item.title,
      description: item.caption,
      mediaUrl,
      privacyStatus: 'public',
      accessToken,
      refreshToken,
    })

    if (!result.success) {
      await updateContentItem(admin, content_item_id, {
        status: 'failed',
        metrics: { ...item.metrics, error: result.error } as any
      })
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    // Update with live post details
    await updateContentItem(admin, content_item_id, {
      status: 'published',
      published_at: new Date().toISOString(),
      external_post_id: result.videoId,
      external_post_url: result.videoUrl
    })

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        status: 'published',
        external_post_id: result.videoId,
        external_post_url: result.videoUrl
      }
    })
  } catch (error: any) {
    console.error('[API YouTube Publish] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
