from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import get_settings
from backend.routers import agent, artifacts, experiments, jobs, projects, webhooks

settings = get_settings()

app = FastAPI(
    title="Gamma API",
    description="ML Development Platform API",
    version="0.1.0",
)

# CORS — permissive for development, restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(projects.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(experiments.router, prefix="/api")
app.include_router(artifacts.router, prefix="/api")
app.include_router(agent.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "gamma"}


# Serve frontend static files in production (built React app)
# Mount this last so API routes take precedence
try:
    app.mount("/", StaticFiles(directory="frontend/build", html=True), name="frontend")
except Exception:
    pass  # Frontend build directory may not exist during development
