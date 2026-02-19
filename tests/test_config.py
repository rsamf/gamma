"""Unit tests for Settings configuration."""
import pytest
from unittest.mock import patch


def test_settings_fields_exist():
    """Settings has all required fields with the correct names."""
    from gamma.config import Settings
    s = Settings()
    assert hasattr(s, "app_name")
    assert hasattr(s, "supabase_url")
    assert hasattr(s, "supabase_key")
    assert hasattr(s, "supabase_secret_key")
    assert hasattr(s, "github_app_id")
    assert hasattr(s, "github_app_private_key")
    assert hasattr(s, "s3_default_bucket")
    assert hasattr(s, "anthropic_api_key")
    # app_name has no override in .env so the coded default holds
    assert s.app_name == "Gamma"


def test_settings_reads_env_vars():
    """Settings picks up values from environment variables."""
    env = {
        "SUPABASE_URL": "https://test.supabase.co",
        "SUPABASE_KEY": "anon-key",
        "SUPABASE_SECRET_KEY": "sb_secret_test",
        "GITHUB_APP_ID": "12345",
        "S3_DEFAULT_BUCKET": "my-bucket",
    }
    with patch.dict("os.environ", env, clear=False):
        from gamma.config import Settings
        s = Settings()
        assert s.supabase_url == "https://test.supabase.co"
        assert s.supabase_key == "anon-key"
        assert s.supabase_secret_key == "sb_secret_test"
        assert s.github_app_id == "12345"
        assert s.s3_default_bucket == "my-bucket"
