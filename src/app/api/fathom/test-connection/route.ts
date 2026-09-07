export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const apiKey = (body.api_key || '').trim()

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key is required.' }, { status: 400 })
    }

    // Test API call to Fathom
    const res = await fetch('https://api.fathom.ai/external/v1/meetings?limit=1', {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json({
        success: false,
        error: `Fathom rejected key (HTTP ${res.status}): ${errorText || 'Unauthorized or invalid token'}`,
      }, { status: 400 })
    }

    const data = await res.json()
    const hasItems = Array.isArray(data.items)

    return NextResponse.json({
      success: true,
      message: 'Fathom API Key verified successfully!',
      sample_meeting_found: hasItems && data.items.length > 0,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
