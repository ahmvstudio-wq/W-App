import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason') || searchParams.get('error_description')
  const state = searchParams.get('state')

  const host = req.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const appBaseUrl = `${protocol}://${host}`
  const returnTo = state ? decodeURIComponent(state) : '/settings'

  if (error || !code) {
    console.error('[Meta Auth] Callback error:', error, errorReason)
    return NextResponse.redirect(
      `${appBaseUrl}${returnTo}?meta_error=${encodeURIComponent(errorReason || error || 'Authorization failed')}`
    )
  }

  const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET
  const redirectUri = `${appBaseUrl}/api/auth/meta/callback`

  if (!appId || !appSecret) {
    return NextResponse.redirect(
      `${appBaseUrl}${returnTo}?meta_error=${encodeURIComponent('META_APP_ID or META_APP_SECRET is not configured in .env.local')}`
    )
  }

  try {
    // 1. Exchange authorization code for short-lived User Access Token
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
    tokenUrl.searchParams.set('client_id', appId)
    tokenUrl.searchParams.set('client_secret', appSecret)
    tokenUrl.searchParams.set('redirect_uri', redirectUri)
    tokenUrl.searchParams.set('code', code)

    const tokenRes = await fetch(tokenUrl.toString())
    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[Meta Auth] Short token exchange failed:', tokenData)
      return NextResponse.redirect(
        `${appBaseUrl}${returnTo}?meta_error=${encodeURIComponent(tokenData.error?.message || 'Failed to exchange authorization code')}`
      )
    }

    let userAccessToken = tokenData.access_token

    // 2. Exchange short-lived token for Long-Lived Token (60 days)
    try {
      const longTokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
      longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token')
      longTokenUrl.searchParams.set('client_id', appId)
      longTokenUrl.searchParams.set('client_secret', appSecret)
      longTokenUrl.searchParams.set('fb_exchange_token', userAccessToken)

      const longTokenRes = await fetch(longTokenUrl.toString())
      const longTokenData = await longTokenRes.json()

      if (longTokenData.access_token) {
        userAccessToken = longTokenData.access_token
      }
    } catch (err) {
      console.warn('[Meta Auth] Long-lived token exchange warning, falling back to short token:', err)
    }

    // 3. Resolve Facebook Pages and linked Instagram Business Account
    let instagramAccountId = ''
    let instagramUsername = ''
    let instagramAvatar = ''
    let pageAccessToken = ''

    try {
      const accountsRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${userAccessToken}`
      )
      const accountsData = await accountsRes.json()

      if (accountsData.data && accountsData.data.length > 0) {
        for (const page of accountsData.data) {
          if (page.instagram_business_account?.id) {
            instagramAccountId = page.instagram_business_account.id
            instagramUsername = page.instagram_business_account.username || ''
            instagramAvatar = page.instagram_business_account.profile_picture_url || ''
            pageAccessToken = page.access_token || ''
            break
          }
        }
      }
    } catch (err) {
      console.warn('[Meta Auth] Error fetching linked Instagram accounts:', err)
    }

    // 4. Construct response redirect
    const targetUrl = new URL(`${appBaseUrl}${returnTo}`)
    targetUrl.searchParams.set('meta_connected', 'true')
    if (instagramUsername) targetUrl.searchParams.set('ig_user', instagramUsername)
    if (instagramAccountId) targetUrl.searchParams.set('ig_id', instagramAccountId)

    const response = NextResponse.redirect(targetUrl.toString())

    // 5. Store tokens in secure cookies (valid for 60 days)
    const cookieAge = 60 * 60 * 24 * 60 // 60 days
    const isProduction = process.env.NODE_ENV === 'production'

    response.cookies.set('meta_access_token', userAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: cookieAge,
    })

    if (pageAccessToken) {
      response.cookies.set('meta_page_token', pageAccessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: cookieAge,
      })
    }

    if (instagramAccountId) {
      response.cookies.set('instagram_account_id', instagramAccountId, {
        httpOnly: false, // Accessible to client UI
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: cookieAge,
      })
    }

    if (instagramUsername) {
      response.cookies.set('instagram_username', instagramUsername, {
        httpOnly: false, // Accessible to client UI
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: cookieAge,
      })
    }

    return response
  } catch (err: any) {
    console.error('[Meta Auth] Exception in callback:', err)
    return NextResponse.redirect(
      `${appBaseUrl}${returnTo}?meta_error=${encodeURIComponent(err.message || 'Internal error in Meta authentication')}`
    )
  }
}
