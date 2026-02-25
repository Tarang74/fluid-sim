#!/bin/bash
set -uo pipefail

# Update dependencies and install Docker
apt update
apt install -y docker.io awscli

# Start docker services
systemctl enable docker
systemctl start docker

# Add docker to ubuntu group
usermod -aG docker ubuntu

# Get parameters from parameter store
POSTGRES_USERNAME=
POSTGRES_PASSWORD=
POSTGRES_DATABASE_NAME=

# Login to ECR
aws ecr get-login-password --region ${aws_region} | docker login --username AWS --password-stdin ${ecr_repo_url}

# Pull latest image
docker pull ${ecr_repo_url}:latest

# Check if SHA of existing container's image matches latest image
NEW_ID="$(docker image inspect -f '{{.Id}}' ${ecr_repo_url}:latest 2>/dev/null || echo '')"
OLD_ID="$(docker inspect -f '{{.Image}}' postgres 2>/dev/null || echo '')"

run_postgres() {
  docker rm postgres

  docker run -d \
    --name postgres \
    --restart always \
    -p ${postgres_port_host}:${postgres_port_container} \
    -e POSTGRES_USER=$POSTGRES_USERNAME \
    -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
    -e POSTGRES_DB=$POSTGRES_DATABASE_NAME \
    -v postgres_data:/var/lib/postgresql/data \
    ${ecr_repo_url}:latest
}

# First boot (no container) OR new image available
if [ -z "$OLD_ID" ] || [ "$NEW_ID" != "$OLD_ID" ]; then
  run_postgres
fi

