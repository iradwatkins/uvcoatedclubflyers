# UV Coated Club Flyers - Docker Project

This is a complete Docker project containing all services for the UV Coated Club Flyers application.

## Project Structure

All services are containerized within a single Docker project named `uvcoatedclubflyers`:

| Service | Container Name | Internal Port | External Port |
|---------|---------------|---------------|---------------|
| PostgreSQL | uvcoatedclubflyers-postgres | 5432 | 5433 |
| Redis | uvcoatedclubflyers-redis | 6379 | 6303 |
| MinIO | uvcoatedclubflyers-minio | 9000/9001 | 9003/9103 |
| Vaultwarden | uvcoatedclubflyers-vaultwarden | 80 | 8083 |
| App | uvcoatedclubflyers-app | 3000 | (internal only) |
| Nginx | uvcoatedclubflyers-nginx | 80 | 3003 |

## Quick Start

### 1. Setup Secrets

All secrets are stored in the `secrets/` directory. The following files are required:

```
secrets/
├── db_password.txt          # PostgreSQL password
├── redis_password.txt       # Redis password
├── minio_access_key.txt     # MinIO access key
├── minio_secret_key.txt     # MinIO secret key
├── vaultwarden_admin_token.txt
├── nextauth_secret.txt
├── square_access_token.txt
├── square_sandbox_access_token.txt
├── paypal_client_id.txt
├── paypal_client_secret.txt
├── google_client_id.txt
├── google_client_secret.txt
├── resend_api_key.txt
├── fedex_api_key.txt
└── fedex_secret_key.txt
```

### 2. Configure Environment

Copy the environment template and configure:

```bash
cp .env.docker .env
# Edit .env with your configuration
```

### 3. Start the Project

Use the deploy script:

```bash
./deploy.sh start
```

Or use Docker Compose directly:

```bash
docker compose -p uvcoatedclubflyers -f docker-compose.project.yml up -d
```

## Management Commands

```bash
# Start all services
./deploy.sh start

# Stop all services
./deploy.sh stop

# Restart all services
./deploy.sh restart

# View service status
./deploy.sh status

# View logs (all services)
./deploy.sh logs

# View logs (specific service)
./deploy.sh logs app
./deploy.sh logs postgres

# Rebuild the app
./deploy.sh build

# Connect to PostgreSQL
./deploy.sh db

# Connect to Redis
./deploy.sh redis

# Pull latest images
./deploy.sh pull

# Clean up everything (WARNING: deletes all data)
./deploy.sh clean
```

## Network Architecture

All services communicate via the internal Docker network `uvcoatedclubflyers_network`.

```
Internet
    │
    ▼
[Nginx :3003]
    │
    ▼
[App :3000] ──────► [PostgreSQL :5433]
    │                      │
    ├──────────────► [Redis :6303]
    │
    └──────────────► [MinIO :9003]
```

## Volume Storage

Persistent data is stored in Docker volumes:

- `uvcoatedclubflyers_postgres-data` - Database files
- `uvcoatedclubflyers_redis-data` - Redis persistence
- `uvcoatedclubflyers_minio-data` - Object storage
- `uvcoatedclubflyers_vaultwarden-data` - Password vault
- `uvcoatedclubflyers_app-uploads` - Application uploads
- `uvcoatedclubflyers_app-cache` - Next.js cache

## Health Checks

All services have health checks configured:

- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`
- MinIO: `mc ready local`
- App: `curl http://localhost:3000/api/health`
- Nginx: `nginx -t`

## Security Notes

1. All external ports bind to `127.0.0.1` (localhost only)
2. Nginx on port 3003 is the only public-facing service
3. Secrets are managed via Docker secrets
4. Never commit the `secrets/` directory
5. The app runs as non-root user inside the container
