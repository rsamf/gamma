terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "gamma-terraform-state"
    key    = "gamma/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "gamma"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "networking" {
  source = "./modules/networking"

  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

module "ecr" {
  source = "./modules/ecr"

  environment = var.environment
}

module "s3" {
  source = "./modules/s3"

  environment = var.environment
  bucket_name = var.artifact_bucket_name
}

module "iam" {
  source = "./modules/iam"

  environment         = var.environment
  artifact_bucket_arn = module.s3.bucket_arn
  ecr_repository_arns = module.ecr.repository_arns
}

module "ecs" {
  source = "./modules/ecs"

  environment = var.environment
  vpc_id      = module.networking.vpc_id
  subnet_ids  = module.networking.private_subnet_ids
  public_subnet_ids = module.networking.public_subnet_ids

  gamma_ecr_repo_url  = module.ecr.gamma_repository_url
  mlflow_ecr_repo_url = module.ecr.mlflow_repository_url
  execution_role_arn  = module.iam.ecs_execution_role_arn
  task_role_arn       = module.iam.ecs_task_role_arn

  gamma_image_tag  = var.gamma_image_tag
  mlflow_image_tag = var.mlflow_image_tag

  # Secrets (ARNs from AWS Secrets Manager)
  supabase_url_secret_arn         = var.supabase_url_secret_arn
  supabase_key_secret_arn         = var.supabase_key_secret_arn
  supabase_service_key_secret_arn = var.supabase_service_key_secret_arn
  github_app_private_key_arn      = var.github_app_private_key_arn
  github_webhook_secret_arn       = var.github_webhook_secret_arn
  anthropic_api_key_arn           = var.anthropic_api_key_arn
  mlflow_backend_uri_secret_arn   = var.mlflow_backend_uri_secret_arn

  artifact_bucket = var.artifact_bucket_name
}
