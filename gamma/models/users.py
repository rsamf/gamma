from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class Profile(BaseModel):
    id: UUID
    github_username: str
    avatar_url: str | None = None
    created_at: datetime
