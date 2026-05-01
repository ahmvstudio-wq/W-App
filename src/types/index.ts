export type Priority = 'p0' | 'p1' | 'p2' | 'p3'
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'shipped' | 'killed'
export type ProjectStatus = 'active' | 'paused' | 'killed' | 'shipped'
export type DocumentStatus = 'live' | 'reference' | 'archive' | 'delete'

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  settings?: {
    theme?: string
    timezone?: string
    work_hours?: { start: string; end: string }
    daily_target?: number
  }
}

export interface Workspace {
  id: string
  name: string
  owner_id: string
  members: { user_id: string; role: 'owner' | 'admin' | 'member' }[]
  created_at: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description?: string
  status: ProjectStatus
  owner_id: string
  success_metric?: string
  kill_condition?: string
  min_shippable_version?: string
  deadline?: string
  created_at: string
  updated_at: string
  priority: Priority
  owner?: User
  tasks?: Task[]
}

export interface Task {
  id: string
  project_id?: string
  workspace_id: string
  title: string
  description?: string
  owner_id: string
  status: TaskStatus
  priority: Priority
  time_box_minutes?: number
  started_at?: string
  completed_at?: string
  output_description?: string
  blocked_reason?: string
  blocked_by_user_id?: string
  created_at: string
  updated_at: string
  owner?: User
  project?: Project
  blocked_by?: User
}

export interface Document {
  id: string
  workspace_id: string
  title: string
  content?: Record<string, unknown>
  owner_id: string
  status: DocumentStatus
  last_opened_at?: string
  created_at: string
  updated_at: string
  owner?: User
}

export interface Meeting {
  id: string
  workspace_id: string
  title: string
  decision_to_make: string
  owner_id: string
  attendees: { user_id: string; name: string }[]
  scheduled_at: string
  duration_minutes: number
  decision_reached?: boolean
  decision_text?: string
  cancelled_reason?: string
  passed_gate: boolean
  created_at: string
  owner?: User
}

export interface DailyLog {
  id: string
  user_id: string
  date: string
  morning_shipped?: string
  midday_shipped?: string
  end_shipped?: string
  blockers?: { description: string; blocked_by?: string }[]
  tomorrows_priority?: string
  notes?: string
}

export interface AIConversation {
  id: string
  user_id: string
  workspace_id: string
  context_type: 'task' | 'project' | 'document' | 'general'
  context_id?: string
  messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[]
  created_at: string
}

export interface WorkspaceStats {
  tasksShippedToday: number
  dailyTarget: number
  activeBlockers: number
  projectsAtRisk: number
  velocityThisWeek: number
  velocityLastWeek: number
  velocityDelta: number
}
