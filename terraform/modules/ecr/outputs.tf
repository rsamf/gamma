output "gamma_repository_url" {
  value = aws_ecr_repository.gamma.repository_url
}

output "mlflow_repository_url" {
  value = aws_ecr_repository.mlflow.repository_url
}

output "repository_arns" {
  value = [
    aws_ecr_repository.gamma.arn,
    aws_ecr_repository.mlflow.arn,
  ]
}
