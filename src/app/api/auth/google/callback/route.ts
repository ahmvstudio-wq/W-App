export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const host = req.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const appBaseUrl = `${protocol}://${host}`

  if (error || !code) {
    return NextResponse.redirect(`${appBaseUrl}/settings?google_error=${encodeURIComponent(error || 'No authorization code provided')}`)
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${appBaseUrl}/api/auth/google/callback`

  if (!clientSecret) {
    // If client secret is not yet filled in .env, redirect with instructions
    return NextResponse.redirect(`${appBaseUrl}/settings?google_status=missing_secret&code=${code}`)
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      return NextResponse.redirect(`${appBaseUrl}/settings?google_error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`)
    }

    // Set cookie or pass status back to settings
    const response = NextResponse.redirect(`${appBaseUrl}/settings?google_connected=true`)
    if (tokenData.access_token) {
      response.cookies.set('gcal_access_token', tokenData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: tokenData.expires_in || 3600,
        path: '/',
      })
    }
    if (tokenData.refresh_token) {
      response.cookies.set('gcal_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }

    return response
  } catch (err: any) {
    return NextResponse.redirect(`${appBaseUrl}/settings?google_error=${encodeURIComponent(err.message)}`)
  }
}
