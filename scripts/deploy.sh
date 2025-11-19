#!/bin/bash

# Blue-Green Deployment Script for UV Coated Club Flyers
# Usage: ./scripts/deploy.sh [blue|green]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/uvcoatedclubflyers"
REPO_URL="https://github.com/iradwatkins/uvcoatedclubflyers.git"

# Determine which environment to deploy to
get_inactive_env() {
    # Check which environment is currently active in nginx
    if grep -q "uvcoatedclubflyers-app-blue" "$PROJECT_DIR/nginx/conf.d/upstream.conf" | grep -v "^#"; then
        echo "green"
    else
        echo "blue"
    fi
}

# Get target environment
if [ -z "$1" ]; then
    TARGET_ENV=$(get_inactive_env)
    echo -e "${YELLOW}No environment specified, deploying to inactive environment: ${TARGET_ENV}${NC}"
else
    TARGET_ENV="$1"
fi

# Validate target environment
if [ "$TARGET_ENV" != "blue" ] && [ "$TARGET_ENV" != "green" ]; then
    echo -e "${RED}Error: Invalid environment. Use 'blue' or 'green'${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deploying to ${TARGET_ENV^^} environment${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Pull latest code
echo -e "\n${YELLOW}Step 1: Pulling latest code...${NC}"
cd "$PROJECT_DIR"
git fetch origin
git pull origin main

# Step 2: Build Docker image for target environment
echo -e "\n${YELLOW}Step 2: Building Docker image for ${TARGET_ENV}...${NC}"
docker-compose -f docker-compose.${TARGET_ENV}.yml build --no-cache

# Step 3: Stop existing container for this environment (if running)
echo -e "\n${YELLOW}Step 3: Stopping existing ${TARGET_ENV} container...${NC}"
docker-compose -f docker-compose.${TARGET_ENV}.yml down || true

# Step 4: Start new container
echo -e "\n${YELLOW}Step 4: Starting new ${TARGET_ENV} container...${NC}"
docker-compose -f docker-compose.${TARGET_ENV}.yml up -d

# Step 5: Wait for health check
echo -e "\n${YELLOW}Step 5: Waiting for health check...${NC}"
CONTAINER_NAME="uvcoatedclubflyers-app-${TARGET_ENV}"
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec $CONTAINER_NAME curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}Health check passed!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for container to be healthy... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}Error: Health check failed after $MAX_RETRIES attempts${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    docker-compose -f docker-compose.${TARGET_ENV}.yml down
    exit 1
fi

# Step 6: Run database migrations (if needed)
echo -e "\n${YELLOW}Step 6: Running database migrations...${NC}"
docker exec $CONTAINER_NAME npm run db:migrate || echo -e "${YELLOW}No migrations to run${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment to ${TARGET_ENV^^} complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "To switch traffic to ${TARGET_ENV}, run:"
echo -e "  ${BLUE}./scripts/switch-traffic.sh ${TARGET_ENV}${NC}"
echo ""
echo -e "To test before switching:"
echo -e "  ${BLUE}curl http://localhost:300$([ "$TARGET_ENV" = "blue" ] && echo "1" || echo "2")/api/health${NC}"
