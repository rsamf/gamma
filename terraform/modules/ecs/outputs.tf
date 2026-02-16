output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "gamma_service_name" {
  value = aws_ecs_service.gamma.name
}

output "mlflow_service_name" {
  value = aws_ecs_service.mlflow.name
}

output "cluster_name" {
  value = aws_ecs_cluster.main.name
}
