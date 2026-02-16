from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class AgentConversation(BaseModel):
    id: UUID
    project_id: UUID
    training_job_id: UUID | None = None
    created_at: datetime


class AgentMessageCreate(BaseModel):
    content: str


class AgentMessage(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str  # 'user' or 'assistant'
    content: str
    metadata: dict = {}
    created_at: datetime


class CommitSummary(BaseModel):
    id: UUID
    project_id: UUID
    commit_sha: str
    summary: str
    created_at: datetime


class AgentChatRequest(BaseModel):
    message: str
    conversation_id: UUID | None = None
    training_job_id: UUID | None = None
