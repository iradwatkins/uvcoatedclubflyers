# Password Vault System - Complete Setup Guide

## 🔐 Overview

This project uses a **hybrid password vault approach** for maximum security:

1. **Docker Secrets** - Runtime secret injection (production-grade security)
2. **Vaultwarden** - Web UI for team credential management (http://localhost:8080)

All sensitive credentials are stored in Docker Secrets and **never** committed to Git.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Secrets Management](#secrets-management)
- [Vaultwarden Setup](#vaultwarden-setup)
- [Docker Compose](#docker-compose)
- [Deployment](#deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### 1. Set Up Secrets

```bash
# Your secrets directory already exists with current credentials!
# Location: ./secrets/

# To view what secrets are configured:
ls -la secrets/

# To update a secret:
echo "new_value_here" > secrets/secret_name.txt
```

### 2. Start All Services

```bash
# Start all containers (PostgreSQL, Redis, MinIO, Vaultwarden, Next.js app)
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Access Services

- **Application:** http://localhost:3000
- **Vaultwarden (Password Manager UI):** http://localhost:8080
- **MinIO Console:** http://localhost:9001
- **PostgreSQL:** localhost:5448
- **Redis:** localhost:6302

---

## 🏗️ Architecture

### Services Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose Stack                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    Redis     │  │    MinIO     │     │
│  │   (5448)     │  │   (6302)     │  │   (9002)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Vaultwarden Password Manager            │  │
│  │              http://localhost:8080                   │  │
│  │         (Web UI for credential management)           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js Application                     │  │
│  │              http://localhost:3000                   │  │
│  │                                                      │  │
│  │   ┌──────────────────────────────────────────────┐  │  │
│  │   │  Entrypoint Script                           │  │  │
│  │   │  • Reads secrets from /run/secrets/          │  │  │
│  │   │  • Exports as environment variables          │  │  │
│  │   │  • Starts Next.js server                     │  │  │
│  │   └──────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↑
                            │
                   Secrets Injected
                            │
                ┌───────────────────────┐
                │   secrets/ directory  │
                │  (on host machine)    │
                │                       │
                │  • db_password.txt    │
                │  • square_token.txt   │
                │  • paypal_secret.txt  │
                │  • ... (12 total)     │
                └───────────────────────┘
```

### How Secrets Work

1. **Storage:** Secrets stored as `.txt` files in `secrets/` directory on host
2. **Mounting:** Docker mounts secrets to `/run/secrets/` inside containers
3. **Injection:** Entrypoint script reads `/run/secrets/*` and exports as env vars
4. **Access:** Next.js reads from `process.env` (same as before, no code changes!)
5. **Security:** Secrets never in Git, never in image layers, only in memory

---

## 🔑 Secrets Management

### Current Secrets Configured

| Secret File | Purpose | Where to Get |
|------------|---------|--------------|
| `db_password.txt` | PostgreSQL password | Auto-generated or custom |
| `redis_password.txt` | Redis password | Auto-generated or custom |
| `minio_access_key.txt` | MinIO access key | Custom (default: minioadmin) |
| `minio_secret_key.txt` | MinIO secret key | Custom (default: minioadmin) |
| `square_access_token.txt` | Square production token | https://developer.squareup.com |
| `square_sandbox_access_token.txt` | Square sandbox token | https://developer.squareup.com |
| `paypal_client_id.txt` | PayPal client ID | https://developer.paypal.com |
| `paypal_client_secret.txt` | PayPal client secret | https://developer.paypal.com |
| `nextauth_secret.txt` | NextAuth session secret | `openssl rand -base64 32` |
| `google_client_id.txt` | Google OAuth ID | https://console.cloud.google.com |
| `google_client_secret.txt` | Google OAuth secret | https://console.cloud.google.com |
| `vaultwarden_admin_token.txt` | Vaultwarden admin token | `openssl rand -base64 32` |

### Adding a New Secret

```bash
# 1. Create secret file
echo "my_secret_value" > secrets/new_secret.txt

# 2. Add to docker-compose.yml secrets section:
secrets:
  new_secret:
    file: ./secrets/new_secret.txt

# 3. Mount to app container:
services:
  app:
    secrets:
      - new_secret

# 4. Update entrypoint script to export:
export NEW_SECRET=$(read_secret "new_secret")

# 5. Restart container:
docker-compose restart app
```

### Rotating Secrets

```bash
# 1. Update secret file
echo "new_rotated_value" > secrets/secret_name.txt

# 2. Restart affected services
docker-compose restart app

# 3. Verify new secret loaded
docker-compose logs app | grep "Loading"
```

---

## 🌐 Vaultwarden Setup

### Initial Setup

1. **Start Vaultwarden:**
   ```bash
   docker-compose up -d vaultwarden
   ```

2. **Get Admin Token:**
   ```bash
   cat secrets/vaultwarden_admin_token.txt
   ```

3. **Access Admin Panel:**
   - Open: http://localhost:8080/admin
   - Paste admin token

4. **Create Account:**
   - Go to: http://localhost:8080
   - Sign up with email and master password
   - **IMPORTANT:** Save this master password securely!

5. **Import Credentials:**
   - Click "New Item" → "Login"
   - Add all payment provider credentials
   - Add OAuth credentials
   - Add database passwords

### Team Access

1. **Create Organization:**
   - Click "New" → "Organization"
   - Name: "UV Coated Club Flyers"

2. **Invite Team Members:**
   - Go to Organization → "Manage"
   - Click "Invite User"
   - Send invitation email

3. **Share Collections:**
   - Create Collections: "Payment Providers", "Infrastructure", "OAuth"
   - Share credentials with team

### Using Vaultwarden

**Browser Extension:**
- Install from: https://bitwarden.com/download/
- Set custom server: http://localhost:8080
- Log in with master password

**Mobile App:**
- Download Bitwarden app
- Set custom server URL
- Access credentials on-the-go

---

## 🐳 Docker Compose

### Commands Reference

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d app

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: deletes data!)
docker-compose down -v

# Rebuild application
docker-compose build app

# Rebuild and restart
docker-compose up -d --build app

# Check service status
docker-compose ps

# Execute command in container
docker-compose exec app sh

# View secrets in container
docker-compose exec app ls -la /run/secrets/
```

### Service Health Checks

```bash
# PostgreSQL
docker-compose exec postgres pg_isready -U appuser

# Redis
docker-compose exec redis redis-cli ping

# MinIO
curl http://localhost:9002/minio/health/live

# Application
curl http://localhost:3000/api/health
```

---

## 🚀 Deployment

### Production Deployment Checklist

- [ ] **Generate Strong Production Secrets**
  ```bash
  openssl rand -base64 32 > secrets/nextauth_secret.txt
  openssl rand -base64 32 > secrets/db_password.txt
  ```

- [ ] **Update Payment Credentials to Production**
  - Get production tokens from Square/PayPal
  - Update `square_access_token.txt` (not sandbox)
  - Update PayPal to production mode

- [ ] **Update Environment Variables**
  - Set `NEXT_PUBLIC_SQUARE_ENVIRONMENT=production`
  - Set `NEXT_PUBLIC_PAYPAL_ENVIRONMENT=production`
  - Set `NODE_ENV=production`

- [ ] **Enable HTTPS**
  - Add reverse proxy (Nginx, Traefik)
  - Get SSL certificates (Let's Encrypt)
  - Update `NEXTAUTH_URL` to HTTPS domain

- [ ] **Secure Vaultwarden**
  - Set strong admin token
  - Disable signups: `SIGNUPS_ALLOWED=false`
  - Enable HTTPS for Vaultwarden
  - Set proper domain in config

- [ ] **Backup Strategy**
  - Backup `secrets/` directory (encrypted)
  - Backup Docker volumes
  - Export Vaultwarden vault
  - Document recovery procedures

- [ ] **Monitoring**
  - Set up log aggregation
  - Monitor secret access patterns
  - Alert on failed authentications
  - Track API usage

---

## 🔒 Security

### Best Practices

1. **Never Commit Secrets to Git**
   - `secrets/` is in `.gitignore`
   - Verify before each commit: `git status`

2. **Use Strong Passwords**
   ```bash
   # Generate random password
   openssl rand -base64 32

   # Generate alphanumeric
   pwgen -s 32 1
   ```

3. **Principle of Least Privilege**
   - Only give team members access to secrets they need
   - Use Vaultwarden collections for segmentation

4. **Regular Rotation**
   - Rotate secrets every 90 days
   - Rotate immediately after team member departure
   - Document rotation procedures

5. **Audit Trail**
   - Review Vaultwarden access logs
   - Monitor Docker container logs
   - Track secret file modifications

### Emergency Procedures

**If Secrets Are Compromised:**

1. **Immediately Rotate All Affected Secrets**
   ```bash
   # Generate new secret
   openssl rand -base64 32 > secrets/compromised_secret.txt

   # Restart services
   docker-compose restart app
   ```

2. **Revoke API Tokens**
   - Square: https://developer.squareup.com/apps
   - PayPal: https://developer.paypal.com/dashboard
   - Google: https://console.cloud.google.com

3. **Update Vaultwarden**
   - Change master password
   - Generate new admin token
   - Review access logs

4. **Notify Team**
   - Inform all team members
   - Document incident
   - Review security procedures

---

## 🔧 Troubleshooting

### Application Won't Start

**Check logs:**
```bash
docker-compose logs app
```

**Common issues:**

1. **Secret file not found**
   ```bash
   # Verify secret exists
   ls -la secrets/

   # Check permissions
   chmod 644 secrets/*.txt
   ```

2. **Database connection failed**
   ```bash
   # Check PostgreSQL is running
   docker-compose ps postgres

   # Test connection
   docker-compose exec postgres psql -U appuser -d uvcoated
   ```

3. **Port already in use**
   ```bash
   # Find process using port
   lsof -i :3000

   # Kill process
   kill -9 <PID>
   ```

### Secret Not Loading

**Verify secret in container:**
```bash
# List secrets
docker-compose exec app ls -la /run/secrets/

# Read secret value
docker-compose exec app cat /run/secrets/square_access_token

# Check environment variable
docker-compose exec app env | grep SQUARE
```

**Verify entrypoint executed:**
```bash
# Check entrypoint logs
docker-compose logs app | grep "Loading"
```

### Vaultwarden Issues

**Can't access admin panel:**
```bash
# Check admin token
cat secrets/vaultwarden_admin_token.txt

# View Vaultwarden logs
docker-compose logs vaultwarden
```

**Forgot master password:**
- **WARNING:** No password recovery!
- Must restore from backup or reset (lose all data)

### Performance Issues

**Check resource usage:**
```bash
# View resource stats
docker stats

# Check disk space
df -h

# Check volume sizes
docker system df -v
```

---

## 📝 Additional Resources

- **Docker Secrets Documentation:** https://docs.docker.com/engine/swarm/secrets/
- **Vaultwarden Wiki:** https://github.com/dani-garcia/vaultwarden/wiki
- **Square Developer Docs:** https://developer.squareup.com/docs
- **PayPal Developer Docs:** https://developer.paypal.com/docs
- **Next.js Environment Variables:** https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

---

## 🎯 Summary

You now have a production-ready password vault system with:

✅ **Docker Secrets** for secure runtime secret injection
✅ **Vaultwarden** for team credential management with web UI
✅ **All current credentials** already configured in `secrets/`
✅ **Automated secret loading** via entrypoint script
✅ **Production-grade security** (secrets never in Git/images)
✅ **Easy deployment** with docker-compose
✅ **Team collaboration** via Vaultwarden organizations

**Next Steps:**
1. Start services: `docker-compose up -d`
2. Access Vaultwarden: http://localhost:8080
3. Create account and import credentials
4. Test application: http://localhost:3000

**For production deployment, follow the Production Deployment Checklist above.**

---

**Questions or issues? Check the Troubleshooting section or review docker-compose logs.**
