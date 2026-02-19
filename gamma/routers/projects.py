from uuid import UUID

from fastapi import APIRouter, HTTPException

from gamma.config import get_settings
from gamma.db import get_supabase_admin_client
from gamma.models import Project, ProjectCreate, ProjectCreateRequest, ProjectUpdate
from gamma.services.github_service import GitHubService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[Project])
async def list_projects(owner_id: UUID | None = None):
    """List all projects, optionally filtered by owner."""
    client = get_supabase_admin_client()
    query = client.table("projects").select("*")
    if owner_id:
        query = query.eq("owner_id", str(owner_id))
    result = query.order("created_at", desc=True).execute()
    return result.data


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: UUID):
    """Get a single project by ID."""
    client = get_supabase_admin_client()
    result = (
        client.table("projects")
        .select("*")
        .eq("id", str(project_id))
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return result.data


@router.post("", response_model=Project, status_code=201)
async def create_project(project: ProjectCreateRequest, owner_id: UUID):
    """Create a new project by connecting a GitHub repo."""
    owner, repo = project.github_repo_full_name.split("/", 1)

    github = GitHubService()
    installation_id = await github.get_repo_installation_id(owner, repo)

    settings = get_settings()
    full_project = ProjectCreate(
        name=repo,
        github_repo_full_name=project.github_repo_full_name,
        github_installation_id=installation_id,
        s3_bucket=settings.s3_default_bucket,
    )

    client = get_supabase_admin_client()

    # Ensure a profile row exists for this user (safety net if the DB trigger
    # hadn't been applied yet when the user first signed up).
    user_resp = client.auth.admin.get_user_by_id(str(owner_id))
    if user_resp and user_resp.user:
        meta = user_resp.user.user_metadata or {}
        client.table("profiles").upsert(
            {
                "id": str(owner_id),
                "github_username": meta.get("user_name") or "",
                "avatar_url": meta.get("avatar_url"),
            },
            on_conflict="id",
        ).execute()

    result = (
        client.table("projects")
        .insert({"owner_id": str(owner_id), **full_project.model_dump()})
        .execute()
    )
    return result.data[0]


@router.patch("/{project_id}", response_model=Project)
async def update_project(project_id: UUID, updates: ProjectUpdate):
    """Update project settings."""
    client = get_supabase_admin_client()
    data = updates.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = (
        client.table("projects")
        .update(data)
        .eq("id", str(project_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return result.data[0]


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: UUID):
    """Delete a project."""
    client = get_supabase_admin_client()
    client.table("projects").delete().eq("id", str(project_id)).execute()
