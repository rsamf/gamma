import hashlib
import hmac
import time
from pathlib import Path

import httpx
import jwt

from gamma.config import get_settings


class GitHubService:
    """Client for GitHub App API interactions."""

    BASE_URL = "https://api.github.com"

    def __init__(self) -> None:
        self.settings = get_settings()

    def _generate_jwt(self) -> str:
        """Generate a JWT for GitHub App authentication."""
        now = int(time.time())
        payload = {
            "iat": now - 60,
            "exp": now + (10 * 60),
            "iss": self.settings.github_app_id,
        }
        raw = self.settings.github_app_private_key
        p = Path(raw).expanduser()
        if p.is_file():
            key = p.read_text()
        else:
            # Env vars may store literal \n; convert to real newlines for PEM parsing
            key = raw.replace("\\n", "\n")
        return jwt.encode(payload, key, algorithm="RS256")

    async def _get_installation_token(self, installation_id: int) -> str:
        """Get an installation access token for a specific GitHub App installation."""
        app_jwt = self._generate_jwt()
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.BASE_URL}/app/installations/{installation_id}/access_tokens",
                headers={
                    "Authorization": f"Bearer {app_jwt}",
                    "Accept": "application/vnd.github+json",
                },
            )
            resp.raise_for_status()
            return resp.json()["token"]

    async def get_repo_installation_id(self, owner: str, repo: str) -> int:
        """Get the GitHub App installation ID for a specific repo."""
        app_jwt = self._generate_jwt()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/installation",
                headers={
                    "Authorization": f"Bearer {app_jwt}",
                    "Accept": "application/vnd.github+json",
                },
            )
            resp.raise_for_status()
            return resp.json()["id"]

    async def get_commit_diff(
        self, installation_id: int, repo_full_name: str, commit_sha: str
    ) -> str:
        """Fetch the diff for a specific commit."""
        token = await self._get_installation_token(installation_id)
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/repos/{repo_full_name}/commits/{commit_sha}",
                headers={
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github.diff",
                },
            )
            resp.raise_for_status()
            return resp.text

    async def get_file_content(
        self,
        installation_id: int,
        repo_full_name: str,
        path: str,
        ref: str = "main",
    ) -> str:
        """Fetch file content from a repo."""
        token = await self._get_installation_token(installation_id)
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/repos/{repo_full_name}/contents/{path}",
                params={"ref": ref},
                headers={
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github.raw+json",
                },
            )
            resp.raise_for_status()
            return resp.text

    async def create_commit(
        self,
        installation_id: int,
        repo_full_name: str,
        branch: str,
        message: str,
        files: dict[str, str],
    ) -> dict:
        """Create a commit with the given file changes via the Git Data API."""
        token = await self._get_installation_token(installation_id)
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
        }

        async with httpx.AsyncClient() as client:
            # Get the current branch ref
            ref_resp = await client.get(
                f"{self.BASE_URL}/repos/{repo_full_name}/git/ref/heads/{branch}",
                headers=headers,
            )
            ref_resp.raise_for_status()
            current_sha = ref_resp.json()["object"]["sha"]

            # Get the current commit's tree
            commit_resp = await client.get(
                f"{self.BASE_URL}/repos/{repo_full_name}/git/commits/{current_sha}",
                headers=headers,
            )
            commit_resp.raise_for_status()
            base_tree_sha = commit_resp.json()["tree"]["sha"]

            # Create blobs for each file
            tree_items = []
            for path, content in files.items():
                blob_resp = await client.post(
                    f"{self.BASE_URL}/repos/{repo_full_name}/git/blobs",
                    headers=headers,
                    json={"content": content, "encoding": "utf-8"},
                )
                blob_resp.raise_for_status()
                tree_items.append(
                    {
                        "path": path,
                        "mode": "100644",
                        "type": "blob",
                        "sha": blob_resp.json()["sha"],
                    }
                )

            # Create a new tree
            tree_resp = await client.post(
                f"{self.BASE_URL}/repos/{repo_full_name}/git/trees",
                headers=headers,
                json={"base_tree": base_tree_sha, "tree": tree_items},
            )
            tree_resp.raise_for_status()

            # Create the commit
            new_commit_resp = await client.post(
                f"{self.BASE_URL}/repos/{repo_full_name}/git/commits",
                headers=headers,
                json={
                    "message": message,
                    "tree": tree_resp.json()["sha"],
                    "parents": [current_sha],
                },
            )
            new_commit_resp.raise_for_status()

            # Update the branch ref
            update_resp = await client.patch(
                f"{self.BASE_URL}/repos/{repo_full_name}/git/refs/heads/{branch}",
                headers=headers,
                json={"sha": new_commit_resp.json()["sha"]},
            )
            update_resp.raise_for_status()

            return new_commit_resp.json()

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify the GitHub webhook signature."""
        expected = hmac.new(
            self.settings.github_webhook_secret.encode(),
            payload,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(f"sha256={expected}", signature)
