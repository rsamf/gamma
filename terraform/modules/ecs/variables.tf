variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "gamma_ecr_repo_url" {
  type = string
}

variable "mlflow_ecr_repo_url" {
  type = string
}

variable "execution_role_arn" {
  type = string
}

variable "task_role_arn" {
  type = string
}

variable "gamma_image_tag" {
  type    = string
  default = "latest"
}

variable "mlflow_image_tag" {
  type    = string
  default = "latest"
}

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

variable "artifact_bucket" {
  type = string
}
