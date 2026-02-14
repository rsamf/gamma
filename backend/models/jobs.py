from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from enum import Enum


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TrainingJobCreate(BaseModel):
    project_id: UUID
    commit_sha: str
    branch: str
    github_workflow_run_id: int | None = None
    sagemaker_job_name: str | None = None


class TrainingJobUpdate(BaseModel):
    status: JobStatus | None = None
    sagemaker_job_name: str | None = None
    mlflow_run_id: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


class TrainingJob(BaseModel):
    id: UUID
    project_id: UUID
    commit_sha: str
    branch: str
    github_workflow_run_id: int | None = None
    sagemaker_job_name: str | None = None
    status: JobStatus
    mlflow_run_id: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
