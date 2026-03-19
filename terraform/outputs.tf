output "db_endpoint" {
  description = "The endpoint of the RDS PostgreSQL database"
  value       = aws_db_instance.postgres.endpoint
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "cognito_user_pool_id" {
  description = "The ID of the AWS Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "The ID of the AWS Cognito User Pool Client (Frontend)"
  value       = aws_cognito_user_pool_client.nextjs_client.id
}

output "api_service_name" {
  description = "The name of the API ECS service"
  value       = aws_ecs_service.api.name
}

output "cognito_client_secret" {
  description = "The secret of the AWS Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.nextjs_client.client_secret
  sensitive   = true
}
