export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getValidGoogleAccessToken } from '@/lib/google/calendar'
import { listGoogleDriveVideos } from '@/lib/google/drive'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const accessToken = await getValidGoogleAccessToken(req)

    if (!accessToken) {
      return NextResponse.json({
        connected: false,
        message: 'Google account is not connected. Connect your Google Workspace or Drive account in Settings.',
        authUrl: '/api/auth/google?service=workspace&return_to=/content',
        videos: [],
        folders: [],
      })
    }

    const { searchParams } = new URL(req.url)
    const folderId = searchParams.get('folder_id') || undefined
    const searchQuery = searchParams.get('q') || undefined
    const pageSize = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50

    try {
      const { videos, folders } = await listGoogleDriveVideos(accessToken, {
        folderId,
        searchQuery,
        pageSize,
      })

      return NextResponse.json({
        connected: true,
        videos,
        folders,
        total: videos.length,
      })
    } catch (driveErr: any) {
      console.error('[Google Drive Fetch Error]', driveErr)
      const isScopeError =
        driveErr?.message?.includes('insufficient') ||
        driveErr?.message?.includes('scope') ||
        driveErr?.message?.includes('permission')

      return NextResponse.json({
        connected: !isScopeError,
        error: driveErr?.message || 'Failed to list Google Drive video assets',
        requiresReauth: isScopeError,
        authUrl: '/api/auth/google?service=workspace&return_to=/content',
        videos: [],
        folders: [],
      })
    }
  } catch (error: any) {
    console.error('[API /api/content/drive/files GET] Error:', error)
    return NextResponse.json(
      {
        connected: false,
        error: error.message || 'Server error',
        videos: [],
        folders: [],
      },
      { status: 500 }
    )
  }
}
