# Secrets Directory Structure

This directory contains example secret files showing the structure needed for Docker Secrets.

## Setup Instructions

1. **Copy this directory to create your actual secrets:**
   ```bash
   cp -r secrets.example secrets
   cd secrets
   ```

2. **Fill in your actual credentials** in each `.txt` file

3. **NEVER commit the `secrets/` directory** to version control (already in .gitignore)

## Secret Files Reference

### Database Credentials

**File:** `db_password.txt`
**Content:** PostgreSQL database password
**Example:** `your_secure_database_password_here`

---

### Redis Credentials

**File:** `redis_password.txt`
**Content:** Redis password
**Example:** `your_redis_password_here`

---

### MinIO/S3 Credentials

**File:** `minio_access_key.txt`
**Content:** MinIO access key (like AWS Access Key ID)
**Example:** `minioadmin` or your custom access key

**File:** `minio_secret_key.txt`
**Content:** MinIO secret key (like AWS Secret Access Key)
**Example:** `minioadmin` or your custom secret key

---

### Square Payment Credentials

Get these from: https://developer.squareup.com/apps

**File:** `square_access_token.txt`
**Content:** Square Production Access Token
**Example:** `EAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**File:** `square_sandbox_access_token.txt`
**Content:** Square Sandbox Access Token
**Example:** `EAAAyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`

---

### PayPal Payment Credentials

Get these from: https://developer.paypal.com/dashboard

**File:** `paypal_client_id.txt`
**Content:** PayPal Client ID (can be used for both sandbox and production)
**Example:** `AabXwMSB3J9rKKhf0wfdTCq8z_tQp3SnSwVM8IjDw5kOX6K2RZLhmFqXNLkBeENN7XgarjeVC1QGaLaw`

**File:** `paypal_client_secret.txt`
**Content:** PayPal Client Secret
**Example:** `EFHiO04VT9YKpQSz0o3waFfUATg0NZ_P3Gqws3HMk5iCAFpcHfNVEoPttytLgNE-tYj0o26NisZ__BaX`

---

### NextAuth Credentials

**File:** `nextauth_secret.txt`
**Content:** NextAuth secret for session encryption
**Generate with:** `openssl rand -base64 32`
**Example:** `your-nextauth-secret-key-generated-with-openssl`

---

### Google OAuth Credentials

Get these from: https://console.cloud.google.com/apis/credentials

**File:** `google_client_id.txt`
**Content:** Google OAuth Client ID
**Example:** `673490836581-xxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`

**File:** `google_client_secret.txt`
**Content:** Google OAuth Client Secret
**Example:** `GOCSPX-xxxxxxxxxxxxxxxxxxxxxx`

---

### Vaultwarden Admin Token

**File:** `vaultwarden_admin_token.txt`
**Content:** Admin token for Vaultwarden web UI
**Generate with:** `openssl rand -base64 32`
**Example:** `randomly-generated-admin-token-here`

**Access Vaultwarden admin:** http://localhost:8080/admin
**Use this token to log into the admin panel**

---

## Security Best Practices

1. **Generate Strong Passwords:**
   ```bash
   # Generate random password
   openssl rand -base64 32

   # Generate random alphanumeric
   openssl rand -hex 16
   ```

2. **Never Share Secrets:**
   - Don't commit to Git
   - Don't share in Slack/Discord
   - Don't email credentials
   - Use Vaultwarden to share with team

3. **Rotate Secrets Regularly:**
   - Change passwords every 90 days
   - Rotate API tokens quarterly
   - Update after team member departure

4. **Backup Secrets Securely:**
   - Keep encrypted backup of secrets directory
   - Store in password manager (Vaultwarden)
   - Document recovery procedures

5. **Use Vaultwarden:**
   - Store all credentials in Vaultwarden (http://localhost:8080)
   - Use it as source of truth
   - Export secrets.txt files from Vaultwarden when deploying

---

## Troubleshooting

### Secret not loading in container

**Check secret file:**
```bash
cat secrets/your_secret_file.txt
```

**Verify no extra whitespace:**
```bash
cat -A secrets/your_secret_file.txt
```

**Check Docker Secrets mounted:**
```bash
docker exec uvcoated-app ls -la /run/secrets/
```

### Container fails to start

**View logs:**
```bash
docker-compose logs app
```

**Check entrypoint script:**
```bash
docker exec uvcoated-app cat /usr/local/bin/entrypoint.sh
```

---

## Quick Setup Script

```bash
#!/bin/bash
# quick-setup-secrets.sh

# Copy example directory
cp -r secrets.example secrets
cd secrets

# Generate secure passwords
echo "$(openssl rand -base64 24)" > db_password.txt
echo "$(openssl rand -base64 24)" > redis_password.txt
echo "minioadmin" > minio_access_key.txt
echo "minioadmin" > minio_secret_key.txt
echo "$(openssl rand -base64 32)" > nextauth_secret.txt
echo "$(openssl rand -base64 32)" > vaultwarden_admin_token.txt

# Placeholder for payment credentials (YOU MUST FILL THESE IN!)
echo "YOUR_SQUARE_ACCESS_TOKEN_HERE" > square_access_token.txt
echo "YOUR_SQUARE_SANDBOX_TOKEN_HERE" > square_sandbox_access_token.txt
echo "YOUR_PAYPAL_CLIENT_ID_HERE" > paypal_client_id.txt
echo "YOUR_PAYPAL_CLIENT_SECRET_HERE" > paypal_client_secret.txt
echo "YOUR_GOOGLE_CLIENT_ID_HERE" > google_client_id.txt
echo "YOUR_GOOGLE_CLIENT_SECRET_HERE" > google_client_secret.txt

echo "✅ Secrets directory created!"
echo "⚠️  IMPORTANT: Edit payment provider credentials in secrets/ directory!"
```

Run with:
```bash
chmod +x quick-setup-secrets.sh
./quick-setup-secrets.sh
```
