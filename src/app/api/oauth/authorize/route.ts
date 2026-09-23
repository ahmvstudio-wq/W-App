import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOAuthClient, createAuthorizationCode } from '@/lib/oauth/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')
  const redirectUri = searchParams.get('redirect_uri')
  const state = searchParams.get('state') || ''
  const scope = searchParams.get('scope') || 'read write'

  if (!clientId || !redirectUri) {
    return new NextResponse('Missing required OAuth parameters: client_id and redirect_uri', { status: 400 })
  }

  const clientVal = await validateOAuthClient(clientId)
  if (!clientVal.valid) {
    return new NextResponse(`Invalid client_id: ${clientId}`, { status: 400 })
  }

  // Check user session
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(req.url)
    return NextResponse.redirect(new URL(`/?return_to=${returnUrl}`, req.url))
  }

  const clientName = clientVal.client?.name || 'External Application'

  // Render sleek consent HTML
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize ${clientName} • Cultlike OS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0c0d0f; color: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #141618; border: 1px solid #27272a; border-radius: 20px; max-width: 440px; width: 100%; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    .logo { width: 32px; height: 32px; border-radius: 8px; background: #c8f135; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #000; font-size: 14px; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
    p { font-size: 13px; color: #9ca3af; line-height: 1.5; margin-bottom: 24px; }
    .permissions { background: #18191c; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .perm-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #c8f135; letter-spacing: 0.05em; margin-bottom: 12px; }
    .perm-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #e5e7eb; margin-bottom: 10px; }
    .perm-item:last-child { margin-bottom: 0; }
    .check { color: #10b981; font-weight: bold; }
    .btn-group { display: flex; gap: 12px; }
    button { flex: 1; padding: 12px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; border: none; }
    .btn-approve { background: #c8f135; color: #000; }
    .btn-approve:hover { background: #b5dc2e; }
    .btn-deny { background: #27272a; color: #9ca3af; }
    .btn-deny:hover { background: #3f3f46; color: #fff; }
    .user-pill { font-size: 11px; color: #6b7280; text-align: center; margin-top: 16px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand" style="justify-content: center; margin-bottom: 24px;">
      <img src="/logo.png" alt="Cultlike OS" style="height: 32px; width: auto; object-fit: contain;" />
    </div>

    <h1>Authorize Connection</h1>
    <p><strong style="color: #fff;">${clientName}</strong> is requesting permission to access your Cultlike OS workspace.</p>

    <div class="permissions">
      <div class="perm-title">Permissions Requested</div>
      <div class="perm-item">
        <span class="check">✓</span>
        <span>View and manage active projects & deliverables</span>
      </div>
      <div class="perm-item">
        <span class="check">✓</span>
        <span>Access Content Vault assets and publish schedule</span>
      </div>
      <div class="perm-item">
        <span class="check">✓</span>
        <span>Create, update, and prioritize sprint tasks</span>
      </div>
      <div class="perm-item">
        <span class="check">✓</span>
        <span>Read Living Strategy Memos & documents</span>
      </div>
    </div>

    <form method="POST" action="/api/oauth/authorize">
      <input type="hidden" name="client_id" value="${clientId}" />
      <input type="hidden" name="redirect_uri" value="${redirectUri}" />
      <input type="hidden" name="state" value="${state}" />
      <input type="hidden" name="scope" value="${scope}" />
      <input type="hidden" name="action" value="approve" />

      <div class="btn-group">
        <button type="submit" class="btn-approve">Authorize</button>
        <button type="button" class="btn-deny" onclick="window.history.back()">Deny</button>
      </div>
    </form>

    <div class="user-pill">
      Signed in as ${user.email}
    </div>
  </div>
</body>
</html>
`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}

export async function POST(req: NextRequest) {
  try {
    let clientId = ''
    let redirectUri = ''
    let state = ''
    let scope = 'read write'

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData()
      clientId = (formData.get('client_id') as string) || ''
      redirectUri = (formData.get('redirect_uri') as string) || ''
      state = (formData.get('state') as string) || ''
      scope = (formData.get('scope') as string) || 'read write'
    } else {
      const body = await req.json()
      clientId = body.client_id
      redirectUri = body.redirect_uri
      state = body.state || ''
      scope = body.scope || 'read write'
    }

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: 'Missing client_id or redirect_uri' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 })
    }

    const code = await createAuthorizationCode(clientId, user.id, redirectUri, scope)

    const targetUrl = new URL(redirectUri)
    targetUrl.searchParams.set('code', code)
    if (state) targetUrl.searchParams.set('state', state)

    return NextResponse.redirect(targetUrl.toString())
  } catch (error: any) {
    console.error('[API /api/oauth/authorize POST] Error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
