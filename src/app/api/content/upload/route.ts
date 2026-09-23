import { NextRequest, NextResponse } from 'next/server'
import { getApiClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'content-vault'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const admin = getApiClient()
    const fileExt = file.name.split('.').pop() || 'bin'
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Try uploading to project-assets bucket
    const { data, error } = await admin.storage
      .from('project-assets')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.warn('Upload to project-assets failed, attempting content-vault bucket:', error)
      const { data: retryData, error: retryErr } = await admin.storage
        .from('content-vault')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true
        })

      if (retryErr) {
        return NextResponse.json({ success: false, error: retryErr.message }, { status: 500 })
      }
    }

    const { data: { publicUrl } } = admin.storage
      .from('project-assets')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    })
  } catch (error: any) {
    console.error('[API /api/content/upload] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
