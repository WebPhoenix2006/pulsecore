# Docker Deployment Guide for PulseCore

Complete guide for containerizing and deploying your full-stack application (Angular + Django + PostgreSQL + Redis + Celery) to AWS EC2.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Local Docker Setup](#local-docker-setup)
4. [Production Configuration](#production-configuration)
5. [AWS EC2 Deployment](#aws-ec2-deployment)
6. [Deployment Steps](#deployment-steps)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    EC2 Instance                      │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Nginx      │  │   Angular    │  │  Django   │ │
│  │   (Proxy)    │──│   (Static)   │  │   (API)   │ │
│  │   :80/:443   │  │              │  │   :8000   │ │
│  └──────────────┘  └──────────────┘  └─────┬─────┘ │
│                                             │        │
│  ┌──────────────┐  ┌──────────────┐  ┌────▼──────┐ │
│  │  PostgreSQL  │  │    Redis     │  │  Celery   │ │
│  │    :5432     │  │    :6379     │  │  Workers  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Local Development Machine
- Docker Desktop installed
- Docker Compose v2.x
- Git
- AWS CLI configured

### AWS Account
- EC2 access
- IAM permissions for EC2, Security Groups, EBS
- (Optional) Route53 for DNS
- (Optional) ACM for SSL certificates

---

## Local Docker Setup

### 1. Create Docker Configuration Files

#### `Dockerfile.backend`

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    musl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY services/requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project
COPY services/ .

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Create directory for logs
RUN mkdir -p /var/log/pulsecore

# Expose port
EXPOSE 8000

# Run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "backend.wsgi:application"]
```

#### `Dockerfile.frontend`

```dockerfile
# Stage 1: Build Angular app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY admin-portal/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY admin-portal/ .

# Build for production
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built app from builder stage
COPY --from=builder /app/dist/admin-portal /usr/share/nginx/html

# Copy custom nginx config
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### `Dockerfile.celery`

```dockerfile
# Celery Worker Dockerfile
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    musl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY services/requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project
COPY services/ .

# Run celery worker
CMD ["celery", "-A", "backend", "worker", "-l", "info", "--concurrency=2"]
```

#### `docker-compose.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: pulsecore_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-pulsecore}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache & Message Broker
  redis:
    image: redis:7-alpine
    container_name: pulsecore_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Django Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: pulsecore_backend
    restart: unless-stopped
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
      - DB_NAME=${DB_NAME:-pulsecore}
      - DB_USER=${DB_USER:-postgres}
      - DB_PASSWORD=${DB_PASSWORD:-postgres}
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
      - ALLOWED_HOSTS=${ALLOWED_HOSTS:-localhost,127.0.0.1}
      - CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-http://localhost,http://localhost:4200}
    volumes:
      - ./services:/app
      - static_files:/app/staticfiles
      - media_files:/app/media
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 120 backend.wsgi:application"

  # Celery Worker
  celery_worker:
    build:
      context: .
      dockerfile: Dockerfile.celery
    container_name: pulsecore_celery_worker
    restart: unless-stopped
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
      - DB_NAME=${DB_NAME:-pulsecore}
      - DB_USER=${DB_USER:-postgres}
      - DB_PASSWORD=${DB_PASSWORD:-postgres}
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    volumes:
      - ./services:/app
    depends_on:
      - db
      - redis
      - backend
    command: celery -A backend worker -l info --concurrency=2

  # Celery Beat (Scheduler)
  celery_beat:
    build:
      context: .
      dockerfile: Dockerfile.celery
    container_name: pulsecore_celery_beat
    restart: unless-stopped
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
      - DB_NAME=${DB_NAME:-pulsecore}
      - DB_USER=${DB_USER:-postgres}
      - DB_PASSWORD=${DB_PASSWORD:-postgres}
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    volumes:
      - ./services:/app
    depends_on:
      - db
      - redis
      - backend
    command: celery -A backend beat -l info

  # Angular Frontend
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: pulsecore_frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
  static_files:
  media_files:
```

#### `.env.example`

```bash
# Django Settings
SECRET_KEY=your-super-secret-key-change-this-in-production
DEBUG=False

# Database
DB_NAME=pulsecore
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Django Security
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
CORS_ALLOWED_ORIGINS=http://localhost,http://your-domain.com,https://your-domain.com

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Paystack (Optional)
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
```

#### `nginx/nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
}
```

#### `nginx/default.conf`

```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name _;
    client_max_body_size 20M;

    # Frontend (Angular)
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /app/staticfiles/;
    }

    # Media files
    location /media/ {
        alias /app/media/;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

## Production Configuration

### 1. Update Django Settings

Create `services/backend/settings_production.py`:

```python
from .settings import *

DEBUG = False

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# Security Settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Database connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 600

# Static files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/pulsecore/django_errors.log',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
}
```

### 2. Update Angular Environment

Update `admin-portal/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com/api',
  paystackPublicKey: 'pk_live_xxx'
};
```

### 3. Add Health Check Endpoint

Add to `services/backend/urls.py`:

```python
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'healthy', 'service': 'pulsecore'})

urlpatterns = [
    path('health/', health_check, name='health'),
    # ... other urls
]
```

---

## AWS EC2 Deployment

### 1. Launch EC2 Instance

#### Instance Specifications:
- **AMI**: Ubuntu Server 22.04 LTS
- **Instance Type**:
  - Development: t3.medium (2 vCPU, 4 GB RAM)
  - Production: t3.large or higher (2 vCPU, 8 GB RAM)
- **Storage**: 30-50 GB EBS (gp3)
- **Security Group**: Configure ports (see below)

#### Security Group Rules:

```
Inbound Rules:
- SSH (22): Your IP only
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- Custom TCP (8000): Only within VPC (for backend)

Outbound Rules:
- All traffic: 0.0.0.0/0
```

### 2. Connect to EC2 Instance

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

### 3. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
```

### 4. Install Additional Tools

```bash
# Install Git
sudo apt install git -y

# Install htop for monitoring
sudo apt install htop -y

# Install fail2ban for security
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Deployment Steps

### Option 1: Deploy from Git Repository

```bash
# 1. Clone your repository
cd /home/ubuntu
git clone https://github.com/your-username/pulsecore.git
cd pulsecore

# 2. Create .env file
cp .env.example .env
nano .env  # Edit with production values

# 3. Create necessary directories
mkdir -p nginx logs

# 4. Copy nginx config files (if not in repo)
# ... copy your nginx configs

# 5. Build and start containers
docker-compose up -d --build

# 6. Check container status
docker-compose ps

# 7. View logs
docker-compose logs -f

# 8. Run migrations
docker-compose exec backend python manage.py migrate

# 9. Create superuser
docker-compose exec backend python manage.py createsuperuser

# 10. Backfill analytics (if needed)
docker-compose exec backend python backfill_analytics.py 365
```

### Option 2: Deploy with CI/CD (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Deploy to EC2
      env:
        PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
        HOST: ${{ secrets.EC2_HOST }}
        USER: ubuntu
      run: |
        echo "$PRIVATE_KEY" > private_key && chmod 600 private_key
        ssh -o StrictHostKeyChecking=no -i private_key ${USER}@${HOST} '
          cd /home/ubuntu/pulsecore &&
          git pull origin main &&
          docker-compose down &&
          docker-compose up -d --build &&
          docker-compose exec -T backend python manage.py migrate
        '
```

### Option 3: Manual File Transfer

```bash
# From local machine
# Create deployment package
tar -czf pulsecore.tar.gz \
  --exclude='node_modules' \
  --exclude='*.pyc' \
  --exclude='__pycache__' \
  --exclude='.git' \
  .

# Transfer to EC2
scp -i your-key.pem pulsecore.tar.gz ubuntu@your-ec2-ip:/home/ubuntu/

# On EC2
tar -xzf pulsecore.tar.gz
cd pulsecore
docker-compose up -d --build
```

---

## SSL Certificate Setup (Let's Encrypt)

### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Update Nginx Config for SSL

Create `nginx/default.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 20M;

    # ... rest of your nginx config
}
```

### 3. Obtain Certificate

```bash
# Stop nginx container
docker-compose stop frontend

# Get certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Update docker-compose.yml to mount certificates
# Add under frontend service volumes:
# - /etc/letsencrypt:/etc/letsencrypt:ro

# Restart containers
docker-compose up -d
```

### 4. Auto-renewal

```bash
# Add cron job
sudo crontab -e

# Add this line (runs at 2am daily)
0 2 * * * certbot renew --quiet && docker-compose restart frontend
```

---

## Monitoring & Maintenance

### 1. Container Management Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart [service_name]

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Rebuild and restart
docker-compose up -d --build

# Remove old images
docker image prune -a
```

### 2. Database Backups

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pulsecore_$DATE.sql"

mkdir -p $BACKUP_DIR

docker-compose exec -T db pg_dump -U postgres pulsecore > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

Schedule daily backups:

```bash
chmod +x scripts/backup-db.sh

# Add to crontab
crontab -e

# Add line (runs at 3am daily)
0 3 * * * /home/ubuntu/pulsecore/scripts/backup-db.sh >> /home/ubuntu/backups/backup.log 2>&1
```

### 3. Restore Database

```bash
# Restore from backup
gunzip -c /home/ubuntu/backups/pulsecore_20241124_030000.sql.gz | \
  docker-compose exec -T db psql -U postgres pulsecore
```

### 4. Monitor Resources

```bash
# Install monitoring tools
docker run -d \
  --name=cadvisor \
  --restart=always \
  -p 8080:8080 \
  -v /:/rootfs:ro \
  -v /var/run:/var/run:ro \
  -v /sys:/sys:ro \
  -v /var/lib/docker/:/var/lib/docker:ro \
  gcr.io/cadvisor/cadvisor:latest

# Access at http://your-ec2-ip:8080
```

### 5. Log Management

Create `scripts/clean-logs.sh`:

```bash
#!/bin/bash
# Clean Docker logs
docker system prune -f --volumes

# Clean application logs older than 30 days
find /home/ubuntu/pulsecore/logs -name "*.log" -mtime +30 -delete

# Truncate large log files
truncate -s 0 /var/log/pulsecore/*.log
```

---

## Troubleshooting

### Common Issues

#### 1. Container won't start

```bash
# Check logs
docker-compose logs [service_name]

# Check container status
docker-compose ps

# Restart service
docker-compose restart [service_name]
```

#### 2. Database connection errors

```bash
# Check if database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Verify environment variables
docker-compose exec backend env | grep DB_
```

#### 3. High memory usage

```bash
# Check resource usage
docker stats

# Restart services
docker-compose restart

# Increase swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 4. Celery tasks not running

```bash
# Check celery worker logs
docker-compose logs celery_worker

# Check Redis connection
docker-compose exec backend python manage.py shell
>>> from django.core.cache import cache
>>> cache.set('test', 'value')
>>> cache.get('test')
```

#### 5. Frontend not loading

```bash
# Check nginx logs
docker-compose logs frontend

# Verify build
docker-compose exec frontend ls -la /usr/share/nginx/html

# Check nginx config
docker-compose exec frontend nginx -t
```

### Performance Optimization

```bash
# 1. Add database connection pooling
# In docker-compose.yml, add to backend environment:
DATABASES_CONN_MAX_AGE=600

# 2. Increase Gunicorn workers
# In Dockerfile.backend, update CMD:
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--worker-class", "gevent", "--worker-connections", "1000", "backend.wsgi:application"]

# 3. Enable Redis persistence
# In docker-compose.yml, update redis command:
command: redis-server --appendonly yes --appendfsync everysec
```

---

## Security Checklist

- [ ] Change default passwords
- [ ] Enable firewall (UFW)
- [ ] Set up fail2ban
- [ ] Use SSL certificates
- [ ] Enable HTTPS redirect
- [ ] Set secure SECRET_KEY
- [ ] Restrict SSH to specific IPs
- [ ] Enable automatic security updates
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity
- [ ] Keep Docker images updated
- [ ] Use environment variables for secrets
- [ ] Disable Django DEBUG mode

```bash
# Enable UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Enable automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## Cost Estimation (AWS)

### Monthly Costs (US East):

- **t3.medium EC2**: ~$30/month
- **30 GB EBS Storage**: ~$3/month
- **Data Transfer**: ~$5-20/month (depends on traffic)
- **Elastic IP**: Free if attached to running instance

**Total**: ~$40-55/month for small to medium traffic

### Cost Optimization:

- Use Reserved Instances (save up to 72%)
- Use Spot Instances for dev/staging
- Enable CloudWatch alarms for cost monitoring
- Use S3 for static files and media (optional)
- Consider AWS Lightsail for simpler setup (~$20-40/month)

---

## Next Steps

1. Set up domain and DNS (Route53 or your registrar)
2. Configure SSL certificates
3. Set up monitoring (CloudWatch, Datadog, etc.)
4. Configure automated backups to S3
5. Set up staging environment
6. Create deployment pipeline
7. Configure log aggregation
8. Set up error tracking (Sentry)

---

## Useful Commands Reference

```bash
# Quick deployment
docker-compose up -d --build

# View all logs
docker-compose logs -f

# Django management commands
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py collectstatic

# Database access
docker-compose exec db psql -U postgres pulsecore

# Redis CLI
docker-compose exec redis redis-cli

# Shell access
docker-compose exec backend bash
docker-compose exec frontend sh

# Clean everything
docker-compose down -v
docker system prune -a --volumes
```

---

## Support & Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Last Updated**: 2024-11-24
