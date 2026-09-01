export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const { id } = params

    const { data: project, error } = await supabase
      .from('projects')
      .select('*, tasks(*), owner:profiles(*)')
      .eq('id', id)
      .single()

    if (error || !project) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, project })
  } catch (error: any) {
    console.error('[API /api/chatgpt/projects/[id] GET] Error:', error)
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

    updates.updated_at = new Date().toISOString()

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Project "${project.name}" updated successfully.`,
      project,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/projects/[id] PATCH] Error:', error)
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

    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Project deleted successfully.`,
      id,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/projects/[id] DELETE] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
