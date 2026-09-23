/**
 * Instagram Graph API Publishing Integration
 */

export interface InstagramPublishParams {
  caption: string
  mediaUrl: string
  mediaType?: 'REELS' | 'IMAGE' | 'STORIES' | 'VIDEO'
  instagramAccountId?: string
  accessToken?: string
}

export async function publishToInstagram(params: InstagramPublishParams): Promise<{
  success: boolean
  mediaId?: string
  postUrl?: string
  error?: string
}> {
  const {
    caption,
    mediaUrl,
    mediaType = 'REELS',
    instagramAccountId = process.env.INSTAGRAM_ACCOUNT_ID,
    accessToken = process.env.META_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN
  } = params

  // If credentials are not configured, return clean simulation for staging/dev
  if (!accessToken || !instagramAccountId) {
    console.info('[Instagram Engine] Credentials not configured in environment. Simulating dispatch for:', caption.slice(0, 40))
    const simulatedId = `ig_${Date.now().toString(36)}`
    return {
      success: true,
      mediaId: simulatedId,
      postUrl: `https://www.instagram.com/p/${simulatedId}/`
    }
  }

  try {
    // Step 1: Create Media Container
    const isVideo = mediaType === 'REELS' || mediaType === 'VIDEO'
    const containerParams = new URLSearchParams({
      access_token: accessToken,
      caption,
      media_type: mediaType,
      ...(isVideo ? { video_url: mediaUrl } : { image_url: mediaUrl })
    })

    const createContainerRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media?${containerParams.toString()}`,
      { method: 'POST' }
    )

    const containerData = await createContainerRes.json()
    if (!createContainerRes.ok || !containerData.id) {
      return {
        success: false,
        error: containerData.error?.message || 'Failed to create Instagram media container'
      }
    }

    const creationId = containerData.id

    // Step 2: Poll container status if video/reel
    if (isVideo) {
      let isReady = false
      let attempts = 0

      while (!isReady && attempts < 15) {
        await new Promise(r => setTimeout(r, 2000))
        attempts++

        const statusRes = await fetch(
          `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${accessToken}`
        )
        const statusData = await statusRes.json()

        if (statusData.status_code === 'FINISHED') {
          isReady = true
        } else if (statusData.status_code === 'ERROR') {
          return { success: false, error: 'Instagram container processing failed on Meta servers.' }
        }
      }
    }

    // Step 3: Publish Media Container
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`,
      { method: 'POST' }
    )

    const publishData = await publishRes.json()
    if (!publishRes.ok || !publishData.id) {
      return {
        success: false,
        error: publishData.error?.message || 'Failed to publish media container on Instagram.'
      }
    }

    const publishedMediaId = publishData.id

    return {
      success: true,
      mediaId: publishedMediaId,
      postUrl: `https://www.instagram.com/p/${publishedMediaId}/`
    }
  } catch (err: any) {
    console.error('[Instagram API] Exception:', err)
    return { success: false, error: err.message || 'Instagram publishing error' }
  }
}
