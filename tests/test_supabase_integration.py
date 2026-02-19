"""Integration tests — require live Supabase credentials in .env.

Run with:  uv run pytest -m integration
Skip with: uv run pytest -m "not integration"
"""
import pytest


@pytest.mark.integration
def test_supabase_admin_connection():
    """Admin client initialises successfully with the secret key.

    Note: queries against app tables (e.g. 'projects') will fail with PGRST205
    until the DB schema has been applied (see db/001_schema.sql).
    """
    from gamma.db.client import get_supabase_admin_client

    get_supabase_admin_client.cache_clear()
    try:
        # If this raises SupabaseException("Invalid API key") the secret key
        # format is not supported by the installed SDK version.
        client = get_supabase_admin_client()
        assert client is not None
        assert str(client.supabase_url).startswith("https://")
    finally:
        get_supabase_admin_client.cache_clear()


@pytest.mark.integration
def test_supabase_admin_can_access_auth():
    """Admin client can access auth.admin (requires secret key, not anon key)."""
    from gamma.db.client import get_supabase_admin_client

    get_supabase_admin_client.cache_clear()
    try:
        client = get_supabase_admin_client()
        # list_users returns a paginated response — just verifying no auth error
        result = client.auth.admin.list_users()
        assert result is not None
    finally:
        get_supabase_admin_client.cache_clear()


@pytest.mark.integration
def test_supabase_admin_can_get_user_by_id():
    """Admin client can look up a user by ID (the call made by the GitHub repos route).

    If this fails with 401, the admin client is not using the secret key.
    Uses the first user returned by list_users as the test subject.
    Skips if there are no users in the project.
    """
    from gamma.db.client import get_supabase_admin_client

    get_supabase_admin_client.cache_clear()
    try:
        client = get_supabase_admin_client()
        users = client.auth.admin.list_users()
        if not users:
            pytest.skip("No users in Supabase project — create a user first")
        user_id = users[0].id
        result = client.auth.admin.get_user_by_id(user_id)
        assert result is not None
        assert result.user is not None
        assert result.user.id == user_id
    finally:
        get_supabase_admin_client.cache_clear()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_github_repos_endpoint():
    """End-to-end: GET /api/github/repos returns repos for the first GitHub-linked user.

    Requires:
      - SUPABASE_SECRET_KEY in .env (for admin auth lookup)
      - GITHUB_APP_ID + GITHUB_APP_PRIVATE_KEY in .env (for App JWT)
      - At least one Supabase user who authenticated via GitHub OAuth
    Skips if no GitHub-linked user is found.
    """
    from httpx import AsyncClient, ASGITransport
    from gamma.main import app
    from gamma.db.client import get_supabase_admin_client

    get_supabase_admin_client.cache_clear()
    try:
        admin = get_supabase_admin_client()
        users = admin.auth.admin.list_users()

        github_user = next(
            (u for u in users if u.app_metadata.get("provider") == "github"),
            None,
        )
        if github_user is None:
            pytest.skip("No GitHub-linked user found — sign in via GitHub first")

        # Verify GitHub App credentials are configured (not placeholders)
        from gamma.services.github_service import GitHubService
        import jwt as _jwt

        try:
            GitHubService()._generate_jwt()
        except _jwt.exceptions.InvalidKeyError:
            pytest.skip("GITHUB_APP_PRIVATE_KEY in .env is missing or invalid")

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            resp = await ac.get(f"/api/github/repos?owner_id={github_user.id}")

        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        for repo in data:
            assert "full_name" in repo
            assert "installation_id" in repo
    finally:
        get_supabase_admin_client.cache_clear()
