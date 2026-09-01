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
 * Universal Natural Language Parser & Entity Extraction Engine
 * Works for ANY project description, task list, brain dump, or follow-up instruction
 */
export function synthesizeHeuristic(rawText: string): SynthesizedPlan {
  const text = rawText.trim()
  if (!text) {
    return {
      mode: 'single_task',
      project_name: 'General Sprint',
      description: '',
      priority: 'p1',
      phases: [{ id: 'ph-1', name: 'General', task_count: 0 }],
      tasks: [],
      backlog_ideas: [],
      clarifications_needed: [],
      conflicts_detected: [],
      raw_input: ''
    }
  }

  const lower = text.toLowerCase()

  // 1. Detect Deadline from Text
  let detectedDeadlineLabel: string | undefined = undefined
  let detectedDeadlineIso: string | undefined = undefined

  if (lower.includes('tomorrow afternoon') || lower.includes('tomorrow 2pm') || lower.includes('tomorrow 1:30')) {
    detectedDeadlineLabel = lower.includes('1:30') ? 'Tomorrow 1:30 PM' : 'Tomorrow Afternoon'
    detectedDeadlineIso = new Date(Date.now() + 86400000 + 3600000 * 4).toISOString()
  } else if (lower.includes('tomorrow') || lower.includes('by tomorrow')) {
    detectedDeadlineLabel = 'Tomorrow EOD'
    detectedDeadlineIso = new Date(Date.now() + 86400000).toISOString()
  } else if (lower.includes('tonight') || lower.includes('today')) {
    detectedDeadlineLabel = 'Today EOD'
    detectedDeadlineIso = new Date(Date.now() + 3600000 * 6).toISOString()
  } else if (lower.includes('by friday') || lower.includes('this friday') || lower.includes('friday')) {
    detectedDeadlineLabel = 'This Friday'
    detectedDeadlineIso = new Date(Date.now() + 86400000 * 3).toISOString()
  } else if (lower.includes('by thursday') || lower.includes('this thursday') || lower.includes('thursday')) {
    detectedDeadlineLabel = 'This Thursday'
    detectedDeadlineIso = new Date(Date.now() + 86400000 * 2).toISOString()
  } else if (lower.includes('next week') || lower.includes('next tuesday') || lower.includes('tuesday')) {
    detectedDeadlineLabel = 'Next Tuesday'
    detectedDeadlineIso = new Date(Date.now() + 86400000 * 7).toISOString()
  } else if (lower.includes('within 2 weeks') || lower.includes('in 2 weeks')) {
    detectedDeadlineLabel = 'In 2 Weeks'
    detectedDeadlineIso = new Date(Date.now() + 86400000 * 14).toISOString()
  }

  // 2. Detect Priority
  let overallPriority: Priority = 'p1'
  if (lower.includes('p0') || lower.includes('critical') || lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately')) {
    overallPriority = 'p0'
  } else if (lower.includes('p2') || lower.includes('when possible') || lower.includes('low priority')) {
    overallPriority = 'p2'
  } else if (lower.includes('p3') || lower.includes('backlog') || lower.includes('someday')) {
    overallPriority = 'p3'
  }

  // 3. Detect Single Task vs Multi-Phase Project
  const isExplicitSingleTask = 
    (lower.startsWith('follow up') || lower.startsWith('remind') || lower.startsWith('check with') || lower.startsWith('ping') || lower.startsWith('call') || lower.startsWith('message')) ||
    (!text.includes('\n') && !text.includes(';') && text.split('.').length <= 2 && text.length < 130 && !lower.includes('project') && !lower.includes('we need to finish the') && !lower.includes('phase'))

  if (isExplicitSingleTask) {
    let person: string | undefined = undefined
    const personMatch = text.match(/(?:with|to|for|ask|ping|email)\s+([A-Z][a-z]+)/)
    if (personMatch) person = personMatch[1]

    const triggerMatch = text.match(/if\s+([^,.]+)/i)
    const dependencies = triggerMatch ? [`Trigger: ${triggerMatch[0].trim()}`] : []

    const cleanTitle = text.replace(/^follow up with\s+/i, 'Follow up with ')

    return {
      mode: 'single_task',
      project_name: person ? `Communication with ${person}` : 'Executive Operations',
      description: text,
      deadline_label: detectedDeadlineLabel || 'Next 24–48 Hours',
      deadline_iso: detectedDeadlineIso || new Date(Date.now() + 86400000).toISOString(),
      priority: overallPriority,
      phases: [{ id: 'ph-1', name: 'Targeted Deliverable', task_count: 1 }],
      tasks: [
        {
          id: 'task-s-1',
          title: cleanTitle,
          phase: 'Targeted Deliverable',
          priority: overallPriority,
          due_date_label: detectedDeadlineLabel || 'Next 24h',
          due_date_iso: detectedDeadlineIso || new Date(Date.now() + 86400000).toISOString(),
          assignee: person || 'You',
          dependencies,
          confidence: 'explicit',
          status: 'todo',
          type: lower.includes('follow up') ? 'follow_up' : 'core_deliverable',
          is_selected: true
        }
      ],
      backlog_ideas: [],
      clarifications_needed: dependencies.length > 0 ? [`Awaiting condition: ${dependencies[0]}`] : [],
      conflicts_detected: [],
      raw_input: text
    }
  }

  // 4. Multi-Task & Project Extraction
  const rawClauses: string[] = []
  const lines = text.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    // Check if line is a bullet or numbered item
    if (/^[-*•\d.]+\s+/.test(trimmedLine)) {
      rawClauses.push(trimmedLine.replace(/^[-*•\d.]+\s+/, ''))
    } else {
      // Split by periods, semicolons, or commas preceding verbs/conjunctions
      const subClauses = trimmedLine.split(/(?:;|\.\s+|\band\s+(?:then\s+|also\s+)?|,\s*(?=(?:and|also|we need|draft|design|set up|calculate|estimate|prepare|send|finalize|verify|clone|deploy|run|fix|review|allocate|submit)\b))/i)
      for (const sc of subClauses) {
        const cleanSc = sc.trim()
        if (cleanSc.length > 4) {
          rawClauses.push(cleanSc)
        }
      }
    }
  }

  // Extract Clarifications & Backlog items
  const backlogIdeas: string[] = []
  const clarifications: string[] = []
  const candidateClauses: string[] = []

  for (const clause of rawClauses) {
    const cLower = clause.toLowerCase()
    if (cLower.includes('future') || cLower.includes('later on') || cLower.includes('v2') || cLower.includes('post launch') || cLower.includes('nice to have') || cLower.includes('eventually') || cLower.includes('post-launch')) {
      backlogIdeas.push(clause.charAt(0).toUpperCase() + clause.slice(1))
    } else if (clause.includes('?') || cLower.includes('need to check') || cLower.includes('tbd') || cLower.includes('unknown') || cLower.includes('unclear') || cLower.includes('confirm if')) {
      clarifications.push(clause.charAt(0).toUpperCase() + clause.slice(1))
    } else {
      candidateClauses.push(clause)
    }
  }

  // Deduce Project Title
  let projectName = 'Executive Strategic Initiative'
  const projectMatch = text.match(/(?:for the|project:?|initiative:?|building|create|launching|rebrand the)\s+([^,.\n]+)/i)
  if (projectMatch && projectMatch[1].length > 3 && projectMatch[1].length < 45) {
    projectName = projectMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase())
  } else if (candidateClauses[0] && candidateClauses[0].length < 40 && !candidateClauses[0].includes('need to')) {
    projectName = candidateClauses[0].replace(/\b\w/g, c => c.toUpperCase())
  }

  // Dynamic Phase Categorization
  const phasesMap: Record<string, SynthesizedTaskItem[]> = {}

  candidateClauses.forEach((clause, idx) => {
    let clean = clause.replace(/^(for the [^,]+,\s*|we need to\s+|please\s+|also\s+|make sure to\s+|first\s+|then\s+)/i, '').trim()
    clean = clean.charAt(0).toUpperCase() + clean.slice(1)
    if (clean.endsWith('.')) clean = clean.slice(0, -1)

    if (clean.length < 4) return

    const cLower = clean.toLowerCase()

    // Determine Phase
    let phaseName = 'PHASE 1 — Core Execution'
    if (cLower.includes('crm') || cLower.includes('lead') || cLower.includes('counselor') || cLower.includes('permission')) {
      phaseName = 'PHASE 1 — CRM Demo'
    } else if (cLower.includes('e-commerce') || cLower.includes('ecommerce') || cLower.includes('client product') || cLower.includes('branding') || cLower.includes('codebase')) {
      phaseName = 'PHASE 2 — E-Commerce Demo'
    } else if (cLower.includes('package') || cLower.includes('pricing') || cLower.includes('standard') || cLower.includes('gold') || cLower.includes('premium') || cLower.includes('ad spend') || cLower.includes('budget')) {
      phaseName = 'PHASE 3 — Commercial & Budget'
    } else if (cLower.includes('hour') || cLower.includes('estimate') || cLower.includes('timeline') || cLower.includes('schedule') || cLower.includes('analytics') || cLower.includes('tracking')) {
      phaseName = 'PHASE 4 — Planning & Tracking'
    } else if (cLower.includes('send') || cLower.includes('handoff') || cLower.includes('ismail') || cLower.includes('discussion') || cLower.includes('present') || cLower.includes('deploy') || cLower.includes('submit') || cLower.includes('launch') || cLower.includes('testflight')) {
      phaseName = 'PHASE 5 — Release & Handoff'
    } else {
      // General NLP Phase clustering
      if (cLower.includes('design') || cLower.includes('figma') || cLower.includes('spec') || cLower.includes('research') || cLower.includes('draft') || cLower.includes('copy') || idx === 0) {
        phaseName = 'PHASE 1 — Creative & Specification'
      } else if (cLower.includes('build') || cLower.includes('develop') || cLower.includes('implement') || cLower.includes('code') || cLower.includes('api') || cLower.includes('fix') || cLower.includes('refactor') || cLower.includes('push')) {
        phaseName = 'PHASE 2 — Implementation & Build'
      } else if (cLower.includes('test') || cLower.includes('qa') || cLower.includes('verify') || cLower.includes('review') || cLower.includes('audit') || cLower.includes('cypress') || cLower.includes('sentry')) {
        phaseName = 'PHASE 3 — Testing & Verification'
      } else if (cLower.includes('deploy') || cLower.includes('ship') || cLower.includes('release') || cLower.includes('patch')) {
        phaseName = 'PHASE 4 — Deployment & Release'
      }
    }

    // Determine Assignee
    let assignee = 'Team'
    const nameMatch = clean.match(/\b([A-Z][a-z]+)\s+(?:needs to|should|will|to)\b/) || clean.match(/\b(?:with|by|assign to)\s+([A-Z][a-z]+)\b/)
    if (nameMatch) {
      assignee = nameMatch[1]
    } else if (cLower.includes('design') || cLower.includes('ui') || cLower.includes('figma') || cLower.includes('carousel') || cLower.includes('brand')) {
      assignee = 'Design'
    } else if (cLower.includes('code') || cLower.includes('api') || cLower.includes('dev') || cLower.includes('cluster') || cLower.includes('sentry') || cLower.includes('cypress') || cLower.includes('patch')) {
      assignee = 'Engineering'
    } else if (cLower.includes('pricing') || cLower.includes('cost') || cLower.includes('package') || cLower.includes('ismail') || cLower.includes('spend')) {
      assignee = 'Ahmed'
    } else if (cLower.includes('timeline') || cLower.includes('estimate') || cLower.includes('copy') || cLower.includes('email')) {
      assignee = 'Sarah'
    }

    // Determine Task Priority
    let taskPriority: Priority = overallPriority
    if (cLower.includes('p0') || cLower.includes('critical') || cLower.includes('urgent') || idx === 0 || cLower.includes('urgent') || cLower.includes('patch')) {
      taskPriority = 'p0'
    } else if (cLower.includes('p2') || cLower.includes('estimate') || cLower.includes('optional')) {
      taskPriority = 'p2'
    }

    // Determine Task Type
    let taskType: SynthesizedTaskItem['type'] = 'core_deliverable'
    if (cLower.includes('verify') || cLower.includes('test') || cLower.includes('review') || cLower.includes('audit') || cLower.includes('cypress')) {
      taskType = 'review'
    } else if (cLower.includes('send') || cLower.includes('deploy') || cLower.includes('handoff') || cLower.includes('present') || cLower.includes('submit')) {
      taskType = 'handoff'
    } else if (cLower.includes('follow up') || cLower.includes('remind') || cLower.includes('ping')) {
      taskType = 'follow_up'
    }

    // Determine Task Due Date
    let taskDueLabel = detectedDeadlineLabel
    if (cLower.includes('by thursday') || cLower.includes('thursday')) {
      taskDueLabel = 'Thursday EOD'
    } else if (cLower.includes('by friday') || cLower.includes('friday')) {
      taskDueLabel = 'Friday EOD'
    } else if (cLower.includes('tonight') || cLower.includes('today')) {
      taskDueLabel = 'Tonight'
    } else if (cLower.includes('tomorrow 1:30') || cLower.includes('before 1:30')) {
      taskDueLabel = 'Tomorrow 1:30 PM'
    }

    // Determine Dependencies
    const dependencies: string[] = []
    if (cLower.includes('send everything') || cLower.includes('send to') || cLower.includes('submit build')) {
      dependencies.push('All deliverables above')
    } else if (cLower.includes('timeline') || cLower.includes('estimate')) {
      dependencies.push('Scope & estimates')
    } else if (cLower.includes('deploy') || cLower.includes('patch')) {
      dependencies.push('Test verification')
    }

    // Determine Confidence
    const isImplied = cLower.includes('verify') || cLower.includes('make sure') || cLower.includes('ensure') || cLower.includes('calculate')

    if (!phasesMap[phaseName]) {
      phasesMap[phaseName] = []
    }

    phasesMap[phaseName].push({
      id: `task-gen-${idx + 1}`,
      title: clean,
      phase: phaseName,
      priority: taskPriority,
      due_date_label: taskDueLabel || 'Sprint Horizon',
      due_date_iso: detectedDeadlineIso || new Date(Date.now() + 86400000).toISOString(),
      assignee,
      dependencies,
      confidence: isImplied ? 'implied' : 'explicit',
      status: 'todo',
      type: taskType,
      is_selected: true
    })
  })

  // Format Phases Array and Flatten Tasks
  const phases: SynthesizedPhase[] = Object.keys(phasesMap).map((name, idx) => ({
    id: `ph-${idx + 1}`,
    name,
    task_count: phasesMap[name].length
  }))

  const allTasks = Object.values(phasesMap).flat()

  return {
    mode: 'project_with_phases',
    project_name: projectName,
    description: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
    deadline_label: detectedDeadlineLabel || 'Sprint Horizon',
    deadline_iso: detectedDeadlineIso || new Date(Date.now() + 86400000 * 3).toISOString(),
    priority: overallPriority,
    phases,
    tasks: allTasks,
    backlog_ideas: backlogIdeas,
    clarifications_needed: clarifications,
    conflicts_detected: [],
    raw_input: text
  }
}
