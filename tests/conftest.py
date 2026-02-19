import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from gamma.main import app
    return TestClient(app)
