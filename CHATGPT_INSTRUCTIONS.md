# ChatGPT Custom GPT Configuration Guide

This guide enables you to connect or update your Custom GPT in OpenAI's ChatGPT to interact directly with your **Focus Executive OS / Workspace** with all newly supported capabilities:
- 🎙️ **Fathom AI Meetings**: Query all 111+ historical meeting recordings, search by attendee or keyword, read native summaries and verbatim transcripts.
- ⚡ **Meeting Action-Item Conversion**: Convert any meeting takeaway or action item directly into a tracked workspace task with assignees and deadlines.
- 📊 **Real-time Sprint & Execution Analytics**: Query sprint health, completion rate %, velocity trends, focus hours, and project breakdown.
- 📅 **Point-in-Time Historical State & Date Range Filtering**: Review exact task states on any given day or date window.
- 📁 **CSV Task Export**: Request raw CSV data formatted for spreadsheets directly from ChatGPT.
- 🎯 **Task & Project Management**: Create, update, re-prioritize, and ship tasks.

---

## 1. Quick Setup in ChatGPT GPT Builder

1. Go to [ChatGPT](https://chatgpt.com) -> Click your profile/workspace -> **Explore GPTs** -> **Create a GPT** (or edit your existing Focus OS GPT).
2. Go to the **Configure** tab.
3. Fill in the Name, Description, and Instructions (see [Section 2](#2-recommended-custom-gpt-instructions) below).
4. Under **Actions**, click **Create new action** (or edit your existing action).
5. In the **Schema** box:
   - Click **Import from URL** and enter:
     ```
     https://your-domain.com/api/chatgpt/openapi.json
     ```
     *(Or copy-paste the entire contents of [`public/chatgpt-openapi.json`](file:///public/chatgpt-openapi.json) directly into the Schema field).*
6. Under **Authentication**:
   - **Authentication Type**: `API Key`
   - **Auth Type**: `Bearer`
   - **API Key**: `focus_sk_live_9a7d3f82e1c4b6e5` *(or your configured `CHATGPT_API_KEY`)*
7. Click **Save** / **Update** (Top Right) -> Select "Only me" or "Anyone with a link".

---

## 2. Recommended Custom GPT Instructions

Copy and paste the following into the **Instructions** box of your Custom GPT:

```markdown
You are the Executive Chief of Staff for the user's workspace ("Focus OS").
You have direct read/write API access to their live workspace database, tasks, projects, execution analytics, and Fathom AI meeting records.

### Core Capabilities:
1. **Fathom Meetings & Transcripts**:
   - Use `getMeetings` to search recordings by keyword, date (`YYYY-MM-DD`), or attendee.
   - Use `getMeetingDetail` to inspect full Fathom AI summaries, key takeaways, action items, and verbatim timestamped transcripts.
   - Use `convertMeetingActionToTask` to convert any meeting action item or takeaway into a real task in the workspace.
2. **Execution Analytics & Velocity**:
   - Use `getAnalytics` to check sprint completion rate (%), focus hours, 7-day velocity trend, and project velocity.
   - Use `getWorkspaceOverview` for high-level dashboard summaries.
3. **Tasks & Point-in-Time History**:
   - Use `getTasks` to list tasks, filter by priority (`p0`, `p1`, `p2`), status (`todo`, `in_progress`, `shipped`, `killed`), or project.
   - To see what the workspace looked like on a specific past date, pass `date="YYYY-MM-DD"`.
   - To export tasks as a spreadsheet, pass `format="csv"`.
   - Use `createTask`, `updateTask`, or `updateTaskStatus` to manage tasks directly.
4. **Projects & Logs**:
   - Use `getProjects` and `createProject` to supervise strategic initiatives.
   - Use `getDailyLogs` and `createDailyLog` for standup logs and retro notes.

### Operating Rules:
- Always be proactive, concise, and structured. Use Markdown tables, bullet points, and clean headers.
- When the user asks about a meeting (e.g. "What did we agree with client X?"), query `getMeetings`, retrieve the details with `getMeetingDetail`, and summarize the key decisions and action items.
- When relevant, ask if the user wants meeting action items converted into workspace tasks.
- When asked for sprint health or progress, use `getAnalytics` to cite exact figures: completion percentage, shipped count, and velocity trend.
```

---

## 3. Example Prompts to Test

### 🎙️ Fathom Meetings
- *"What meetings did I have recently? Show me the attendees and durations."*
- *"Search my Fathom calls for 'onboarding' and show me the key takeaways."*
- *"Summarize recording #112 and list all action items with owners."*
- *"Take the action item 'Prepare pitch deck for Tuesday' from that call and turn it into a P1 task due next Monday."*

### 📊 Sprint Analytics & Velocity
- *"How is our current sprint health looking? What is our completion rate?"*
- *"Give me our 7-day task velocity breakdown."*
- *"Which projects have the highest number of active tasks?"*

### 📅 Point-in-Time History & CSV
- *"What did my active tasks look like on September 3rd?"*
- *"Give me a CSV export of all shipped tasks from the last 2 weeks."*

### 🎯 Task & Project Operations
- *"Create a P0 task 'Finalize Q4 roadmap review' under the Core Platform project with a 60-minute timebox."*
- *"Mark task 'Update ChatGPT scripts' as shipped."*

---

## 4. API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/chatgpt/overview` | `GET` | Snapshot of projects, tasks, recent daily logs, sprint %, recent Fathom calls |
| `/api/chatgpt/analytics` | `GET` | Sprint health, completion rate %, velocity trends, focus hours, priority breakdown |
| `/api/chatgpt/meetings` | `GET` | List & search Fathom meetings (filters: `search`, `date`, `attendee`, `limit`) |
| `/api/chatgpt/meetings/{id}` | `GET` | Meeting detail: AI summary, action items with assignees, verbatim transcript |
| `/api/chatgpt/meetings/{id}/convert-action` | `POST` | Convert meeting action item to a workspace task |
| `/api/chatgpt/tasks` | `GET` | Fetch tasks (filters: `status`, `priority`, `project_id`, `date`, `date_from`, `date_to`, `format=csv`) |
| `/api/chatgpt/tasks` | `POST` | Create a new task |
| `/api/chatgpt/tasks/{id}` | `PATCH` | Update task title, description, priority, deadline, status |
| `/api/chatgpt/tasks/{id}/status` | `POST` | Quick status transition (`todo`, `in_progress`, `shipped`, `killed`) |
| `/api/chatgpt/projects` | `GET`, `POST` | List and create workspace projects |
| `/api/chatgpt/daily-logs` | `GET`, `POST` | View and create daily standup logs |
| `/api/chatgpt/synthesize` | `POST` | Synthesize notes or transcripts with workspace AI |
| `/api/chatgpt/openapi.json` | `GET` | Dynamic OpenAPI 3.1.0 specification |
