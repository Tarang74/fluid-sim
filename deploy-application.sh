#!/bin/bash 
set -euo pipefail

set -a
source .env
set +a

# Login to repository
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ecr get-login-password --region $AWS_REGION | \
docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build image
docker compose --env-file .env build

# Tag and push each image
docker compose push

