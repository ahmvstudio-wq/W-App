import { SupabaseClient } from '@supabase/supabase-js'
import type { ContentItem } from '@/types'

export async function getContentItems(
  supabase: SupabaseClient,
  workspaceId: string,
  platform?: string | null,
  status?: string | null
): Promise<ContentItem[]> {
  try {
    let query = supabase
      .from('content_items')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (platform && platform !== 'all') query = query.eq('platform', platform)
    if (status && status !== 'all') query = query.eq('status', status)

    const { data, error } = await query

    if (!error && data) {
      return data as ContentItem[]
    }
  } catch {
    // Fall back to workspace settings
  }

  // Graceful fallback to workspace settings
  try {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .single()

    const rawItems: ContentItem[] = ws?.settings?.content_items || []
    return rawItems.filter(item => {
      if (platform && platform !== 'all' && item.platform !== platform) return false
      if (status && status !== 'all' && item.status !== status) return false
      return true
    })
  } catch {
    return []
  }
}

export async function getContentItemById(
  supabase: SupabaseClient,
  id: string
): Promise<ContentItem | null> {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', id)
      .single()

    if (!error && data) return data as ContentItem
  } catch {
    //
  }

  try {
    const { data: workspaces } = await supabase.from('workspaces').select('settings')
    if (workspaces) {
      for (const ws of workspaces) {
        const item = (ws.settings?.content_items || []).find((i: any) => i.id === id)
        if (item) return item as ContentItem
      }
    }
  } catch {
    //
  }

  return null
}

export async function saveContentItem(
  supabase: SupabaseClient,
  item: Partial<ContentItem> & { title: string; workspace_id: string; owner_id: string }
): Promise<ContentItem> {
  const fullItem: ContentItem = {
    id: item.id || `ci_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    workspace_id: item.workspace_id,
    owner_id: item.owner_id,
    title: item.title,
    caption: item.caption || '',
    platform: (item.platform as any) || 'youtube',
    content_type: (item.content_type as any) || 'video',
    status: (item.status as any) || 'draft',
    media_urls: item.media_urls || [],
    thumbnail_url: item.thumbnail_url || (item.media_urls?.[0]) || '',
    drive_file_id: item.drive_file_id || undefined,
    drive_web_view_link: item.drive_web_view_link || undefined,
    drive_download_link: item.drive_download_link || undefined,
    transcript: item.transcript || undefined,
    hook: item.hook || undefined,
    angle: item.angle || undefined,
    cta: item.cta || undefined,
    tags: item.tags || [],
    file_size_bytes: item.file_size_bytes || undefined,
    duration_seconds: item.duration_seconds || undefined,
    scheduled_at: item.scheduled_at || undefined,
    published_at: item.published_at || undefined,
    external_post_id: item.external_post_id || undefined,
    external_post_url: item.external_post_url || undefined,
    metrics: item.metrics || { views: 0, likes: 0, comments: 0, shares: 0 },
    created_at: item.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Attempt direct table insert
  try {
    const { data, error } = await supabase
      .from('content_items')
      .insert(fullItem)
      .select()
      .single()

    if (!error && data) {
      return data as ContentItem
    }
  } catch {
    // Fallback to workspace settings
  }

  // Fallback to workspace settings
  const { data: ws } = await supabase
    .from('workspaces')
    .select('settings')
    .eq('id', item.workspace_id)
    .single()

  const currentSettings = ws?.settings || {}
  const currentList: ContentItem[] = Array.isArray(currentSettings.content_items) ? currentSettings.content_items : []
  const nextList = [fullItem, ...currentList.filter(i => i.id !== fullItem.id)]

  await supabase
    .from('workspaces')
    .update({
      settings: {
        ...currentSettings,
        content_items: nextList
      }
    })
    .eq('id', item.workspace_id)

  return fullItem
}

export async function updateContentItem(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<ContentItem>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('content_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) return true
  } catch {
    // Fallback to workspace settings
  }

  // Fallback to workspaces
  try {
    const { data: workspaces } = await supabase.from('workspaces').select('id, settings')
    if (workspaces) {
      for (const ws of workspaces) {
        const items: ContentItem[] = ws.settings?.content_items || []
        const idx = items.findIndex(i => i.id === id)
        if (idx !== -1) {
          items[idx] = { ...items[idx], ...updates, updated_at: new Date().toISOString() }
          await supabase
            .from('workspaces')
            .update({ settings: { ...ws.settings, content_items: items } })
            .eq('id', ws.id)
          return true
        }
      }
    }
  } catch {
    //
  }

  return true
}

export async function deleteContentItem(
  supabase: SupabaseClient,
  id: string
): Promise<boolean> {
  try {
    await supabase.from('content_items').delete().eq('id', id)
  } catch {
    //
  }

  try {
    const { data: workspaces } = await supabase.from('workspaces').select('id, settings')
    if (workspaces) {
      for (const ws of workspaces) {
        const items: ContentItem[] = ws.settings?.content_items || []
        const filtered = items.filter(i => i.id !== id)
        if (filtered.length !== items.length) {
          await supabase
            .from('workspaces')
            .update({ settings: { ...ws.settings, content_items: filtered } })
            .eq('id', ws.id)
          return true
        }
      }
    }
  } catch {
    //
  }

  return true
}
