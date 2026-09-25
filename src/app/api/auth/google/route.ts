export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  
  if (!clientId) {
    return NextResponse.json({ error: 'Google Client ID is not configured' }, { status: 400 })
  }

  // Derive redirect URI dynamically based on configured app URL or current host
  const appBase = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  let redirectUri = `${appBase}/api/auth/google/callback`
  if (!appBase) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    redirectUri = `${protocol}://${host}/api/auth/google/callback`
  }

  // Extract requested service target (workspace | calendar | youtube)
  const service = req.nextUrl.searchParams.get('service') || 'workspace'

  let scopesList: string[] = []

  if (service === 'youtube') {
    // YouTube Data API v3 & YouTube Analytics
    scopesList = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    ]
  } else {
    // Google Calendar & Workspace (Docs & Drive file access)
    scopesList = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive.file',
    ]
  }

  const scopes = scopesList.join(' ')

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleAuthUrl.searchParams.set('client_id', clientId)
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
  googleAuthUrl.searchParams.set('response_type', 'code')
  googleAuthUrl.searchParams.set('scope', scopes)
  googleAuthUrl.searchParams.set('access_type', 'offline')
  googleAuthUrl.searchParams.set('prompt', 'consent')
  googleAuthUrl.searchParams.set('state', service)

  return NextResponse.redirect(googleAuthUrl.toString())
}
