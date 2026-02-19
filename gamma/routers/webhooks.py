import re

from fastapi import APIRouter, Header, HTTPException, Request

from gamma.db import get_supabase_admin_client
from gamma.services.github_service import GitHubService

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Matches 'models' or 'models/<anything>'
MODELS_BRANCH_PATTERN = re.compile(r"^refs/heads/models(/.*)?$")


@router.post("/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None),
    x_github_event: str = Header(None),
):
    """Handle GitHub webhook events."""
    body = await request.body()

    # Verify webhook signature
    github = GitHubService()
    if x_hub_signature_256 and not github.verify_webhook_signature(
        body, x_hub_signature_256
    ):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = await request.json()

    if x_github_event == "push":
        return await _handle_push(payload)
    elif x_github_event == "workflow_run":
        return await _handle_workflow_run(payload)

    return {"status": "ignored", "event": x_github_event}


async def _handle_push(payload: dict) -> dict:
    """Handle push events — create training job records for models/* branches."""
    ref = payload.get("ref", "")
    if not MODELS_BRANCH_PATTERN.match(ref):
        return {"status": "ignored", "reason": "not a models branch"}

    repo_full_name = payload["repository"]["full_name"]
    commit_sha = payload["after"]
    branch = ref.replace("refs/heads/", "")
    installation_id = payload.get("installation", {}).get("id")

    client = get_supabase_admin_client()

    # Find the project associated with this repo
    project = (
        client.table("projects")
        .select("id")
        .eq("github_repo_full_name", repo_full_name)
        .execute()
    )
    if not project.data:
        return {"status": "ignored", "reason": "repo not connected to a project"}

    project_id = project.data[0]["id"]

    # Create a training job record
    result = (
        client.table("training_jobs")
        .insert(
            {
                "project_id": project_id,
                "commit_sha": commit_sha,
                "branch": branch,
                "status": "pending",
            }
        )
        .execute()
    )

    return {"status": "created", "job_id": result.data[0]["id"]}


async def _handle_workflow_run(payload: dict) -> dict:
    """Handle workflow_run events — update training job status."""
    action = payload.get("action", "")
    workflow_run = payload.get("workflow_run", {})
    repo_full_name = payload["repository"]["full_name"]
    head_sha = workflow_run.get("head_sha", "")
    run_id = workflow_run.get("id")

    client = get_supabase_admin_client()

    # Find the matching training job by commit SHA
    job = (
        client.table("training_jobs")
        .select("id, project_id")
        .eq("commit_sha", head_sha)
        .execute()
    )
    if not job.data:
        return {"status": "ignored", "reason": "no matching job for commit"}

    job_id = job.data[0]["id"]
    updates: dict = {"github_workflow_run_id": run_id}

    if action == "in_progress":
        updates["status"] = "running"
    elif action == "completed":
        conclusion = workflow_run.get("conclusion", "")
        updates["status"] = "completed" if conclusion == "success" else "failed"

    client.table("training_jobs").update(updates).eq("id", job_id).execute()

    return {"status": "updated", "job_id": job_id, "action": action}
