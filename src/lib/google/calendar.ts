import { Task } from '@/types'
import { NextRequest } from 'next/server'

export interface GoogleCalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  htmlLink?: string
  location?: string
  attendees?: string[]
}

/**
 * Format a date to iCalendar UTC format: YYYYMMDDTHHMMSSZ
 */
function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Escape iCalendar text fields
 */
function escapeIcsText(text: string): string {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Generate standard RFC 5545 iCalendar data (.ics) for all tasks
 */
export function generateIcsCalendar(tasks: Task[], calendarName = 'CallMy Tasks'): string {
  const now = new Date()
  const dtStamp = formatIcsDate(now)

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CallMy Mgmt//Universal Task Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:UTC',
  ]

  tasks.forEach((task) => {
    if (task.status === 'killed') return

    const startDate = task.due_date ? new Date(task.due_date) : new Date(task.created_at)
    const durationMinutes = task.time_box_minutes || 45
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)

    const priorityLabel = task.priority ? task.priority.toUpperCase() : 'P1'
    const statusLabel = task.status ? task.status.replace('_', ' ').toUpperCase() : 'TODO'
    const projectName = task.project?.name ? `[${task.project.name}] ` : ''

    const summary = `${projectName}${task.title}`
    const description = `Priority: ${priorityLabel}\\nStatus: ${statusLabel}\\nEstimated Time: ${durationMinutes} minutes\\n${escapeIcsText(task.description || '')}`
    const uid = `task-${task.id}@callmy-mgmt.app`

    ics.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${description}`,
      `STATUS:${task.status === 'shipped' ? 'COMPLETED' : 'CONFIRMED'}`,
      'CLASS:PUBLIC',
      'END:VEVENT'
    )
  })

  ics.push('END:VCALENDAR')
  return ics.join('\r\n')
}

/**
 * Retrieve or refresh Google OAuth Access Token
 */
export async function getValidGoogleAccessToken(req: NextRequest): Promise<string | null> {
  const accessToken = req.cookies.get('gcal_access_token')?.value
  if (accessToken) return accessToken

  const refreshToken = req.cookies.get('gcal_refresh_token')?.value
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (refreshToken && clientId && clientSecret) {
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      const data = await tokenRes.json()
      if (data.access_token) {
        return data.access_token
      }
    } catch (e) {
      console.error('[Google OAuth Refresh Error]', e)
    }
  }

  return null
}

/**
 * Fetch events directly from Google Calendar REST API
 */
export async function fetchGoogleCalendarEvents(accessToken: string): Promise<GoogleCalendarEvent[]> {
  try {
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=100`

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!res.ok) {
      console.error('[Google Calendar Fetch Error] status:', res.status, await res.text())
      return []
    }

    const data = await res.json()
    const items = data.items || []

    return items.map((item: any) => {
      const startStr = item.start?.dateTime || item.start?.date || new Date().toISOString()
      const endStr = item.end?.dateTime || item.end?.date || startStr

      const attendees = Array.isArray(item.attendees)
        ? item.attendees.map((a: any) => a.displayName || a.email?.split('@')[0] || a.email)
        : []

      return {
        id: item.id || String(Math.random()),
        title: item.summary || 'Google Calendar Event',
        description: item.description,
        start: new Date(startStr),
        end: new Date(endStr),
        htmlLink: item.htmlLink,
        location: item.location,
        attendees
      }
    })
  } catch (err) {
    console.error('[Google Calendar Fetch Exception]', err)
    return []
  }
}
