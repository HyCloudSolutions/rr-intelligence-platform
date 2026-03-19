#!/bin/bash
# deploy_lambda.sh
# Builds the ML scorer Docker image and pushes it to ECR.
# Infrastructure (Lambda function, IAM, EventBridge) is managed by Terraform.
#
# Usage:
#   ./backend/scripts/deploy_lambda.sh          # from project root
#   ./scripts/deploy_lambda.sh                  # from backend/

set -e

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="371153570838"
ECR_REPO_NAME="restaurantrisk-prod-ml-scorer"
IMAGE_TAG="latest"

ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE="${ECR_URL}/${ECR_REPO_NAME}:${IMAGE_TAG}"

# Resolve the backend directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🚀 ML Scorer — Build & Push"
echo "   Image: ${FULL_IMAGE}"
echo ""

# ──────────────────────────────────────────────
# 1. Authenticate Docker with ECR
# ──────────────────────────────────────────────
echo "🔑 Logging in to Amazon ECR..."
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${ECR_URL}

# ──────────────────────────────────────────────
# 2. Build Docker Image
# ──────────────────────────────────────────────
echo "🐳 Building Docker image from Dockerfile.ml..."
docker build --platform linux/amd64 \
  -f "${BACKEND_DIR}/Dockerfile.ml" \
  -t ${ECR_REPO_NAME}:${IMAGE_TAG} \
  "${BACKEND_DIR}"

# ──────────────────────────────────────────────
# 3. Tag and Push to ECR
# ──────────────────────────────────────────────
echo "🏷️  Tagging and pushing image to ECR..."
docker tag ${ECR_REPO_NAME}:${IMAGE_TAG} ${FULL_IMAGE}
docker push ${FULL_IMAGE}

# ──────────────────────────────────────────────
# 4. Update the Lambda to use the new image
# ──────────────────────────────────────────────
LAMBDA_FUNCTION_NAME="restaurantrisk-prod-nightly-ml-scorer"
echo "⚡ Updating Lambda function code..."
aws lambda update-function-code \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --image-uri ${FULL_IMAGE} \
  --region ${AWS_REGION} > /dev/null

echo ""
echo "✅ Deployment complete!"
echo ""
echo "To test manually:"
echo "   aws lambda invoke --function-name ${LAMBDA_FUNCTION_NAME} --region ${AWS_REGION} /tmp/ml_output.json && cat /tmp/ml_output.json"
