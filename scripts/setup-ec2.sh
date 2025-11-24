#!/bin/bash
# EC2 Initial Setup Script

echo "================================"
echo "PulseCore EC2 Setup Script"
echo "================================"
echo ""

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
echo "Installing additional tools..."
sudo apt install -y git htop fail2ban unattended-upgrades

# Configure fail2ban
echo "Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Enable automatic security updates
echo "Enabling automatic security updates..."
sudo dpkg-reconfigure --priority=low unattended-upgrades

# Configure UFW firewall
echo "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create directories
echo "Creating application directories..."
mkdir -p ~/backups
mkdir -p ~/pulsecore/logs

# Create swap space (4GB)
echo "Creating swap space..."
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Set up log rotation
echo "Setting up log rotation..."
sudo tee /etc/logrotate.d/pulsecore > /dev/null <<EOF
/home/ubuntu/pulsecore/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
EOF

echo ""
echo "================================"
echo "Setup completed!"
echo "================================"
echo ""
echo "IMPORTANT: Please log out and log back in for Docker group changes to take effect."
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone <your-repo-url>"
echo "2. Create .env file with production values"
echo "3. Run deployment: cd pulsecore && ./scripts/deploy.sh"
echo ""
