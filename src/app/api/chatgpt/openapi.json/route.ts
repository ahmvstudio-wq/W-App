import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'CallMy Mgmt AI Chief of Staff API',
      description:
        'Official API for ChatGPT Custom GPT Actions to read and manage tasks, projects, documents, blockers, and daily logs in CallMy Mgmt.',
      version: '1.0.0',
    },
    servers: [
      {
        url: baseUrl,
        description: 'Focus OS Application Server',
      },
    ],
    paths: {
      '/api/chatgpt/overview': {
        get: {
          operationId: 'getWorkspaceOverview',
          summary: 'Get workspace overview',
          description:
            'Fetches a comprehensive workspace snapshot including urgent P0/P1 tasks, active projects, current blockers, and recent daily logs.',
          responses: {
            '200': {
              description: 'Workspace overview fetched successfully.',
            },
          },
        },
      },
      '/api/chatgpt/tasks': {
        get: {
          operationId: 'listTasks',
          summary: 'List and search tasks',
          description: 'Lists tasks with optional filtering by status, priority, project_id, or search keyword.',
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
              schema: {
                type: 'string',
                enum: ['p0', 'p1', 'p2', 'p3'],
              },
              description: 'Filter by priority level (p0 = critical/highest, p3 = low).',
            },
            {
              name: 'project_id',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
              },
              description: 'Filter tasks belonging to a specific project ID.',
            },
            {
              name: 'search',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
              },
              description: 'Search string to match against task title.',
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                default: 50,
              },
              description: 'Maximum number of tasks to return.',
            },
          ],
          responses: {
            '200': {
              description: 'List of tasks.',
            },
          },
        },
        post: {
          operationId: 'createTask',
          summary: 'Create a new task',
          description:
            'Creates a new task in Focus OS. Can specify project_id, priority (p0-p3), time box, and due date.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: {
                      type: 'string',
                      description: 'The title of the task.',
                    },
                    description: {
                      type: 'string',
                      description: 'Detailed description or instructions for the task.',
                    },
                    priority: {
                      type: 'string',
                      enum: ['p0', 'p1', 'p2', 'p3'],
                      default: 'p2',
                      description: 'Priority level: p0 (critical), p1 (high), p2 (medium), p3 (low).',
                    },
                    status: {
                      type: 'string',
                      enum: ['todo', 'in_progress', 'blocked', 'shipped', 'killed'],
                      default: 'todo',
                      description: 'Initial status of the task.',
                    },
                    project_id: {
                      type: 'string',
                      description: 'Optional UUID of the project this task belongs to.',
                    },
                    due_date: {
                      type: 'string',
                      format: 'date-time',
                      description: 'ISO 8601 due date for the task.',
                    },
                    time_box_minutes: {
                      type: 'integer',
                      default: 60,
                      description: 'Estimated focus time box in minutes.',
                    },
                    output_description: {
                      type: 'string',
                      description: 'Clear definition of what output constitutes completion.',
                    },
                    blocked_reason: {
                      type: 'string',
                      description: 'If status is blocked, explain the blocker.',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Task created successfully.',
            },
          },
        },
        patch: {
          operationId: 'updateTask',
          summary: 'Update a task',
          description: 'Updates a task by providing the task ID in the request body.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['id'],
                  properties: {
                    id: {
                      type: 'string',
                      description: 'The UUID of the task to update.',
                    },
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
            '200': {
              description: 'Task updated successfully.',
            },
          },
        },
      },
      '/api/chatgpt/tasks/{id}': {
        get: {
          operationId: 'getTaskById',
          summary: 'Get task by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'UUID of the task.',
            },
          ],
          responses: {
            '200': { description: 'Task details.' },
          },
        },
        patch: {
          operationId: 'updateTaskById',
          summary: 'Update task by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'UUID of the task.',
            },
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
          responses: {
            '200': { description: 'Task updated successfully.' },
          },
        },
        delete: {
          operationId: 'deleteTaskById',
          summary: 'Delete task by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'UUID of the task to delete.',
            },
          ],
          responses: {
            '200': { description: 'Task deleted successfully.' },
          },
        },
      },
      '/api/chatgpt/projects': {
        get: {
          operationId: 'listProjects',
          summary: 'List projects',
          description: 'Lists all projects with their task progress and status.',
          parameters: [
            {
              name: 'status',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['active', 'paused', 'killed', 'shipped'],
              },
              description: 'Filter by project status.',
            },
            {
              name: 'priority',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['p0', 'p1', 'p2', 'p3'],
              },
            },
            {
              name: 'search',
              in: 'query',
              required: false,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'List of projects.' },
          },
        },
        post: {
          operationId: 'createProject',
          summary: 'Create a new project',
          description: 'Creates a new project in Focus OS.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', description: 'Name of the project.' },
                    description: { type: 'string', description: 'Description of the project.' },
                    status: {
                      type: 'string',
                      enum: ['active', 'paused', 'killed', 'shipped'],
                      default: 'active',
                    },
                    priority: {
                      type: 'string',
                      enum: ['p0', 'p1', 'p2', 'p3'],
                      default: 'p1',
                    },
                    deadline: { type: 'string', format: 'date-time', description: 'Deadline ISO date.' },
                    success_metric: { type: 'string', description: 'What defines success for this project?' },
                    kill_condition: { type: 'string', description: 'When should this project be killed/abandoned?' },
                    min_shippable_version: { type: 'string', description: 'Minimum viable shippable scope.' },
                    color: { type: 'string', default: '#c8f135' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Project created successfully.' },
          },
        },
      },
      '/api/chatgpt/projects/{id}': {
        get: {
          operationId: 'getProjectById',
          summary: 'Get project by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Project details.' },
          },
        },
        patch: {
          operationId: 'updateProjectById',
          summary: 'Update project by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
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
                    color: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Project updated successfully.' },
          },
        },
        delete: {
          operationId: 'deleteProjectById',
          summary: 'Delete project by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Project deleted successfully.' },
          },
        },
      },
      '/api/chatgpt/documents': {
        get: {
          operationId: 'listDocuments',
          summary: 'List documents',
          parameters: [
            {
              name: 'project_id',
              in: 'query',
              required: false,
              schema: { type: 'string' },
            },
            {
              name: 'search',
              in: 'query',
              required: false,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'List of documents.' },
          },
        },
        post: {
          operationId: 'createDocument',
          summary: 'Create document or note',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string', description: 'Title of the document.' },
                    content: { type: 'string', description: 'Plain text or markdown content of the document.' },
                    project_id: { type: 'string', description: 'Optional project ID link.' },
                    status: {
                      type: 'string',
                      enum: ['live', 'reference', 'archive', 'delete'],
                      default: 'live',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Document created successfully.' },
          },
        },
      },
      '/api/chatgpt/daily-logs': {
        get: {
          operationId: 'listDailyLogs',
          summary: 'Get recent daily logs',
          responses: {
            '200': { description: 'Recent daily logs.' },
          },
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
                    date: { type: 'string', format: 'date', description: 'YYYY-MM-DD date' },
                    notes: { type: 'string', description: 'Daily summary notes or morning brief.' },
                    tomorrows_priority: { type: 'string', description: 'The top priority for tomorrow.' },
                    tasks_shipped: { type: 'integer' },
                    tasks_created: { type: 'integer' },
                    blockers_resolved: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Daily log saved successfully.' },
          },
        },
      },
    },
    components: {
      schemas: {},
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
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
