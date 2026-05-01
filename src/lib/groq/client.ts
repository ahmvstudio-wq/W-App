export function buildWorkspaceContext(data: {
  projects?: { name: string; status: string; tasksTotal: number; tasksShipped: number }[]
  tasks?: { title: string; priority: string; status: string; owner?: string }[]
  blockers?: { title: string; reason: string }[]
}) {
  const lines: string[] = ['=== WORKSPACE CONTEXT ===']
  
  if (data.projects?.length) {
    lines.push('\nACTIVE PROJECTS:')
    data.projects.forEach(p => {
      lines.push(`- ${p.name} [${p.status}] — ${p.tasksShipped}/${p.tasksTotal} tasks shipped`)
    })
  }
  
  if (data.tasks?.length) {
    lines.push('\nP0/P1 TASKS:')
    data.tasks.slice(0, 10).forEach(t => {
      lines.push(`- [${t.priority.toUpperCase()}] ${t.title} — ${t.status}${t.owner ? ` (${t.owner})` : ''}`)
    })
  }
  
  if (data.blockers?.length) {
    lines.push('\nACTIVE BLOCKERS:')
    data.blockers.forEach(b => {
      lines.push(`- ${b.title}: ${b.reason}`)
    })
  }
  
  return lines.join('\n')
}

async function fetchAi(action: string, payload: any) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  })
  if (!res.ok) {
    throw new Error('AI API Error')
  }
  const data = await res.json()
  return data.result
}

export async function callGroq(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  workspaceContext?: string
) {
  return fetchAi('callGroq', { messages, workspaceContext })
}

export async function challengeTask(title: string, output: string) {
  return fetchAi('challengeTask', { title, output })
}

export async function stressTestProject(project: {
  name: string
  description?: string
  success_metric?: string
  kill_condition?: string
  min_shippable_version?: string
  deadline?: string
}) {
  return fetchAi('stressTestProject', { project })
}

export async function generateMorningBrief(context: {
  topTask?: string
  biggestBlocker?: string
  slowProject?: string
}) {
  return fetchAi('generateMorningBrief', { context })
}
