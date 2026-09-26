#!/usr/bin/env node

/**
 * Cultlike OS - Comprehensive Model Context Protocol (MCP) Server for Claude & AI Agents
 * Transport: stdio (JSON-RPC 2.0)
 * 
 * Provides 100% full tool permissions across every feature in Cultlike OS:
 * - Tasks, Microtasks & Sprint Execution
 * - Projects & Initiatives Roadmap
 * - Content Vault, AI Viral Hooks & Multi-channel Publishing (YouTube & Instagram)
 * - Google Drive Ingestion & Google Calendar Two-Way Sync
 * - Fathom AI Meeting Notes, Summaries & Transcripts
 * - Strategic Documents & Executive Daily Logs
 * - Natural Language Brain Dump Project Synthesis
 */

const readline = require('readline');

const BASE_URL = process.env.CULTLIKE_BASE_URL || 'https://cultlike.ahmvsystems.com';
const API_KEY = process.env.CULTLIKE_API_KEY || process.env.CHATGPT_API_KEY || '';

async function fetchApi(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}`, 'x-api-key': API_KEY } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Cultlike API error (${res.status}): ${errorText}`);
  }
  return res.json();
}

const TOOLS = [
  {
    name: 'cultlike_get_overview',
    description: 'Get complete workspace executive briefing including urgent P0/P1 tasks, active projects, blockers, velocity metrics, and recent daily logs.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'cultlike_list_tasks',
    description: 'List and search workspace tasks with filtering by status, priority, project_id, date, or keyword.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'shipped', 'killed', 'active'], description: 'Filter by task status' },
        priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'], description: 'Filter by priority level (p0=critical, p3=low)' },
        search: { type: 'string', description: 'Search keyword matching task title' },
        project_id: { type: 'string', description: 'Filter by project UUID' },
        date: { type: 'string', description: 'Filter by YYYY-MM-DD date' },
        limit: { type: 'number', description: 'Max number of tasks to return (default 50)' }
      }
    }
  },
  {
    name: 'cultlike_create_task',
    description: 'Create a new sprint task in Cultlike OS with priority, timebox, and project attachments.',
    inputSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Detailed instructions' },
        priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'], description: 'Priority level (p0=highest, p3=lowest)' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'shipped'], description: 'Initial status' },
        project_id: { type: 'string', description: 'Optional project UUID to link' },
        due_date: { type: 'string', description: 'ISO 8601 due date' },
        time_box_minutes: { type: 'number', description: 'Estimated focus time in minutes' },
        output_description: { type: 'string', description: 'Definition of done' }
      }
    }
  },
  {
    name: 'cultlike_update_task',
    description: 'Update a task status, priority, title, blocker, or due date by task ID.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'UUID of the task' },
        title: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'shipped', 'killed'] },
        priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] },
        blocked_reason: { type: 'string' },
        due_date: { type: 'string' },
        time_box_minutes: { type: 'number' }
      }
    }
  },
  {
    name: 'cultlike_generate_microtasks',
    description: 'Decompose any task into 3-5 sequenced micro-deliverables with clear focus timeboxes.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Optional task UUID' },
        title: { type: 'string', description: 'Task title to decompose' },
        description: { type: 'string', description: 'Context or instructions' }
      }
    }
  },
  {
    name: 'cultlike_list_projects',
    description: 'List all workspace initiatives, completion rates, deadlines, and kill conditions.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'paused', 'killed', 'shipped'] },
        priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] },
        search: { type: 'string' }
      }
    }
  },
  {
    name: 'cultlike_create_project',
    description: 'Create a new project / initiative in Cultlike OS.',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] },
        deadline: { type: 'string', description: 'ISO date' },
        success_metric: { type: 'string' },
        kill_condition: { type: 'string' },
        min_shippable_version: { type: 'string' }
      }
    }
  },
  {
    name: 'cultlike_get_content_vault',
    description: 'List staged, scheduled, and published deliverables in the Content Vault.',
    inputSchema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['all', 'youtube', 'instagram'] },
        status: { type: 'string', enum: ['all', 'draft', 'inbox', 'scheduled', 'published'] },
        limit: { type: 'number' }
      }
    }
  },
  {
    name: 'cultlike_create_content_item',
    description: 'Stage a new video or social deliverable in the Content Vault ready for scheduling.',
    inputSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string' },
        caption: { type: 'string' },
        platform: { type: 'string', enum: ['youtube', 'instagram'] },
        content_type: { type: 'string', enum: ['video', 'short', 'reel', 'post', 'carousel'] },
        scheduled_at: { type: 'string', description: 'Optional ISO datetime' },
        media_urls: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  {
    name: 'cultlike_schedule_content',
    description: 'Schedule a staged content deliverable for automated publication.',
    inputSchema: {
      type: 'object',
      required: ['id', 'scheduled_at'],
      properties: {
        id: { type: 'string', description: 'UUID of the content item' },
        scheduled_at: { type: 'string', description: 'Target release ISO datetime' }
      }
    }
  },
  {
    name: 'cultlike_publish_content_item',
    description: 'Trigger immediate 1-click publishing of a Content Vault asset to YouTube (Short/Video) or Instagram (Reel/Carousel).',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'UUID of the content item to publish' },
        platform: { type: 'string', enum: ['youtube', 'instagram'] },
        privacy_status: { type: 'string', enum: ['public', 'unlisted', 'private'] }
      }
    }
  },
  {
    name: 'cultlike_list_drive_assets',
    description: 'Discover and browse finished video exports and folders on Google Drive.',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: { type: 'string' },
        q: { type: 'string' },
        limit: { type: 'number' }
      }
    }
  },
  {
    name: 'cultlike_import_drive_assets',
    description: 'Import video deliverables from Google Drive directly into the private Content Vault.',
    inputSchema: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title'],
            properties: {
              title: { type: 'string' },
              webContentLink: { type: 'string' },
              platform: { type: 'string', enum: ['youtube', 'instagram'] }
            }
          }
        }
      }
    }
  },
  {
    name: 'cultlike_analyze_content_asset',
    description: 'Run AI analysis on a video title/transcript to extract 3 viral hooks, platform-optimized captions for Instagram and YouTube, and optimal posting times.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'UUID of the vault deliverable' },
        title: { type: 'string', description: 'Deliverable title' },
        transcript: { type: 'string' },
        platform: { type: 'string', enum: ['youtube', 'instagram'] }
      }
    }
  },
  {
    name: 'cultlike_plan_content_sprint',
    description: 'Auto-schedule pending assets across a 14 or 30 day multi-platform distribution sprint.',
    inputSchema: {
      type: 'object',
      properties: {
        sprint_days: { type: 'number', default: 14 },
        items_per_day: { type: 'number', default: 1 },
        start_date: { type: 'string', description: 'YYYY-MM-DD' }
      }
    }
  },
  {
    name: 'cultlike_sync_google_calendar',
    description: 'Trigger two-way task sync to user Google Calendar.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'cultlike_get_calendar_events',
    description: 'Fetch upcoming Google Calendar schedule and events.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'cultlike_synthesize_project_plan',
    description: 'Decompose a natural language brain dump or strategy directive into structured project phases and actionable sprint tasks (with optional auto-commit).',
    inputSchema: {
      type: 'object',
      required: ['text'],
      properties: {
        text: { type: 'string', description: 'Raw thoughts, brainstorm, or directive' },
        auto_commit: { type: 'boolean', default: false, description: 'Automatically commit project and tasks to DB' }
      }
    }
  },
  {
    name: 'cultlike_list_meetings',
    description: 'List and search Fathom meeting recordings, attendees, and summaries.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search term or attendee name' },
        limit: { type: 'number' }
      }
    }
  },
  {
    name: 'cultlike_get_meeting_detail',
    description: 'Get full summary, action items, and verbatim transcript of a Fathom meeting recording.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Fathom recording ID' }
      }
    }
  },
  {
    name: 'cultlike_convert_meeting_action',
    description: 'Convert a meeting action item takeaway into a real workspace task.',
    inputSchema: {
      type: 'object',
      required: ['id', 'title'],
      properties: {
        id: { type: 'string', description: 'Fathom recording ID' },
        title: { type: 'string', description: 'Title or description of the action item' },
        priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] },
        project_id: { type: 'string' }
      }
    }
  },
  {
    name: 'cultlike_get_analytics',
    description: 'Get workspace velocity trends, sprint progress, and task completion metrics.',
    inputSchema: { type: 'object', properties: {} }
  }
];

async function handleToolCall(name, args) {
  switch (name) {
    case 'cultlike_get_overview':
      return await fetchApi('/api/chatgpt/overview');
    
    case 'cultlike_list_tasks': {
      const q = new URLSearchParams();
      if (args.status) q.set('status', args.status);
      if (args.priority) q.set('priority', args.priority);
      if (args.search) q.set('search', args.search);
      if (args.project_id) q.set('project_id', args.project_id);
      if (args.date) q.set('date', args.date);
      if (args.limit) q.set('limit', String(args.limit));
      return await fetchApi(`/api/chatgpt/tasks?${q.toString()}`);
    }

    case 'cultlike_create_task':
      return await fetchApi('/api/chatgpt/tasks', { method: 'POST', body: JSON.stringify(args) });

    case 'cultlike_update_task':
      return await fetchApi('/api/chatgpt/tasks', { method: 'PATCH', body: JSON.stringify(args) });

    case 'cultlike_generate_microtasks':
      return await fetchApi('/api/chatgpt/tasks/microtasks', { method: 'POST', body: JSON.stringify(args) });

    case 'cultlike_list_projects': {
      const q = new URLSearchParams();
      if (args.status) q.set('status', args.status);
      if (args.priority) q.set('priority', args.priority);
      if (args.search) q.set('search', args.search);
      return await fetchApi(`/api/chatgpt/projects?${q.toString()}`);
    }

    case 'cultlike_create_project':
      return await fetchApi('/api/chatgpt/projects', { method: 'POST', body: JSON.stringify(args) });

    case 'cultlike_get_content_vault': {
      const q = new URLSearchParams();
      if (args.platform) q.set('platform', args.platform);
      if (args.status) q.set('status', args.status);
      if (args.limit) q.set('limit', String(args.limit));
      return await fetchApi(`/api/chatgpt/content?${q.toString()}`);
    }

    case 'cultlike_create_content_item':
      return await fetchApi('/api/chatgpt/content', { method: 'POST', body: JSON.stringify(args) });

    case 'cultlike_schedule_content':
      return await fetchApi('/api/chatgpt/content/schedule', { method: 'POST', body: JSON.stringify(args) });

    case 'cultlike_publish_content_item':
      return await fetchApi(`/api/chatgpt/content/${encodeURIComponent(args.id)}/publish`, {
        method: 'POST',
        body: JSON.stringify(args)
      });

    case 'cultlike_list_drive_assets': {
      const q = new URLSearchParams();
      if (args.folder_id) q.set('folder_id', args.folder_id);
      if (args.q) q.set('q', args.q);
      if (args.limit) q.set('limit', String(args.limit));
      return await fetchApi(`/api/chatgpt/content/drive?${q.toString()}`);
    }

    case 'cultlike_import_drive_assets':
      return await fetchApi('/api/chatgpt/content/drive/import', { method: 'POST', body: JSON.stringify(args) });

    case 'cultlike_analyze_content_asset':
      return await fetchApi('/api/chatgpt/content/analyze-asset', { method: 'POST', body: JSON.stringify(args) });

    case 'cultlike_plan_content_sprint':
      return await fetchApi('/api/chatgpt/content/plan-sprint', { method: 'POST', body: JSON.stringify(args) });

    case 'cultlike_sync_google_calendar':
      return await fetchApi('/api/chatgpt/calendar/sync', { method: 'POST' });

    case 'cultlike_get_calendar_events':
      return await fetchApi('/api/chatgpt/calendar/events');

    case 'cultlike_synthesize_project_plan':
      return await fetchApi('/api/chatgpt/synthesize', { method: 'POST', body: JSON.stringify(args) });

    case 'cultlike_list_meetings': {
      const q = new URLSearchParams();
      if (args.search) q.set('search', args.search);
      if (args.limit) q.set('limit', String(args.limit));
      return await fetchApi(`/api/chatgpt/meetings?${q.toString()}`);
    }

    case 'cultlike_get_meeting_detail':
      return await fetchApi(`/api/chatgpt/meetings/${encodeURIComponent(args.id)}`);

    case 'cultlike_convert_meeting_action':
      return await fetchApi(`/api/chatgpt/meetings/${encodeURIComponent(args.id)}/convert-action`, {
        method: 'POST',
        body: JSON.stringify(args)
      });

    case 'cultlike_get_analytics':
      return await fetchApi('/api/chatgpt/analytics');

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// JSON-RPC Stdio Interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  if (!line.trim()) return;

  let request;
  try {
    request = JSON.parse(line);
  } catch (err) {
    console.error('Invalid JSON received:', line);
    return;
  }

  const { id, method, params } = request;

  try {
    if (method === 'initialize') {
      sendResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'cultlike-mcp-server', version: '2.0.0' }
      });
    } else if (method === 'tools/list') {
      sendResponse(id, { tools: TOOLS });
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params;
      const result = await handleToolCall(name, args || {});
      sendResponse(id, {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }
        ]
      });
    } else if (method === 'notifications/initialized') {
      // no-op
    } else {
      sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    sendError(id, -32603, error.message || 'Internal error');
  }
});

function sendResponse(id, result) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, result });
  process.stdout.write(msg + '\n');
}

function sendError(id, code, message) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
  process.stdout.write(msg + '\n');
}
