export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getApiClient, getUserWorkspaces, ensureUserWorkspace } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Helper to extract authenticated user from Supabase session header or bearer token
async function getAuthUser(req: NextRequest) {
  const supabase = getApiClient()
  const authHeader = req.headers.get('authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user) return user
  }

  // Check custom user ID header (if passed from client proxy)
  const headerUserId = req.headers.get('x-user-id')
  if (headerUserId) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', headerUserId).single()
    if (profile) return profile
  }

  return null
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getApiClient()
    const user = await getAuthUser(req)

    if (!user) {
      // Fallback: If no direct session user header, query all workspaces
      const { data: allWs } = await supabase.from('workspaces').select('*').order('created_at', { ascending: false })
      return NextResponse.json({
        success: true,
        workspaces: allWs || [],
      })
    }

    // Get user workspaces
    let workspaces = await getUserWorkspaces(user.id, supabase)
    
    if (workspaces.length === 0) {
      // Auto-provision initial workspace
      const defaultWs = await ensureUserWorkspace(user.id, (user as any).name || (user as any).email?.split('@')[0], supabase)
      workspaces = [defaultWs]
    }

    return NextResponse.json({
      success: true,
      workspaces,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getApiClient()
    const body = await req.json()
    const { name, user_id } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Workspace name is required.' }, { status: 400 })
    }

    const authUser = await getAuthUser(req)
    const ownerId = authUser?.id || user_id

    if (!ownerId) {
      return NextResponse.json({ success: false, error: 'Owner user ID is required.' }, { status: 400 })
    }

    // 1. Create Workspace
    const { data: newWs, error: createError } = await supabase
      .from('workspaces')
      .insert({
        name: name.trim(),
        owner_id: ownerId,
        settings: {},
      })
      .select()
      .single()

    if (createError || !newWs) {
      throw createError || new Error('Failed to create workspace')
    }

    // 2. Add owner to workspace_members
    try {
      await supabase.from('workspace_members').insert({
        workspace_id: newWs.id,
        user_id: ownerId,
        role: 'owner',
      })
    } catch {}

    return NextResponse.json({
      success: true,
      workspace: {
        ...newWs,
        role: 'owner',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
