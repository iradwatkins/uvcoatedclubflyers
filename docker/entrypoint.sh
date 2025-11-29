#!/bin/sh
set -e

echo "============================================"
echo "UV Coated Club Flyers - Secret Injection"
echo "============================================"

# Function to read secret from Docker Secrets
read_secret() {
  local secret_name=$1
  local secret_file="/run/secrets/${secret_name}"

  if [ -f "$secret_file" ]; then
    cat "$secret_file" | tr -d '\n' | tr -d '\r'
  else
    echo "WARNING: Secret file ${secret_file} not found!" >&2
    echo ""
  fi
}

# Function to URL-encode a string (for passwords with special chars)
# Uses printf and sed - compatible with busybox/alpine
urlencode() {
  printf '%s' "$1" | od -An -tx1 | tr ' ' '%' | tr -d '\n' | sed 's/%0a$//'
}

# Database Credentials
echo "Loading database credentials..."
export DATABASE_PASSWORD=$(read_secret "db_password")
ENCODED_DB_PASSWORD=$(urlencode "$DATABASE_PASSWORD")
export DATABASE_URL="postgresql://${DATABASE_USER}:${ENCODED_DB_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"
echo "✅ Database credentials loaded"

# Redis Credentials
echo "Loading Redis credentials..."
export REDIS_PASSWORD=$(read_secret "redis_password")
ENCODED_REDIS_PASSWORD=$(urlencode "$REDIS_PASSWORD")
export REDIS_URL="redis://:${ENCODED_REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}"
echo "✅ Redis credentials loaded"

# MinIO/S3 Credentials
echo "Loading MinIO credentials..."
export MINIO_ACCESS_KEY=$(read_secret "minio_access_key")
export MINIO_SECRET_KEY=$(read_secret "minio_secret_key")
echo "✅ MinIO credentials loaded"

# Square Payment Credentials
echo "Loading Square credentials..."
export SQUARE_ACCESS_TOKEN=$(read_secret "square_access_token")
export SQUARE_SANDBOX_ACCESS_TOKEN=$(read_secret "square_sandbox_access_token")
export SQUARE_LOCATION_ID="${NEXT_PUBLIC_SQUARE_LOCATION_ID}"
export SQUARE_ENVIRONMENT="${NEXT_PUBLIC_SQUARE_ENVIRONMENT}"
echo "✅ Square credentials loaded"

# PayPal Payment Credentials
echo "Loading PayPal credentials..."
export PAYPAL_CLIENT_ID=$(read_secret "paypal_client_id")
export PAYPAL_CLIENT_SECRET=$(read_secret "paypal_client_secret")
export NEXT_PUBLIC_PAYPAL_CLIENT_ID="${PAYPAL_CLIENT_ID}"
export PAYPAL_ENVIRONMENT="${NEXT_PUBLIC_PAYPAL_ENVIRONMENT}"
echo "✅ PayPal credentials loaded"

# NextAuth Credentials
echo "Loading NextAuth credentials..."
export NEXTAUTH_SECRET=$(read_secret "nextauth_secret")
echo "✅ NextAuth credentials loaded"

# Google OAuth Credentials
echo "Loading Google OAuth credentials..."
export GOOGLE_CLIENT_ID=$(read_secret "google_client_id")
export GOOGLE_CLIENT_SECRET=$(read_secret "google_client_secret")
echo "✅ Google OAuth credentials loaded"

echo "============================================"
echo "All secrets loaded successfully!"
echo "Starting Next.js application..."
echo "============================================"

# Execute the main command (start Next.js)
exec "$@"
