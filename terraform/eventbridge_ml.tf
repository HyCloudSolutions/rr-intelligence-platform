# ------------------------------------------------------------------------------
# ML Batch Scoring — AWS Lambda (Container Image) + EventBridge
#
# Replaces the previous ECS Fargate Task approach with a Docker-based
# Lambda function. The same image can be reused for ECS Fargate later
# if we outgrow Lambda's 15-minute timeout.
# ------------------------------------------------------------------------------

# ─── IAM Role for the Lambda Function ──────────────────────────────────────────

resource "aws_iam_role" "ml_lambda_execution" {
  name = "${var.project_name}-${var.environment}-ml-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Basic Lambda execution (CloudWatch Logs)
resource "aws_iam_role_policy_attachment" "ml_lambda_basic" {
  role       = aws_iam_role.ml_lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# VPC access so the Lambda can reach the private RDS instance
resource "aws_iam_role_policy_attachment" "ml_lambda_vpc" {
  role       = aws_iam_role.ml_lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# ─── Lambda Function (Docker Container Image) ─────────────────────────────────

resource "aws_lambda_function" "ml_scorer" {
  function_name = "${var.project_name}-${var.environment}-nightly-ml-scorer"
  role          = aws_iam_role.ml_lambda_execution.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.ml_scorer.repository_url}:latest"
  timeout       = 900 # 15 minutes (max Lambda timeout)
  memory_size   = 1024

  vpc_config {
    subnet_ids         = data.aws_subnets.default.ids
    security_group_ids = [aws_security_group.ecs_tasks.id]
  }

  environment {
    variables = {
      DATABASE_URL = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
    }
  }

  tags = {
    Name        = "${var.project_name} Nightly ML Scorer"
    Environment = var.environment
  }

  # Ignore changes to the image_uri so that CI/CD can push new images
  # without Terraform trying to revert them
  lifecycle {
    ignore_changes = [image_uri]
  }
}

# ─── EventBridge Cron Schedule ─────────────────────────────────────────────────

resource "aws_cloudwatch_event_rule" "nightly_ml_scoring" {
  name                = "${var.project_name}-${var.environment}-nightly-ml"
  description         = "Triggers the nightly ML risk scorer Lambda daily"
  schedule_expression = var.ml_cron_schedule
}

resource "aws_cloudwatch_event_target" "lambda_ml_target" {
  target_id = "${var.project_name}-${var.environment}-ml-lambda-target"
  rule      = aws_cloudwatch_event_rule.nightly_ml_scoring.name
  arn       = aws_lambda_function.ml_scorer.arn
}

# Grant EventBridge permission to invoke the Lambda
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ml_scorer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.nightly_ml_scoring.arn
}
