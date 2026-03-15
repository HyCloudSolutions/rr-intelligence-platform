#!/bin/bash
# Production Deployment Script for RestaurantRisk Backend

set -e

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="371153570838"
ECR_REPO_NAME="restaurantrisk-prod-backend"
ECS_CLUSTER="restaurantrisk-prod-cluster"
ECS_SERVICE="restaurantrisk-prod-api-service"

ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE_NAME="${ECR_URL}/${ECR_REPO_NAME}:latest"

echo "🚀 Starting Production Deployment..."

# 1. Login to ECR
echo "🔑 Logging in to Amazon ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URL}

# 2. Build the Docker Image
echo "📦 Building Docker image..."
# Use physical architecture (linux/amd64) for ECS Fargate
cd backend
docker build --platform linux/amd64 -t ${ECR_REPO_NAME}:latest .
cd ..

# 3. Tag and Push to ECR
echo "🏷️ Tagging and Pushing image to ECR..."
docker tag ${ECR_REPO_NAME}:latest ${FULL_IMAGE_NAME}
docker push ${FULL_IMAGE_NAME}

# 4. Trigger ECS Deployment
echo "🚢 Updating ECS Service to pick up new image..."
aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE} --force-new-deployment

echo "✅ Deployment successful! Backend is updating."
