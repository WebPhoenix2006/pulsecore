# PulseCore - Quick Start Guide

## Local Development with Docker

### 1. Prerequisites
- Docker Desktop installed
- Docker Compose v2.x
- 4GB+ RAM available

### 2. Setup

```bash
# Clone repository
git clone <your-repo-url>
cd pulsecore

# Create environment file
cp .env.example .env

# Edit .env with your values
# At minimum, change SECRET_KEY and DB_PASSWORD
nano .env

# Build and start containers
docker-compose up -d --build

# Wait for services to be ready (about 30 seconds)
docker-compose ps

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8000/api
# Django Admin: http://localhost:8000/admin
```

### 3. Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Run Django commands
docker-compose exec backend python manage.py <command>

# Access database
docker-compose exec db psql -U postgres pulsecore

# Stop all services
docker-compose down

# Clean up everything (including volumes)
docker-compose down -v
```

---

## Production Deployment to AWS EC2

### Step 1: Launch EC2 Instance

1. Go to AWS EC2 Console
2. Click "Launch Instance"
3. Configure:
   - **Name**: pulsecore-production
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t3.medium (minimum)
   - **Key Pair**: Create or select existing
   - **Storage**: 30 GB gp3
4. Configure Security Group:
   - SSH (22) - Your IP only
   - HTTP (80) - Anywhere (0.0.0.0/0)
   - HTTPS (443) - Anywhere (0.0.0.0/0)
5. Launch instance

### Step 2: Initial Server Setup

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@<your-ec2-public-ip>

# Download and run setup script
wget https://raw.githubusercontent.com/your-repo/pulsecore/main/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh

# Log out and back in
exit
ssh -i your-key.pem ubuntu@<your-ec2-public-ip>
```

### Step 3: Deploy Application

```bash
# Clone repository
git clone <your-repo-url>
cd pulsecore

# Create production .env file
cp .env.example .env
nano .env

# IMPORTANT: Update these values in .env:
# - SECRET_KEY (generate a strong random key)
# - DB_PASSWORD (use a strong password)
# - ALLOWED_HOSTS (add your domain and EC2 IP)
# - CORS_ALLOWED_ORIGINS (add your domain with http:// and https://)

# Make scripts executable
chmod +x scripts/*.sh

# Deploy
./scripts/deploy.sh

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Backfill analytics (optional)
docker-compose exec backend python backfill_analytics.py 365
```

### Step 4: Configure Domain (Optional)

1. Point your domain to EC2 Elastic IP
2. Update `.env`:
   ```
   ALLOWED_HOSTS=your-domain.com,www.your-domain.com
   CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
   ```
3. Restart services:
   ```bash
   docker-compose down && docker-compose up -d
   ```

### Step 5: Setup SSL Certificate

```bash
# Stop nginx
docker-compose stop frontend

# Get certificate
sudo apt install certbot -y
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Update nginx config to use SSL (see DOCKER_DEPLOYMENT.md)
# Then restart
docker-compose up -d

# Setup auto-renewal
sudo crontab -e
# Add: 0 2 * * * certbot renew --quiet && docker-compose restart frontend
```

### Step 6: Setup Automated Backups

```bash
# Test backup script
./scripts/backup-db.sh

# Schedule daily backups
crontab -e
# Add: 0 3 * * * /home/ubuntu/pulsecore/scripts/backup-db.sh >> /home/ubuntu/backups/backup.log 2>&1
```

---

## Testing the Deployment

### Health Checks

```bash
# Check all services
docker-compose ps

# Test backend API
curl http://localhost/api/health

# Test frontend
curl http://localhost

# Check database
docker-compose exec backend python manage.py check --database default

# Check Redis
docker-compose exec redis redis-cli ping

# Check Celery
docker-compose exec celery_worker celery -A backend inspect active
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery_worker

# Last 100 lines
docker-compose logs --tail=100 backend
```

---

## Monitoring

### Resource Usage

```bash
# Container stats
docker stats

# System resources
htop

# Disk usage
df -h
docker system df
```

### Application Logs

```bash
# Django logs
docker-compose exec backend tail -f /var/log/pulsecore/django_errors.log

# Nginx logs
docker-compose exec frontend tail -f /var/log/nginx/access.log
docker-compose exec frontend tail -f /var/log/nginx/error.log
```

---

## Maintenance

### Updating the Application

```bash
cd ~/pulsecore
git pull origin main
./scripts/deploy.sh
```

### Database Backup & Restore

```bash
# Backup
./scripts/backup-db.sh

# Restore
./scripts/restore-db.sh /home/ubuntu/backups/pulsecore_20241124_030000.sql.gz
```

### Clean Up Docker Resources

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup (be careful!)
docker system prune -a --volumes
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs [service_name]

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Database Connection Issues

```bash
# Check if DB is running
docker-compose ps db

# Check DB logs
docker-compose logs db

# Test connection
docker-compose exec backend python manage.py dbshell
```

### Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Restart services
docker-compose restart

# Add swap if needed (see DOCKER_DEPLOYMENT.md)
```

### Application Errors

```bash
# Check backend logs
docker-compose logs backend

# Access Django shell
docker-compose exec backend python manage.py shell

# Run Django check
docker-compose exec backend python manage.py check
```

---

## Production Checklist

Before going live:

- [ ] Change SECRET_KEY to a strong random value
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS with your domain
- [ ] Set strong database password
- [ ] Setup SSL certificate
- [ ] Configure automated backups
- [ ] Enable firewall (UFW)
- [ ] Setup monitoring and alerts
- [ ] Test backup and restore procedure
- [ ] Document environment variables
- [ ] Setup error tracking (Sentry)
- [ ] Configure email settings
- [ ] Test all critical features
- [ ] Setup log rotation
- [ ] Configure automatic security updates

---

## Getting Help

- Full documentation: See `DOCKER_DEPLOYMENT.md`
- Django docs: https://docs.djangoproject.com/
- Docker docs: https://docs.docker.com/
- Celery docs: https://docs.celeryproject.org/

---

**Last Updated**: 2024-11-24
