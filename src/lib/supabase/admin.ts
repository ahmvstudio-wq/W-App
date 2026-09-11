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

export async function getDefaultWorkspaceId(client?: SupabaseClient, explicitUserId?: string | null): Promise<string | null> {
  try {
    const supabase = client || getApiClient()
    const targetUserId = explicitUserId || (await getDefaultUserId(supabase))

    if (targetUserId) {
      const { data: userWs } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', targetUserId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (userWs && userWs.length > 0) {
        return userWs[0].id
      }
    }

    // Next preference: workspace with configured settings or active projects
    const { data: configuredWs } = await supabase
      .from('workspaces')
      .select('id, settings')
      .order('created_at', { ascending: true })

    if (configuredWs && configuredWs.length > 0) {
      const found = configuredWs.find((w: any) => w.settings && Object.keys(w.settings).length > 0)
      return found ? found.id : configuredWs[0].id
    }

    return null
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

export async function getUserWorkspaces(userId: string, client?: SupabaseClient) {
  const supabase = client || getApiClient()

  try {
    // 1. Try querying via workspace_members
    const { data: memberRows, error: mErr } = await supabase
      .from('workspace_members')
      .select('role, workspace:workspaces(*)')
      .eq('user_id', userId)

    if (!mErr && memberRows && memberRows.length > 0) {
      return memberRows.map((r: any) => ({
        ...r.workspace,
        role: r.role,
      }))
    }
  } catch {}

  // 2. Fallback: Workspaces owned by user
  try {
    const { data: ownedWs } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', userId)

    if (ownedWs && ownedWs.length > 0) {
      return ownedWs.map((ws: any) => ({
        ...ws,
        role: 'owner',
      }))
    }
  } catch {}

  return []
}

export async function ensureUserWorkspace(userId: string, userName?: string, client?: SupabaseClient) {
  const supabase = client || getApiClient()
  const workspaces = await getUserWorkspaces(userId, supabase)

  if (workspaces.length > 0) {
    return workspaces[0]
  }

  // Create default workspace for user
  const wsName = userName ? `${userName}'s Workspace` : 'My Workspace'
  const { data: newWs, error } = await supabase
    .from('workspaces')
    .insert({
      name: wsName,
      owner_id: userId,
      settings: {},
    })
    .select()
    .single()

  if (error || !newWs) {
    throw new Error(error?.message || 'Failed to initialize workspace')
  }

  // Try to register in workspace_members
  try {
    await supabase.from('workspace_members').insert({
      workspace_id: newWs.id,
      user_id: userId,
      role: 'owner',
    })
  } catch {}

  return { ...newWs, role: 'owner' }
}

export async function getWorkspaceMembers(workspaceId: string, client?: SupabaseClient) {
  const supabase = client || getApiClient()

  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('id, workspace_id, user_id, role, created_at, profile:profiles(id, name, avatar_url)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      return data
    }
  } catch {}

  // Fallback: If table not yet populated, return workspace owner as sole member
  try {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('id, owner_id')
      .eq('id', workspaceId)
      .single()

    if (ws?.owner_id) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', ws.owner_id)
        .single()

      return [
        {
          id: `owner-${ws.id}`,
          workspace_id: workspaceId,
          user_id: ws.owner_id,
          role: 'owner',
          created_at: new Date().toISOString(),
          profile: prof || null,
        },
      ]
    }
  } catch {}

  return []
}

