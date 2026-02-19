"""Unit tests for /api/projects endpoints."""
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from uuid import uuid4


OWNER_ID = str(uuid4())
PROJECT_ID = str(uuid4())

SAMPLE_PROJECT = {
    "id": PROJECT_ID,
    "owner_id": OWNER_ID,
    "name": "gamma",
    "github_repo_full_name": "rsamf/gamma",
    "github_installation_id": 99999,
    "s3_bucket": "test-bucket",
    "s3_prefix": "",
    "mlflow_experiment_name": None,
    "created_at": "2024-01-01T00:00:00+00:00",
    "updated_at": "2024-01-01T00:00:00+00:00",
}


def _mock_supabase(data):
    """Build a chainable Supabase client mock.

    Every query method (select/eq/order/single) returns the same query mock
    so any call order works. Only execute() breaks the chain and returns data.
    """
    client = MagicMock()
    query = MagicMock()

    # Make every chaining method return the same query mock
    query.select.return_value = query
    query.eq.return_value = query
    query.order.return_value = query
    query.single.return_value = query
    query.execute.return_value.data = data

    client.table.return_value = query

    # insert() is structurally separate — it doesn't chain through query
    insert_data = [data] if isinstance(data, dict) else (data or [])
    client.table.return_value.insert.return_value.execute.return_value.data = insert_data

    return client


def test_list_projects(client):
    with patch("gamma.routers.projects.get_supabase_admin_client", return_value=_mock_supabase([SAMPLE_PROJECT])):
        resp = client.get(f"/api/projects?owner_id={OWNER_ID}")
    assert resp.status_code == 200
    assert resp.json()[0]["name"] == "gamma"


def test_list_projects_empty(client):
    with patch("gamma.routers.projects.get_supabase_admin_client", return_value=_mock_supabase([])):
        resp = client.get("/api/projects")
    assert resp.status_code == 200
    assert resp.json() == []


def test_get_project(client):
    with patch("gamma.routers.projects.get_supabase_admin_client", return_value=_mock_supabase(SAMPLE_PROJECT)):
        resp = client.get(f"/api/projects/{PROJECT_ID}")
    assert resp.status_code == 200
    assert resp.json()["id"] == PROJECT_ID


def test_get_project_not_found(client):
    mock = _mock_supabase(None)
    mock.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None
    with patch("gamma.routers.projects.get_supabase_admin_client", return_value=mock):
        resp = client.get(f"/api/projects/{PROJECT_ID}")
    assert resp.status_code == 404


def test_create_project(client):
    mock_sb = _mock_supabase(SAMPLE_PROJECT)
    with (
        patch("gamma.routers.projects.get_supabase_admin_client", return_value=mock_sb),
        patch("gamma.routers.projects.get_settings") as mock_settings,
        patch("gamma.routers.projects.GitHubService") as mock_gh_cls,
    ):
        mock_settings.return_value.s3_default_bucket = "test-bucket"
        mock_gh = mock_gh_cls.return_value
        mock_gh.get_repo_installation_id = AsyncMock(return_value=99999)

        resp = client.post(
            f"/api/projects?owner_id={OWNER_ID}",
            json={"github_repo_full_name": "rsamf/gamma"},
        )

    assert resp.status_code == 201
    assert resp.json()["name"] == "gamma"


def test_delete_project(client):
    mock = MagicMock()
    mock.table.return_value.delete.return_value.eq.return_value.execute.return_value = None
    with patch("gamma.routers.projects.get_supabase_admin_client", return_value=mock):
        resp = client.delete(f"/api/projects/{PROJECT_ID}")
    assert resp.status_code == 204
