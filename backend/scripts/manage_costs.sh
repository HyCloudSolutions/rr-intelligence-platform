#!/bin/bash
# Manage Costs for RestaurantRisk AWS Infrastructure

set -e

CLUSTER="restaurantrisk-prod-cluster"
SERVICE="restaurantrisk-prod-api-service"
RDS_DB="restaurantrisk-prod-db"

action=$1

if [ "$action" == "stop" ]; then
    echo "🛑 Scaling down ECS Service $SERVICE to 0..."
    aws ecs update-service --cluster $CLUSTER --service $SERVICE --desired-count 0 || echo "⚠️ ECS update skipped or failed."
    
    echo "🛑 Stopping RDS Database $RDS_DB..."
    aws rds stop-db-instance --db-instance-identifier $RDS_DB || echo "⚠️ RDS stop skipped or failed (Already stopped?)."
    
    echo "✅ Applied cost-saving stop. AWS won't charge for running time!"
elif [ "$action" == "start" ]; then
    echo "🚀 Starting RDS Database $RDS_DB..."
    aws rds start-db-instance --db-instance-identifier $RDS_DB || echo "⚠️ RDS start skipped or failed (Already started?)."
    
    echo "🚀 Scaling up ECS Service $SERVICE to 1 (Saving mode)..."
    aws ecs update-service --cluster $CLUSTER --service $SERVICE --desired-count 1 || echo "⚠️ ECS update skipped."
    
    echo "✅ Applied start-up. Wait ~5 mins for RDS to become available before testing!"
else
    echo "Usage: ./manage_costs.sh [start|stop]"
    exit 1
fi
