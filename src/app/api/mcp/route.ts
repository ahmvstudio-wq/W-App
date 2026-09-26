import { NextRequest, NextResponse } from 'next/server'
import { processMcpMessage } from '@/app/api/mcp/sse/route'

export const dynamic = 'force-dynamic'

// 1. GET /api/mcp - Handshake / Server Info / SSE
export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'cultlike.ahmvsystems.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const accept = req.headers.get('accept') || ''
  if (accept.includes('text/event-stream')) {
    const sessionId = `sess_${Math.random().toString(36).slice(2)}`
    const messageEndpoint = `${baseUrl}/api/mcp/messages?sessionId=${sessionId}`
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`event: endpoint\ndata: ${messageEndpoint}\n\n`))
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform, no-store',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      }
    })
  }

  // Return server discovery metadata for HTTP MCP
  return NextResponse.json(
    {
      name: 'cultlike-mcp-server',
      version: '2.0.0',
      description: 'Cultlike OS MCP Server for Claude & AI Agents',
      transports: {
        streamableHttp: `${baseUrl}/api/mcp`,
        sse: `${baseUrl}/api/mcp/sse`
      },
      status: 'active'
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      }
    }
  )
}

// 2. POST /api/mcp - Streamable HTTP (Standard modern MCP transport)
export async function POST(req: NextRequest) {
  const host = req.headers.get('host') || 'cultlike.ahmvsystems.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  try {
    const body = await req.json()
    const authHeader = req.headers.get('authorization') || req.headers.get('x-api-key')
    const keyParam = req.nextUrl.searchParams.get('key') || req.nextUrl.searchParams.get('token')
    const response = await processMcpMessage(body, baseUrl, authHeader, keyParam)
    if (!response) {
      return new NextResponse(null, { status: 204 })
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

// 3. OPTIONS /api/mcp - Pre-flight CORS
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
