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
  title: string
  recorded_at: string
  duration_minutes: number
  video_url?: string
  share_url?: string
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

const FATHOM_API_KEY = process.env.FATHOM_API_KEY || 'VB4MPQZrn0K7K_hFiXCsRg.mfJeDGKBdb_HZwMgjmgfa_eI_Ultt1J3SGJuN1h2VKY'

// Default executive meetings fallback if Fathom API has 0 recordings yet
export const DEFAULT_FATHOM_MEETINGS: FathomMeeting[] = [
  {
    id: 'fathom-rec-001',
    title: 'Executive Sprint Alignment & Q4 Roadmap Review',
    recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    duration_minutes: 42,
    video_url: 'https://fathom.video/share/rec_sample_001',
    share_url: 'https://fathom.video/share/rec_sample_001',
    summary: 'Aligned on executive goals for the sprint. Decided to prioritize the minimal white UI overhaul, Fathom AI integration, and task velocity tracking before opening access.',
    key_takeaways: [
      'Focus 100% of engineering bandwidth on core product speed and minimal white UI.',
      'Integrate Fathom AI transcripts and action items directly into CallMy Mgmt sprint tasks.',
      'Maintain sub-48-hour release cadence with zero blockers.'
    ],
    chapters: [
      { title: 'Sprint Retrospective & Velocity Review', timestamp: '00:00', summary: 'Reviewed previous sprint output and identified bottlenecks in task reviews.' },
      { title: 'Fathom AI & Automation Architecture', timestamp: '14:20', summary: 'Discussed webhook pipeline to sync meeting transcripts and convert action items into deliverables.' },
      { title: 'Final Priorities & Action Items', timestamp: '31:45', summary: 'Locked in deliverables for the week and set owner check-ins.' }
    ],
    action_items: [
      { id: 'act-1', text: 'Connect Fathom API and configure real-time webhook endpoints', assignee: 'Engineering', timestamp_seconds: 920, converted_to_task: true },
      { id: 'act-2', text: 'Build interactive transcript viewer with speaker breakdown', assignee: 'Product', timestamp_seconds: 1240, converted_to_task: false },
      { id: 'act-3', text: 'Audit task drag-and-drop performance on Kanban board', assignee: 'Frontend', timestamp_seconds: 2100, converted_to_task: false }
    ],
    transcript: [
      { speaker: 'Mohammed Rehan', timestamp: '00:15', text: 'Welcome team. Let us review our product priorities and streamline all upcoming release items.' },
      { speaker: 'AI Chief of Staff', timestamp: '01:02', text: 'Workspace telemetry indicates our shipping velocity is up 24% over the past 7 days.' },
      { speaker: 'Mohammed Rehan', timestamp: '14:25', text: 'We need all meeting recordings and transcripts from Fathom to flow right into our Meetings tab.' },
      { speaker: 'Engineering Lead', timestamp: '16:40', text: 'The webhook architecture is ready. We can auto-parse action items and turn them into P0 tasks with one click.' }
    ],
    attendees: [
      { name: 'Mohammed Rehan', email: 'founder@callmymgmt.com' },
      { name: 'AI Chief of Staff', email: 'ai@callmymgmt.com' },
      { name: 'Engineering Lead', email: 'eng@callmymgmt.com' }
    ]
  },
  {
    id: 'fathom-rec-002',
    title: 'Product Design & User Experience Deep Dive',
    recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    duration_minutes: 28,
    video_url: 'https://fathom.video/share/rec_sample_002',
    share_url: 'https://fathom.video/share/rec_sample_002',
    summary: 'Reviewed design tokens, Apple-style ambient lighting curves, Poppins Light typography, and top navigation bar layout.',
    key_takeaways: [
      'Eliminated sidebar in favor of full-width canvas with floating top navigation.',
      'Standardized on Poppins Light for headings and Inter for body text.',
      'Replaced solid chart fills with ambient glowing linear gradients.'
    ],
    chapters: [
      { title: 'Top Navigation Conversion', timestamp: '00:00', summary: 'Switched from vertical sidebar to clean sticky top bar.' },
      { title: 'Data Visualization Ambient Colors', timestamp: '11:15', summary: 'Designed glowing radial gauges and sparkline curves.' }
    ],
    action_items: [
      { id: 'act-4', text: 'Refactor top bar navigation layout across all device viewports', assignee: 'Design', timestamp_seconds: 450, converted_to_task: true },
      { id: 'act-5', text: 'Ensure all modals have frosted glass backdrop filters', assignee: 'Design', timestamp_seconds: 1100, converted_to_task: true }
    ],
    transcript: [
      { speaker: 'Mohammed Rehan', timestamp: '00:30', text: 'Let us make the app feel clean, spacious, and data-dense without clutter.' },
      { speaker: 'Design Lead', timestamp: '02:10', text: 'Top bar layout gives the entire horizontal canvas back to graphs and Kanban boards.' }
    ],
    attendees: [
      { name: 'Mohammed Rehan', email: 'founder@callmymgmt.com' },
      { name: 'Design Lead', email: 'design@callmymgmt.com' }
    ]
  }
]

export async function fetchFathomMeetings(): Promise<FathomMeeting[]> {
  try {
    // Attempt live fetch from Fathom API
    const response = await fetch('https://api.fathom.video/v1/recordings', {
      headers: {
        'Authorization': `Bearer ${FATHOM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 30 }
    })

    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data?.recordings) && data.recordings.length > 0) {
        return data.recordings.map((rec: any) => ({
          id: rec.id || `fathom-${Date.now()}`,
          title: rec.title || rec.meeting_title || 'Fathom Meeting Recording',
          recorded_at: rec.created_at || rec.recorded_at || new Date().toISOString(),
          duration_minutes: Math.round((rec.duration || 1800) / 60),
          video_url: rec.video_url || rec.url || rec.share_url,
          share_url: rec.share_url || rec.url,
          summary: rec.summary || rec.ai_summary || 'Meeting summarized by Fathom AI.',
          key_takeaways: rec.key_takeaways || ['Meeting reviewed and archived in CallMy Mgmt.'],
          chapters: rec.chapters || [],
          action_items: (rec.action_items || []).map((a: any, idx: number) => ({
            id: a.id || `act-${idx}`,
            text: typeof a === 'string' ? a : a.text || a.description,
            assignee: a.assignee || 'Unassigned',
            timestamp_seconds: a.timestamp || 0,
            converted_to_task: false
          })),
          transcript: rec.transcript || [],
          attendees: rec.attendees || [{ name: 'Mohammed Rehan' }]
        }))
      }
    }
  } catch (err) {
    console.warn('[Fathom Client] Live API fetch fallback to cached meetings:', err)
  }

  return DEFAULT_FATHOM_MEETINGS
}
