-- FOCUS OS Database Schema (REPAIR & EXPANSION)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DROP EXISTING TABLES (CAREFUL)
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- WORKSPACES
CREATE TABLE workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PROJECTS
CREATE TABLE projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active','paused','killed','shipped')),
  owner_id uuid REFERENCES auth.users(id),
  success_metric text,
  kill_condition text,
  min_shippable_version text,
  priority text DEFAULT 'p1' CHECK (priority IN ('p0','p1','p2','p3')),
  deadline timestamptz,
  whiteboard_state jsonb DEFAULT '{"nodes":[],"edges":[]}',
  whiteboard_updated_at timestamptz,
  color text DEFAULT '#c8f135',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TASKS
CREATE TABLE tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'todo' CHECK (status IN ('todo','in_progress','blocked','shipped','killed')),
  priority text DEFAULT 'p2' CHECK (priority IN ('p0','p1','p2','p3')),
  time_box_minutes integer DEFAULT 60,
  started_at timestamptz,
  completed_at timestamptz,
  due_date timestamptz,
  output_description text,
  blocked_reason text,
  blocked_by_task_id uuid REFERENCES tasks(id),
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ASSETS
CREATE TABLE assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id),
  task_id uuid REFERENCES tasks(id),
  name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  file_type text,
  mime_type text,
  url text,
  thumbnail_url text,
  tags text[] DEFAULT '{}',
  description text,
  width integer,
  height integer,
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

-- DOCUMENTS
CREATE TABLE documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id),
  title text NOT NULL DEFAULT 'Untitled',
  content jsonb DEFAULT '{}',
  owner_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'live' CHECK (status IN ('live','reference','archive','delete')),
  last_opened_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CALENDAR EVENTS
CREATE TABLE calendar_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id),
  task_id uuid REFERENCES tasks(id),
  owner_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  color text DEFAULT '#c8f135',
  event_type text DEFAULT 'event' CHECK (event_type IN ('event','deadline','milestone','meeting')),
  attendees jsonb DEFAULT '[]',
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- MEETINGS
CREATE TABLE meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id),
  title text NOT NULL,
  decision_to_make text,
  owner_id uuid REFERENCES auth.users(id),
  attendees jsonb DEFAULT '[]',
  scheduled_at timestamptz,
  duration_minutes integer DEFAULT 25,
  decision_reached boolean DEFAULT false,
  decision_text text,
  passed_gate boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- DAILY LOGS
CREATE TABLE daily_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id),
  date date DEFAULT CURRENT_DATE,
  tasks_shipped integer DEFAULT 0,
  tasks_created integer DEFAULT 0,
  blockers_resolved integer DEFAULT 0,
  notes text,
  tomorrows_priority text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- USER PROFILES
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text,
  avatar_url text,
  workspace_id uuid,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FOCUS SESSIONS
CREATE TABLE focus_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  mode text DEFAULT 'freeform' CHECK (mode IN ('freeform','task','pomodoro')),
  target_minutes integer NOT NULL DEFAULT 25,
  duration_minutes integer,
  completed boolean DEFAULT false,
  interrupted boolean DEFAULT false,
  interruption_reason text,
  notes text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- DISABLE RLS ON ALL TABLES FOR NOW
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions DISABLE ROW LEVEL SECURITY;

-- PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SYNC EXISTING USERS TO PROFILES (Safety)
INSERT INTO profiles (id, name, avatar_url)
SELECT id, COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
