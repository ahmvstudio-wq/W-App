import { NextRequest, NextResponse } from 'next/server'
import { getApiClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const token = body.token || req.headers.get('authorization')?.replace('Bearer ', '')

    if (token) {
      const admin = getApiClient()
      await admin.from('oauth_tokens').delete().eq('access_token', token)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
