export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'cultlike.ahmvsystems.com'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'Cultlike OS Executive Operating System API (Complete ChatGPT & Claude Connector Suite)',
      description:
        'Comprehensive, full-permission API & Tool Manifest for ChatGPT Plugins, Custom GPTs, Claude Connectors, and MCP Agents to orchestrate workspace initiatives, sprint tasks, meeting intelligence, Google Drive & Calendar workflows, viral content asset analysis, and multi-channel publishing (YouTube & Instagram).',
      version: '2.0.0',
    },
    servers: [
      {
        url: baseUrl,
        description: 'Cultlike OS Production Server',
      },
    ],
    paths: {
      '/api/chatgpt/overview': {
        get: {
          operationId: 'getWorkspaceOverview',
          summary: 'Get workspace executive briefing',
          description:
            'Fetches an executive workspace snapshot including urgent P0/P1 tasks, active projects, current blockers, velocity, and recent daily logs.',
          responses: {
            '200': { description: 'Workspace overview fetched successfully.' },
          },
        },
      },
      '/api/chatgpt/tasks': {
        get: {
          operationId: 'listTasks',
          summary: 'List and search tasks',
          description: 'Lists tasks with optional filtering by status, priority, project_id, date, or search keyword.',
          parameters: [
            {
              name: 'status',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['todo', 'in_progress', 'blocked', 'shipped', 'killed', 'active'],
              },
              description: 'Filter by task status. "active" includes todo, in_progress, and blocked.',
            },
            {
              name: 'priority',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] },
              description: 'Filter by priority level (p0 = critical/highest, p3 = low).',
            },
            {
              name: 'project_id',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Filter tasks belonging to a specific project UUID.',
            },
            {
              name: 'search',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Search string to match against task title.',
            },
            {
              name: 'date',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Filter tasks on a specific date (YYYY-MM-DD).',
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'integer', default: 50 },
            },
          ],
          responses: {
            '200': { description: 'List of tasks.' },
          },
        },
        post: {
          operationId: 'createTask',
          summary: 'Create a new task',
          description: 'Creates a new sprint task in Cultlike OS with priority, timebox, and project attachments.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string', description: 'The title of the task.' },
                    description: { type: 'string', description: 'Detailed instructions or context.' },
                    priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'], default: 'p2' },
                    status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'shipped', 'killed'], default: 'todo' },
                    project_id: { type: 'string', description: 'Optional UUID of the project.' },
                    due_date: { type: 'string', format: 'date-time', description: 'ISO 8601 due date.' },
                    time_box_minutes: { type: 'integer', default: 45, description: 'Estimated focus timebox in minutes.' },
                    output_description: { type: 'string', description: 'Definition of done.' },
                    blocked_reason: { type: 'string', description: 'If blocked, explain reason.' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Task created successfully.' },
          },
        },
        patch: {
          operationId: 'updateTask',
          summary: 'Update a task',
          description: 'Updates a task providing the task ID in the request body.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['id'],
                  properties: {
                    id: { type: 'string', description: 'UUID of the task.' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] },
                    status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'shipped', 'killed'] },
                    project_id: { type: 'string' },
                    due_date: { type: 'string', format: 'date-time' },
                    time_box_minutes: { type: 'integer' },
                    output_description: { type: 'string' },
                    blocked_reason: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Task updated successfully.' },
          },
        },
      },
      '/api/chatgpt/tasks/{id}': {
        get: {
          operationId: 'getTaskById',
          summary: 'Get task by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Task details.' } },
        },
        patch: {
          operationId: 'updateTaskById',
          summary: 'Update task by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] },
                    status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'shipped', 'killed'] },
                    project_id: { type: 'string' },
                    due_date: { type: 'string', format: 'date-time' },
                    time_box_minutes: { type: 'integer' },
                    output_description: { type: 'string' },
                    blocked_reason: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Task updated successfully.' } },
        },
        delete: {
          operationId: 'deleteTaskById',
          summary: 'Delete task by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Task deleted successfully.' } },
        },
      },
      '/api/chatgpt/tasks/microtasks': {
        post: {
          operationId: 'generateMicrotasks',
          summary: 'Decompose task into executable microtasks',
          description: 'Uses intelligence engine to break down any complex task into 3-5 sequenced micro-deliverables with clear timeboxes.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'Optional task UUID.' },
                    title: { type: 'string', description: 'Task title to break down.' },
                    description: { type: 'string', description: 'Context or background.' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'List of microtasks generated.' } },
        },
      },
      '/api/chatgpt/projects': {
        get: {
          operationId: 'listProjects',
          summary: 'List projects',
          description: 'Lists all initiatives with completion rate and task progress.',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'paused', 'killed', 'shipped'] } },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'List of projects.' } },
        },
        post: {
          operationId: 'createProject',
          summary: 'Create a new project',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'paused', 'killed', 'shipped'], default: 'active' },
                    priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'], default: 'p1' },
                    deadline: { type: 'string', format: 'date-time' },
                    success_metric: { type: 'string' },
                    kill_condition: { type: 'string' },
                    min_shippable_version: { type: 'string' },
                    color: { type: 'string', default: '#c8f135' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Project created successfully.' } },
        },
      },
      '/api/chatgpt/projects/{id}': {
        get: {
          operationId: 'getProjectById',
          summary: 'Get project by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Project details.' } },
        },
        patch: {
          operationId: 'updateProjectById',
          summary: 'Update project by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'paused', 'killed', 'shipped'] },
                    priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'] },
                    deadline: { type: 'string', format: 'date-time' },
                    success_metric: { type: 'string' },
                    kill_condition: { type: 'string' },
                    min_shippable_version: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Project updated successfully.' } },
        },
        delete: {
          operationId: 'deleteProjectById',
          summary: 'Delete project by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Project deleted successfully.' } },
        },
      },
      '/api/chatgpt/documents': {
        get: {
          operationId: 'listDocuments',
          summary: 'List documents & memos',
          parameters: [
            { name: 'project_id', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'List of documents.' } },
        },
        post: {
          operationId: 'createDocument',
          summary: 'Create document or strategy memo',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string', description: 'Plain text or markdown content.' },
                    project_id: { type: 'string' },
                    status: { type: 'string', enum: ['live', 'reference', 'archive', 'delete'], default: 'live' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Document created successfully.' } },
        },
      },
      '/api/chatgpt/documents/{id}': {
        get: {
          operationId: 'getDocumentById',
          summary: 'Get document by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Document details.' } },
        },
        patch: {
          operationId: 'updateDocumentById',
          summary: 'Update document by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    status: { type: 'string', enum: ['live', 'reference', 'archive', 'delete'] },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Document updated successfully.' } },
        },
        delete: {
          operationId: 'deleteDocumentById',
          summary: 'Delete document by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Document deleted successfully.' } },
        },
      },
      '/api/chatgpt/daily-logs': {
        get: {
          operationId: 'listDailyLogs',
          summary: 'Get recent daily recap logs',
          responses: { '200': { description: 'Recent daily logs.' } },
        },
        post: {
          operationId: 'saveDailyLog',
          summary: 'Save or update daily recap log',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', format: 'date' },
                    notes: { type: 'string' },
                    tomorrows_priority: { type: 'string' },
                    tasks_shipped: { type: 'integer' },
                    tasks_created: { type: 'integer' },
                    blockers_resolved: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Daily log saved successfully.' } },
        },
      },
      '/api/chatgpt/analytics': {
        get: {
          operationId: 'getWorkspaceAnalytics',
          summary: 'Get execution velocity & sprint analytics',
          responses: { '200': { description: 'Analytics and velocity trends.' } },
        },
      },
      '/api/chatgpt/meetings': {
        get: {
          operationId: 'listMeetings',
          summary: 'List and search Fathom video meetings',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'date', in: 'query', schema: { type: 'string' } },
            { name: 'attendee', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 25 } },
          ],
          responses: { '200': { description: 'List of meetings.' } },
        },
      },
      '/api/chatgpt/meetings/{id}': {
        get: {
          operationId: 'getMeetingDetail',
          summary: 'Get Fathom meeting summary & transcript',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Meeting recording details, summary, and transcript.' } },
        },
      },
      '/api/chatgpt/meetings/{id}/convert-action': {
        post: {
          operationId: 'convertMeetingActionToTask',
          summary: 'Convert meeting takeaway to task',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string' },
                    assignee: { type: 'string' },
                    priority: { type: 'string', enum: ['p0', 'p1', 'p2', 'p3'], default: 'p1' },
                    project_id: { type: 'string' },
                    due_date: { type: 'string', format: 'date-time' },
                    time_box_minutes: { type: 'integer', default: 45 },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Action item converted to task successfully.' } },
        },
      },
      '/api/chatgpt/content': {
        get: {
          operationId: 'getContentVault',
          summary: 'List staged and scheduled content in vault',
          parameters: [
            { name: 'platform', in: 'query', schema: { type: 'string', enum: ['all', 'youtube', 'instagram'] } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['all', 'draft', 'inbox', 'scheduled', 'published'] } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 30 } },
          ],
          responses: { '200': { description: 'Content deliverables.' } },
        },
        post: {
          operationId: 'createContentItem',
          summary: 'Stage new content deliverable in vault',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string' },
                    caption: { type: 'string' },
                    platform: { type: 'string', enum: ['youtube', 'instagram'], default: 'youtube' },
                    content_type: { type: 'string', enum: ['video', 'short', 'reel', 'post', 'carousel'], default: 'video' },
                    status: { type: 'string', enum: ['draft', 'inbox', 'scheduled'], default: 'draft' },
                    scheduled_at: { type: 'string', format: 'date-time' },
                    media_urls: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Content item created.' } },
        },
      },
      '/api/chatgpt/content/schedule': {
        post: {
          operationId: 'scheduleContent',
          summary: 'Schedule content deliverable for automated release',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['id', 'scheduled_at'],
                  properties: {
                    id: { type: 'string' },
                    scheduled_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Content scheduled.' } },
        },
      },
      '/api/chatgpt/content/{id}/publish': {
        post: {
          operationId: 'publishContentItem',
          summary: 'Immediately publish deliverable to YouTube or Instagram',
          description: 'Triggers direct 1-click publishing of a Content Vault asset to YouTube (Video/Short) or Instagram (Reel/Carousel).',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    platform: { type: 'string', enum: ['youtube', 'instagram'] },
                    title: { type: 'string' },
                    caption: { type: 'string' },
                    privacy_status: { type: 'string', enum: ['public', 'unlisted', 'private'], default: 'public' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Deliverable published successfully.' } },
        },
      },
      '/api/chatgpt/content/drive': {
        get: {
          operationId: 'listDriveVideoAssets',
          summary: 'List video exports on Google Drive',
          parameters: [
            { name: 'folder_id', in: 'query', schema: { type: 'string' } },
            { name: 'q', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 30 } },
          ],
          responses: { '200': { description: 'Google Drive video files.' } },
        },
      },
      '/api/chatgpt/content/drive/import': {
        post: {
          operationId: 'importDriveVideoAssets',
          summary: 'Import video assets from Google Drive into Content Vault',
          description: 'Imports one or more video files discovered on Google Drive directly into the private Content Vault ready for scheduling.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
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
                          name: { type: 'string' },
                          webContentLink: { type: 'string' },
                          webViewLink: { type: 'string' },
                          thumbnailUrl: { type: 'string' },
                          durationSeconds: { type: 'integer' },
                          size: { type: 'integer' },
                          platform: { type: 'string', enum: ['youtube', 'instagram'] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Assets imported successfully.' } },
        },
      },
      '/api/chatgpt/content/analyze-asset': {
        post: {
          operationId: 'analyzeContentAsset',
          summary: 'AI viral hook, caption & schedule optimization',
          description: 'Runs AI analysis on a video title/transcript to extract 3 viral scroll-stopping hooks, platform-optimized captions for Instagram and YouTube, and optimal posting time windows.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'UUID of the vault deliverable.' },
                    title: { type: 'string', description: 'Deliverable title.' },
                    transcript: { type: 'string' },
                    notes: { type: 'string' },
                    platform: { type: 'string', enum: ['youtube', 'instagram'], default: 'instagram' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Viral analysis generated.' } },
        },
      },
      '/api/chatgpt/content/plan-sprint': {
        post: {
          operationId: 'planContentSprint',
          summary: 'Auto-schedule assets into a 14/30 day distribution sprint',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sprint_days: { type: 'integer', default: 14 },
                    items_per_day: { type: 'integer', default: 1 },
                    platforms: { type: 'array', items: { type: 'string', enum: ['instagram', 'youtube'] } },
                    start_date: { type: 'string', format: 'date' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Content sprint scheduled.' } },
        },
      },
      '/api/chatgpt/content/analytics': {
        get: {
          operationId: 'getContentAnalytics',
          summary: 'Get multi-channel content reach & performance',
          responses: { '200': { description: 'Content metrics.' } },
        },
      },
      '/api/chatgpt/calendar/sync': {
        post: {
          operationId: 'syncTasksToGoogleCalendar',
          summary: 'Trigger two-way task sync to Google Calendar',
          description: 'Synchronizes all active P0/P1 tasks, deadlines, and focus timeboxes to the user Google Calendar.',
          responses: { '200': { description: 'Calendar sync completed.' } },
        },
      },
      '/api/chatgpt/calendar/events': {
        get: {
          operationId: 'getGoogleCalendarEvents',
          summary: 'Fetch upcoming Google Calendar schedule & events',
          responses: { '200': { description: 'Calendar events.' } },
        },
      },
      '/api/chatgpt/synthesize': {
        post: {
          operationId: 'synthesizeProjectPlan',
          summary: 'Synthesize brain dump into phased projects and tasks',
          description: 'Translates a natural language directive or brain dump into an executive plan with phases and actionable tasks, with optional auto-commit.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['text'],
                  properties: {
                    text: { type: 'string', description: 'Raw natural language thoughts or directive.' },
                    auto_commit: { type: 'boolean', default: false, description: 'If true, automatically creates the project and tasks in DB.' },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Synthesized plan.' } },
        },
      },
      '/api/chatgpt/workspaces': {
        get: {
          operationId: 'listWorkspaces',
          summary: 'List user workspaces & organization context',
          responses: { '200': { description: 'Workspaces details.' } },
        },
      },
    },
    components: {
      schemas: {},
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Provide your API Key or OAuth 2.0 access token.'
        },
        OAuth2Auth: {
          type: 'oauth2',
          description: 'Cultlike OS native OAuth 2.0 authorization code flow for 1-click connectors.',
          flows: {
            authorizationCode: {
              authorizationUrl: `${baseUrl}/api/oauth/authorize`,
              tokenUrl: `${baseUrl}/api/oauth/token`,
              scopes: {
                read: 'Read workspace tasks, projects, meeting intelligence, and content deliverables',
                write: 'Create, modify, schedule, and publish deliverables, projects, and sprint tasks'
              }
            }
          }
        }
      },
    },
    security: [
      { BearerAuth: [] },
      { OAuth2Auth: ['read', 'write'] }
    ],
  }

  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    },
  })
}
