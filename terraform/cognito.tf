# ------------------------------------------------------------------------------
# 4. AWS Cognito (Production B2B Auth)
# ------------------------------------------------------------------------------

resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  schema {
    name                     = "tenant_id"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = false
    string_attribute_constraints {
      min_length = 1
      max_length = 36
    }
  }

  tags = {
    Name        = "${var.project_name} User Pool"
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool_client" "nextjs_client" {
  name         = "${var.project_name}-${var.environment}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = true
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

resource "aws_cognito_user_group" "superadmin" {
  name         = "superadmin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "System-wide SuperAdmins capable of provisioning new tenants"
}

resource "aws_cognito_user_group" "director" {
  name         = "director"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Municipal Public Health Directors"
}

resource "aws_cognito_user_group" "inspector" {
  name         = "inspector"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Field Inspectors restricted to their tenant's daily queues"
}
