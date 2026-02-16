resource "aws_ecs_cluster" "main" {
  name = "gamma-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "gamma-${var.environment}" }
}

# ──────────────── Security Groups ────────────────

resource "aws_security_group" "alb" {
  name_prefix = "gamma-alb-${var.environment}-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "gamma-alb-${var.environment}" }
}

resource "aws_security_group" "ecs" {
  name_prefix = "gamma-ecs-${var.environment}-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "gamma-ecs-${var.environment}" }
}

# ──────────────── Application Load Balancer ────────────────

resource "aws_lb" "main" {
  name               = "gamma-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  tags = { Name = "gamma-${var.environment}" }
}

resource "aws_lb_target_group" "gamma" {
  name        = "gamma-${var.environment}"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
  }
}

resource "aws_lb_target_group" "mlflow" {
  name        = "mlflow-${var.environment}"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.gamma.arn
  }
}

# Internal listener rule for MLflow (path-based routing)
resource "aws_lb_listener_rule" "mlflow" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.mlflow.arn
  }

  condition {
    path_pattern {
      values = ["/mlflow/*"]
    }
  }
}

# ──────────────── CloudWatch Log Groups ────────────────

resource "aws_cloudwatch_log_group" "gamma" {
  name              = "/ecs/gamma-${var.environment}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "mlflow" {
  name              = "/ecs/mlflow-${var.environment}"
  retention_in_days = 30
}

# ──────────────── Gamma Task Definition ────────────────

resource "aws_ecs_task_definition" "gamma" {
  family                   = "gamma-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([{
    name  = "gamma"
    image = "${var.gamma_ecr_repo_url}:${var.gamma_image_tag}"

    portMappings = [{
      containerPort = 8000
      protocol      = "tcp"
    }]

    secrets = [
      { name = "SUPABASE_URL", valueFrom = var.supabase_url_secret_arn },
      { name = "SUPABASE_KEY", valueFrom = var.supabase_key_secret_arn },
      { name = "SUPABASE_SERVICE_ROLE_KEY", valueFrom = var.supabase_service_key_secret_arn },
      { name = "GITHUB_APP_PRIVATE_KEY", valueFrom = var.github_app_private_key_arn },
      { name = "GITHUB_WEBHOOK_SECRET", valueFrom = var.github_webhook_secret_arn },
      { name = "ANTHROPIC_API_KEY", valueFrom = var.anthropic_api_key_arn },
    ]

    environment = [
      { name = "MLFLOW_TRACKING_URI", value = "http://localhost:5000" },
      { name = "AWS_REGION", value = "us-east-1" },
      { name = "S3_DEFAULT_BUCKET", value = var.artifact_bucket },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.gamma.name
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "gamma"
      }
    }
  }])
}

# ──────────────── MLflow Task Definition ────────────────

resource "aws_ecs_task_definition" "mlflow" {
  family                   = "mlflow-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([{
    name  = "mlflow"
    image = "${var.mlflow_ecr_repo_url}:${var.mlflow_image_tag}"

    portMappings = [{
      containerPort = 5000
      protocol      = "tcp"
    }]

    secrets = [
      { name = "MLFLOW_BACKEND_STORE_URI", valueFrom = var.mlflow_backend_uri_secret_arn },
    ]

    environment = [
      { name = "MLFLOW_ARTIFACT_ROOT", value = "s3://${var.artifact_bucket}/mlflow-artifacts/" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.mlflow.name
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "mlflow"
      }
    }
  }])
}

# ──────────────── ECS Services ────────────────

resource "aws_ecs_service" "gamma" {
  name            = "gamma-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.gamma.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.gamma.arn
    container_name   = "gamma"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener.http]
}

resource "aws_ecs_service" "mlflow" {
  name            = "mlflow-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.mlflow.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.mlflow.arn
    container_name   = "mlflow"
    container_port   = 5000
  }

  depends_on = [aws_lb_listener.http]
}
