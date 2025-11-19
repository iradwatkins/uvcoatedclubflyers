#!/bin/bash

# VPS Initial Setup Script for UV Coated Club Flyers
# Run this once on a fresh VPS to set up the deployment environment

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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  UV Coated Club Flyers - VPS Setup${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Step 1: Install Docker if not present
echo -e "\n${YELLOW}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker installed successfully${NC}"
else
    echo -e "${GREEN}Docker is already installed${NC}"
fi

# Step 2: Install Docker Compose if not present
echo -e "\n${YELLOW}Step 2: Checking Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose installed successfully${NC}"
else
    echo -e "${GREEN}Docker Compose is already installed${NC}"
fi

# Step 3: Create project directory
echo -e "\n${YELLOW}Step 3: Setting up project directory...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}Project directory exists. Pulling latest changes...${NC}"
    cd "$PROJECT_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# Step 4: Create secrets directory
echo -e "\n${YELLOW}Step 4: Setting up secrets...${NC}"
if [ ! -d "$PROJECT_DIR/secrets" ]; then
    mkdir -p "$PROJECT_DIR/secrets"
    echo -e "${RED}IMPORTANT: You need to create the following secret files in $PROJECT_DIR/secrets/:${NC}"
    echo "  - db_password.txt"
    echo "  - redis_password.txt"
    echo "  - minio_access_key.txt"
    echo "  - minio_secret_key.txt"
    echo "  - square_access_token.txt"
    echo "  - square_sandbox_access_token.txt"
    echo "  - paypal_client_id.txt"
    echo "  - paypal_client_secret.txt"
    echo "  - nextauth_secret.txt"
    echo "  - google_client_id.txt"
    echo "  - google_client_secret.txt"
    echo "  - vaultwarden_admin_token.txt"
fi

# Step 5: Set permissions
echo -e "\n${YELLOW}Step 5: Setting permissions...${NC}"
chmod +x "$PROJECT_DIR/scripts/"*.sh
chmod 600 "$PROJECT_DIR/secrets/"* 2>/dev/null || true

# Step 6: Create Docker network
echo -e "\n${YELLOW}Step 6: Creating Docker network...${NC}"
docker network create uvcoatedclubflyers-network 2>/dev/null || echo "Network already exists"

# Step 7: Start shared services
echo -e "\n${YELLOW}Step 7: Starting shared services...${NC}"
cd "$PROJECT_DIR"
docker-compose -f docker-compose.shared.yml up -d

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Step 8: Deploy initial blue environment
echo -e "\n${YELLOW}Step 8: Deploying initial blue environment...${NC}"
./scripts/deploy.sh blue

# Step 9: Switch traffic to blue
echo -e "\n${YELLOW}Step 9: Switching traffic to blue...${NC}"
./scripts/switch-traffic.sh blue

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  VPS Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Your application is now running at:"
echo -e "  ${BLUE}http://your-server-ip:3015${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Configure your domain DNS to point to this server"
echo -e "  2. Set up SSL with Let's Encrypt (recommended)"
echo -e "  3. Configure firewall rules"
echo ""
echo -e "For future deployments, run:"
echo -e "  ${BLUE}cd $PROJECT_DIR && ./scripts/deploy.sh${NC}"
