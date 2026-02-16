# Gamma

Unified ML development platform built on the GAMMA stack (Git, AWS, MLFlow, Mujoco WASM, Agent). Manage projects, track experiments, visualize results, and get AI-powered development assistance — all driven by the git-native MMP workflow.

## Architecture

- **Frontend**: Next.js + TypeScript + shadcn/ui
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
├── frontend/         # Next.js + TypeScript application
│   └── src/
│       ├── app/      # Next.js App Router pages
│       ├── components/ # UI components with shadcn/ui styling
│       ├── hooks/    # useAuth, useProjects, useJobs
│       ├── lib/      # API client, Supabase client, utilities, types
│       └── components/ui/ # shadcn/ui components
├── docker/           # Dockerfiles for Gamma and MLflow
├── terraform/        # IaC (VPC, ECS, S3, ECR, IAM)
├── db/               # SQL migrations
└── .github/workflows/ # CI/CD
```

## Development Setup

1. Set up environment variables:
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your values

   # Frontend
   cd frontend
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

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

   The frontend will be available at [http://localhost:3000](http://localhost:3000)

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
