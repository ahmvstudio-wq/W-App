import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'cultlike.ahmvsystems.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const manifest = {
    schema_version: 'v1',
    name_for_human: 'Cultlike OS',
    name_for_model: 'cultlike_os',
    description_for_human: 'Executive Operating System to orchestrate sprint tasks, projects, meeting takeaways, and multi-channel content publishing.',
    description_for_model: 'Plugin for orchestrating Cultlike OS workspaces. Use this plugin to query sprint analytics, list and manage P0/P1 tasks, create projects, inspect Fathom meeting summaries and action items, and stage/schedule video deliverables in the Content Vault for YouTube and Instagram.',
    auth: {
      type: 'oauth',
      client_url: `${baseUrl}/api/oauth/authorize`,
      scope: 'read write',
      authorization_url: `${baseUrl}/api/oauth/token`,
      authorization_content_type: 'application/json',
      verification_tokens: {
        openai: process.env.OPENAI_PLUGIN_VERIFICATION_TOKEN || 'cultlike_openai_verification_token'
      }
    },
    api: {
      type: 'openapi',
      url: `${baseUrl}/api/chatgpt/openapi.json`,
      is_user_authenticated: false
    },
    logo_url: `${baseUrl}/logo.png`,
    contact_email: 'w.taufiqq@gmail.com',
    legal_info_url: `${baseUrl}/terms`
  }

  return NextResponse.json(manifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
