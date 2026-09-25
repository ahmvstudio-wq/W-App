export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getValidGoogleAccessToken } from '@/lib/google/calendar'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const accessToken = await getValidGoogleAccessToken(req)

    if (!accessToken) {
      return NextResponse.json({
        success: true,
        connected: false,
        files: []
      })
    }

    // Query Google Drive API for Documents, Sheets, Slides, and PDFs
    const driveQuery = "trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.presentation' or mimeType = 'application/pdf')"
    const url = `https://www.googleapis.com/drive/v3/files?pageSize=30&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,webViewLink,createdTime,modifiedTime,iconLink)&q=${encodeURIComponent(driveQuery)}`

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({
        success: false,
        connected: true,
        error: `Drive query failed (${res.status}): ${errText}`,
        files: []
      }, { status: res.status })
    }

    const data = await res.json()
    const files = (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      webViewLink: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      iconLink: file.iconLink,
      isGoogleDoc: file.mimeType === 'application/vnd.google-apps.document',
      isGoogleSheet: file.mimeType === 'application/vnd.google-apps.spreadsheet',
      isGoogleSlide: file.mimeType === 'application/vnd.google-apps.presentation',
      isPdf: file.mimeType === 'application/pdf'
    }))

    return NextResponse.json({
      success: true,
      connected: true,
      count: files.length,
      files
    })
  } catch (error: any) {
    console.error('[API /api/docs/google/files] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
