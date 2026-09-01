import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

export function getApiClient(): SupabaseClient {
  if (cachedClient) return cachedClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Key is missing in environment variables.')
  }

  cachedClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return cachedClient
}

export async function getDefaultWorkspaceId(client?: SupabaseClient): Promise<string | null> {
  try {
    const supabase = client || getApiClient()
    const { data, error } = await supabase.from('workspaces').select('id').limit(1)
    if (error || !data || data.length === 0) {
      return null
    }
    return data[0].id
  } catch {
    return null
  }
}

export async function getDefaultUserId(client?: SupabaseClient): Promise<string | null> {
  try {
    const supabase = client || getApiClient()
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    if (error || !data || data.length === 0) {
      return null
    }
    return data[0].id
  } catch {
    return null
  }
}

