import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const { id } = params

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !document) {
      return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, document })
  } catch (error: any) {
    console.error('[API /api/chatgpt/documents/[id] GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const { id } = params
    const updates = await req.json()

    if (typeof updates.content === 'string') {
      updates.content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: updates.content }],
          },
        ],
      }
    }

    updates.updated_at = new Date().toISOString()

    const { data: document, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Document "${document.title}" updated successfully.`,
      document,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/documents/[id] PATCH] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const { id } = params

    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Document deleted successfully.`,
      id,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/documents/[id] DELETE] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
