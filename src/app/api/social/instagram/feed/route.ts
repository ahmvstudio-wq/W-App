import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const accessToken = 
      req.cookies.get('meta_page_token')?.value || 
      req.cookies.get('meta_access_token')?.value || 
      process.env.INSTAGRAM_ACCESS_TOKEN || 
      process.env.META_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json({
        success: true,
        connected: false,
        account: null,
        reels: []
      })
    }

    // 1. Fetch Profile Data
    let account: any = {
      username: process.env.INSTAGRAM_USERNAME || 'w.ahmvdd',
      id: process.env.INSTAGRAM_ACCOUNT_ID || '38573606682285011',
      account_type: 'MEDIA_CREATOR'
    }

    try {
      const profileRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`,
        { cache: 'no-store' }
      )
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        account = {
          id: profileData.id,
          username: profileData.username,
          account_type: profileData.account_type || 'MEDIA_CREATOR',
          media_count: profileData.media_count || 0
        }
      }
    } catch (err) {
      console.warn('[Instagram Feed] Profile fetch fallback:', err)
    }

    // 2. Fetch Media (Reels & Posts)
    const mediaRes = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=20&access_token=${accessToken}`,
      { cache: 'no-store' }
    )

    let items: any[] = []

    if (mediaRes.ok) {
      const mediaData = await mediaRes.json()
      items = (mediaData.data || []).map((m: any) => {
        const isReel = m.media_type === 'VIDEO'
        const title = m.caption ? (m.caption.split('\n')[0].slice(0, 70) || 'Instagram Reel') : 'Instagram Post'
        
        return {
          id: `ig_${m.id}`,
          title,
          caption: m.caption || '',
          platform: 'instagram' as const,
          content_type: isReel ? 'reel' as const : 'post' as const,
          status: 'published' as const,
          thumbnail_url: m.thumbnail_url || m.media_url || '',
          media_urls: m.media_url ? [m.media_url] : [],
          external_post_id: m.id,
          external_post_url: m.permalink || `https://www.instagram.com/p/${m.id}/`,
          published_at: m.timestamp || new Date().toISOString(),
          metrics: {
            views: 0,
            likes: 0,
            comments: 0
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      connected: true,
      account,
      reels: items
    })
  } catch (err: any) {
    console.error('[Instagram Feed] Error:', err)
    return NextResponse.json({
      success: false,
      connected: false,
      error: err.message || 'Failed to fetch Instagram feed'
    }, { status: 500 })
  }
}
