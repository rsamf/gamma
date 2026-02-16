from uuid import UUID

from fastapi import APIRouter, HTTPException

from backend.db import get_supabase_admin_client
from backend.services.s3_service import S3Service

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


@router.get("/{project_id}")
async def list_artifacts(project_id: UUID, prefix: str = ""):
    """List artifacts in S3 for a project."""
    client = get_supabase_admin_client()
    result = (
        client.table("projects")
        .select("s3_bucket, s3_prefix")
        .eq("id", str(project_id))
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    bucket = result.data["s3_bucket"]
    full_prefix = result.data.get("s3_prefix", "")
    if prefix:
        full_prefix = f"{full_prefix}/{prefix}" if full_prefix else prefix

    s3 = S3Service()
    return s3.list_objects(bucket, full_prefix)


@router.get("/{project_id}/download-url")
async def get_download_url(project_id: UUID, key: str):
    """Generate a presigned download URL for an artifact."""
    client = get_supabase_admin_client()
    result = (
        client.table("projects")
        .select("s3_bucket")
        .eq("id", str(project_id))
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    s3 = S3Service()
    url = s3.generate_presigned_url(result.data["s3_bucket"], key)
    return {"url": url}


@router.get("/{project_id}/metadata")
async def get_artifact_metadata(project_id: UUID, key: str):
    """Get metadata for a specific artifact."""
    client = get_supabase_admin_client()
    result = (
        client.table("projects")
        .select("s3_bucket")
        .eq("id", str(project_id))
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    s3 = S3Service()
    return s3.get_object_metadata(result.data["s3_bucket"], key)
