from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException

from gamma.db import get_supabase_admin_client
from gamma.services.github_service import GitHubService

router = APIRouter(prefix="/github", tags=["github"])

GITHUB_API = "https://api.github.com"


@router.get("/repos")
async def list_github_repos(owner_id: UUID):
    """List repos accessible via the GitHub App for the authenticated user.

    Uses the App JWT to call GET /app/installations and filters by the user's
    GitHub login stored in Supabase user metadata. No user OAuth token required.
    """
    # Resolve the user's GitHub login from Supabase
    admin = get_supabase_admin_client()
    user_resp = admin.auth.admin.get_user_by_id(str(owner_id))
    if not user_resp or not user_resp.user:
        raise HTTPException(status_code=404, detail="User not found")

    meta = user_resp.user.user_metadata or {}
    github_login = meta.get("user_name") or meta.get("preferred_username")
    if not github_login:
        raise HTTPException(status_code=400, detail="GitHub login not found in user metadata")

    github = GitHubService()
    app_jwt = github._generate_jwt()
    gh_headers = {
        "Authorization": f"Bearer {app_jwt}",
        "Accept": "application/vnd.github+json",
    }

    repos = []
    async with httpx.AsyncClient() as client:
        # List all installations of this GitHub App
        inst_resp = await client.get(f"{GITHUB_API}/app/installations", headers=gh_headers)
        inst_resp.raise_for_status()

        for installation in inst_resp.json():
            if installation["account"]["login"].lower() != github_login.lower():
                continue

            inst_id = installation["id"]

            # Get an installation access token for this installation
            token_resp = await client.post(
                f"{GITHUB_API}/app/installations/{inst_id}/access_tokens",
                headers=gh_headers,
            )
            token_resp.raise_for_status()
            inst_token = token_resp.json()["token"]

            # List repositories accessible to this installation (paginated)
            inst_headers = {
                "Authorization": f"token {inst_token}",
                "Accept": "application/vnd.github+json",
            }
            page = 1
            while True:
                repos_resp = await client.get(
                    f"{GITHUB_API}/installation/repositories",
                    headers=inst_headers,
                    params={"per_page": 100, "page": page},
                )
                repos_resp.raise_for_status()
                body = repos_resp.json()
                for repo in body.get("repositories", []):
                    repos.append(
                        {
                            "full_name": repo["full_name"],
                            "name": repo["name"],
                            "private": repo["private"],
                            "installation_id": inst_id,
                        }
                    )
                if len(body.get("repositories", [])) < 100:
                    break
                page += 1

    return repos
