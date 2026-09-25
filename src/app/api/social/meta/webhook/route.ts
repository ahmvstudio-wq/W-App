import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Meta Webhook Verification and Event Dispatcher
 * Used for Instagram Graph API and Facebook Webhooks
 */

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'cultlike_meta_verify_2026'

  if (mode === 'subscribe' && token === expectedToken) {
    console.info('[Meta Webhook] Verification successful. Responding with challenge.')
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  console.warn('[Meta Webhook] Verification failed. Received token does not match expected verify token.')
  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    console.info('[Meta Webhook] Received event payload:', JSON.stringify(payload).slice(0, 200))

    // Handle Instagram / Facebook events here if needed (e.g. comment notifications, publish status)

    return NextResponse.json({ success: true, received: true }, { status: 200 })
  } catch (err: any) {
    console.error('[Meta Webhook] Error processing event:', err)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}
