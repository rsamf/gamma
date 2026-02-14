data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ECS Task Execution Role (used by ECS agent to pull images, get secrets)
resource "aws_iam_role" "ecs_execution" {
  name = "gamma-ecs-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_default" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "secrets-access"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue"
      ]
      Resource = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:gamma/*"
    }]
  })
}

# ECS Task Role (used by the application at runtime)
resource "aws_iam_role" "ecs_task" {
  name = "gamma-ecs-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

# S3 access for artifact management
resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "s3-artifact-access"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ]
      Resource = [
        var.artifact_bucket_arn,
        "${var.artifact_bucket_arn}/*"
      ]
    }]
  })
}

# SageMaker read access for job status queries
resource "aws_iam_role_policy" "ecs_task_sagemaker" {
  name = "sagemaker-read-access"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "sagemaker:DescribeTrainingJob",
        "sagemaker:ListTrainingJobs"
      ]
      Resource = "*"
    }]
  })
}
