data "cloudinit_config" "api_userdata" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    content      = file("${path.module}/cloud-init/cloud-config-always.yml")
  }

  part {
    content_type = "text/x-shellscript"
    content = templatefile("${path.module}/user-data/api_user_data.sh", {
      api_port_host      = var.api_port_host
      api_port_container = var.api_port_container

      redis_elasticache_endpoint = aws_elasticache_replication_group.redis.primary_endpoint_address
      redis_elasticache_port  = var.redis_port

      postgres_private_ip = var.postgres_private_ip
      postgres_port_host  = var.postgres_port_host

      ecr_repo_url = aws_ecr_repository.api_repository.repository_url
      aws_region   = var.aws_region
    })
  }
}

data "cloudinit_config" "postgres_userdata" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    content      = file("${path.module}/cloud-init/cloud-config-always.yml")
  }

  part {
    content_type = "text/x-shellscript"
    content = templatefile("${path.module}/user-data/postgres_user_data.sh", {
      postgres_port_host      = var.postgres_port_host
      postgres_port_container = var.postgres_port_container

      ecr_repo_url = aws_ecr_repository.postgres_repository.repository_url
      aws_region   = var.aws_region
    })
  }
}

