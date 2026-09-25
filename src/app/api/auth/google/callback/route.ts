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
    // Determine secrets to try (handle potential typo or leading L)
    const secretsToTry = [
      clientSecret.startsWith('LGOCSPX-') ? clientSecret.slice(1) : clientSecret,
      clientSecret.startsWith('LGOCSPX-') ? clientSecret : (clientSecret.startsWith('GOCSPX-') ? `L${clientSecret}` : clientSecret)
    ].filter((s, i, arr) => arr.indexOf(s) === i)

    let tokenData: any = null
    let lastError = ''

    for (const secret of secretsToTry) {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId || '',
          client_secret: secret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      const data = await tokenRes.json()
      if (data.access_token) {
        tokenData = data
        break
      } else {
        lastError = data.error_description || data.error || 'Token exchange failed'
      }
    }

    if (!tokenData || !tokenData.access_token) {
      return NextResponse.redirect(`${appBaseUrl}/settings?google_error=${encodeURIComponent(lastError)}`)
    }

    // Set cookies and redirect back to settings
    const state = searchParams.get('state')
    const isYouTube = state === 'youtube'
    const redirectParam = isYouTube ? 'youtube_connected=true' : 'google_connected=true'
    const response = NextResponse.redirect(`${appBaseUrl}/settings?${redirectParam}`)
    
    // Cookie options
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    }

    if (isYouTube) {
      // Set YouTube specific tokens
      response.cookies.set('youtube_access_token', tokenData.access_token, {
        ...cookieOpts,
        maxAge: tokenData.expires_in || 3600,
      })
      if (tokenData.refresh_token) {
        response.cookies.set('youtube_refresh_token', tokenData.refresh_token, {
          ...cookieOpts,
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      }
    } else {
      // Set Google Calendar & Workspace tokens
      response.cookies.set('gcal_access_token', tokenData.access_token, {
        ...cookieOpts,
        maxAge: tokenData.expires_in || 3600,
      })
      if (tokenData.refresh_token) {
        response.cookies.set('gcal_refresh_token', tokenData.refresh_token, {
          ...cookieOpts,
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      }
    }

    // Set unified google access token
    response.cookies.set('google_access_token', tokenData.access_token, {
      ...cookieOpts,
      maxAge: tokenData.expires_in || 3600,
    })
    if (tokenData.refresh_token) {
      response.cookies.set('google_refresh_token', tokenData.refresh_token, {
        ...cookieOpts,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    }

    return response
  } catch (err: any) {
    return NextResponse.redirect(`${appBaseUrl}/settings?google_error=${encodeURIComponent(err.message)}`)
  }
}
