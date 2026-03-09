# ------------------------------------------------------------------------------
# 3. ML Batch Scoring Job & EventBridge
# ------------------------------------------------------------------------------

resource "aws_ecs_task_definition" "ml_batch" {
  family                   = "${var.project_name}-${var.environment}-ml-batch"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 2048 # PyTorch requires more CPU
  memory                   = 4096 # and memory for model inference
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "ml-batch"
      image     = var.backend_image
      essential = true
      command   = ["python", "-m", "jobs.batch_score"]
      environment = [
        { name = "DATABASE_URL", value = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}" }
      ]
    }
  ])
}

resource "aws_iam_role" "eventbridge_ecs" {
  name = "${var.project_name}-${var.environment}-eventbridge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "eventbridge_ecs_policy" {
  name = "${var.project_name}-${var.environment}-eventbridge-policy"
  role = aws_iam_role.eventbridge_ecs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "ecs:RunTask"
        Resource = aws_ecs_task_definition.ml_batch.arn
      },
      {
        Effect = "Allow"
        Action = "iam:PassRole"
        Resource = aws_iam_role.ecs_task_execution_role.arn
      }
    ]
  })
}

resource "aws_cloudwatch_event_rule" "nightly_ml_scoring" {
  name                = "${var.project_name}-${var.environment}-nightly-ml"
  description         = "Triggers the nightly PyTorch ML batch scoring ECS task"
  schedule_expression = var.ml_cron_schedule
}

resource "aws_cloudwatch_event_target" "ecs_ml_task" {
  target_id = "${var.project_name}-${var.environment}-ml-target"
  rule      = aws_cloudwatch_event_rule.nightly_ml_scoring.name
  arn       = aws_ecs_cluster.main.arn
  role_arn  = aws_iam_role.eventbridge_ecs.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.ml_batch.arn
    launch_type         = "FARGATE"
    
    network_configuration {
      subnets          = data.aws_subnets.default.ids
      security_groups  = [aws_security_group.ecs_tasks.id]
      assign_public_ip = true
    }
  }
}
