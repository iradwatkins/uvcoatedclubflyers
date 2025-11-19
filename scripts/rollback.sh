#!/bin/bash

# Rollback Script for Blue-Green Deployment
# Switches traffic to the inactive environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/uvcoatedclubflyers"
UPSTREAM_CONF="$PROJECT_DIR/nginx/conf.d/upstream.conf"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Rolling back deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# Determine current active environment
if grep -q "^upstream" "$UPSTREAM_CONF" && grep -q "uvcoated-app-blue" "$UPSTREAM_CONF"; then
    # Check if blue is active (not commented)
    if grep "uvcoated-app-blue" "$UPSTREAM_CONF" | head -1 | grep -qv "^#"; then
        CURRENT_ENV="blue"
        TARGET_ENV="green"
    else
        CURRENT_ENV="green"
        TARGET_ENV="blue"
    fi
else
    echo -e "${RED}Error: Cannot determine current active environment${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Current active environment: ${CURRENT_ENV^^}${NC}"
echo -e "${YELLOW}Rolling back to: ${TARGET_ENV^^}${NC}"

# Check if target container is running
CONTAINER_NAME="uvcoated-app-${TARGET_ENV}"

if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}Error: Container $CONTAINER_NAME is not running${NC}"
    echo -e "${YELLOW}Cannot rollback - previous environment is not available${NC}"
    exit 1
fi

# Check if target container is healthy
if ! docker exec $CONTAINER_NAME curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${RED}Error: Container $CONTAINER_NAME is not healthy${NC}"
    echo -e "${YELLOW}Cannot rollback to unhealthy container${NC}"
    exit 1
fi

echo -e "${GREEN}Rollback target is healthy!${NC}"

# Switch traffic
echo -e "\n${YELLOW}Switching traffic to ${TARGET_ENV}...${NC}"
./scripts/switch-traffic.sh $TARGET_ENV

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Rollback complete!${NC}"
echo -e "${GREEN}  Traffic now routing to ${TARGET_ENV^^}${NC}"
echo -e "${GREEN}========================================${NC}"
