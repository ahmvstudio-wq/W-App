import { supabase } from './client'

export async function uploadAsset(
  file: File,
  projectId: string,
  userId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${projectId}/${userId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('project-assets')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) {
    console.error('Storage upload error:', error)
    throw error
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('project-assets')
    .getPublicUrl(fileName)
  
  return publicUrl
}

export async function saveAsset(
  file: File,
  publicUrl: string,
  projectId: string,
  workspaceId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('assets')
    .insert({
      project_id: projectId,
      workspace_id: workspaceId,
      uploaded_by: userId,
      name: file.name,
      file_path: publicUrl, // The brief said file_path: publicUrl
      file_size: file.size,
      file_type: file.type.split('/')[0],
      mime_type: file.type,
      url: publicUrl
    })
    .select()
    .single()
  
  if (error) {
    console.error('DB save error:', error)
    throw error
  }
  return data
}
