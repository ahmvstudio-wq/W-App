import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApiClient } from '@/lib/supabase/admin'
import { updateContentItem, deleteContentItem } from '@/lib/content/store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getApiClient()
    const { id } = params

    const { data } = await admin
      .from('content_items')
      .select('*')
      .eq('id', id)
      .single()

    if (data) return NextResponse.json({ success: true, item: data })

    const { data: workspaces } = await admin.from('workspaces').select('settings')
    if (workspaces) {
      for (const ws of workspaces) {
        const item = (ws.settings?.content_items || []).find((i: any) => i.id === id)
        if (item) return NextResponse.json({ success: true, item })
      }
    }

    return NextResponse.json({ success: false, error: 'Content item not found' }, { status: 404 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getApiClient()
    const { id } = params
    const body = await req.json()

    await updateContentItem(admin, id, body)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getApiClient()
    const { id } = params

    await deleteContentItem(admin, id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
