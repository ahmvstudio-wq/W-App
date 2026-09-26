import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = process.env.OPENAI_APPS_CHALLENGE_TOKEN || 'cultlike_openai_apps_challenge_verified'
  
  return new NextResponse(token, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
