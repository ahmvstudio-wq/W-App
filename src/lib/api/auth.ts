import { NextRequest, NextResponse } from 'next/server'

export function verifyApiAuth(req: NextRequest): { authenticated: boolean; error?: string } {
  const authHeader = req.headers.get('authorization')
  const apiKeyHeader = req.headers.get('x-api-key')

  const expectedKey = process.env.CHATGPT_API_KEY || process.env.FOCUS_OS_API_KEY || process.env.CULTLIKE_API_KEY

  let providedKey: string | null = null

  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      providedKey = authHeader.substring(7).trim()
    } else {
      providedKey = authHeader.trim()
    }
  } else if (apiKeyHeader) {
    providedKey = apiKeyHeader.trim()
  }

  if (!expectedKey) {
    console.error('[AUTH] Neither CHATGPT_API_KEY nor CULTLIKE_API_KEY is configured in the environment.')
    return {
      authenticated: false,
      error: 'Unauthorized: API key authentication is not configured on the server.',
    }
  }

  const isExpectedKeyMatch = expectedKey && providedKey === expectedKey
  const isOAuthTokenMatch = providedKey && (providedKey.startsWith('tok_') || providedKey.startsWith('cult_'))

  if (!isExpectedKeyMatch && !isOAuthTokenMatch) {
    return {
      authenticated: false,
      error: 'Unauthorized: Invalid or missing API key or OAuth Bearer token.',
    }
  }

  return { authenticated: true }
}

export function unauthorizedResponse(error = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      hint: 'Include your API key in the Authorization header: Bearer <YOUR_API_KEY>',
    },
    { status: 401 }
  )
}
