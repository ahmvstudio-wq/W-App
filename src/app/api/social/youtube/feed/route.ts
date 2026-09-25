export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { refreshYouTubeToken } from '@/lib/social/youtube'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    let accessToken =
      req.cookies.get('youtube_access_token')?.value ||
      req.cookies.get('google_access_token')?.value ||
      process.env.YOUTUBE_ACCESS_TOKEN ||
      process.env.GOOGLE_ACCESS_TOKEN
    const refreshToken =
      req.cookies.get('youtube_refresh_token')?.value ||
      req.cookies.get('google_refresh_token')?.value ||
      process.env.YOUTUBE_REFRESH_TOKEN ||
      process.env.GOOGLE_REFRESH_TOKEN

    if (!accessToken && refreshToken) {
      accessToken = (await refreshYouTubeToken(refreshToken)) || undefined
    }

    if (!accessToken) {
      return NextResponse.json({
        success: true,
        connected: false,
        channel: null,
        videos: [],
        authUrl: '/api/auth/google?service=youtube&return_to=/create'
      })
    }

    // 1. Fetch authenticated YouTube Channel Info & Uploads Playlist
    let channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true',
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        cache: 'no-store'
      }
    )

    if (channelRes.status === 401 && refreshToken) {
      const refreshed = await refreshYouTubeToken(refreshToken)
      if (refreshed) {
        accessToken = refreshed
        channelRes = await fetch(
          'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true',
          {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            cache: 'no-store'
          }
        )
      }
    }

    if (!channelRes.ok) {
      return NextResponse.json({
        success: true,
        connected: false,
        channel: null,
        videos: [],
        authUrl: '/api/auth/google?service=youtube&return_to=/create'
      })
    }

    const channelData = await channelRes.json()
    const channelItem = channelData.items?.[0]

    if (!channelItem) {
      return NextResponse.json({
        success: true,
        connected: true,
        channel: null,
        videos: [],
        message: 'No YouTube channel found for this Google account.'
      })
    }

    const channel = {
      id: channelItem.id,
      title: channelItem.snippet?.title || 'YouTube Channel',
      customUrl: channelItem.snippet?.customUrl || null,
      thumbnail: channelItem.snippet?.thumbnails?.medium?.url || channelItem.snippet?.thumbnails?.default?.url || '',
      subscriberCount: channelItem.statistics?.subscriberCount || '0',
      videoCount: channelItem.statistics?.videoCount || '0',
      viewCount: channelItem.statistics?.viewCount || '0'
    }

    const uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) {
      return NextResponse.json({
        success: true,
        connected: true,
        channel,
        videos: []
      })
    }

    // 2. Fetch recent videos from the Uploads Playlist
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=25`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        cache: 'no-store'
      }
    )

    if (!playlistRes.ok) {
      return NextResponse.json({
        success: true,
        connected: true,
        channel,
        videos: []
      })
    }

    const playlistData = await playlistRes.json()
    const playlistItems = playlistData.items || []

    const videoIds = playlistItems
      .map((item: any) => item.contentDetails?.videoId)
      .filter(Boolean)

    if (videoIds.length === 0) {
      return NextResponse.json({
        success: true,
        connected: true,
        channel,
        videos: []
      })
    }

    // 3. Fetch video metrics (views, likes, comments, duration)
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        cache: 'no-store'
      }
    )

    let videoStatsMap: Record<string, any> = {}
    if (videosRes.ok) {
      const vData = await videosRes.json()
      for (const v of vData.items || []) {
        videoStatsMap[v.id] = v
      }
    }

    // 4. Assemble clean video objects matching ContentItem format
    const videos = playlistItems.map((item: any) => {
      const videoId = item.contentDetails?.videoId
      const statsItem = videoStatsMap[videoId] || {}
      const snippet = statsItem.snippet || item.snippet || {}
      const statistics = statsItem.statistics || {}

      const durationStr = statsItem.contentDetails?.duration || ''
      // Simple heuristic: if duration under 60s or title contains #shorts, mark as short
      const isShort = durationStr.includes('S') && !durationStr.includes('M') && !durationStr.includes('H')
        || (snippet.title || '').toLowerCase().includes('#shorts')

      const thumbs = snippet.thumbnails || {}
      const thumbUrl = thumbs.maxres?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || ''

      return {
        id: `yt_${videoId}`,
        external_post_id: videoId,
        title: snippet.title || 'Untitled Video',
        caption: snippet.description || '',
        platform: 'youtube' as const,
        content_type: isShort ? ('short' as const) : ('video' as const),
        status: 'published' as const,
        thumbnail_url: thumbUrl,
        media_urls: [thumbUrl],
        external_post_url: `https://www.youtube.com/watch?v=${videoId}`,
        published_at: snippet.publishedAt || item.contentDetails?.videoPublishedAt,
        metrics: {
          views: parseInt(statistics.viewCount || '0', 10),
          likes: parseInt(statistics.likeCount || '0', 10),
          comments: parseInt(statistics.commentCount || '0', 10),
          shares: 0
        }
      }
    })

    return NextResponse.json({
      success: true,
      connected: true,
      channel,
      videos
    })
  } catch (error: any) {
    console.error('[API /api/social/youtube/feed] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
