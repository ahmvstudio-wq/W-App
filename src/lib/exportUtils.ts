import { format } from 'date-fns'
import type { Task } from '@/types'

/**
 * Export tasks array as a UTF-8 CSV file and trigger browser download
 */
export function exportTasksToCSV(tasks: Task[], filenamePrefix = 'callmy-tasks') {
  const headers = [
    'Task ID',
    'Title',
    'Status',
    'Priority',
    'Project',
    'Timebox (Minutes)',
    'Tracked Duration (Minutes)',
    'Deadline',
    'Started At',
    'Completed At',
    'Created At',
    'Description'
  ]

  const rows = tasks.map(t => {
    let durationMinutes = t.time_box_minutes || 0
    if (t.started_at && t.completed_at) {
      const diff = Math.round((new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 60000)
      if (diff > 0) durationMinutes = diff
    }

    const fields = [
      t.id,
      t.title,
      t.status,
      t.priority,
      t.project?.name || 'General',
      t.time_box_minutes || '',
      durationMinutes || '',
      t.due_date ? format(new Date(t.due_date), 'yyyy-MM-dd HH:mm') : '',
      t.started_at ? format(new Date(t.started_at), 'yyyy-MM-dd HH:mm') : '',
      t.completed_at ? format(new Date(t.completed_at), 'yyyy-MM-dd HH:mm') : '',
      t.created_at ? format(new Date(t.created_at), 'yyyy-MM-dd HH:mm') : '',
      (t.description || '').replace(/[\r\n]+/g, ' ')
    ]

    return fields
      .map(val => `"${String(val ?? '').replace(/"/g, '""')}"`)
      .join(',')
  })

  // \uFEFF enables Excel / Google Sheets to recognize UTF-8 encoding immediately
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filenamePrefix}-${format(new Date(), 'yyyy-MM-dd')}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
