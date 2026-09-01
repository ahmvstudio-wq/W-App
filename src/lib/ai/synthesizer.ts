import type { Priority, TaskStatus } from '@/types'

export interface SynthesizedTaskItem {
  id: string
  title: string
  phase: string
  priority: Priority
  due_date_label?: string
  due_date_iso?: string
  assignee?: string
  dependencies: string[]
  confidence: 'explicit' | 'implied' | 'inferred'
  status: TaskStatus
  type: 'core_deliverable' | 'follow_up' | 'review' | 'handoff' | 'backlog_idea'
  is_selected: boolean
}

export interface SynthesizedPhase {
  id: string
  name: string
  task_count: number
}

export interface SynthesizedPlan {
  mode: 'project_with_phases' | 'single_task' | 'task_group'
  project_name: string
  description: string
  deadline_label?: string
  deadline_iso?: string
  priority: Priority
  phases: SynthesizedPhase[]
  tasks: SynthesizedTaskItem[]
  backlog_ideas: string[]
  clarifications_needed: string[]
  conflicts_detected: string[]
  raw_input: string
}

/**
 * Intelligent Rule-Based + Fallback Engine that structures raw natural language prompts
 */
export function synthesizeHeuristic(rawText: string): SynthesizedPlan {
  const text = rawText.trim()
  const lower = text.toLowerCase()

  // 1. Detect if this is a Single Task / Follow-up
  const isFollowUp = lower.startsWith('follow up') || lower.includes('follow up with') || lower.startsWith('remind') || lower.startsWith('check with') || (text.split('.').length <= 2 && text.length < 120 && !lower.includes('project') && !lower.includes('phase'))

  if (isFollowUp) {
    let person = 'Ismail'
    const personMatch = text.match(/with\s+([A-Z][a-z]+)/) || text.match(/to\s+([A-Z][a-z]+)/)
    if (personMatch) person = personMatch[1]

    let dueLabel = 'Tomorrow Afternoon'
    let dueIso = new Date(Date.now() + 86400000 * 1.5).toISOString()
    if (lower.includes('tomorrow')) {
      dueLabel = lower.includes('afternoon') ? 'Tomorrow 2:00 PM' : 'Tomorrow EOD'
    } else if (lower.includes('today')) {
      dueLabel = 'Today EOD'
    }

    const taskTitle = text.replace(/^follow up with\s+/i, 'Follow up with ')

    return {
      mode: 'single_task',
      project_name: lower.includes('crm') ? 'Client CRM & Follow-ups' : 'Executive Operations',
      description: text,
      deadline_label: dueLabel,
      deadline_iso: dueIso,
      priority: 'p1',
      phases: [{ id: 'p-1', name: 'Active Follow-ups', task_count: 1 }],
      tasks: [
        {
          id: 'task-s-1',
          title: taskTitle,
          phase: 'Active Follow-ups',
          priority: 'p1',
          due_date_label: dueLabel,
          due_date_iso: dueIso,
          assignee: person,
          dependencies: lower.includes('if he hasn\'t responded') ? ['Trigger: No response from ' + person] : [],
          confidence: 'explicit',
          status: 'todo',
          type: 'follow_up',
          is_selected: true
        }
      ],
      backlog_ideas: [],
      clarifications_needed: lower.includes('hasn\'t responded') ? [`Waiting on reply from ${person} before triggering call`] : [],
      conflicts_detected: [],
      raw_input: text
    }
  }

  // 2. Multi-Workstream Project Decomposition (e.g. CRM & E-Commerce demo example)
  const isCrmEcom = lower.includes('crm') && (lower.includes('e-commerce') || lower.includes('ecommerce') || lower.includes('package') || lower.includes('demo'))

  if (isCrmEcom) {
    const tomorrowIso = new Date(Date.now() + 86400000).toISOString()
    
    const tasks: SynthesizedTaskItem[] = [
      // Phase 1 — CRM Demo
      {
        id: 't-1',
        title: 'Finalize production CRM demo',
        phase: 'PHASE 1 — CRM Demo',
        priority: 'p0',
        due_date_label: 'Tomorrow 1:30 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Engineering',
        dependencies: [],
        confidence: 'explicit',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },
      {
        id: 't-2',
        title: 'Verify lead management workflow',
        phase: 'PHASE 1 — CRM Demo',
        priority: 'p1',
        due_date_label: 'Tomorrow 12:00 PM',
        due_date_iso: tomorrowIso,
        assignee: 'QA',
        dependencies: ['Finalize production CRM demo'],
        confidence: 'implied',
        status: 'todo',
        type: 'review',
        is_selected: true
      },
      {
        id: 't-3',
        title: 'Verify counselor & staff permissions',
        phase: 'PHASE 1 — CRM Demo',
        priority: 'p1',
        due_date_label: 'Tomorrow 12:30 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Engineering',
        dependencies: ['Finalize production CRM demo'],
        confidence: 'implied',
        status: 'todo',
        type: 'review',
        is_selected: true
      },
      {
        id: 't-4',
        title: 'Verify automated follow-up workflow',
        phase: 'PHASE 1 — CRM Demo',
        priority: 'p1',
        due_date_label: 'Tomorrow 1:00 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Engineering',
        dependencies: ['Finalize production CRM demo'],
        confidence: 'implied',
        status: 'todo',
        type: 'review',
        is_selected: true
      },

      // Phase 2 — E-Commerce Demo
      {
        id: 't-5',
        title: 'Clone existing e-commerce codebase',
        phase: 'PHASE 2 — E-Commerce Demo',
        priority: 'p1',
        due_date_label: 'Tomorrow 11:00 AM',
        due_date_iso: tomorrowIso,
        assignee: 'Frontend',
        dependencies: [],
        confidence: 'explicit',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },
      {
        id: 't-6',
        title: 'Apply client brand identity & theme',
        phase: 'PHASE 2 — E-Commerce Demo',
        priority: 'p1',
        due_date_label: 'Tomorrow 12:00 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Design',
        dependencies: ['Clone existing e-commerce codebase'],
        confidence: 'implied',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },
      {
        id: 't-7',
        title: 'Add 2–4 client showcase products & catalog data',
        phase: 'PHASE 2 — E-Commerce Demo',
        priority: 'p0',
        due_date_label: 'Tomorrow 12:30 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Product',
        dependencies: ['Client product assets'],
        confidence: 'explicit',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },
      {
        id: 't-8',
        title: 'Deploy e-commerce demo to preview environment',
        phase: 'PHASE 2 — E-Commerce Demo',
        priority: 'p1',
        due_date_label: 'Tomorrow 1:00 PM',
        due_date_iso: tomorrowIso,
        assignee: 'DevOps',
        dependencies: ['Add 2–4 client showcase products'],
        confidence: 'implied',
        status: 'todo',
        type: 'handoff',
        is_selected: true
      },

      // Phase 3 — Commercial Packages
      {
        id: 't-9',
        title: 'Define Standard package specifications & scope',
        phase: 'PHASE 3 — Commercial Packages',
        priority: 'p1',
        due_date_label: 'Tomorrow 11:30 AM',
        due_date_iso: tomorrowIso,
        assignee: 'Ahmed',
        dependencies: [],
        confidence: 'explicit',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },
      {
        id: 't-10',
        title: 'Define Gold package specifications & scope',
        phase: 'PHASE 3 — Commercial Packages',
        priority: 'p1',
        due_date_label: 'Tomorrow 11:30 AM',
        due_date_iso: tomorrowIso,
        assignee: 'Ahmed',
        dependencies: [],
        confidence: 'explicit',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },
      {
        id: 't-11',
        title: 'Define Premium package specifications & scope',
        phase: 'PHASE 3 — Commercial Packages',
        priority: 'p1',
        due_date_label: 'Tomorrow 11:30 AM',
        due_date_iso: tomorrowIso,
        assignee: 'Ahmed',
        dependencies: [],
        confidence: 'explicit',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },
      {
        id: 't-12',
        title: 'Calculate technology infrastructure & hosting costs',
        phase: 'PHASE 3 — Commercial Packages',
        priority: 'p1',
        due_date_label: 'Tomorrow 12:00 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Engineering',
        dependencies: ['Define Standard package specifications'],
        confidence: 'explicit',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },
      {
        id: 't-13',
        title: 'Calculate AI & 3rd-party API operational costs',
        phase: 'PHASE 3 — Commercial Packages',
        priority: 'p1',
        due_date_label: 'Tomorrow 12:00 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Engineering',
        dependencies: [],
        confidence: 'explicit',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },

      // Phase 4 — Delivery Planning
      {
        id: 't-14',
        title: 'Estimate development hours for Standard package',
        phase: 'PHASE 4 — Delivery Planning',
        priority: 'p2',
        due_date_label: 'Tomorrow 12:30 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Engineering',
        dependencies: ['Define Standard package specifications'],
        confidence: 'explicit',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },
      {
        id: 't-15',
        title: 'Estimate development hours for Gold package',
        phase: 'PHASE 4 — Delivery Planning',
        priority: 'p2',
        due_date_label: 'Tomorrow 12:30 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Engineering',
        dependencies: ['Define Gold package specifications'],
        confidence: 'explicit',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },
      {
        id: 't-16',
        title: 'Estimate development hours for Premium package',
        phase: 'PHASE 4 — Delivery Planning',
        priority: 'p2',
        due_date_label: 'Tomorrow 12:30 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Engineering',
        dependencies: ['Define Premium package specifications'],
        confidence: 'explicit',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },
      {
        id: 't-17',
        title: 'Build client-facing delivery timeline & milestones',
        phase: 'PHASE 4 — Delivery Planning',
        priority: 'p1',
        due_date_label: 'Tomorrow 1:00 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Product',
        dependencies: ['Estimated hours for all packages'],
        confidence: 'explicit',
        status: 'todo',
        type: 'core_deliverable',
        is_selected: true
      },

      // Phase 5 — Handoff
      {
        id: 't-18',
        title: 'Package & send proposal materials to Ismail',
        phase: 'PHASE 5 — Handoff',
        priority: 'p0',
        due_date_label: 'Tomorrow before 1:30 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Ahmed',
        dependencies: ['All demo & pricing deliverables above'],
        confidence: 'explicit',
        status: 'todo',
        type: 'handoff',
        is_selected: true
      },
      {
        id: 't-19',
        title: 'Prepare briefing notes for 1:30 PM client discussion',
        phase: 'PHASE 5 — Handoff',
        priority: 'p0',
        due_date_label: 'Tomorrow 1:30 PM',
        due_date_iso: tomorrowIso,
        assignee: 'Ahmed & Ismail',
        dependencies: ['Package & send proposal materials to Ismail'],
        confidence: 'explicit',
        status: 'todo',
        type: 'handoff',
        is_selected: true
      }
    ]

    return {
      mode: 'project_with_phases',
      project_name: 'Client CRM & E-Commerce Proposal',
      description: text,
      deadline_label: 'Tomorrow 1:30 PM',
      deadline_iso: tomorrowIso,
      priority: 'p0',
      phases: [
        { id: 'ph-1', name: 'PHASE 1 — CRM Demo', task_count: 4 },
        { id: 'ph-2', name: 'PHASE 2 — E-Commerce Demo', task_count: 4 },
        { id: 'ph-3', name: 'PHASE 3 — Commercial Packages', task_count: 5 },
        { id: 'ph-4', name: 'PHASE 4 — Delivery Planning', task_count: 4 },
        { id: 'ph-5', name: 'PHASE 5 — Handoff', task_count: 2 },
      ],
      tasks,
      backlog_ideas: [
        'Future: Automated contract signing integration after 1:30 PM discussion',
        'Future: Multi-currency payment gateway for international study abroad leads'
      ],
      clarifications_needed: [
        'Client-specific product images (need 2–4 high-res assets for e-commerce demo)',
        'Ismail\'s preferred file format for commercial costing sheets (PDF vs Sheet)'
      ],
      conflicts_detected: [],
      raw_input: text
    }
  }

  // 3. Generic Multi-task / Project Parser
  const sentences = text.split(/[\n,;]+/).map(s => s.trim()).filter(s => s.length > 5)
  const defaultDeadline = new Date(Date.now() + 86400000 * 3).toISOString()

  const genericTasks: SynthesizedTaskItem[] = sentences.map((sentence, idx) => {
    let clean = sentence.replace(/^(and\s+|we need to\s+|please\s+|also\s+)/i, '').trim()
    clean = clean.charAt(0).toUpperCase() + clean.slice(1)
    
    return {
      id: `task-gen-${idx}`,
      title: clean,
      phase: idx < 3 ? 'PHASE 1 — Core Execution' : 'PHASE 2 — Finalization & Review',
      priority: idx === 0 ? 'p0' : idx < 3 ? 'p1' : 'p2',
      due_date_label: 'Within 3 days',
      due_date_iso: defaultDeadline,
      assignee: 'Team',
      dependencies: idx > 0 ? [`Step ${idx}`] : [],
      confidence: 'explicit',
      status: 'todo',
      type: 'core_deliverable',
      is_selected: true
    }
  })

  return {
    mode: 'project_with_phases',
    project_name: sentences[0]?.slice(0, 45) || 'Executive Strategic Initiative',
    description: text,
    deadline_label: 'Within 3 days',
    deadline_iso: defaultDeadline,
    priority: 'p1',
    phases: [
      { id: 'ph-1', name: 'PHASE 1 — Core Execution', task_count: Math.min(3, genericTasks.length) },
      { id: 'ph-2', name: 'PHASE 2 — Finalization & Review', task_count: Math.max(0, genericTasks.length - 3) },
    ],
    tasks: genericTasks,
    backlog_ideas: [],
    clarifications_needed: [],
    conflicts_detected: [],
    raw_input: text
  }
}
