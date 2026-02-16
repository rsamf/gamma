from uuid import UUID

from fastapi import APIRouter, HTTPException

from backend.db import get_supabase_admin_client
from backend.models import Project, ProjectCreate, ProjectUpdate

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
async def create_project(project: ProjectCreate, owner_id: UUID):
    """Create a new project by connecting a GitHub repo."""
    client = get_supabase_admin_client()
    result = (
        client.table("projects")
        .insert({"owner_id": str(owner_id), **project.model_dump()})
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
