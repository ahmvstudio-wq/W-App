export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getValidGoogleAccessToken } from '@/lib/google/calendar'
import { listGoogleDriveVideos } from '@/lib/google/drive'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const accessToken = await getValidGoogleAccessToken(req)

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: 'Google Drive is not connected. User must connect Google in Cultlike OS Settings.',
        videos: [],
      })
    }

    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get('folder_id') || undefined
    const q = searchParams.get('q') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 30

    const { videos, folders } = await listGoogleDriveVideos(accessToken, {
      folderId,
      searchQuery: q,
      pageSize: limit,
    })

    return NextResponse.json({
      success: true,
      connected: true,
      count: videos.length,
      videos: videos.map((v) => ({
        id: v.id,
        name: v.name,
        size: v.sizeFormatted,
        duration: v.durationFormatted,
        duration_seconds: v.durationSeconds,
        aspect_ratio: v.aspectRatio,
        web_view_link: v.webViewLink,
        download_link: v.webContentLink,
      })),
      folders,
    })
  } catch (error: any) {
    console.error('[ChatGPT Drive Videos API] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
