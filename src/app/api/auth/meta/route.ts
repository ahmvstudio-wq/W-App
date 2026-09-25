import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID

  if (!appId) {
    return NextResponse.json({ 
      error: 'META_APP_ID is not configured in .env.local. Please configure your Meta App ID from developers.facebook.com' 
    }, { status: 400 })
  }

  // Derive redirect URI dynamically based on configured app URL or current host
  const appBase = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  let redirectUri = `${appBase}/api/auth/meta/callback`
  if (!appBase) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    redirectUri = `${protocol}://${host}/api/auth/meta/callback`
  }

  // Requested Scopes for Instagram Content Publishing & Analytics
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
    'business_management',
  ].join(',')

  const returnTo = req.nextUrl.searchParams.get('returnTo') || '/settings'

  const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  authUrl.searchParams.set('client_id', appId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('state', encodeURIComponent(returnTo))

  return NextResponse.redirect(authUrl.toString())
}
