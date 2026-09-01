import { Task } from '@/types'

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
    // Only export non-deleted tasks
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
