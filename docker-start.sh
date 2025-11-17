#!/bin/bash

echo "============================================"
echo "UV Coated Club Flyers - Docker Startup"
echo "============================================"
echo ""

# Check if secrets directory exists
if [ ! -d "secrets" ]; then
    echo "❌ ERROR: secrets/ directory not found!"
    echo "   Please create secrets directory and add credentials."
    echo "   See VAULT-SETUP.md for instructions."
    exit 1
fi

# Check if required secret files exist
REQUIRED_SECRETS=(
    "db_password.txt"
    "redis_password.txt"
    "paypal_client_id.txt"
    "paypal_client_secret.txt"
)

MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ ! -f "secrets/$secret" ]; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo "❌ ERROR: Missing required secret files:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "   - secrets/$secret"
    done
    echo ""
    echo "   See VAULT-SETUP.md for setup instructions."
    exit 1
fi

echo "✅ All required secrets found"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Pull latest images
echo "📦 Pulling Docker images..."
docker-compose pull

# Build application
echo "🔨 Building application..."
docker-compose build app

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

# Show logs
echo ""
echo "📝 Recent logs:"
docker-compose logs --tail=20

echo ""
echo "============================================"
echo "✅ Startup Complete!"
echo "============================================"
echo ""
echo "🌐 Access Points:"
echo "   Application:  http://localhost:3000"
echo "   Vaultwarden:  http://localhost:8080"
echo "   MinIO Console: http://localhost:9001"
echo ""
echo "📚 Documentation:"
echo "   Setup Guide: VAULT-SETUP.md"
echo "   Package Info: SQUARE-PAYMENT-PACKAGE-SUMMARY.md"
echo ""
echo "🔍 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
