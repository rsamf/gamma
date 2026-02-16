environment          = "dev"
aws_region           = "us-east-1"
vpc_cidr             = "10.0.0.0/16"
artifact_bucket_name = "gamma-artifacts-dev"

# Replace with actual Secrets Manager ARNs after creating secrets
supabase_url_secret_arn         = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/supabase-url"
supabase_key_secret_arn         = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/supabase-key"
supabase_service_key_secret_arn = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/supabase-service-key"
github_app_private_key_arn      = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/github-app-key"
github_webhook_secret_arn       = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/github-webhook-secret"
anthropic_api_key_arn           = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/anthropic-api-key"
mlflow_backend_uri_secret_arn   = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/mlflow-backend-uri"
