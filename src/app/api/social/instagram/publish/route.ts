import { NextRequest, NextResponse } from 'next/server'
import { getApiClient } from '@/lib/supabase/admin'
import { publishToInstagram } from '@/lib/social/instagram'
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

    await updateContentItem(admin, content_item_id, { status: 'publishing' })

    const mediaUrl = item.media_urls?.[0] || item.thumbnail_url || 'https://placehold.co/1080x1920.mp4'
    const mediaType = item.content_type === 'post' || item.content_type === 'carousel' ? 'IMAGE' : 'REELS'

    const metaToken = req.cookies.get('meta_page_token')?.value || req.cookies.get('meta_access_token')?.value
    const igAccountId = req.cookies.get('instagram_account_id')?.value

    const result = await publishToInstagram({
      caption: item.caption || item.title,
      mediaUrl,
      mediaType,
      ...(metaToken ? { accessToken: metaToken } : {}),
      ...(igAccountId ? { instagramAccountId: igAccountId } : {}),
    })

    if (!result.success) {
      await updateContentItem(admin, content_item_id, {
        status: 'failed',
        metrics: { ...item.metrics, error: result.error } as any
      })
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    await updateContentItem(admin, content_item_id, {
      status: 'published',
      published_at: new Date().toISOString(),
      external_post_id: result.mediaId,
      external_post_url: result.postUrl
    })

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        status: 'published',
        external_post_id: result.mediaId,
        external_post_url: result.postUrl
      }
    })
  } catch (error: any) {
    console.error('[API Instagram Publish] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
