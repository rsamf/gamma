from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class ProjectCreateRequest(BaseModel):
    github_repo_full_name: str


class ProjectCreate(BaseModel):
    name: str
    github_repo_full_name: str
    github_installation_id: int
    s3_bucket: str
    s3_prefix: str = ""
    mlflow_experiment_name: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    s3_bucket: str | None = None
    s3_prefix: str | None = None
    mlflow_experiment_name: str | None = None


class Project(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    github_repo_full_name: str
    github_installation_id: int
    s3_bucket: str
    s3_prefix: str
    mlflow_experiment_name: str | None = None
    created_at: datetime
    updated_at: datetime
