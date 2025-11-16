# UV Coated Club Flyers

Custom UV coated club flyers printing service built with Next.js and Docker.

## Development Environment

All development happens inside Docker containers:
- **Next.js App**: http://localhost:3000
- **PostgreSQL**: localhost:5448
- **Redis**: localhost:6302
- **MinIO Console**: http://localhost:9102

## Quick Start

```bash
docker-compose up -d
docker exec uvcoatedclubflyers sh -c "cd /workspace && npm run dev"
```

## Project Structure

- Next.js running on Node 20
- PostgreSQL 16 for database
- Redis 7 for caching
- MinIO for object storage

