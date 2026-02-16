-- Gamma Database Schema
-- Run against Supabase Postgres (public schema)

-- Users (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    github_username TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects (1 project = 1 GitHub repo)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    github_repo_full_name TEXT NOT NULL,
    github_installation_id BIGINT NOT NULL,
    s3_bucket TEXT NOT NULL,
    s3_prefix TEXT DEFAULT '',
    mlflow_experiment_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Jobs (linked to commits)
CREATE TABLE IF NOT EXISTS training_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    commit_sha TEXT NOT NULL,
    branch TEXT NOT NULL,
    github_workflow_run_id BIGINT,
    sagemaker_job_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    mlflow_run_id TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Conversations
CREATE TABLE IF NOT EXISTS agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    training_job_id UUID REFERENCES training_jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Messages
CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cached commit summaries
CREATE TABLE IF NOT EXISTS commit_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    commit_sha TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, commit_sha)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project ON training_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_commit ON training_jobs(commit_sha);
CREATE INDEX IF NOT EXISTS idx_conversations_project ON agent_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON agent_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_summaries_project_commit ON commit_summaries(project_id, commit_sha);

-- Row Level Security Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE commit_summaries ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: owners can CRUD, others can read
CREATE POLICY projects_select ON projects FOR SELECT USING (true);
CREATE POLICY projects_insert ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY projects_update ON projects FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY projects_delete ON projects FOR DELETE USING (auth.uid() = owner_id);

-- Training jobs: readable by anyone, writable by project owner
CREATE POLICY jobs_select ON training_jobs FOR SELECT USING (true);
CREATE POLICY jobs_insert ON training_jobs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);

-- Agent conversations: accessible by project owner
CREATE POLICY conversations_select ON agent_conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);
CREATE POLICY conversations_insert ON agent_conversations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);

-- Agent messages: accessible through conversation ownership
CREATE POLICY messages_select ON agent_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM agent_conversations c
        JOIN projects p ON c.project_id = p.id
        WHERE c.id = conversation_id AND p.owner_id = auth.uid()
    )
);
CREATE POLICY messages_insert ON agent_messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM agent_conversations c
        JOIN projects p ON c.project_id = p.id
        WHERE c.id = conversation_id AND p.owner_id = auth.uid()
    )
);

-- Commit summaries: readable by anyone, writable by project owner
CREATE POLICY summaries_select ON commit_summaries FOR SELECT USING (true);
CREATE POLICY summaries_insert ON commit_summaries FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);

-- Trigger to auto-update updated_at on projects
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
