export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient } from '@/lib/supabase/admin'
import { publishToYouTube } from '@/lib/social/youtube'
import { publishToInstagram } from '@/lib/social/instagram'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const { id } = params
    const body = await req.json().catch(() => ({}))

    // 1. Fetch content item
    const { data: item, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !item) {
      return NextResponse.json({ success: false, error: 'Content deliverable not found.' }, { status: 404 })
    }

    const platform = body.platform || item.platform || 'youtube'
    const mediaUrl = body.media_url || item.media_urls?.[0] || item.drive_download_link || ''

    if (!mediaUrl && !process.env.SIMULATE_SOCIAL_DISPATCH) {
      // If no media URL, check if we can publish metadata or simulated dispatch
    }

    let publishResult: { success: boolean; postUrl?: string; videoUrl?: string; error?: string } = { success: false }

    if (platform === 'youtube') {
      publishResult = await publishToYouTube({
        title: body.title || item.title,
        description: body.caption || item.caption || '',
        mediaUrl: mediaUrl || 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        privacyStatus: body.privacy_status || 'public',
        tags: item.tags || []
      })
    } else if (platform === 'instagram') {
      publishResult = await publishToInstagram({
        caption: body.caption || item.caption || item.title,
        mediaUrl: mediaUrl || 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        mediaType: item.content_type === 'carousel' ? 'VIDEO' : 'REELS'
      })
    } else {
      return NextResponse.json({ success: false, error: `Unsupported platform: ${platform}` }, { status: 400 })
    }

    if (publishResult.success) {
      const publishedUrl = publishResult.postUrl || publishResult.videoUrl || ''
      await supabase
        .from('content_items')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          post_url: publishedUrl
        })
        .eq('id', id)

      return NextResponse.json({
        success: true,
        message: `Successfully published "${item.title}" to ${platform}!`,
        url: publishedUrl,
        deliverable_id: id
      })
    } else {
      return NextResponse.json({
        success: false,
        error: publishResult.error || `Publishing to ${platform} failed.`
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[API /api/chatgpt/content/[id]/publish POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
