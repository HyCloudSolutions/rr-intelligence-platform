variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "restaurantrisk"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "backend_image" {
  description = "Docker image URI for the FastAPI backend/ML worker"
  type        = string
  default     = "nginx:alpine" # Default placeholder for initial spinup
}

variable "ml_cron_schedule" {
  description = "EventBridge cron expression for ML batch scoring"
  type        = string
  default     = "cron(0 2 * * ? *)" # 2:00 AM UTC every day
}

variable "mapbox_access_token" {
  description = "Mapbox Access Token for routing optimization"
  type        = string
  default     = ""
}

