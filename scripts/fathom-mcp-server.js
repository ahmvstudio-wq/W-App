#!/usr/bin/env node

/**
 * Fathom Video AI - Model Context Protocol (MCP) Server
 * Transport: stdio (JSON-RPC 2.0)
 * 
 * Exposes Fathom meeting recordings, summaries, action items, and transcripts
 * to AI models and assistants (Antigravity, Claude Desktop, Cursor, etc.).
 */

const readline = require('readline');

const API_KEY = process.env.FATHOM_API_KEY || 'VB4MPQZrn0K7K_hFiXCsRg.mfJeDGKBdb_HZwMgjmgfa_eI_Ultt1J3SGJuN1h2VKY';
const BASE_URL = 'https://api.fathom.ai/external/v1';

async function fetchFathom(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'X-Api-Key': API_KEY,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Fathom API error (${res.status}): ${errorText}`);
  }
  return res.json();
}

const TOOLS = [
  {
    name: 'fathom_list_meetings',
    description: 'List historical meeting recordings from Fathom with attendee information, call duration, and recording IDs.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of meetings to return (default 20, max 100)'
        },
        cursor: {
          type: 'string',
          description: 'Pagination cursor for fetching the next page of meetings'
        }
      }
    }
  },
  {
    name: 'fathom_search_meetings',
    description: 'Search meetings by title, attendee name, or keyword across all recordings.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword, topic, or attendee name'
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default 10)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'fathom_get_recording_summary',
    description: 'Fetch the direct Fathom AI markdown summary and extracted next steps/action items for a specific meeting recording ID.',
    inputSchema: {
      type: 'object',
      properties: {
        recording_id: {
          type: 'string',
          description: 'The numeric or string Fathom recording ID (e.g. "178763522")'
        }
      },
      required: ['recording_id']
    }
  },
  {
    name: 'fathom_get_transcript',
    description: 'Fetch the verbatim transcript with speaker labels and timestamps for a specific recording ID.',
    inputSchema: {
      type: 'object',
      properties: {
        recording_id: {
          type: 'string',
          description: 'The numeric or string Fathom recording ID'
        }
      },
      required: ['recording_id']
    }
  }
];

async function handleToolCall(name, args) {
  switch (name) {
    case 'fathom_list_meetings': {
      const limit = Math.min(args.limit || 20, 100);
      let path = `/meetings`;
      if (args.cursor) {
        path += `?cursor=${encodeURIComponent(args.cursor)}`;
      }
      const data = await fetchFathom(path);
      const items = (data.items || []).slice(0, limit).map(item => ({
        id: item.recording_id,
        title: item.meeting_title || item.title,
        date: item.recording_start_time || item.created_at,
        duration_minutes: item.recording_end_time && item.recording_start_time
          ? Math.round((new Date(item.recording_end_time) - new Date(item.recording_start_time)) / 60000)
          : null,
        url: item.url,
        attendees: [
          ...(item.recorded_by ? [item.recorded_by.name || item.recorded_by.email] : []),
          ...(Array.isArray(item.calendar_invitees) ? item.calendar_invitees.map(i => i.name || i.email) : [])
        ]
      }));

      return {
        total_in_batch: items.length,
        next_cursor: data.next_cursor || null,
        meetings: items
      };
    }

    case 'fathom_search_meetings': {
      const q = (args.query || '').toLowerCase();
      const limit = args.limit || 10;
      
      let allItems = [];
      let cursor = null;
      let pages = 0;
      while (pages < 5) {
        const path = cursor ? `/meetings?cursor=${encodeURIComponent(cursor)}` : '/meetings';
        const data = await fetchFathom(path);
        allItems = allItems.concat(data.items || []);
        if (!data.next_cursor || (data.items || []).length === 0) break;
        cursor = data.next_cursor;
        pages++;
      }

      const matched = allItems.filter(item => {
        const title = (item.meeting_title || item.title || '').toLowerCase();
        const attendees = [
          ...(item.recorded_by ? [item.recorded_by.name, item.recorded_by.email] : []),
          ...(Array.isArray(item.calendar_invitees) ? item.calendar_invitees.flatMap(i => [i.name, i.email]) : [])
        ].filter(Boolean).join(' ').toLowerCase();
        return title.includes(q) || attendees.includes(q);
      }).slice(0, limit).map(item => ({
        id: item.recording_id,
        title: item.meeting_title || item.title,
        date: item.recording_start_time || item.created_at,
        url: item.url
      }));

      return {
        query: args.query,
        count: matched.length,
        results: matched
      };
    }

    case 'fathom_get_recording_summary': {
      const recordingId = args.recording_id;
      const data = await fetchFathom(`/recordings/${recordingId}/summary`);
      return {
        recording_id: recordingId,
        summary_markdown: data.summary?.markdown_formatted || 'No summary available for this recording.'
      };
    }

    case 'fathom_get_transcript': {
      const recordingId = args.recording_id;
      const data = await fetchFathom(`/recordings/${recordingId}/transcript`);
      const lines = Array.isArray(data.transcript) ? data.transcript.map(t => ({
        speaker: t.speaker?.display_name || t.speaker?.name || 'Speaker',
        timestamp: t.timestamp || '00:00',
        text: t.text || ''
      })) : [];
      return {
        recording_id: recordingId,
        line_count: lines.length,
        transcript: lines
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// JSON-RPC stdio reader
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function sendResponse(response) {
  process.stdout.write(JSON.stringify(response) + '\n');
}

rl.on('line', async (line) => {
  if (!line.trim()) return;
  let message;
  try {
    message = JSON.parse(line);
  } catch (err) {
    sendResponse({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' }
    });
    return;
  }

  const { id, method, params } = message;

  try {
    switch (method) {
      case 'initialize':
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'fathom-mcp-server',
              version: '1.0.0'
            }
          }
        });
        break;

      case 'notifications/initialized':
        // Client ack, no response
        break;

      case 'ping':
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {}
        });
        break;

      case 'tools/list':
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            tools: TOOLS
          }
        });
        break;

      case 'tools/call': {
        const { name, arguments: toolArgs } = params || {};
        const result = await handleToolCall(name, toolArgs || {});
        sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        });
        break;
      }

      default:
        if (id !== undefined) {
          sendResponse({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method not found: ${method}` }
          });
        }
        break;
    }
  } catch (err) {
    if (id !== undefined) {
      sendResponse({
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err.message || 'Internal error' }
      });
    }
  }
});
