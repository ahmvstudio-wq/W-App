import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import type { Priority, TaskStatus, ProjectStatus, DocumentStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM d, HH:mm')
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function daysSince(date: string | Date) {
  return differenceInDays(new Date(), new Date(date))
}

export function daysUntil(date: string | Date) {
  return differenceInDays(new Date(date), new Date())
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; description: string }> = {
  p0: { label: 'P0', color: '#ff4444', description: 'CRITICAL — blocking everything' },
  p1: { label: 'P1', color: '#f5a623', description: 'HIGH — must ship this sprint' },
  p2: { label: 'P2', color: '#6b6e75', description: 'MEDIUM — important but not urgent' },
  p3: { label: 'P3', color: '#252729', description: 'LOW — nice to have, kill if needed' },
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'TODO', color: '#6b6e75' },
  in_progress: { label: 'IN PROGRESS', color: '#c8f135' },
  blocked: { label: 'BLOCKED', color: '#f5a623' },
  shipped: { label: 'SHIPPED', color: '#00c853' },
  killed: { label: 'KILLED', color: '#ff4444' },
}

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  active: { label: 'ACTIVE', color: '#00c853' },
  paused: { label: 'PAUSED', color: '#f5a623' },
  killed: { label: 'KILLED', color: '#ff4444' },
  shipped: { label: 'SHIPPED', color: '#c8f135' },
}

export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string }> = {
  live: { label: 'LIVE', color: '#00c853' },
  reference: { label: 'REFERENCE', color: '#6b6e75' },
  archive: { label: 'ARCHIVE', color: '#f5a623' },
  delete: { label: 'DELETE', color: '#ff4444' },
}

export function getProjectHealth(project: {
  updated_at: string
  deadline?: string
  tasks?: { status: string }[]
}): 'green' | 'amber' | 'red' {
  const daysSinceActivity = daysSince(project.updated_at)
  const daysToDeadline = project.deadline ? daysUntil(project.deadline) : 999
  const shippedRatio = project.tasks?.length 
    ? project.tasks.filter(t => t.status === 'shipped').length / project.tasks.length
    : 0

  if (daysSinceActivity > 48 / 24 || daysToDeadline < 0 || (daysToDeadline < 7 && shippedRatio < 0.5)) {
    return 'red'
  }
  if (daysSinceActivity > 24 / 24 || (daysToDeadline < 14 && shippedRatio < 0.7)) {
    return 'amber'
  }
  return 'green'
}

export function getInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
