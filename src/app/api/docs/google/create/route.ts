export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getValidGoogleAccessToken } from '@/lib/google/calendar'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = await getValidGoogleAccessToken(req)

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Google Workspace. Please click "Connect Calendar & Workspace" in Settings.'
      }, { status: 401 })
    }

    const { title = 'Untitled Strategy Doc', workspace_id } = await req.json()

    // 1. Create fresh document via Google Docs API
    const docsRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title.trim()
      })
    })

    if (!docsRes.ok) {
      const errText = await docsRes.text()
      return NextResponse.json({
        success: false,
        error: `Google Docs API error (${docsRes.status}): ${errText}`
      }, { status: docsRes.status })
    }

    const docData = await docsRes.json()
    const documentId = docData.documentId
    const editUrl = `https://docs.google.com/document/d/${documentId}/edit`

    // 2. Persist in Supabase Documents table for instant access
    let savedDoc = null
    try {
      const supabase = getSupabase()
      let wsId = workspace_id
      if (!wsId) {
        const { data: ws } = await supabase.from('workspaces').select('id').limit(1).single()
        wsId = ws?.id
      }

      if (wsId) {
        const { data } = await supabase.from('documents').insert({
          workspace_id: wsId,
          title: title.trim(),
          content: {
            type: 'google_doc',
            google_document_id: documentId,
            google_edit_url: editUrl,
            synced_at: new Date().toISOString()
          },
          status: 'live',
          last_opened_at: new Date().toISOString()
        }).select().single()
        savedDoc = data
      }
    } catch (dbErr) {
      console.warn('[Google Docs create] DB persistence notice:', dbErr)
    }

    return NextResponse.json({
      success: true,
      documentId,
      title: docData.title || title,
      editUrl,
      document: savedDoc
    })
  } catch (error: any) {
    console.error('[API /api/docs/google/create] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
