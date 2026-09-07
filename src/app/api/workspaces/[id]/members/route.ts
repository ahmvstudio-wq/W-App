export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getApiClient, getWorkspaceMembers } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getApiClient()
    const workspaceId = params.id

    const members = await getWorkspaceMembers(workspaceId, supabase)

    return NextResponse.json({
      success: true,
      members,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getApiClient()
    const workspaceId = params.id
    const body = await req.json()
    const { user_id, email, role = 'member' } = body

    let targetUserId = user_id

    // If email provided instead of user_id, search for existing user profile
    if (!targetUserId && email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name')
        .ilike('name', `%${email.split('@')[0]}%`)
        .limit(1)
        .single()

      if (profile) {
        targetUserId = profile.id
      }
    }

    if (!targetUserId) {
      // Create an invite if user doesn't exist yet
      const token = `inv_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`
      try {
        await supabase.from('workspace_invites').insert({
          workspace_id: workspaceId,
          email: email || '',
          role,
          token,
        })
      } catch {}

      return NextResponse.json({
        success: true,
        invited: true,
        email,
        token,
        message: `Invitation generated for ${email}.`,
      })
    }

    // Insert or update member record
    const { data: member, error } = await supabase
      .from('workspace_members')
      .upsert(
        {
          workspace_id: workspaceId,
          user_id: targetUserId,
          role,
        },
        { onConflict: 'workspace_id,user_id' }
      )
      .select('*, profile:profiles(id, name, avatar_url)')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      member,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getApiClient()
    const workspaceId = params.id
    const body = await req.json()
    const { user_id, role } = body

    if (!user_id || !role) {
      return NextResponse.json({ success: false, error: 'user_id and role are required.' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', user_id)
      .select('*, profile:profiles(id, name, avatar_url)')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      member: updated,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getApiClient()
    const workspaceId = params.id
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'user_id parameter is required.' }, { status: 400 })
    }

    // Prevent removing workspace owner
    const { data: ws } = await supabase.from('workspaces').select('owner_id').eq('id', workspaceId).single()
    if (ws?.owner_id === userId) {
      return NextResponse.json({ success: false, error: 'Cannot remove workspace owner.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      removed_user_id: userId,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
