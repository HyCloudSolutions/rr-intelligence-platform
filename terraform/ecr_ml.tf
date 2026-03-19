# ------------------------------------------------------------------------------
# ML Scorer Lambda — ECR Repository
# A dedicated ECR repo for the ML scorer Docker image, separate from the
# main backend API image.
# ------------------------------------------------------------------------------

resource "aws_ecr_repository" "ml_scorer" {
  name                 = "${var.project_name}-${var.environment}-ml-scorer"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name} ML Scorer ECR"
    Environment = var.environment
  }
}

resource "aws_ecr_lifecycle_policy" "ml_scorer_policy" {
  repository = aws_ecr_repository.ml_scorer.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 ML scorer images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

output "ml_scorer_ecr_url" {
  value       = aws_ecr_repository.ml_scorer.repository_url
  description = "The URL of the ML Scorer ECR repository"
}
