resource "aws_elasticache_subnet_group" "redis" {
  name = ""
  subnet_ids = [
    data.aws_subnet.public_subnet_1.id,
    data.aws_subnet.public_subnet_2.id,
  ]
}

resource "aws_elasticache_user" "app" {
  engine        = "redis"
  user_id       = var.redis_username
  user_name     = var.redis_username
  passwords     = [var.redis_password]
  access_string = "on ~* +@all"
}

resource "aws_elasticache_user_group" "app" {
  engine        = "redis"
  user_group_id = ""
  user_ids = [
    "default",
    aws_elasticache_user.app.user_id
  ]
}

resource "aws_elasticache_parameter_group" "redis" {
  name        = ""
  family      = "redis7"
  description = ""
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = ""
  description          = ""
  engine               = "redis"
  engine_version       = "7.1"

  node_type = "cache.t4g.micro"

  transit_encryption_enabled = true
  at_rest_encryption_enabled = true

  port               = var.redis_port
  security_group_ids = [data.aws_security_group.cab432_security_group.id]
  subnet_group_name  = aws_elasticache_subnet_group.redis.name

  user_group_ids       = [aws_elasticache_user_group.app.user_group_id]
  parameter_group_name = aws_elasticache_parameter_group.redis.name

  snapshot_retention_limit   = 0
  auto_minor_version_upgrade = true
}
