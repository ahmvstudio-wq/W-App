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
    const limit = parseInt(searchParams.get('limit') || '7', 10)

    const { data: logs, error } = await supabase
      .from('daily_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      success: true,
      logs: logs || [],
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/daily-logs GET] Error:', error)
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
      date = new Date().toISOString().split('T')[0],
      notes,
      tomorrows_priority,
      tasks_shipped = 0,
      tasks_created = 0,
      blockers_resolved = 0,
      workspace_id: explicitWorkspaceId,
      user_id: explicitUserId,
    } = body

    const workspaceId = explicitWorkspaceId || (await getDefaultWorkspaceId(supabase))
    const userId = explicitUserId || (await getDefaultUserId(supabase))

    const logData = {
      date,
      notes: notes || null,
      tomorrows_priority: tomorrows_priority || null,
      tasks_shipped: Number(tasks_shipped) || 0,
      tasks_created: Number(tasks_created) || 0,
      blockers_resolved: Number(blockers_resolved) || 0,
      workspace_id: workspaceId,
      user_id: userId,
    }

    const { data: log, error } = await supabase
      .from('daily_logs')
      .upsert(logData, { onConflict: 'user_id,date' })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Daily log for ${date} saved successfully.`,
      log,
    })
  } catch (error: any) {
    console.error('[API /api/chatgpt/daily-logs POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
