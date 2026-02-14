from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Gamma"
    debug: bool = False

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""  # anon/public key
    supabase_service_role_key: str = ""  # service role key for admin ops

    # GitHub App
    github_app_id: str = ""
    github_app_private_key: str = ""  # PEM-encoded private key
    github_webhook_secret: str = ""

    # MLflow
    mlflow_tracking_uri: str = "http://localhost:5000"

    # AWS
    aws_region: str = "us-east-1"
    s3_default_bucket: str = ""

    # Anthropic
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
