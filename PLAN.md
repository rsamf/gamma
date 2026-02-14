# Gamma — ML Development Platform

## Vision

Gamma is a unified ML development platform built on the **GAMMA stack** (Git, AWS, MLFlow, Mujoco WASM, Agent). It provides ML engineers and researchers with a single hub to manage projects, track experiments, visualize results, and receive AI-powered development assistance — all driven by a git-native workflow called **MMP (Main-Models-Push)**.

For the MVP, the stack is: **Git (GitHub) + AWS (SageMaker, S3) + MLflow + Agent**.

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        User (Browser)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Gamma Service (ECS Fargate)                 │
│  ┌───────────────────┐  ┌────────────────────────────────┐  │
│  │  Frontend (React)  │  │  Backend API (FastAPI)         │  │
│  │  - Project views   │  │  - GitHub App integration      │  │
│  │  - Metric charts   │  │  - MLflow API proxy            │  │
│  │  - Job dashboard   │  │  - Agent (LLM-powered)         │  │
│  │  - Agent chat      │  │  - S3 artifact access          │  │
│  └───────────────────┘  └────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┬─────────────────┐
          ▼                ▼                ▼                 ▼
   ┌─────────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────┐
   │  Supabase   │  │  MLflow   │  │   GitHub     │  │   AWS    │
   │  (Hosted)   │  │  Tracking │  │   API        │  │          │
   │             │  │  Server   │  │              │  │          │
   │ - Auth      │  │  (ECS)    │  │ - Webhooks   │  │ - S3     │
   │ - User data │  │           │  │ - Commits    │  │ - Sage-  │
   │ - Metadata  │  │ Uses      │  │ - Diffs      │  │   Maker  │
   │ - Agent     │  │ Supabase  │  │              │  │          │
   │   messages  │  │ Postgres  │  │              │  │          │
   └─────────────┘  └───────────┘  └──────────────┘  └──────────┘
```

### Data Flow

1. **User connects a GitHub repo** (must follow MMP convention) to a Gamma project.
2. **User pushes to `models` or `models/*` branches** → GitHub webhook fires.
3. **GitHub Actions CI** picks up the push, submits a **SageMaker training job**. The training script logs metrics/artifacts to the **MLflow tracking server** (artifacts stored in S3).
4. **Gamma receives the webhook**, records the commit + job association in Supabase, and makes the agent code-diff summary available on-demand.
5. **Gamma UI** queries the backend, which proxies to MLflow REST API for metrics/params, S3 for artifacts/checkpoints, and GitHub API for code context.
6. **Agent** (on-demand) analyzes code diffs, answers questions about the repo, and can commit changes via GitHub API.

---

## MMP Git Flow

MMP (Main-Models-Push) is an opinionated git workflow for ML development:

- **`models` branch**: The primary ML development branch. Pushes here trigger training jobs via CI.
- **`models/*` branches** (e.g., `models/vit-experiment`, `models/lr-sweep`): Feature branches for parallel experiments. Pushes also trigger CI.
- **`main` branch**: Stable code. Not directly tied to training triggers.
- Each push to `models` or `models/*` = one training job submission = one experiment in Gamma.

Gamma assumes the connected repo follows this convention. Documentation on MMP setup will be provided separately.

---

## Technology Choices

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Frontend | React + TypeScript | Standard, large ecosystem for dashboarding |
| Backend | FastAPI (Python) | Native Python ecosystem for ML tooling, async support |
| Auth | Supabase Auth (GitHub OAuth) | Unified with data layer, GitHub-native login |
| Database | Supabase Postgres (hosted) | User data, project metadata, agent messages |
| Experiment Tracking | MLflow Tracking Server | Standard format, REST API, S3 artifact store |
| MLflow Backend DB | Supabase Postgres (separate schema) | Reuse existing infra, fewer resources for MVP |
| Artifact Storage | AWS S3 | Checkpoints, model files, MLflow artifacts |
| Training Orchestration | GitHub Actions → SageMaker | CI-driven, repo-owned, aligns with MMP |
| Agent LLM | Anthropic Claude API | Code understanding, diff analysis |
| Containerization | Docker | Single container for Gamma (frontend + backend) |
| Deployment | AWS ECS Fargate | Serverless containers, low ops overhead |
| IaC | Terraform (AWS provider) | Declarative, reproducible infrastructure |
| Charts | Plotly.js or Recharts | Interactive metric visualization |

---

## MVP Feature Scope

### P0 — Core (Must Have)

1. **Project Management**
   - Create a project by connecting a GitHub repo (via GitHub App installation)
   - View list of projects with status summary
   - Project settings (repo connection, S3 bucket config, MLflow endpoint)

2. **Training Job Tracking**
   - Receive GitHub webhooks on pushes to `models`/`models/*`
   - Associate commits with SageMaker training jobs (via CI metadata)
   - Job dashboard: list of jobs with status (pending, running, completed, failed), commit hash, branch, timestamp
   - Job detail view: link to commit, job duration, final metrics summary

3. **Experiment Metrics (via MLflow API)**
   - Query MLflow tracking server REST API for runs, metrics, params
   - Metric visualization: line charts for training curves (loss, accuracy, etc.)
   - Compare metrics across runs/experiments side-by-side
   - Parameter tracking: hyperparameters logged per run

4. **Artifact & Checkpoint Management**
   - List artifacts and checkpoints stored in S3 (via MLflow artifact API)
   - Display metadata: file size, timestamp, associated run/step
   - Download links for model checkpoints and artifacts

5. **Agent — Code Diff Analysis**
   - On-demand button per job/commit: "Generate Summary"
   - Agent reads the commit diff via GitHub API, produces a short description of changes
   - Agent chat: ask questions about the diff, the repo, or the experiment
   - Conversation history stored in Supabase (user + agent messages per project)

6. **Authentication & User Management**
   - GitHub OAuth via Supabase Auth
   - User profile and project ownership
   - Basic RBAC: project owner can manage settings

### P1 — Important (Should Have for MVP)

7. **Agent — Commit Changes**
   - Agent can propose and commit code changes to the repo via GitHub API
   - User reviews proposed changes before agent commits
   - Commit appears as authored by the Gamma GitHub App

8. **Webhook-Driven Event System**
   - GitHub webhook listener for push events, workflow run status updates
   - SSE (Server-Sent Events) to push real-time job status updates to the UI

9. **Mobile-Responsive UI**
   - Key views (job dashboard, metrics, agent chat) usable on mobile
   - This is a primary motivation for building custom UI over MLflow's

### P2 — Nice to Have (Post-MVP)

10. Proactive agent insights (automatic suggestions based on experiment trends)
11. A2UI — agent-generated dynamic visualizations from prompts
12. Mujoco WASM integration for policy visualization
13. Multi-cloud support (GCP, Azure)
14. Non-GitHub VCS support (GitLab, Bitbucket)
15. Team collaboration features (shared projects, comments)

---

## Infrastructure (Terraform)

### AWS Resources

```
terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── modules/
│   ├── networking/        # VPC, subnets, security groups
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ecs/               # ECS cluster, Fargate services, ALB
│   │   ├── main.tf        # Gamma service + MLflow service
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── s3/                # Artifact bucket(s)
│   │   ├── main.tf
│   │   └── variables.tf
│   ├── ecr/               # Container registries
│   │   ├── main.tf
│   │   └── variables.tf
│   └── iam/               # Roles and policies
│       ├── main.tf
│       └── variables.tf
└── environments/
    ├── dev.tfvars
    └── prod.tfvars
```

### Resource Summary

| Resource | Purpose |
|----------|---------|
| **VPC** | Private networking for ECS tasks |
| **ECS Cluster (Fargate)** | Runs Gamma service + MLflow tracking server |
| **ALB** | Routes traffic to Gamma (public) and MLflow (internal or restricted) |
| **ECR** | Stores Docker images for Gamma and MLflow |
| **S3 Bucket** | MLflow artifact store, model checkpoints |
| **IAM Roles** | ECS task execution, S3 access, SageMaker (for CI) |
| **Security Groups** | ALB ingress, ECS task communication |
| **Secrets Manager** | Supabase credentials, GitHub App private key, Anthropic API key |

### External Services (Not Terraform-managed)

| Service | Purpose |
|---------|---------|
| **Supabase (hosted)** | Auth, Postgres DB (user data + MLflow backend) |
| **GitHub** | Repo integration, webhooks, OAuth, Actions CI |
| **Anthropic API** | Agent LLM for code analysis |

---

## Application Structure

```
gamma/
├── docker/
│   ├── Dockerfile              # Multi-stage: build frontend, serve with backend
│   └── Dockerfile.mlflow       # MLflow tracking server
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # Project list
│   │   │   ├── Project.tsx         # Project overview, job list
│   │   │   ├── JobDetail.tsx       # Single job: metrics, artifacts, diff
│   │   │   ├── Experiments.tsx     # MLflow metrics explorer, charts
│   │   │   ├── Artifacts.tsx       # Checkpoint/artifact browser
│   │   │   └── Agent.tsx           # Agent chat interface
│   │   ├── components/
│   │   │   ├── MetricChart.tsx     # Reusable chart component
│   │   │   ├── JobTable.tsx        # Job list with status
│   │   │   ├── DiffViewer.tsx      # Code diff display
│   │   │   ├── ArtifactList.tsx    # S3 artifact browser
│   │   │   └── ChatMessage.tsx     # Agent chat bubble
│   │   ├── hooks/
│   │   ├── services/               # API client functions
│   │   └── types/
│   └── public/
├── backend/
│   ├── main.py                     # FastAPI entrypoint
│   ├── routers/
│   │   ├── projects.py             # CRUD for projects
│   │   ├── jobs.py                 # Training job tracking
│   │   ├── experiments.py          # MLflow API proxy
│   │   ├── artifacts.py            # S3 artifact access
│   │   ├── agent.py                # Agent chat + diff summary
│   │   └── webhooks.py             # GitHub webhook handler
│   ├── services/
│   │   ├── github_service.py       # GitHub App API client
│   │   ├── mlflow_service.py       # MLflow REST API client
│   │   ├── s3_service.py           # S3 operations
│   │   ├── sagemaker_service.py    # SageMaker job status queries
│   │   └── agent_service.py        # LLM orchestration
│   ├── models/                     # Pydantic models / DB schemas
│   ├── db/                         # Supabase client setup
│   └── config.py                   # Environment configuration
├── terraform/                      # As described above
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD for Gamma itself
└── README.md
```

---

## Database Schema (Supabase Postgres)

### Gamma Schema (`public`)

```sql
-- Users (managed by Supabase Auth, extended here)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    github_username TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects (1 project = 1 GitHub repo)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) NOT NULL,
    name TEXT NOT NULL,
    github_repo_full_name TEXT NOT NULL,  -- e.g. "richard/my-model"
    github_installation_id BIGINT NOT NULL,
    s3_bucket TEXT NOT NULL,
    s3_prefix TEXT DEFAULT '',
    mlflow_experiment_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Jobs (linked to commits)
CREATE TABLE training_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    commit_sha TEXT NOT NULL,
    branch TEXT NOT NULL,
    github_workflow_run_id BIGINT,
    sagemaker_job_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, running, completed, failed
    mlflow_run_id TEXT,                      -- links to MLflow run
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Conversations
CREATE TABLE agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    training_job_id UUID REFERENCES training_jobs(id),  -- nullable, can be project-level
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES agent_conversations(id) NOT NULL,
    role TEXT NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',  -- e.g. diff context, referenced files
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent-generated commit summaries (cached)
CREATE TABLE commit_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    commit_sha TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, commit_sha)
);
```

### MLflow Schema (`mlflow`)

MLflow tracking server manages its own schema in the `mlflow` schema of the same Postgres instance. This is configured via MLflow's `--backend-store-uri` pointing to the Supabase Postgres with `?options=-csearch_path=mlflow`.

---

## Key Integration Details

### GitHub App

- **Permissions**: Repository contents (read/write), metadata (read), webhooks (push, workflow_run)
- **Auth flow**: User installs the Gamma GitHub App on their repo → Gamma receives installation ID → uses installation access tokens for API calls
- **Webhook events**: `push` (to detect `models/*` branch pushes), `workflow_run` (to track CI job status)

### MLflow Tracking Server

- Runs as a separate ECS Fargate service (not publicly exposed, internal ALB target group)
- Backend store: `postgresql://supabase-host/postgres?options=-csearch_path=mlflow`
- Artifact store: `s3://<bucket>/mlflow-artifacts/`
- Training jobs log to this server via the MLflow tracking URI (set in CI environment)
- Gamma backend queries the MLflow REST API (`/api/2.0/mlflow/...`) for runs, metrics, params, artifacts

### Agent

- Uses Anthropic Claude API for code understanding
- Context assembly: commit diff (from GitHub API) + relevant file contents + experiment metrics
- Streaming responses via SSE to the frontend
- Stateless per request — full conversation history sent from Supabase on each turn

---

## Development Phases

### Phase 1 — Foundation
- Terraform infrastructure: VPC, ECS cluster, S3, ECR, ALB, IAM, Secrets Manager
- Docker setup: Gamma container (FastAPI + React build), MLflow container
- Supabase project setup: auth, database schema, RLS policies
- GitHub App registration and webhook endpoint
- Basic FastAPI skeleton with health check, Supabase client, config management
- React app scaffold with routing, auth flow (GitHub OAuth via Supabase)

### Phase 2 — Core Integration
- Project CRUD: create project by connecting GitHub repo
- GitHub webhook handler: listen for push events on `models/*`, workflow_run events
- Training job tracking: create job records from webhook events, poll SageMaker for status
- MLflow API proxy: query runs, metrics, params from MLflow tracking server
- Frontend: project dashboard, job list with status indicators

### Phase 3 — Visualization & Artifacts
- Metric charting: interactive line charts for training curves, run comparison
- Artifact browser: list S3 objects via MLflow artifact API, display metadata, download links
- Checkpoint viewer: list checkpoints with step/metric info
- Frontend polish: responsive layout, mobile-friendly views

### Phase 4 — Agent
- Agent service: Anthropic API integration, context assembly (diff + code + metrics)
- On-demand diff summary: button per commit/job, generates and caches summary
- Agent chat: conversational interface, project-scoped and job-scoped conversations
- Agent commits: propose changes, user approval flow, commit via GitHub API
- SSE streaming for agent responses

### Phase 5 — Polish & Deploy
- CI/CD pipeline for Gamma itself (GitHub Actions → ECR → ECS deploy)
- Error handling, logging, monitoring (CloudWatch)
- Security review: webhook signature verification, token management, RLS policies
- End-to-end testing with a real MMP repo
- Documentation: setup guide, MMP workflow docs

---

## Resolved Decisions

1. **Domain/hosting**: No custom domain for MVP. ALB default DNS.
2. **Cost management**: Out of scope for MVP.
3. **Multi-user**: Supported from day 1. Auth, RBAC, and RLS policies included.
4. **MLflow experiment mapping**: One MLflow experiment per successfully submitted training job. Experiment metadata retrievable via the AWS SageMaker API.
5. **Artifact retention**: No automatic cleanup policies. Manual management only.
6. **Rate limits**: Not a concern for MVP scope.