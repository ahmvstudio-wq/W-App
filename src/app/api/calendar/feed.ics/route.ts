import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateIcsCalendar } from '@/lib/google/calendar'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*, project:projects(id, name)')
      .order('created_at', { ascending: false })

    if (error) {
      return new NextResponse(`Error fetching tasks: ${error.message}`, { status: 500 })
    }

    const icsContent = generateIcsCalendar(tasks || [])

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="callmy-tasks.ics"',
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      },
    })
  } catch (err: any) {
    return new NextResponse(`Internal error: ${err.message}`, { status: 500 })
  }
}
