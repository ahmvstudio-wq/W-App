export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { fetchFathomRecordingDetail } from '@/lib/fathom/client'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const detail = await fetchFathomRecordingDetail(id)
    return NextResponse.json({ success: true, detail })
  } catch (error: any) {
    console.error(`[API /api/fathom/recording/${params.id}] Error:`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
