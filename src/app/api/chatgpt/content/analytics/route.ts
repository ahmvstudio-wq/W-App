import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth, unauthorizedResponse } from '@/lib/api/auth'
import { getApiClient, getDefaultWorkspaceId } from '@/lib/supabase/admin'
import { getContentItems } from '@/lib/content/store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = verifyApiAuth(req)
  if (!auth.authenticated) return unauthorizedResponse(auth.error)

  try {
    const supabase = getApiClient()
    const workspaceId = await getDefaultWorkspaceId(supabase)

    if (!workspaceId) {
      return NextResponse.json({
        success: true,
        analytics: {
          total_items: 0,
          total_views: 0,
          total_likes: 0,
          total_comments: 0,
          by_platform: { youtube: 0, instagram: 0 },
          by_status: { draft: 0, scheduled: 0, published: 0 }
        }
      })
    }

    const allItems = await getContentItems(supabase, workspaceId)
    const totalViews = allItems.reduce((acc, i) => acc + (i.metrics?.views || 0), 0)
    const totalLikes = allItems.reduce((acc, i) => acc + (i.metrics?.likes || 0), 0)
    const totalComments = allItems.reduce((acc, i) => acc + (i.metrics?.comments || 0), 0)

    const byPlatform = {
      youtube: allItems.filter(i => i.platform === 'youtube').length,
      instagram: allItems.filter(i => i.platform === 'instagram').length,
    }

    const byStatus = {
      draft: allItems.filter(i => i.status === 'draft').length,
      scheduled: allItems.filter(i => i.status === 'scheduled').length,
      published: allItems.filter(i => i.status === 'published').length,
    }

    return NextResponse.json({
      success: true,
      analytics: {
        total_items: allItems.length,
        total_views: totalViews,
        total_likes: totalLikes,
        total_comments: totalComments,
        by_platform: byPlatform,
        by_status: byStatus
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
