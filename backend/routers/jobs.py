from uuid import UUID

from fastapi import APIRouter, HTTPException

from backend.db import get_supabase_admin_client
from backend.models import TrainingJob, TrainingJobCreate, TrainingJobUpdate
from backend.services.sagemaker_service import SageMakerService

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=list[TrainingJob])
async def list_jobs(project_id: UUID | None = None):
    """List training jobs, optionally filtered by project."""
    client = get_supabase_admin_client()
    query = client.table("training_jobs").select("*")
    if project_id:
        query = query.eq("project_id", str(project_id))
    result = query.order("created_at", desc=True).execute()
    return result.data


@router.get("/{job_id}", response_model=TrainingJob)
async def get_job(job_id: UUID):
    """Get a single training job by ID."""
    client = get_supabase_admin_client()
    result = (
        client.table("training_jobs")
        .select("*")
        .eq("id", str(job_id))
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return result.data


@router.post("", response_model=TrainingJob, status_code=201)
async def create_job(job: TrainingJobCreate):
    """Create a new training job record."""
    client = get_supabase_admin_client()
    result = (
        client.table("training_jobs").insert(job.model_dump(mode="json")).execute()
    )
    return result.data[0]


@router.patch("/{job_id}", response_model=TrainingJob)
async def update_job(job_id: UUID, updates: TrainingJobUpdate):
    """Update a training job's status or metadata."""
    client = get_supabase_admin_client()
    data = updates.model_dump(exclude_none=True, mode="json")
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = (
        client.table("training_jobs")
        .update(data)
        .eq("id", str(job_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return result.data[0]


@router.get("/{job_id}/sagemaker-status")
async def get_sagemaker_status(job_id: UUID):
    """Fetch live SageMaker status for a job."""
    client = get_supabase_admin_client()
    result = (
        client.table("training_jobs")
        .select("sagemaker_job_name")
        .eq("id", str(job_id))
        .single()
        .execute()
    )
    if not result.data or not result.data.get("sagemaker_job_name"):
        raise HTTPException(
            status_code=404, detail="Job not found or no SageMaker job name"
        )

    sagemaker = SageMakerService()
    return sagemaker.get_training_job(result.data["sagemaker_job_name"])
