export interface FathomAttendee {
  name: string
  email?: string
  avatar_url?: string
}

export interface FathomActionItem {
  id: string
  text: string
  assignee?: string
  timestamp_seconds?: number
  converted_to_task?: boolean
}

export interface FathomChapter {
  title: string
  timestamp: string
  summary: string
}

export interface FathomMeeting {
  id: string
  recording_id?: number
  title: string
  recorded_at: string
  duration_minutes: number
  video_url?: string
  share_url?: string
  meeting_url?: string
  summary: string
  key_takeaways: string[]
  chapters: FathomChapter[]
  action_items: FathomActionItem[]
  transcript: {
    speaker: string
    timestamp: string
    text: string
  }[]
  attendees: FathomAttendee[]
}

const FATHOM_API_KEY = process.env.FATHOM_API_KEY || ''
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''

/**
 * Fetch all real meetings from Fathom API
 */
export async function fetchFathomMeetings(): Promise<FathomMeeting[]> {
  try {
    const res = await fetch('https://api.fathom.ai/external/v1/meetings', {
      headers: {
        'X-Api-Key': FATHOM_API_KEY,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      console.error(`[Fathom API Error] HTTP ${res.status}:`, await res.text())
      return []
    }

    const data = await res.json()
    const items = data.items || []

    const meetings: FathomMeeting[] = items.map((item: any) => {
      const startTime = item.recording_start_time || item.scheduled_start_time || item.created_at
      const endTime = item.recording_end_time || item.scheduled_end_time
      let durationMinutes = 30
      if (startTime && endTime) {
        durationMinutes = Math.max(1, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000))
      }

      // Collect attendees from invitees and recorded_by
      const attendees: FathomAttendee[] = []
      if (item.recorded_by) {
        attendees.push({
          name: item.recorded_by.name || 'Host',
          email: item.recorded_by.email
        })
      }
      if (Array.isArray(item.calendar_invitees)) {
        item.calendar_invitees.forEach((inv: any) => {
          if (!attendees.some(a => a.email === inv.email || a.name === inv.name)) {
            attendees.push({
              name: inv.name || inv.email?.split('@')[0] || 'Guest',
              email: inv.email
            })
          }
        })
      }

      const cleanTitle = item.meeting_title || item.title || 'Fathom Meeting'

      return {
        id: item.recording_id ? String(item.recording_id) : (item.url ? item.url.split('/').pop() : String(Date.now())),
        recording_id: item.recording_id,
        title: cleanTitle,
        recorded_at: startTime || item.created_at || new Date().toISOString(),
        duration_minutes: durationMinutes,
        video_url: item.url,
        share_url: item.share_url || item.url,
        meeting_url: item.meeting_url,
        summary: item.default_summary || 'Fathom AI recording processed. Click to view full transcript and extract action items.',
        key_takeaways: item.highlights ? item.highlights.map((h: any) => h.text || h) : [
          `Meeting recorded with ${attendees.length} participant(s).`,
          `Call link: ${item.meeting_url || item.url || 'Online video conference'}`
        ],
        chapters: [],
        action_items: Array.isArray(item.action_items) ? item.action_items.map((a: any, idx: number) => ({
          id: `act-${idx}`,
          text: typeof a === 'string' ? a : a.text || a.description,
          assignee: a.assignee || 'Unassigned',
          converted_to_task: false
        })) : [],
        transcript: [],
        attendees
      }
    })

    return meetings
  } catch (err) {
    console.error('[Fathom Client] Exception fetching meetings:', err)
    return []
  }
}

/**
 * Fetch detailed summary and transcript for a single recording from Fathom
 */
export async function fetchFathomRecordingDetail(recordingId: number | string): Promise<{
  summary?: string
  key_takeaways?: string[]
  transcript?: { speaker: string; timestamp: string; text: string }[]
  action_items?: FathomActionItem[]
}> {
  const result: any = {
    key_takeaways: [],
    transcript: [],
    action_items: []
  }

  try {
    // 1. Fetch AI Summary directly from Fathom API
    const sumRes = await fetch(`https://api.fathom.ai/external/v1/recordings/${recordingId}/summary`, {
      headers: { 'X-Api-Key': FATHOM_API_KEY },
      cache: 'no-store'
    })

    if (sumRes.ok) {
      const sumData = await sumRes.json()
      if (sumData?.summary?.markdown_formatted) {
        result.summary = sumData.summary.markdown_formatted

        // Parse action items & key takeaways directly from Fathom summary markdown
        const lines = sumData.summary.markdown_formatted.split('\n')
        let inActionSection = false
        const parsedActions: FathomActionItem[] = []

        lines.forEach((line: string, idx: number) => {
          const trimmed = line.trim()
          if (trimmed.toLowerCase().includes('action item') || trimmed.toLowerCase().includes('next step')) {
            inActionSection = true
          } else if (trimmed.startsWith('#') && inActionSection && !trimmed.toLowerCase().includes('next step') && !trimmed.toLowerCase().includes('action item')) {
            inActionSection = false
          } else if (inActionSection && (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed))) {
            // Strip list markers and extract text inside markdown links: [Text](URL) -> Text
            let cleanText = trimmed.replace(/^[-*\d.]+\s*/, '').trim()
            const linkMatch = cleanText.match(/\[(.*?)\]\([^)]+\)/)
            if (linkMatch && linkMatch[1]) {
              cleanText = linkMatch[1].trim()
            }
            cleanText = cleanText.replace(/\*\*/g, '').replace(/\*/g, '')

            if (cleanText.length > 3) {
              let assignee = 'Team'
              if (cleanText.includes(':')) {
                const parts = cleanText.split(':')
                if (parts[0].length < 35) {
                  assignee = parts[0].trim()
                  cleanText = parts.slice(1).join(':').trim()
                }
              }

              parsedActions.push({
                id: `act-fathom-${recordingId}-${idx}`,
                text: cleanText,
                assignee,
                converted_to_task: false
              })
            }
          }
        })

        if (parsedActions.length > 0) {
          result.action_items = parsedActions
        }
      }
    }
  } catch (e) {
    console.warn(`[Fathom Client] Failed fetching summary for ${recordingId}:`, e)
  }

  try {
    // 2. Fetch full Transcript directly from Fathom API
    const tranRes = await fetch(`https://api.fathom.ai/external/v1/recordings/${recordingId}/transcript`, {
      headers: { 'X-Api-Key': FATHOM_API_KEY },
      cache: 'no-store'
    })

    if (tranRes.ok) {
      const tranData = await tranRes.json()
      if (Array.isArray(tranData?.transcript)) {
        result.transcript = tranData.transcript.map((t: any) => ({
          speaker: t.speaker?.display_name || t.speaker?.name || 'Speaker',
          timestamp: t.timestamp || '00:00',
          text: t.text || ''
        }))
      }
    }
  } catch (e) {
    console.warn(`[Fathom Client] Failed fetching transcript for ${recordingId}:`, e)
  }

  return result
}
