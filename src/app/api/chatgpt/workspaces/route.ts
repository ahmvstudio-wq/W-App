export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient, getDefaultWorkspaceId } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('id, name, created_at, owner_id')
      .order('created_at', { ascending: true })

    if (error) throw error

    const defaultId = await getDefaultWorkspaceId(supabase)

    return NextResponse.json({
      success: true,
      default_workspace_id: defaultId,
      workspaces: workspaces || []
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/workspaces GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
