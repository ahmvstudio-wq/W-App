export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'

    const syncRes = await fetch(`${protocol}://${host}/api/calendar/google/sync`, {
      method: 'POST',
      headers: {
        'cookie': req.headers.get('cookie') || '',
        'Authorization': req.headers.get('authorization') || ''
      }
    })

    const data = await syncRes.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[API /api/chatgpt/calendar/sync POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
