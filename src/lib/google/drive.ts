export interface DriveVideoFile {
  id: string
  name: string
  mimeType: string
  size?: number
  sizeFormatted?: string
  thumbnailUrl?: string
  webViewLink?: string
  webContentLink?: string
  durationSeconds?: number
  durationFormatted?: string
  width?: number
  height?: number
  aspectRatio?: '9:16' | '16:9' | 'square' | 'other'
  createdTime?: string
  modifiedTime?: string
}

export interface DriveFolder {
  id: string
  name: string
  mimeType: string
  createdTime?: string
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export function determineAspectRatio(width?: number, height?: number): '9:16' | '16:9' | 'square' | 'other' {
  if (!width || !height) return 'other'
  const ratio = width / height
  if (Math.abs(ratio - 9 / 16) < 0.1 || (height > width && ratio < 0.8)) return '9:16'
  if (Math.abs(ratio - 16 / 9) < 0.1 || (width > height && ratio > 1.4)) return '16:9'
  if (Math.abs(ratio - 1) < 0.15) return 'square'
  return 'other'
}

/**
 * Fetch video files and folders from Google Drive
 */
export async function listGoogleDriveVideos(
  accessToken: string,
  options: {
    folderId?: string
    searchQuery?: string
    pageSize?: number
  } = {}
): Promise<{ videos: DriveVideoFile[]; folders: DriveFolder[] }> {
  const { folderId, searchQuery, pageSize = 50 } = options

  // Build Drive search query
  const queryParts: string[] = ['trashed = false']

  if (folderId && folderId !== 'root') {
    queryParts.push(`'${folderId}' in parents`)
  }

  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'")
    queryParts.push(`name contains '${escaped}'`)
  }

  // Include video files and folders
  queryParts.push(`(mimeType contains 'video/' or mimeType = 'application/vnd.google-apps.folder')`)

  const q = queryParts.join(' and ')

  const fields =
    'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, videoMediaMetadata, size, createdTime, modifiedTime, iconLink)'

  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('q', q)
  url.searchParams.set('fields', fields)
  url.searchParams.set('pageSize', String(pageSize))
  url.searchParams.set('orderBy', 'folder,modifiedTime desc')

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const errText = await res.text()
    let parsed: any
    try {
      parsed = JSON.parse(errText)
    } catch {
      //
    }
    throw new Error(parsed?.error?.message || `Google Drive API error (${res.status})`)
  }

  const data = await res.json()
  const files: any[] = data.files || []

  const videos: DriveVideoFile[] = []
  const folders: DriveFolder[] = []

  for (const f of files) {
    if (f.mimeType === 'application/vnd.google-apps.folder') {
      folders.push({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        createdTime: f.createdTime,
      })
    } else {
      const meta = f.videoMediaMetadata || {}
      const durationSeconds = meta.durationMillis ? Math.round(Number(meta.durationMillis) / 1000) : undefined
      const width = meta.width ? Number(meta.width) : undefined
      const height = meta.height ? Number(meta.height) : undefined
      const sizeBytes = f.size ? Number(f.size) : undefined

      videos.push({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: sizeBytes,
        sizeFormatted: formatBytes(sizeBytes),
        thumbnailUrl: f.thumbnailLink || undefined,
        webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
        webContentLink: f.webContentLink || undefined,
        durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        width,
        height,
        aspectRatio: determineAspectRatio(width, height),
        createdTime: f.createdTime,
        modifiedTime: f.modifiedTime,
      })
    }
  }

  return { videos, folders }
}
