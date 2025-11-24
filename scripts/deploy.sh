#!/bin/bash
# Deployment Script for PulseCore

echo "================================"
echo "PulseCore Deployment Script"
echo "================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Pull latest changes (if using git)
if [ -d .git ]; then
    echo "Pulling latest changes from git..."
    git pull origin main
fi

# Stop all services
echo "Stopping all services..."
docker-compose down

# Remove old images (optional - comment out if you want to keep old images)
echo "Cleaning up old Docker images..."
docker image prune -f

# Build and start services
echo "Building and starting services..."
docker-compose up -d --build

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 10

# Run migrations
echo "Running database migrations..."
docker-compose exec -T backend python manage.py migrate

# Collect static files
echo "Collecting static files..."
docker-compose exec -T backend python manage.py collectstatic --noinput

# Check service status
echo ""
echo "Checking service status..."
docker-compose ps

echo ""
echo "================================"
echo "Deployment completed!"
echo "================================"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Check status: docker-compose ps"
echo "  Restart service: docker-compose restart [service_name]"
echo ""
