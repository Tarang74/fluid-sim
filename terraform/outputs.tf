# AWS
output "aws_region" {
  value = var.aws_region
}

# ECR repositories
output "api_ecr_repo_url" {
  value = aws_ecr_repository.api_repository.repository_url
}
output "render_ecr_repo_url" {
  value = aws_ecr_repository.render_repository.repository_url
}
output "websocket_ecr_repo_url" {
  value = aws_ecr_repository.websocket_repository.repository_url
}
output "postgres_ecr_repo_url" {
  value = aws_ecr_repository.postgres_repository.repository_url
}

# Private IP addresses
output "api_private_ip" {
  value = aws_instance.api_instance.private_ip
}
output "postgres_private_ip" {
  value = aws_instance.postgres_instance.private_ip
}

# Instance IDs
output "api_instance_id" {
  value = aws_instance.api_instance.id
}
output "postgres_instance_id" {
  value = aws_instance.postgres_instance.id
}

# Port mappings
output "api_port_host" {
  value = var.api_port_host
}
output "api_port_container" {
  value = var.api_port_container
}
output "postgres_port_host" {
  value = var.postgres_port_host
}
output "postgres_port_container" {
  value = var.postgres_port_container
}
output "render_port" {
  value = var.render_port
}
output "websocket_port" {
  value = var.websocket_port
}

# Redis
output "redis_elasticache_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}
output "redis_elasticache_port" {
  value = var.redis_port
}
output "redis_database_url" {
  sensitive = true
  value     = "redis://${var.redis_username}:${var.redis_password}@${aws_elasticache_replication_group.redis.primary_endpoint_address}:${var.redis_port}/0"
}

# PostgreSQL
output "postgres_database_url" {
  sensitive = true
  value     = "postgresql://${var.postgres_username}:${var.postgres_password}@${var.postgres_private_ip}:${var.postgres_port_host}/${var.postgres_database_name}"
}

# CloudFront
output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.static_assets.id
}
