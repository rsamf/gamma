output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.ecs.alb_dns_name
}

output "gamma_ecr_repository_url" {
  description = "ECR repository URL for Gamma"
  value       = module.ecr.gamma_repository_url
}

output "mlflow_ecr_repository_url" {
  description = "ECR repository URL for MLflow"
  value       = module.ecr.mlflow_repository_url
}

output "artifact_bucket_name" {
  description = "S3 bucket for artifacts"
  value       = module.s3.bucket_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}
