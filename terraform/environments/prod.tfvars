environment          = "prod"
aws_region           = "us-east-1"
vpc_cidr             = "10.1.0.0/16"
artifact_bucket_name = "gamma-artifacts-prod"

# Replace with actual Secrets Manager ARNs after creating secrets
supabase_url_secret_arn         = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/prod/supabase-url"
supabase_key_secret_arn         = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/prod/supabase-key"
supabase_service_key_secret_arn = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/prod/supabase-service-key"
github_app_private_key_arn      = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/prod/github-app-key"
github_webhook_secret_arn       = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/prod/github-webhook-secret"
anthropic_api_key_arn           = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/prod/anthropic-api-key"
mlflow_backend_uri_secret_arn   = "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:gamma/prod/mlflow-backend-uri"
