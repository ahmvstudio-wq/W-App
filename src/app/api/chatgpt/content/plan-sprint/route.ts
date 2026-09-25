export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient, getDefaultWorkspaceId, getDefaultUserId } from '@/lib/supabase/admin'
import { getContentItems, updateContentItem } from '@/lib/content/store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const body = await req.json()
    const {
      workspace_id: bodyWsId,
      sprint_days = 14,
      items_per_day = 1,
      platforms = ['instagram', 'youtube'],
      start_date = new Date().toISOString().split('T')[0],
      item_ids, // optional: specific item IDs to schedule; otherwise picks from 'inbox'
    } = body

    const ownerId = await getDefaultUserId(supabase)
    const workspaceId = bodyWsId || (await getDefaultWorkspaceId(supabase, ownerId))

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 400 })
    }

    const allItems = await getContentItems(supabase, workspaceId)
    let candidateItems = allItems.filter((i) => i.status === 'inbox' || i.status === 'draft')

    if (item_ids && Array.isArray(item_ids) && item_ids.length > 0) {
      candidateItems = allItems.filter((i) => item_ids.includes(i.id))
    }

    if (candidateItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No unscheduled inbox assets available to plan into the sprint. Import assets from Google Drive first.',
      })
    }

    const scheduledResults: any[] = []
    const startDateObj = new Date(start_date)
    let currentDayOffset = 0
    let itemIndex = 0

    // Schedule items across sprint
    while (itemIndex < candidateItems.length && currentDayOffset < sprint_days) {
      for (let slot = 0; slot < items_per_day && itemIndex < candidateItems.length; slot++) {
        const item = candidateItems[itemIndex]
        const scheduleDate = new Date(startDateObj)
        scheduleDate.setDate(scheduleDate.getDate() + currentDayOffset)

        // Set optimal posting hour (e.g. 18:30 UTC for slot 0, 12:00 UTC for slot 1)
        const hour = slot === 0 ? 18 : 12
        scheduleDate.setHours(hour, 30, 0, 0)

        // Alternate platform if multiple chosen
        const targetPlatform = platforms[itemIndex % platforms.length]
        const targetContentType = targetPlatform === 'instagram' ? 'reel' : 'short'

        const updates = {
          status: 'scheduled' as const,
          scheduled_at: scheduleDate.toISOString(),
          platform: targetPlatform as any,
          content_type: targetContentType as any,
        }

        await updateContentItem(supabase, item.id, updates)

        scheduledResults.push({
          id: item.id,
          title: item.title,
          scheduled_at: scheduleDate.toISOString(),
          platform: targetPlatform,
          content_type: targetContentType,
        })

        itemIndex++
      }
      currentDayOffset++
    }

    return NextResponse.json({
      success: true,
      message: `Successfully scheduled ${scheduledResults.length} assets across a ${sprint_days}-day sprint.`,
      count: scheduledResults.length,
      scheduled: scheduledResults,
    })
  } catch (error: any) {
    console.error('[ChatGPT Plan Sprint API] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
