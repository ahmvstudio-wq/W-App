import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient, getDefaultWorkspaceId, getDefaultUserId } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const { searchParams } = new URL(req.url)

    const projectId = searchParams.get('project_id')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    let query = supabase
      .from('documents')
      .select('id, title, content, status, project_id, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data: documents, error } = await query
    if (error) throw error

    return NextResponse.json({
      success: true,
      count: documents?.length || 0,
      documents: documents || [],
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/documents GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const body = await req.json()

    const {
      title = 'Untitled Document',
      content,
      project_id,
      status = 'live',
      workspace_id: explicitWorkspaceId,
      owner_id: explicitOwnerId,
    } = body

    const workspaceId = explicitWorkspaceId || (await getDefaultWorkspaceId(supabase))
    const ownerId = explicitOwnerId || (await getDefaultUserId(supabase))

    // Handle content whether text or JSON
    let parsedContent = content
    if (typeof content === 'string') {
      parsedContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: content }],
          },
        ],
      }
    }

    const newDocData: any = {
      title: title.trim(),
      content: parsedContent || {},
      status,
      project_id: project_id || null,
      workspace_id: workspaceId,
      owner_id: ownerId,
    }

    const { data: document, error } = await supabase
      .from('documents')
      .insert(newDocData)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Document "${document.title}" created successfully.`,
      document,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/documents POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
