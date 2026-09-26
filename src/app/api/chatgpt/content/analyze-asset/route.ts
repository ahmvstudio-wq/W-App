export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const body = await req.json()
    const { id, title, transcript = '', notes = '', platform = 'instagram', content_type = 'reel' } = body

    let targetTitle = title
    let targetTranscript = transcript
    let targetNotes = notes

    if (id) {
      const supabase = getApiClient()
      const { data: item } = await supabase.from('content_items').select('*').eq('id', id).single()
      if (item) {
        targetTitle = targetTitle || item.title
        targetTranscript = targetTranscript || item.transcript || ''
        targetNotes = targetNotes || item.caption || ''
      }
    }

    if (!targetTitle) {
      return NextResponse.json({ success: false, error: 'Deliverable title or id is required.' }, { status: 400 })
    }

    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'

    const analyzeRes = await fetch(`${protocol}://${host}/api/content/ai/analyze-asset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: targetTitle,
        transcript: targetTranscript,
        notes: targetNotes,
        platform,
        content_type
      })
    })

    const data = await analyzeRes.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[API /api/chatgpt/content/analyze-asset POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
