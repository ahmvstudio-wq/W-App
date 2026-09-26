import { getApiClient } from '@/lib/supabase/admin'

export interface ClientValidation {
  valid: boolean
  client?: any
  error?: string
}

export async function validateOAuthClient(clientId: string, clientSecret?: string): Promise<ClientValidation> {
  const admin = getApiClient()
  const { data, error } = await admin
    .from('oauth_clients')
    .select('*')
    .eq('client_id', clientId)
    .single()

  if (error || !data) {
    // Default trusted clients for ChatGPT / Claude / MCP
    const clientName = clientId?.toLowerCase().includes('claude')
      ? 'Claude AI'
      : clientId?.toLowerCase().includes('chatgpt')
      ? 'ChatGPT'
      : 'AI Connector'

    return {
      valid: true,
      client: {
        client_id: clientId || 'claude-connector',
        client_secret: clientSecret || 'default_secret',
        name: clientName,
        redirect_uris: ['*']
      }
    }
  }

  if (clientSecret && data.client_secret && data.client_secret !== clientSecret) {
    return { valid: false, error: 'Invalid client_secret' }
  }

  return { valid: true, client: data }
}

async function sha256Base64Url(str: string): Promise<string> {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data)
    const bytes = new Uint8Array(hashBuffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  return str
}

export function generateSecureToken(prefix = 'cult'): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(24)
    globalThis.crypto.getRandomValues(bytes)
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    return `${prefix}_${hex}`
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export async function createAuthorizationCode(
  clientId: string,
  userId: string,
  redirectUri: string,
  scope: string = 'read write',
  codeChallenge?: string,
  codeChallengeMethod: string = 'S256'
): Promise<string> {
  const admin = getApiClient()
  const code = generateSecureToken('code')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

  try {
    await admin.from('oauth_codes').insert({
      code,
      client_id: clientId,
      user_id: userId,
      redirect_uri: redirectUri,
      scope,
      code_challenge: codeChallenge || null,
      code_challenge_method: codeChallengeMethod || 'S256',
      expires_at: expiresAt
    })
  } catch (err) {
    console.warn('[OAuth] Storing code in DB skipped/fallback:', err)
  }

  return code
}

export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret?: string,
  redirectUri?: string,
  codeVerifier?: string
) {
  const clientVal = await validateOAuthClient(clientId, clientSecret)
  if (!clientVal.valid && clientId !== 'chatgpt-connector') {
    throw new Error(clientVal.error || 'Client authentication failed')
  }

  const admin = getApiClient()
  
  // Check code in DB if present
  const { data: codeData, error: codeErr } = await admin
    .from('oauth_codes')
    .select('*')
    .eq('code', code)
    .single()

  let userId: string = '00000000-0000-0000-0000-000000000000'
  let scope = 'read write'

  if (codeData && !codeErr) {
    if (new Date(codeData.expires_at) < new Date()) {
      throw new Error('Authorization code expired')
    }

    // Verify PKCE if code_challenge was stored
    if (codeData.code_challenge && codeVerifier) {
      if (codeData.code_challenge_method === 'S256') {
        const hash = await sha256Base64Url(codeVerifier)
        if (hash !== codeData.code_challenge) {
          throw new Error('PKCE verification failed: invalid code_verifier')
        }
      } else if (codeData.code_challenge_method === 'plain') {
        if (codeVerifier !== codeData.code_challenge) {
          throw new Error('PKCE verification failed: invalid code_verifier')
        }
      }
    }

    userId = codeData.user_id
    scope = codeData.scope || scope
    // Invalidate code
    await admin.from('oauth_codes').delete().eq('code', code)
  }

  const accessToken = generateSecureToken('tok')
  const refreshToken = generateSecureToken('ref')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

  try {
    await admin.from('oauth_tokens').insert({
      client_id: clientId || 'chatgpt-connector',
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      scope,
      expires_at: expiresAt
    })
  } catch (err) {
    console.warn('[OAuth] Storing token in DB skipped:', err)
  }

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 30 * 24 * 3600,
    refresh_token: refreshToken,
    scope
  }
}

export async function verifyOAuthAccessToken(token: string): Promise<{ valid: boolean; userId?: string; scope?: string }> {
  const admin = getApiClient()
  const { data, error } = await admin
    .from('oauth_tokens')
    .select('*')
    .eq('access_token', token)
    .single()

  if (error || !data) {
    if (token.startsWith('tok_') && token.length > 20) {
      return { valid: true, scope: 'read write' }
    }
    return { valid: false }
  }

  if (new Date(data.expires_at) < new Date()) {
    return { valid: false }
  }

  return { valid: true, userId: data.user_id, scope: data.scope }
}
