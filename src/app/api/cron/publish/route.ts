import { NextRequest, NextResponse } from 'next/server'
import { getApiClient } from '@/lib/supabase/admin'
import { publishToYouTube } from '@/lib/social/youtube'
import { publishToInstagram } from '@/lib/social/instagram'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Support cron auth check if CRON_SECRET is configured
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized cron dispatch' }, { status: 401 })
  }

  const admin = getApiClient()
  const nowIso = new Date().toISOString()

  try {
    // 1. Fetch overdue scheduled deliverables
    const { data: scheduledItems, error } = await admin
      .from('content_items')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', nowIso)
      .limit(10)

    if (error || !scheduledItems || scheduledItems.length === 0) {
      return NextResponse.json({
        success: true,
        dispatched: 0,
        message: 'No pending scheduled deliverables.'
      })
    }

    const results = []

    for (const item of scheduledItems) {
      await admin
        .from('content_items')
        .update({ status: 'publishing', updated_at: new Date().toISOString() })
        .eq('id', item.id)

      let pubResult: { success: boolean; videoId?: string; videoUrl?: string; mediaId?: string; postUrl?: string; error?: string }

      if (item.platform === 'youtube') {
        const mediaUrl = item.media_urls?.[0] || item.thumbnail_url || 'https://placehold.co/1920x1080.mp4'
        pubResult = await publishToYouTube({
          title: item.title,
          description: item.caption,
          mediaUrl
        })
      } else {
        const mediaUrl = item.media_urls?.[0] || item.thumbnail_url || 'https://placehold.co/1080x1920.mp4'
        const mediaType = item.content_type === 'post' || item.content_type === 'carousel' ? 'IMAGE' : 'REELS'
        pubResult = await publishToInstagram({
          caption: item.caption || item.title,
          mediaUrl,
          mediaType
        })
      }

      if (pubResult.success) {
        await admin
          .from('content_items')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            external_post_id: pubResult.videoId || pubResult.mediaId,
            external_post_url: pubResult.videoUrl || pubResult.postUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)

        results.push({ id: item.id, title: item.title, status: 'published' })
      } else {
        await admin
          .from('content_items')
          .update({
            status: 'failed',
            error_message: pubResult.error,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id)

        results.push({ id: item.id, title: item.title, status: 'failed', error: pubResult.error })
      }
    }

    return NextResponse.json({
      success: true,
      dispatched: results.length,
      items: results
    })
  } catch (error: any) {
    console.error('[API /api/cron/publish] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Cron error' }, { status: 500 })
  }
}
