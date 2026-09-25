export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getValidGoogleAccessToken } from '@/lib/google/calendar'
import { refreshYouTubeToken } from '@/lib/social/youtube'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  // 1. Test Google Calendar
  try {
    const gcalToken = await getValidGoogleAccessToken(req)
    if (!gcalToken) {
      results.tests.google_calendar = {
        success: false,
        connected: false,
        error: 'No active Google Calendar token found in session. Please click "Connect Calendar & Workspace" in Settings.'
      }
    } else {
      const gcalRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5', {
        headers: { 'Authorization': `Bearer ${gcalToken}` },
        cache: 'no-store'
      })
      const gcalData = await gcalRes.json()
      if (gcalRes.ok) {
        results.tests.google_calendar = {
          success: true,
          connected: true,
          calendar_title: gcalData.summary || 'Primary Calendar',
          time_zone: gcalData.timeZone,
          events_retrieved: gcalData.items?.length || 0,
          sample_events: (gcalData.items || []).slice(0, 3).map((item: any) => ({
            id: item.id,
            summary: item.summary || 'Untitled Event',
            start: item.start?.dateTime || item.start?.date
          }))
        }
      } else {
        results.tests.google_calendar = {
          success: false,
          connected: true,
          status: gcalRes.status,
          error: gcalData.error?.message || 'Failed to query Calendar API'
        }
      }
    }
  } catch (err: any) {
    results.tests.google_calendar = { success: false, error: err.message }
  }

  // 2. Test Google Drive & Docs (using Workspace token)
  try {
    const driveToken = await getValidGoogleAccessToken(req)
    if (!driveToken) {
      results.tests.google_drive = {
        success: false,
        connected: false,
        error: 'No active Workspace token in session'
      }
    } else {
      const driveRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=5', {
        headers: { 'Authorization': `Bearer ${driveToken}` },
        cache: 'no-store'
      })
      const driveData = await driveRes.json()
      if (driveRes.ok) {
        results.tests.google_drive = {
          success: true,
          connected: true,
          files_found: driveData.files?.length || 0,
          sample_files: (driveData.files || []).slice(0, 3).map((f: any) => ({
            name: f.name,
            mimeType: f.mimeType
          }))
        }
      } else {
        results.tests.google_drive = {
          success: false,
          connected: true,
          status: driveRes.status,
          error: driveData.error?.message || 'Drive query failed'
        }
      }
    }
  } catch (err: any) {
    results.tests.google_drive = { success: false, error: err.message }
  }

  // 3. Test YouTube Data API v3
  try {
    let ytToken = req.cookies.get('youtube_access_token')?.value
    const ytRefresh = req.cookies.get('youtube_refresh_token')?.value

    if (!ytToken && ytRefresh) {
      ytToken = (await refreshYouTubeToken(ytRefresh)) || undefined
    }

    if (!ytToken) {
      results.tests.youtube = {
        success: false,
        connected: false,
        error: 'No active YouTube token found in session. Please click "Connect YouTube Channel" in Settings.'
      }
    } else {
      const ytRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
        headers: { 'Authorization': `Bearer ${ytToken}` },
        cache: 'no-store'
      })
      const ytData = await ytRes.json()
      if (ytRes.ok) {
        const channel = ytData.items?.[0]
        results.tests.youtube = {
          success: true,
          connected: true,
          channel_title: channel?.snippet?.title || 'Personal Channel',
          custom_url: channel?.snippet?.customUrl || null,
          subscriber_count: channel?.statistics?.subscriberCount || '0',
          video_count: channel?.statistics?.videoCount || '0',
          view_count: channel?.statistics?.viewCount || '0'
        }
      } else {
        results.tests.youtube = {
          success: false,
          connected: true,
          status: ytRes.status,
          error: ytData.error?.message || 'Failed to query YouTube API'
        }
      }
    }
  } catch (err: any) {
    results.tests.youtube = { success: false, error: err.message }
  }

  // 4. Test Supabase Database
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const [tasksRes, projectsRes] = await Promise.all([
      supabase.from('tasks').select('id, title, status').limit(5),
      supabase.from('projects').select('id, name').limit(5)
    ])

    results.tests.supabase = {
      success: !tasksRes.error && !projectsRes.error,
      tasks_count: tasksRes.data?.length || 0,
      projects_count: projectsRes.data?.length || 0,
      sample_tasks: (tasksRes.data || []).slice(0, 3).map(t => t.title)
    }
  } catch (err: any) {
    results.tests.supabase = { success: false, error: err.message }
  }

  // 5. Test Instagram Graph API
  try {
    const igToken = req.cookies.get('meta_page_token')?.value || 
                    req.cookies.get('meta_access_token')?.value || 
                    process.env.INSTAGRAM_ACCESS_TOKEN || 
                    process.env.META_ACCESS_TOKEN

    if (!igToken) {
      results.tests.instagram = {
        success: false,
        connected: false,
        error: 'No active Instagram access token configured in environment or session.'
      }
    } else {
      const igRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${igToken}`,
        { cache: 'no-store' }
      )
      const igData = await igRes.json()
      if (igRes.ok) {
        results.tests.instagram = {
          success: true,
          connected: true,
          username: `@${igData.username}`,
          account_id: igData.id,
          account_type: igData.account_type,
          media_count: igData.media_count || 0
        }
      } else {
        results.tests.instagram = {
          success: false,
          connected: true,
          error: igData.error?.message || 'Instagram API query failed'
        }
      }
    }
  } catch (err: any) {
    results.tests.instagram = { success: false, error: err.message }
  }

  const allSuccess = Object.values(results.tests).every((t: any) => t.success)

  return NextResponse.json({
    status: allSuccess ? 'ALL_SYSTEMS_OPERATIONAL' : 'SYSTEMS_READY_WITH_NOTICES',
    results
  }, {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
