#!/bin/bash

# Switch Traffic Script for Blue-Green Deployment
# Usage: ./scripts/switch-traffic.sh [blue|green]

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

# Validate input
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please specify environment (blue or green)${NC}"
    echo "Usage: $0 [blue|green]"
    exit 1
fi

TARGET_ENV="$1"

if [ "$TARGET_ENV" != "blue" ] && [ "$TARGET_ENV" != "green" ]; then
    echo -e "${RED}Error: Invalid environment. Use 'blue' or 'green'${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Switching traffic to ${TARGET_ENV^^}${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if target container is healthy
echo -e "\n${YELLOW}Checking ${TARGET_ENV} container health...${NC}"
CONTAINER_NAME="uvcoatedclubflyers-app-${TARGET_ENV}"

if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}Error: Container $CONTAINER_NAME is not running${NC}"
    exit 1
fi

if ! docker exec $CONTAINER_NAME curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${RED}Error: Container $CONTAINER_NAME is not healthy${NC}"
    exit 1
fi

echo -e "${GREEN}Container is healthy!${NC}"

# Backup current config
echo -e "\n${YELLOW}Backing up current configuration...${NC}"
cp "$UPSTREAM_CONF" "$UPSTREAM_CONF.backup"

# Update upstream configuration
echo -e "\n${YELLOW}Updating Nginx upstream to ${TARGET_ENV}...${NC}"

if [ "$TARGET_ENV" = "blue" ]; then
    cat > "$UPSTREAM_CONF" << 'EOF'
# Blue-Green Upstream Configuration
# Active: BLUE

upstream uvcoated_app {
    server uvcoatedclubflyers-app-blue:3000;
    keepalive 32;
}

# Green environment (inactive)
# upstream uvcoated_app {
#     server uvcoatedclubflyers-app-green:3000;
#     keepalive 32;
# }
EOF
else
    cat > "$UPSTREAM_CONF" << 'EOF'
# Blue-Green Upstream Configuration
# Active: GREEN

# Blue environment (inactive)
# upstream uvcoated_app {
#     server uvcoatedclubflyers-app-blue:3000;
#     keepalive 32;
# }

upstream uvcoated_app {
    server uvcoatedclubflyers-app-green:3000;
    keepalive 32;
}
EOF
fi

# Test Nginx configuration
echo -e "\n${YELLOW}Testing Nginx configuration...${NC}"
if ! docker exec uvcoatedclubflyers-nginx nginx -t; then
    echo -e "${RED}Error: Nginx configuration test failed${NC}"
    echo -e "${YELLOW}Restoring backup...${NC}"
    mv "$UPSTREAM_CONF.backup" "$UPSTREAM_CONF"
    exit 1
fi

# Reload Nginx
echo -e "\n${YELLOW}Reloading Nginx...${NC}"
docker exec uvcoatedclubflyers-nginx nginx -s reload

# Verify switch
echo -e "\n${YELLOW}Verifying traffic switch...${NC}"
sleep 2

if curl -sf http://localhost:3015/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}Traffic successfully switched to ${TARGET_ENV^^}!${NC}"
else
    echo -e "${RED}Warning: Health check failed after switch${NC}"
    echo -e "${YELLOW}You may want to rollback: ./scripts/rollback.sh${NC}"
fi

# Clean up backup
rm -f "$UPSTREAM_CONF.backup"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Traffic now routing to ${TARGET_ENV^^}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "To rollback, run:"
echo -e "  ${BLUE}./scripts/rollback.sh${NC}"
