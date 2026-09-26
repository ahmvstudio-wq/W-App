export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { processMcpMessage } from '@/app/api/mcp/sse/route'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const host = req.headers.get('host') || 'cultlike.ahmvsystems.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  try {
    const body = await req.json()
    const response = await processMcpMessage(body, baseUrl)
    if (!response) {
      return new NextResponse(null, { status: 202 })
    }
    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      }
    })
  } catch (err: any) {
    return NextResponse.json({ jsonrpc: '2.0', error: { code: -32700, message: err.message } }, { status: 400 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    }
  })
}
