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
    const { id, title, description = '' } = body

    let targetTitle = title
    let targetDesc = description

    if (id) {
      const supabase = getApiClient()
      const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single()
      if (task) {
        targetTitle = targetTitle || task.title
        targetDesc = targetDesc || task.description || ''
      }
    }

    if (!targetTitle) {
      return NextResponse.json({ success: false, error: 'Task title or id is required.' }, { status: 400 })
    }

    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'

    const res = await fetch(`${protocol}://${host}/api/ai/microtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: targetTitle, description: targetDesc })
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[API /api/chatgpt/tasks/microtasks POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
