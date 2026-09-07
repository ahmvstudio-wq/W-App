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
DROP TABLE IF EXISTS focus_sessions CASCADE;

-- USER PROFILES (Must be first for other tables to reference)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text,
  avatar_url text,
  workspace_id uuid,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- WORKSPACES
CREATE TABLE workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- WORKSPACE MEMBERS
CREATE TABLE workspace_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')) NOT NULL,
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, user_id)
);

-- WORKSPACE INVITES
CREATE TABLE workspace_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')) NOT NULL,
  token text UNIQUE NOT NULL,
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days') NOT NULL
);

-- PROJECTS
CREATE TABLE projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active','paused','killed','shipped')),
  owner_id uuid REFERENCES profiles(id),
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
  owner_id uuid REFERENCES profiles(id),
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
  start_time timestamptz,
  end_time timestamptz,
  all_day boolean DEFAULT false,
  event_type text DEFAULT 'task' CHECK (event_type IN ('task','event','deadline','milestone','meeting')),
  attendees jsonb DEFAULT '[]',
  location text,
  color text DEFAULT '#c8f135',
  linked_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ASSETS
CREATE TABLE assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES profiles(id),
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
  owner_id uuid REFERENCES profiles(id),
  status text DEFAULT 'live' CHECK (status IN ('live','reference','archive','delete')),
  last_opened_at timestamptz DEFAULT now(),
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
  owner_id uuid REFERENCES profiles(id),
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
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
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

-- FOCUS SESSIONS
CREATE TABLE focus_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
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

-- ENABLE RLS ON ALL ACTIVE TABLES
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- HELPER SECURITY DEFINER FUNCTIONS (Prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid)
RETURNS boolean AS $$
BEGIN
  IF ws_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = ws_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_workspace_user_role(ws_id uuid)
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  IF ws_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM public.workspaces WHERE id = ws_id AND owner_id = auth.uid()) THEN
    RETURN 'owner';
  END IF;

  SELECT role INTO v_role
  FROM public.workspace_members
  WHERE workspace_id = ws_id AND user_id = auth.uid()
  LIMIT 1;

  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- CREATE RLS SECURITY POLICIES

-- profiles
CREATE POLICY "Allow authenticated read of profiles" ON profiles 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow user to update own profile" ON profiles 
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow user to insert own profile" ON profiles 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- workspaces
CREATE POLICY "Members can view workspace" ON workspaces 
  FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_workspace_member(id));
CREATE POLICY "Owners and admins can update workspace" ON workspaces 
  FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.get_workspace_user_role(id) IN ('owner', 'admin')) WITH CHECK (owner_id = auth.uid() OR public.get_workspace_user_role(id) IN ('owner', 'admin'));
CREATE POLICY "Authenticated users can create workspaces" ON workspaces 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

-- workspace_members
CREATE POLICY "Members can view workspace membership" ON workspace_members
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_workspace_member(workspace_id));
CREATE POLICY "Owners and admins can manage members" ON workspace_members
  FOR ALL TO authenticated USING (public.get_workspace_user_role(workspace_id) IN ('owner', 'admin')) WITH CHECK (public.get_workspace_user_role(workspace_id) IN ('owner', 'admin'));

-- projects
CREATE POLICY "Workspace members can access projects" ON projects 
  FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.is_workspace_member(workspace_id)) WITH CHECK (owner_id = auth.uid() OR public.is_workspace_member(workspace_id));

-- tasks
CREATE POLICY "Workspace members can access tasks" ON tasks 
  FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.is_workspace_member(workspace_id)) WITH CHECK (owner_id = auth.uid() OR public.is_workspace_member(workspace_id));

-- assets
CREATE POLICY "Workspace members can access assets" ON assets 
  FOR ALL TO authenticated USING (uploaded_by = auth.uid() OR public.is_workspace_member(workspace_id)) WITH CHECK (uploaded_by = auth.uid() OR public.is_workspace_member(workspace_id));

-- documents
CREATE POLICY "Workspace members can access documents" ON documents 
  FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.is_workspace_member(workspace_id)) WITH CHECK (owner_id = auth.uid() OR public.is_workspace_member(workspace_id));

-- meetings
CREATE POLICY "Workspace members can access meetings" ON meetings 
  FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.is_workspace_member(workspace_id)) WITH CHECK (owner_id = auth.uid() OR public.is_workspace_member(workspace_id));

-- daily_logs
CREATE POLICY "Allow user to manage own daily_logs" ON daily_logs 
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- focus_sessions
CREATE POLICY "Allow user to manage own focus_sessions" ON focus_sessions 
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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

-- CREATE PERFORMANCE INDEXES FOR RLS AND RELATIONSHIPS
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meetings_owner_id ON meetings(owner_id);
CREATE INDEX IF NOT EXISTS idx_meetings_workspace_id ON meetings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
