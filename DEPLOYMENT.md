# Blue-Green Deployment Guide

## Overview

This project uses a blue-green deployment strategy with Docker containers on a VPS. The application runs on **port 3015**.

- **Blue environment**: Primary deployment
- **Green environment**: Secondary deployment for zero-downtime updates
- **Nginx**: Reverse proxy that routes traffic between blue and green

## Architecture

```
                    Port 3015
                        │
                        ▼
                   ┌─────────┐
                   │  Nginx  │
                   └────┬────┘
                        │
           ┌────────────┼────────────┐
           ▼                         ▼
    ┌─────────────┐           ┌─────────────┐
    │ Blue (3000) │           │Green (3000) │
    └─────────────┘           └─────────────┘
           │                         │
           └────────────┬────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   PostgreSQL        Redis           MinIO
```

## Initial VPS Setup

### Prerequisites

- Ubuntu 20.04+ or Debian 11+
- Root or sudo access
- Domain pointed to server IP

### Automated Setup

```bash
# Clone the repository
git clone https://github.com/iradwatkins/uvcoatedclubflyers.git /opt/uvcoatedclubflyers
cd /opt/uvcoatedclubflyers

# Run setup script
sudo ./scripts/setup-vps.sh
```

### Manual Setup

1. **Install Docker and Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

2. **Clone repository**
   ```bash
   git clone https://github.com/iradwatkins/uvcoatedclubflyers.git /opt/uvcoatedclubflyers
   cd /opt/uvcoatedclubflyers
   ```

3. **Create secrets**
   ```bash
   mkdir -p secrets

   # Create each secret file
   echo "your-db-password" > secrets/db_password.txt
   echo "your-redis-password" > secrets/redis_password.txt
   echo "your-minio-access-key" > secrets/minio_access_key.txt
   echo "your-minio-secret-key" > secrets/minio_secret_key.txt
   echo "your-square-token" > secrets/square_access_token.txt
   echo "your-square-sandbox-token" > secrets/square_sandbox_access_token.txt
   echo "your-paypal-client-id" > secrets/paypal_client_id.txt
   echo "your-paypal-secret" > secrets/paypal_client_secret.txt
   echo "your-nextauth-secret" > secrets/nextauth_secret.txt
   echo "your-google-client-id" > secrets/google_client_id.txt
   echo "your-google-secret" > secrets/google_client_secret.txt
   echo "your-vaultwarden-token" > secrets/vaultwarden_admin_token.txt

   # Set permissions
   chmod 600 secrets/*
   ```

4. **Create Docker network**
   ```bash
   docker network create uvcoated-network
   ```

5. **Start shared services**
   ```bash
   docker-compose -f docker-compose.shared.yml up -d
   ```

6. **Deploy blue environment**
   ```bash
   ./scripts/deploy.sh blue
   ./scripts/switch-traffic.sh blue
   ```

## Deployment Workflow

### Standard Deployment (Zero Downtime)

1. **Deploy to inactive environment**
   ```bash
   cd /opt/uvcoatedclubflyers
   ./scripts/deploy.sh
   ```
   This automatically deploys to whichever environment (blue/green) is not currently active.

2. **Test the new deployment**
   ```bash
   # If deployed to green
   curl http://localhost:3002/api/health

   # If deployed to blue
   curl http://localhost:3001/api/health
   ```

3. **Switch traffic**
   ```bash
   ./scripts/switch-traffic.sh green  # or blue
   ```

### Rollback

If something goes wrong after switching:

```bash
./scripts/rollback.sh
```

This immediately switches traffic back to the previous environment.

## File Structure

```
/opt/uvcoatedclubflyers/
├── docker-compose.shared.yml   # Shared services (DB, Redis, MinIO, Nginx)
├── docker-compose.blue.yml     # Blue app environment
├── docker-compose.green.yml    # Green app environment
├── nginx/
│   ├── nginx.conf              # Main Nginx config
│   └── conf.d/
│       ├── upstream.conf       # Blue/green switching config
│       └── app.conf            # Server configuration
├── scripts/
│   ├── deploy.sh               # Deploy to inactive environment
│   ├── switch-traffic.sh       # Switch Nginx upstream
│   ├── rollback.sh             # Rollback to previous environment
│   └── setup-vps.sh            # Initial VPS setup
├── secrets/                    # Docker secrets (not in git)
└── .env.production             # Production env variables
```

## Port Mapping

| Service | Internal Port | External Port |
|---------|--------------|---------------|
| Nginx (App) | 80 | **3015** |
| PostgreSQL | 5432 | 5448 |
| Redis | 6379 | 6302 |
| MinIO API | 9000 | 9002 |
| MinIO Console | 9001 | 9001 |
| Vaultwarden | 80 | 8080 |

## Monitoring

### Check service status
```bash
docker ps
```

### View logs
```bash
# All services
docker-compose -f docker-compose.shared.yml logs -f

# Specific service
docker logs uvcoated-app-blue -f
docker logs uvcoated-nginx -f
```

### Health checks
```bash
# Application health
curl http://localhost:3015/api/health

# Nginx health
curl http://localhost:3015/nginx-health

# Direct blue/green health
curl http://localhost:3001/api/health  # Blue
curl http://localhost:3002/api/health  # Green
```

## SSL Configuration

For production, configure SSL with Let's Encrypt:

1. Install Certbot
   ```bash
   apt install certbot
   ```

2. Get certificate
   ```bash
   certbot certonly --standalone -d uvcoatedclubflyers.com
   ```

3. Update Nginx configuration to use SSL certificates

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs uvcoated-app-blue

# Check if ports are in use
netstat -tlnp | grep 3015
```

### Database connection issues
```bash
# Check PostgreSQL is running
docker exec uvcoated-postgres pg_isready

# Test connection
docker exec uvcoated-app-blue npm run db:migrate
```

### Traffic not switching
```bash
# Verify Nginx config
docker exec uvcoated-nginx nginx -t

# Check upstream config
cat nginx/conf.d/upstream.conf
```

## Maintenance

### Update secrets
```bash
# Edit secret file
nano secrets/square_access_token.txt

# Restart affected containers
docker-compose -f docker-compose.blue.yml up -d
docker-compose -f docker-compose.green.yml up -d
```

### Database backup
```bash
docker exec uvcoated-postgres pg_dump -U appuser uvcoated > backup.sql
```

### View database
```bash
docker exec -it uvcoated-postgres psql -U appuser -d uvcoated
```
