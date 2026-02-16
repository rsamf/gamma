# Gamma

Unified ML development platform built on the GAMMA stack (Git, AWS, MLFlow, Mujoco WASM, Agent). Manage projects, track experiments, visualize results, and get AI-powered development assistance — all driven by the git-native MMP workflow.

## Architecture

- **Frontend**: React + TypeScript (Vite)
- **Backend**: FastAPI (Python)
- **Auth**: Supabase Auth (GitHub OAuth)
- **Database**: Supabase Postgres
- **Experiment Tracking**: MLflow Tracking Server
- **Artifacts**: AWS S3
- **Training**: GitHub Actions + SageMaker
- **Agent**: Anthropic Claude API
- **Infrastructure**: Terraform (AWS ECS Fargate)

## Project Structure

```
gamma/
├── backend/          # FastAPI application
│   ├── main.py       # Entrypoint
│   ├── config.py     # Environment configuration
│   ├── db/           # Supabase client
│   ├── models/       # Pydantic models
│   ├── routers/      # API route handlers
│   └── services/     # Business logic (GitHub, MLflow, S3, Agent)
├── frontend/         # React + TypeScript application
│   └── src/
│       ├── pages/    # Dashboard, Project, JobDetail, Experiments, Artifacts, Agent
│       ├── components/ # MetricChart, JobTable, DiffViewer, ArtifactList, ChatMessage
│       ├── hooks/    # useAuth, useProjects, useJobs
│       ├── services/ # API client, Supabase client
│       └── types/    # TypeScript type definitions
├── docker/           # Dockerfiles for Gamma and MLflow
├── terraform/        # IaC (VPC, ECS, S3, ECR, IAM)
├── db/               # SQL migrations
└── .github/workflows/ # CI/CD
```

## Development Setup

1. Copy `.env.example` to `.env` and fill in values
2. Start the backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn backend.main:app --reload
   ```
3. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## MMP Git Flow

MMP (Main-Models-Push) is the opinionated git workflow for ML development:

- **`models` branch**: Primary ML dev branch. Pushes trigger training jobs via CI.
- **`models/*` branches**: Feature branches for parallel experiments.
- **`main` branch**: Stable code.
- Each push to `models` or `models/*` = one training job = one experiment.

## Infrastructure Deployment

```bash
cd terraform
terraform init
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/projects` | List/create projects |
| GET/PATCH/DELETE | `/api/projects/:id` | Project CRUD |
| GET/POST | `/api/jobs` | List/create training jobs |
| GET/PATCH | `/api/jobs/:id` | Job details/updates |
| GET | `/api/experiments` | List MLflow experiments |
| GET | `/api/experiments/:name/runs` | List runs for experiment |
| GET | `/api/experiments/runs/:id/metrics/:key` | Metric history |
| GET | `/api/artifacts/:projectId` | List S3 artifacts |
| POST | `/api/agent/summary/:projectId/:sha` | Generate commit summary |
| POST | `/api/agent/chat/:projectId` | Agent chat (SSE) |
| POST | `/api/webhooks/github` | GitHub webhook handler |
