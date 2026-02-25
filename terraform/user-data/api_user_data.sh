#!/bin/bash
set -uo pipefail

# Update dependencies and install Docker + AWS CLI
apt update
apt install -y docker.io awscli

# Start docker services
systemctl enable docker
systemctl start docker

# Add docker to ubuntu group
usermod -aG docker ubuntu

# Login to ECR
aws ecr get-login-password --region ${aws_region} | docker login --username AWS --password-stdin ${ecr_repo_url}

# Pull latest image
docker pull ${ecr_repo_url}:latest

# Check if SHA of existing container's image matches latest image
NEW_ID="$(docker image inspect -f '{{.Id}}' ${ecr_repo_url}:latest 2>/dev/null || echo '')"
OLD_ID="$(docker inspect -f '{{.Image}}' api 2>/dev/null || echo '')"

run_api() {
  docker rm -f api

  docker run -d \
    --name api \
    --restart always \
    -p ${api_port_host}:${api_port_container} \
    -e AWS_REGION=${aws_region} \
    -e API_PORT_CONTAINER=${api_port_container} \
    -e REDIS_ELASTICACHE_ENDPOINT=${redis_elasticache_endpoint} \
    -e REDIS_ELASTICACHE_PORT=${redis_elasticache_port} \
    -e POSTGRES_PRIVATE_IP=${postgres_private_ip} \
    -e POSTGRES_PORT_HOST=${postgres_port_host} \
    -e NODE_ENV=production \
    ${ecr_repo_url}:latest
}

# First boot (no container) OR new image available
if [ -z "$OLD_ID" ] || [ "$NEW_ID" != "$OLD_ID" ]; then
  run_api
fi

