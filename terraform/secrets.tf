# COGNITO_CLIENT_ID
resource "aws_secretsmanager_secret" "cognito_client_id" {
  name = ""
}
resource "aws_secretsmanager_secret_version" "cognito_client_id" {
  secret_id     = aws_secretsmanager_secret.cognito_client_id.id
  secret_string = aws_cognito_user_pool_client.client.id
}

# COGNITO_CLIENT_SECRET
resource "aws_secretsmanager_secret" "cognito_client_secret" {
  name = ""
}
resource "aws_secretsmanager_secret_version" "cognito_client_secret" {
  secret_id     = aws_secretsmanager_secret.cognito_client_secret.id
  secret_string = aws_cognito_user_pool_client.client.client_secret
}

# COGNITO_USER_POOL_ID
resource "aws_secretsmanager_secret" "cognito_user_pool_id" {
  name = ""
}
resource "aws_secretsmanager_secret_version" "cognito_user_pool_id" {
  secret_id     = aws_secretsmanager_secret.cognito_user_pool_id.id
  secret_string = aws_cognito_user_pool.user_pool.id
}

# REDIS_USERNAME
resource "aws_secretsmanager_secret" "redis_username" {
  name = ""
}
resource "aws_secretsmanager_secret_version" "redis_username" {
  secret_id     = aws_secretsmanager_secret.redis_username.id
  secret_string = var.redis_username
}

# REDIS_PASSWORD
resource "aws_secretsmanager_secret" "redis_password" {
  name = ""
}
resource "aws_secretsmanager_secret_version" "redis_password" {
  secret_id     = aws_secretsmanager_secret.redis_password.id
  secret_string = var.redis_password
}

# POSTGRES_USERNAME
resource "aws_secretsmanager_secret" "postgres_username" {
  name = ""
}
resource "aws_secretsmanager_secret_version" "postgres_username" {
  secret_id     = aws_secretsmanager_secret.postgres_username.id
  secret_string = var.postgres_username
}

# POSTGRES_PASSWORD
resource "aws_secretsmanager_secret" "postgres_password" {
  name = ""
}
resource "aws_secretsmanager_secret_version" "postgres_password" {
  secret_id     = aws_secretsmanager_secret.postgres_password.id
  secret_string = var.postgres_password
}

# POSTGRES_DATABASE_NAME
resource "aws_secretsmanager_secret" "postgres_database_name" {
  name = ""
}
resource "aws_secretsmanager_secret_version" "postgres_database_name" {
  secret_id     = aws_secretsmanager_secret.postgres_database_name.id
  secret_string = var.postgres_database_name
}
