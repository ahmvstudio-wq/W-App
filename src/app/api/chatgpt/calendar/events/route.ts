export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'

    const eventsRes = await fetch(`${protocol}://${host}/api/calendar/google/events`, {
      method: 'GET',
      headers: {
        'cookie': req.headers.get('cookie') || '',
        'Authorization': req.headers.get('authorization') || ''
      }
    })

    const data = await eventsRes.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[API /api/chatgpt/calendar/events GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
