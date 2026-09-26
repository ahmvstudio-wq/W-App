import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/oauth/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    let grantType = ''
    let code = ''
    let clientId = ''
    let clientSecret = ''
    let redirectUri = ''
    let codeVerifier = ''

    // Parse Authorization header for HTTP Basic Auth if present
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Basic ')) {
      const creds = Buffer.from(authHeader.substring(6), 'base64').toString('ascii').split(':')
      clientId = creds[0]
      clientSecret = creds[1] || ''
    }

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData()
      grantType = (formData.get('grant_type') as string) || ''
      code = (formData.get('code') as string) || ''
      clientId = clientId || (formData.get('client_id') as string) || ''
      clientSecret = clientSecret || (formData.get('client_secret') as string) || ''
      redirectUri = (formData.get('redirect_uri') as string) || ''
      codeVerifier = (formData.get('code_verifier') as string) || ''
    } else {
      const body = await req.json().catch(() => ({}))
      grantType = body.grant_type || ''
      code = body.code || ''
      clientId = clientId || body.client_id || ''
      clientSecret = clientSecret || body.client_secret || ''
      redirectUri = body.redirect_uri || ''
      codeVerifier = body.code_verifier || ''
    }

    if (grantType !== 'authorization_code' && grantType !== 'refresh_token') {
      return NextResponse.json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code and refresh_token are supported.'
      }, { status: 400 })
    }

    if (!code && grantType === 'authorization_code') {
      return NextResponse.json({
        error: 'invalid_request',
        error_description: 'Missing authorization code.'
      }, { status: 400 })
    }

    const tokenResponse = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri, codeVerifier)

    return NextResponse.json(tokenResponse, {
      headers: {
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error: any) {
    console.error('[API /api/oauth/token] Error:', error)
    return NextResponse.json({
      error: 'invalid_grant',
      error_description: error.message || 'Token exchange failed.'
    }, { status: 400 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}
