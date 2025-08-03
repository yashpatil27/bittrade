#!/bin/bash

# BitTrade One-Click Deployment Script
# Usage: curl -sSL https://raw.githubusercontent.com/yashpatil27/bittrade/main/deploy.sh | bash

set -e

echo "🚀 Starting BitTrade Deployment..."

# Configuration
DOMAIN="bittrade.co.in"
APP_DIR="/home/ubuntu/bittrade"
USER="ubuntu"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

print_status "Step 1/10: Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_status "Step 2/10: Installing Node.js and npm..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

print_status "Step 3/10: Installing PM2 globally..."
sudo npm install -g pm2

print_status "Step 4/10: Installing Nginx..."
sudo apt install nginx -y

print_status "Step 5/10: Installing Certbot..."
sudo apt install certbot python3-certbot-nginx -y

print_status "Step 6/10: Setting up databases..."
# Run database setup if not already done
if ! systemctl is-active --quiet mysql; then
    print_status "Running database setup script..."
    bash <(curl -sSL https://raw.githubusercontent.com/yashpatil27/bittrade/main/setup-database.sh)
else
    print_status "MySQL already running, skipping database setup"
fi

print_status "Step 7/10: Cloning BitTrade repository..."
if [ -d "$APP_DIR" ]; then
    print_warning "Directory exists, pulling latest changes..."
    cd $APP_DIR
    git pull origin main
else
    git clone https://github.com/yashpatil27/bittrade.git $APP_DIR
    cd $APP_DIR
fi

print_status "Step 7/10: Installing dependencies..."
npm install
cd client && npm install && npm run build
cd ..

print_status "Step 8/10: Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/bittrade > /dev/null << 'EOF'
server {
    server_name bittrade.co.in www.bittrade.co.in;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type";
            return 204;
        }
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;

    listen 80;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/bittrade /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

print_status "Step 9/10: Setting up SSL with Certbot..."
print_status "Configuring SSL certificate (mandatory for production)..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

print_status "Step 10/10: Setting up PM2 and automation..."

# Create detached startup script
cat > /home/ubuntu/start_detached.sh << 'EOF'
#!/bin/bash

export PM2_HOME="/home/ubuntu/.pm2"
export PATH="/usr/local/bin:$PATH"

pkill -f PM2 2>/dev/null
sleep 2

setsid nohup pm2 start /home/ubuntu/bittrade/ecosystem.config.js > /dev/null 2>&1 &
sleep 5
pm2 save > /dev/null 2>&1

echo "BitTrade applications started successfully"
EOF

chmod +x /home/ubuntu/start_detached.sh

# Create monitoring script
cat > /home/ubuntu/monitor_simple.sh << 'EOF'
#!/bin/bash

if ! pgrep -f "PM2.*God Daemon" > /dev/null; then
    /home/ubuntu/start_detached.sh > /dev/null 2>&1
fi

if ! pm2 list 2>/dev/null | grep -q "bittrade-server.*online" || \
   ! pm2 list 2>/dev/null | grep -q "bittrade-client.*online"; then
    /home/ubuntu/start_detached.sh > /dev/null 2>&1
fi
EOF

chmod +x /home/ubuntu/monitor_simple.sh

# Setup cron jobs
(crontab -l 2>/dev/null || true; echo "@reboot /home/ubuntu/start_detached.sh") | crontab -
(crontab -l 2>/dev/null || true; echo "*/5 * * * * /home/ubuntu/monitor_simple.sh") | crontab -

# Enable user lingering
sudo loginctl enable-linger ubuntu

# Create logs directory
mkdir -p $APP_DIR/logs

# Start the application
/home/ubuntu/start_detached.sh

print_status "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your BitTrade app is now running at:"
echo "   🔒 https://$DOMAIN (SSL enabled)"
echo "   🔒 https://www.$DOMAIN (SSL enabled)"
echo ""
echo "🔐 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   Email: admin@$DOMAIN"
echo ""
echo "📊 Management commands:"
echo "   pm2 status          - Check application status"
echo "   pm2 logs            - View application logs"
echo "   pm2 restart all     - Restart applications"
echo "   mysql -u bittrade -pbittrade123 bittrade - Access database"
echo ""
echo "🔄 To redeploy: curl -sSL https://raw.githubusercontent.com/yashpatil27/bittrade/main/deploy.sh | bash"
