export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getApiClient, getWorkspaceMembers } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getApiClient()
    const workspaceId = params.id

    const { data: ws, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single()

    if (error || !ws) {
      return NextResponse.json({ success: false, error: 'Workspace not found.' }, { status: 404 })
    }

    const members = await getWorkspaceMembers(workspaceId, supabase)

    return NextResponse.json({
      success: true,
      workspace: {
        ...ws,
        members,
        member_count: members.length,
      },
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
    const { name, settings } = body

    const updates: any = { updated_at: new Date().toISOString() }
    if (name && name.trim()) updates.name = name.trim()
    if (settings) updates.settings = settings

    const { data: updated, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      workspace: updated,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getApiClient()
    const workspaceId = params.id

    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      deleted_id: workspaceId,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
