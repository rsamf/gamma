"""Unit tests for /api/github/repos endpoint."""
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from uuid import uuid4


OWNER_ID = str(uuid4())
GITHUB_LOGIN = "rsamf"

SAMPLE_INSTALLATION = {
    "id": 12345,
    "account": {"login": GITHUB_LOGIN},
}

SAMPLE_REPO = {
    "full_name": f"{GITHUB_LOGIN}/gamma",
    "name": "gamma",
    "private": False,
}


def _mock_supabase_user(login: str):
    mock = MagicMock()
    mock.auth.admin.get_user_by_id.return_value.user.user_metadata = {"user_name": login}
    return mock


def test_list_repos_returns_repos(client):
    mock_sb = _mock_supabase_user(GITHUB_LOGIN)

    with (
        patch("gamma.routers.github.get_supabase_admin_client", return_value=mock_sb),
        patch("gamma.routers.github.GitHubService") as mock_gh_cls,
        patch("gamma.routers.github.httpx.AsyncClient") as mock_http_cls,
    ):
        mock_gh = mock_gh_cls.return_value
        mock_gh._generate_jwt.return_value = "fake-jwt"

        http_client = AsyncMock()
        mock_http_cls.return_value.__aenter__ = AsyncMock(return_value=http_client)
        mock_http_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        # GET /app/installations
        inst_resp = MagicMock()
        inst_resp.json.return_value = [SAMPLE_INSTALLATION]

        # POST /app/installations/{id}/access_tokens
        token_resp = MagicMock()
        token_resp.json.return_value = {"token": "inst-token-abc"}

        # GET /installation/repositories
        repos_resp = MagicMock()
        repos_resp.json.return_value = {"repositories": [SAMPLE_REPO]}

        http_client.get = AsyncMock(side_effect=[inst_resp, repos_resp])
        http_client.post = AsyncMock(return_value=token_resp)

        resp = client.get(f"/api/github/repos?owner_id={OWNER_ID}")

    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["full_name"] == f"{GITHUB_LOGIN}/gamma"
    assert data[0]["installation_id"] == 12345


def test_list_repos_user_not_found(client):
    mock_sb = MagicMock()
    mock_sb.auth.admin.get_user_by_id.return_value.user = None

    with patch("gamma.routers.github.get_supabase_admin_client", return_value=mock_sb):
        resp = client.get(f"/api/github/repos?owner_id={OWNER_ID}")

    assert resp.status_code == 404


def test_list_repos_no_github_login(client):
    mock_sb = MagicMock()
    mock_sb.auth.admin.get_user_by_id.return_value.user.user_metadata = {}

    with patch("gamma.routers.github.get_supabase_admin_client", return_value=mock_sb):
        resp = client.get(f"/api/github/repos?owner_id={OWNER_ID}")

    assert resp.status_code == 400


def test_list_repos_no_matching_installation(client):
    """Returns empty list when no installation matches the user's login."""
    mock_sb = _mock_supabase_user(GITHUB_LOGIN)

    with (
        patch("gamma.routers.github.get_supabase_admin_client", return_value=mock_sb),
        patch("gamma.routers.github.GitHubService") as mock_gh_cls,
        patch("gamma.routers.github.httpx.AsyncClient") as mock_http_cls,
    ):
        mock_gh_cls.return_value._generate_jwt.return_value = "fake-jwt"

        http_client = AsyncMock()
        mock_http_cls.return_value.__aenter__ = AsyncMock(return_value=http_client)
        mock_http_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        inst_resp = MagicMock()
        inst_resp.json.return_value = [{"id": 99, "account": {"login": "someone-else"}}]
        http_client.get = AsyncMock(return_value=inst_resp)

        resp = client.get(f"/api/github/repos?owner_id={OWNER_ID}")

    assert resp.status_code == 200
    assert resp.json() == []
