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

  // Extract requested service target (workspace | calendar | youtube | drive)
  const service = req.nextUrl.searchParams.get('service') || 'workspace'
  const returnTo = req.nextUrl.searchParams.get('return_to') || ''

  // Google does not allow YouTube sensitive scopes and Google Drive scopes to be requested in the same OAuth request.
  // We partition scopes strictly by requested service and use incremental auth (include_granted_scopes: true).
  let scopesList: string[] = []

  if (service === 'youtube') {
    scopesList = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    ]
  } else {
    // Default to Google Drive, Docs & Calendar
    scopesList = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/documents',
    ]
  }

  const scopes = scopesList.join(' ')

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleAuthUrl.searchParams.set('client_id', clientId)
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
  googleAuthUrl.searchParams.set('response_type', 'code')
  googleAuthUrl.searchParams.set('scope', scopes)
  googleAuthUrl.searchParams.set('access_type', 'offline')
  googleAuthUrl.searchParams.set('prompt', 'select_account consent')
  // CRITICAL: Do NOT set include_granted_scopes to 'true'.
  // Google strictly forbids combining YouTube upload/analytics scopes with Google Drive scopes in one token grant.
  // If include_granted_scopes=true is set, Google automatically merges previously granted Drive scopes with YouTube,
  // triggering "Error 400: invalid_request - scopes that cannot be requested together".
  
  const stateVal = returnTo ? `${service}::${returnTo}` : service
  googleAuthUrl.searchParams.set('state', stateVal)

  return NextResponse.redirect(googleAuthUrl.toString())
}
