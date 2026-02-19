import json
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from gamma.db import get_supabase_admin_client
from gamma.models import (
    AgentChatRequest,
    AgentConversation,
    AgentMessage,
    CommitSummary,
)
from gamma.services.agent_service import AgentService

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/summary/{project_id}/{commit_sha}", response_model=CommitSummary)
async def generate_commit_summary(project_id: UUID, commit_sha: str):
    """Generate (or return cached) commit diff summary."""
    client = get_supabase_admin_client()

    # Check cache
    existing = (
        client.table("commit_summaries")
        .select("*")
        .eq("project_id", str(project_id))
        .eq("commit_sha", commit_sha)
        .execute()
    )
    if existing.data:
        return existing.data[0]

    # Get project info for GitHub API
    project = (
        client.table("projects")
        .select("github_repo_full_name, github_installation_id")
        .eq("id", str(project_id))
        .single()
        .execute()
    )
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found")

    agent = AgentService()
    summary = await agent.generate_commit_summary(
        installation_id=project.data["github_installation_id"],
        repo_full_name=project.data["github_repo_full_name"],
        commit_sha=commit_sha,
    )

    # Cache the summary
    result = (
        client.table("commit_summaries")
        .insert(
            {
                "project_id": str(project_id),
                "commit_sha": commit_sha,
                "summary": summary,
            }
        )
        .execute()
    )
    return result.data[0]


@router.post("/chat/{project_id}")
async def agent_chat(project_id: UUID, request: AgentChatRequest):
    """Stream an agent chat response via SSE."""
    client = get_supabase_admin_client()

    # Get project info
    project = (
        client.table("projects")
        .select("*")
        .eq("id", str(project_id))
        .single()
        .execute()
    )
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get or create conversation
    if request.conversation_id:
        conv_result = (
            client.table("agent_conversations")
            .select("*")
            .eq("id", str(request.conversation_id))
            .single()
            .execute()
        )
        if not conv_result.data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        conversation_id = request.conversation_id
    else:
        conv_result = (
            client.table("agent_conversations")
            .insert(
                {
                    "project_id": str(project_id),
                    "training_job_id": (
                        str(request.training_job_id)
                        if request.training_job_id
                        else None
                    ),
                }
            )
            .execute()
        )
        conversation_id = conv_result.data[0]["id"]

    # Save user message
    client.table("agent_messages").insert(
        {
            "conversation_id": str(conversation_id),
            "role": "user",
            "content": request.message,
        }
    ).execute()

    # Load conversation history
    history = (
        client.table("agent_messages")
        .select("role, content")
        .eq("conversation_id", str(conversation_id))
        .order("created_at")
        .execute()
    )
    messages = [{"role": m["role"], "content": m["content"]} for m in history.data]

    # Build context
    agent = AgentService()
    commit_sha = None
    mlflow_run_id = None
    if request.training_job_id:
        job = (
            client.table("training_jobs")
            .select("commit_sha, mlflow_run_id")
            .eq("id", str(request.training_job_id))
            .single()
            .execute()
        )
        if job.data:
            commit_sha = job.data.get("commit_sha")
            mlflow_run_id = job.data.get("mlflow_run_id")

    context = await agent.build_context(
        installation_id=project.data["github_installation_id"],
        repo_full_name=project.data["github_repo_full_name"],
        commit_sha=commit_sha,
        mlflow_run_id=mlflow_run_id,
    )

    async def event_stream():
        full_response = ""
        async for chunk in agent.chat(messages, context):
            full_response += chunk
            yield f"data: {json.dumps({'text': chunk})}\n\n"

        # Save assistant response
        client.table("agent_messages").insert(
            {
                "conversation_id": str(conversation_id),
                "role": "assistant",
                "content": full_response,
            }
        ).execute()
        yield f"data: {json.dumps({'done': True, 'conversation_id': str(conversation_id)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get(
    "/conversations/{project_id}", response_model=list[AgentConversation]
)
async def list_conversations(project_id: UUID):
    """List conversations for a project."""
    client = get_supabase_admin_client()
    result = (
        client.table("agent_conversations")
        .select("*")
        .eq("project_id", str(project_id))
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[AgentMessage],
)
async def get_conversation_messages(conversation_id: UUID):
    """Get all messages in a conversation."""
    client = get_supabase_admin_client()
    result = (
        client.table("agent_messages")
        .select("*")
        .eq("conversation_id", str(conversation_id))
        .order("created_at")
        .execute()
    )
    return result.data
