#!/bin/bash
# UV Coated Club Flyers - VPS Setup Script
# Run this script on your VPS to set up the project

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_msg() {
    echo -e "${2:-$GREEN}$1${NC}"
}

# Configuration
DOMAIN="uvcoatedclubflyers.com"
APP_PORT="3003"
PROJECT_DIR="/root/uvcoatedclubflyers"
REPO_URL="https://github.com/iradwatkins/uvcoatedclubflyers.git"
BRANCH="claude/docker-project-setup-01BDvbHsb9jdRr4jPK4YmZL3"

print_msg "========================================" "$BLUE"
print_msg "  UV Coated Club Flyers - VPS Setup" "$BLUE"
print_msg "========================================" "$BLUE"
echo ""

# Step 1: Install dependencies
print_msg "Step 1: Checking dependencies..." "$BLUE"
if ! command -v docker &> /dev/null; then
    print_msg "Installing Docker..." "$YELLOW"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v nginx &> /dev/null; then
    print_msg "Installing Nginx..." "$YELLOW"
    apt-get update
    apt-get install -y nginx
    systemctl enable nginx
fi

print_msg "Dependencies OK" "$GREEN"

# Step 2: Clone/update repository
print_msg "Step 2: Setting up project..." "$BLUE"
if [ -d "$PROJECT_DIR" ]; then
    print_msg "Updating existing project..." "$YELLOW"
    cd "$PROJECT_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    print_msg "Cloning project..." "$YELLOW"
    git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# Step 3: Set up secrets
print_msg "Step 3: Setting up secrets..." "$BLUE"
mkdir -p secrets

# Generate secrets if they don't exist
if [ ! -f "secrets/db_password.txt" ]; then
    openssl rand -base64 32 | tr -d '\n' > secrets/db_password.txt
    print_msg "  Generated db_password.txt" "$GREEN"
fi

if [ ! -f "secrets/redis_password.txt" ]; then
    openssl rand -base64 32 | tr -d '\n' > secrets/redis_password.txt
    print_msg "  Generated redis_password.txt" "$GREEN"
fi

if [ ! -f "secrets/minio_access_key.txt" ]; then
    openssl rand -base64 24 | tr -d '\n' > secrets/minio_access_key.txt
    print_msg "  Generated minio_access_key.txt" "$GREEN"
fi

if [ ! -f "secrets/minio_secret_key.txt" ]; then
    openssl rand -base64 32 | tr -d '\n' > secrets/minio_secret_key.txt
    print_msg "  Generated minio_secret_key.txt" "$GREEN"
fi

if [ ! -f "secrets/vaultwarden_admin_token.txt" ]; then
    openssl rand -base64 48 | tr -d '\n' > secrets/vaultwarden_admin_token.txt
    print_msg "  Generated vaultwarden_admin_token.txt" "$GREEN"
fi

if [ ! -f "secrets/nextauth_secret.txt" ]; then
    openssl rand -base64 48 | tr -d '\n' > secrets/nextauth_secret.txt
    print_msg "  Generated nextauth_secret.txt" "$GREEN"
fi

# Create placeholder files for API keys if they don't exist
for secret in square_access_token square_sandbox_access_token paypal_client_id paypal_client_secret google_client_id google_client_secret resend_api_key fedex_api_key fedex_secret_key; do
    if [ ! -f "secrets/${secret}.txt" ]; then
        echo "PLACEHOLDER_${secret^^}" > "secrets/${secret}.txt"
        print_msg "  Created placeholder: ${secret}.txt" "$YELLOW"
    fi
done

print_msg "Secrets configured" "$GREEN"

# Step 4: Set up Nginx site configuration
print_msg "Step 4: Configuring Nginx..." "$BLUE"

cat > /etc/nginx/sites-available/${DOMAIN} << 'NGINX_EOF'
server {
    listen 80;
    server_name uvcoatedclubflyers.com www.uvcoatedclubflyers.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX_EOF

# Enable the site
ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/

# Test and reload Nginx
if nginx -t; then
    systemctl reload nginx
    print_msg "Nginx configured and reloaded" "$GREEN"
else
    print_msg "Nginx configuration error!" "$RED"
    exit 1
fi

# Step 5: Set up firewall
print_msg "Step 5: Configuring firewall..." "$BLUE"
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    print_msg "Firewall configured" "$GREEN"
else
    print_msg "UFW not installed, skipping firewall setup" "$YELLOW"
fi

# Step 6: Start Docker containers
print_msg "Step 6: Starting Docker containers..." "$BLUE"
cd "$PROJECT_DIR"

# Build and start
docker compose -p uvcoatedclubflyers -f docker-compose.project.yml up -d --build

print_msg ""
print_msg "========================================" "$GREEN"
print_msg "  Setup Complete!" "$GREEN"
print_msg "========================================" "$GREEN"
print_msg ""
print_msg "Services:" "$BLUE"
print_msg "  App:         http://${DOMAIN}"
print_msg "  MinIO:       http://localhost:9103"
print_msg "  Vaultwarden: http://localhost:8083"
print_msg "  PostgreSQL:  localhost:5433"
print_msg "  Redis:       localhost:6303"
print_msg ""
print_msg "Next steps:" "$YELLOW"
print_msg "  1. Update API secrets in ${PROJECT_DIR}/secrets/"
print_msg "  2. Set up SSL with: certbot --nginx -d ${DOMAIN}"
print_msg ""
print_msg "Check status: docker compose -p uvcoatedclubflyers ps" "$BLUE"
print_msg "View logs:    docker compose -p uvcoatedclubflyers logs -f" "$BLUE"
