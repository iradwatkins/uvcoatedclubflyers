#!/bin/bash
# UV Coated Club Flyers - Docker Project Deployment Script
# This script manages the complete Docker project deployment

set -e

# Configuration
PROJECT_NAME="uvcoatedclubflyers"
COMPOSE_FILE="docker-compose.project.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_msg() {
    echo -e "${2:-$GREEN}$1${NC}"
}

# Check if secrets exist
check_secrets() {
    print_msg "Checking secrets..." "$BLUE"

    required_secrets=(
        "db_password.txt"
        "redis_password.txt"
        "minio_access_key.txt"
        "minio_secret_key.txt"
        "nextauth_secret.txt"
        "vaultwarden_admin_token.txt"
        "square_access_token.txt"
        "square_sandbox_access_token.txt"
        "paypal_client_id.txt"
        "paypal_client_secret.txt"
        "google_client_id.txt"
        "google_client_secret.txt"
        "resend_api_key.txt"
        "fedex_api_key.txt"
        "fedex_secret_key.txt"
    )

    missing=0
    for secret in "${required_secrets[@]}"; do
        if [ ! -f "secrets/$secret" ]; then
            print_msg "  Missing: secrets/$secret" "$RED"
            missing=1
        fi
    done

    if [ $missing -eq 1 ]; then
        print_msg "Some secrets are missing. Please create them first." "$RED"
        exit 1
    fi

    print_msg "All secrets present." "$GREEN"
}

# Copy environment file if not exists
setup_env() {
    if [ ! -f ".env" ] && [ -f ".env.docker" ]; then
        print_msg "Creating .env from .env.docker template..." "$BLUE"
        cp .env.docker .env
        print_msg "Please edit .env with your configuration." "$YELLOW"
    fi
}

# Start the project
start() {
    print_msg "Starting ${PROJECT_NAME} Docker project..." "$BLUE"
    check_secrets
    setup_env

    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d

    print_msg "\n${PROJECT_NAME} started successfully!" "$GREEN"
    print_msg "Services available at:" "$BLUE"
    print_msg "  - App:        http://localhost:3015 (via Nginx)"
    print_msg "  - App Direct: http://localhost:3000"
    print_msg "  - MinIO:      http://localhost:9001 (Console)"
    print_msg "  - Vaultwarden: http://localhost:8080"
    print_msg "  - PostgreSQL: localhost:5448"
    print_msg "  - Redis:      localhost:6379"
}

# Stop the project
stop() {
    print_msg "Stopping ${PROJECT_NAME} Docker project..." "$BLUE"
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down
    print_msg "${PROJECT_NAME} stopped." "$GREEN"
}

# Restart the project
restart() {
    stop
    start
}

# View logs
logs() {
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" logs -f "${@:2}"
}

# View status
status() {
    print_msg "Status of ${PROJECT_NAME} Docker project:" "$BLUE"
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps
}

# Build/rebuild the app
build() {
    print_msg "Building ${PROJECT_NAME} app..." "$BLUE"
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build --no-cache app
    print_msg "Build complete." "$GREEN"
}

# Clean up everything (volumes included)
clean() {
    print_msg "WARNING: This will delete all data including databases!" "$RED"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" down -v --remove-orphans
        print_msg "All ${PROJECT_NAME} containers and volumes removed." "$GREEN"
    else
        print_msg "Cancelled." "$YELLOW"
    fi
}

# Pull latest images
pull() {
    print_msg "Pulling latest images..." "$BLUE"
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" pull
    print_msg "Images updated." "$GREEN"
}

# Database shell
db() {
    print_msg "Connecting to PostgreSQL..." "$BLUE"
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec postgres psql -U appuser -d uvcoated
}

# Redis CLI
redis_cli() {
    print_msg "Connecting to Redis..." "$BLUE"
    REDIS_PASS=$(cat secrets/redis_password.txt)
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec redis redis-cli -a "$REDIS_PASS"
}

# Show help
help() {
    echo "UV Coated Club Flyers - Docker Project Management"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  status    Show service status"
    echo "  logs      View logs (optionally specify service: ./deploy.sh logs app)"
    echo "  build     Rebuild the app container"
    echo "  pull      Pull latest images"
    echo "  db        Connect to PostgreSQL shell"
    echo "  redis     Connect to Redis CLI"
    echo "  clean     Remove all containers and volumes (WARNING: deletes data)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh start      # Start the project"
    echo "  ./deploy.sh logs app   # View app logs"
    echo "  ./deploy.sh status     # Check service status"
}

# Main
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$@"
        ;;
    status)
        status
        ;;
    build)
        build
        ;;
    clean)
        clean
        ;;
    pull)
        pull
        ;;
    db)
        db
        ;;
    redis)
        redis_cli
        ;;
    help|--help|-h)
        help
        ;;
    *)
        help
        exit 1
        ;;
esac
