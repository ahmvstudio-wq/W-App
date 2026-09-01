import { NextRequest, NextResponse } from 'next/server'

export function verifyApiAuth(req: NextRequest): { authenticated: boolean; error?: string } {
  const authHeader = req.headers.get('authorization')
  const apiKeyHeader = req.headers.get('x-api-key')

  const expectedKey = process.env.CHATGPT_API_KEY || process.env.FOCUS_OS_API_KEY

  if (!expectedKey) {
    console.warn('[AUTH] CHATGPT_API_KEY is not set in environment. Access allowed in dev mode.')
    return { authenticated: true }
  }

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

  if (!providedKey || providedKey !== expectedKey) {
    return {
      authenticated: false,
      error: 'Unauthorized: Invalid or missing API key. Please provide a valid Bearer token.',
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
