-- ==============================================================================
-- MULTI-TENANCY MIGRATION FOR CALLMY MGMT / FOCUS OS
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. WORKSPACE MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')) NOT NULL,
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, user_id)
);

-- 2. WORKSPACE INVITES TABLE
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')) NOT NULL,
  token text UNIQUE NOT NULL,
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days') NOT NULL
);

-- 3. INDEXES FOR HIGH-SPEED MULTI-TENANT QUERIES
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON public.workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON public.workspace_invites(email);

-- 4. HELPER SECURITY DEFINER FUNCTIONS (Prevents RLS recursion)
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

  -- Check direct workspace owner first
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

-- 5. TRIGGER: AUTO-ENROLL WORKSPACE CREATOR AS 'owner' IN workspace_members
CREATE OR REPLACE FUNCTION public.handle_new_workspace_owner()
RETURNS trigger AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_workspace_created_add_owner ON public.workspaces;
CREATE TRIGGER on_workspace_created_add_owner
  AFTER INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_workspace_owner();

-- 6. BACKFILL EXISTING WORKSPACES INTO workspace_members
INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM public.workspaces
WHERE owner_id IS NOT NULL
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES FOR workspace_members
DROP POLICY IF EXISTS "Members can view workspace membership" ON public.workspace_members;
CREATE POLICY "Members can view workspace membership" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  );

DROP POLICY IF EXISTS "Owners and admins can manage members" ON public.workspace_members;
CREATE POLICY "Owners and admins can manage members" ON public.workspace_members
  FOR ALL TO authenticated
  USING (
    public.get_workspace_user_role(workspace_id) IN ('owner', 'admin')
  )
  WITH CHECK (
    public.get_workspace_user_role(workspace_id) IN ('owner', 'admin')
  );

-- 9. POLICIES FOR workspaces
DROP POLICY IF EXISTS "Allow user to manage own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Members can view workspace" ON public.workspaces;
CREATE POLICY "Members can view workspace" ON public.workspaces
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid() 
    OR public.is_workspace_member(id)
  );

DROP POLICY IF EXISTS "Owners can update workspace" ON public.workspaces;
CREATE POLICY "Owners can update workspace" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid() 
    OR public.get_workspace_user_role(id) IN ('owner', 'admin')
  )
  WITH CHECK (
    owner_id = auth.uid() 
    OR public.get_workspace_user_role(id) IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- 10. MULTI-TENANT POLICIES FOR TASKS
DROP POLICY IF EXISTS "Allow user to manage own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Workspace members can view tasks" ON public.tasks;
CREATE POLICY "Workspace members can view tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  );

DROP POLICY IF EXISTS "Workspace members can insert tasks" ON public.tasks;
CREATE POLICY "Workspace members can insert tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  );

DROP POLICY IF EXISTS "Workspace members can update tasks" ON public.tasks;
CREATE POLICY "Workspace members can update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  )
  WITH CHECK (
    owner_id = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  );

DROP POLICY IF EXISTS "Workspace members can delete tasks" ON public.tasks;
CREATE POLICY "Workspace members can delete tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (
    owner_id = auth.uid() 
    OR public.get_workspace_user_role(workspace_id) IN ('owner', 'admin')
  );

-- 11. MULTI-TENANT POLICIES FOR PROJECTS
DROP POLICY IF EXISTS "Allow user to manage own projects" ON public.projects;
DROP POLICY IF EXISTS "Workspace members can access projects" ON public.projects;
CREATE POLICY "Workspace members can access projects" ON public.projects
  FOR ALL TO authenticated
  USING (
    owner_id = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  )
  WITH CHECK (
    owner_id = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  );

-- 12. MULTI-TENANT POLICIES FOR DOCUMENTS
DROP POLICY IF EXISTS "Allow user to manage own documents" ON public.documents;
DROP POLICY IF EXISTS "Workspace members can access documents" ON public.documents;
CREATE POLICY "Workspace members can access documents" ON public.documents
  FOR ALL TO authenticated
  USING (
    owner_id = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  )
  WITH CHECK (
    owner_id = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  );

-- 13. MULTI-TENANT POLICIES FOR MEETINGS
DROP POLICY IF EXISTS "Allow user to manage own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Workspace members can access meetings" ON public.meetings;
CREATE POLICY "Workspace members can access meetings" ON public.meetings
  FOR ALL TO authenticated
  USING (
    owner_id = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  )
  WITH CHECK (
    owner_id = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  );

-- 14. MULTI-TENANT POLICIES FOR ASSETS
DROP POLICY IF EXISTS "Allow user to manage own assets" ON public.assets;
DROP POLICY IF EXISTS "Workspace members can access assets" ON public.assets;
CREATE POLICY "Workspace members can access assets" ON public.assets
  FOR ALL TO authenticated
  USING (
    uploaded_by = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  )
  WITH CHECK (
    uploaded_by = auth.uid() 
    OR public.is_workspace_member(workspace_id)
  );
