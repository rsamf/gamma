variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "artifact_bucket_name" {
  type        = string
  description = "S3 bucket for MLflow artifacts and model checkpoints"
}

variable "gamma_image_tag" {
  type    = string
  default = "latest"
}

variable "mlflow_image_tag" {
  type    = string
  default = "latest"
}

# Secrets Manager ARNs — these must be created manually before Terraform runs
variable "supabase_url_secret_arn" {
  type = string
}

variable "supabase_key_secret_arn" {
  type = string
}

variable "supabase_service_key_secret_arn" {
  type = string
}

variable "github_app_private_key_arn" {
  type = string
}

variable "github_webhook_secret_arn" {
  type = string
}

variable "anthropic_api_key_arn" {
  type = string
}

variable "mlflow_backend_uri_secret_arn" {
  type = string
}
