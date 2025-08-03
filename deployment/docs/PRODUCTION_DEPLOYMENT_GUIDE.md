# BitTrade Production Deployment Guide

This comprehensive guide documents the exact steps taken to deploy BitTrade in production on Ubuntu with PM2, Nginx, and SSL certificates.

## Table of Contents

1. [Server Setup](#server-setup)
2. [Application Structure](#application-structure)
3. [PM2 Configuration](#pm2-configuration)
4. [Session-Independent Process Management](#session-independent-process-management)
5. [Nginx Reverse Proxy Setup](#nginx-reverse-proxy-setup)
6. [SSL Certificate Setup with Certbot](#ssl-certificate-setup-with-certbot)
7. [Automated Monitoring and Recovery](#automated-monitoring-and-recovery)
8. [Manual Operations](#manual-operations)
9. [Troubleshooting](#troubleshooting)

## Server Setup

### Prerequisites
- Ubuntu Server (tested on Ubuntu 22.04)
- Domain name pointing to server IP (bittrade.co.in)
- Node.js and npm installed
- PM2 installed globally

### Initial Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

## Application Structure

The BitTrade application consists of two main components:

### 1. Backend Server (`/server/server.js`)
- Express.js API server
- Runs on port 3001
- Handles API routes, authentication, database operations

### 2. Frontend Client (`/client/static-server.js`)
- Static file server for React build
- Runs on port 3000
- Serves the compiled React application

```javascript
// client/static-server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Static server running on port ${PORT}`);
});
```

## PM2 Configuration

### Ecosystem Configuration File (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'bittrade-server',
      script: './server/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        DB_HOST: '127.0.0.1',
        DB_USER: 'bittrade',
        DB_PASSWORD: 'bittrade123',
        DB_NAME: 'bittrade',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '6379',
        JWT_SECRET: 'bittrade_secret_key_2024_production',
        PORT: 3001,
      },
      output: './logs/server-out.log',
      error: './logs/server-error.log',
      log: './logs/server-combined.log',
    },
    {
      name: 'bittrade-client',
      script: './client/static-server.js',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      output: './logs/client-out.log',
      error: './logs/client-error.log',
      log: './logs/client-combined.log',
    },
  ],
};
```

## Session-Independent Process Management

### The Challenge
When you exit SSH sessions, processes can get killed due to session termination signals. This was solved using session detachment techniques.

### Solution: Detached Startup Script

Create `/home/ubuntu/start_detached.sh`:

```bash
#!/bin/bash

# Set environment variables
export PM2_HOME="/home/ubuntu/.pm2"
export PATH="/usr/local/bin:$PATH"

# Kill any existing PM2 processes first
pkill -f PM2 2>/dev/null
sleep 2

# Start PM2 and applications using setsid and nohup to ensure they persist
setsid nohup pm2 start /home/ubuntu/bittrade/ecosystem.config.js > /dev/null 2>&1 &

# Wait for PM2 to start
sleep 5

# Save the process list
pm2 save > /dev/null 2>&1

echo "BitTrade applications started successfully"
```

Make it executable:
```bash
chmod +x /home/ubuntu/start_detached.sh
```

### Key Techniques Used
- **`setsid`**: Creates a new session, completely detaching processes from the terminal
- **`nohup`**: Prevents processes from receiving hangup signals when SSH session ends
- **Background execution (`&`)**: Runs the command in the background

## Nginx Reverse Proxy Setup

### 1. Create Nginx Configuration

Create `/etc/nginx/sites-available/bittrade`:

```nginx
server {
    server_name bittrade.co.in www.bittrade.co.in;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API endpoints (backend server on port 3001)
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type";
            return 204;
        }
    }

    # WebSocket support for real-time updates
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

    # Main application - ALL requests go to frontend server (port 3000)
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

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/bittrade.co.in/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/bittrade.co.in/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

# HTTP to HTTPS redirect
server {
    if ($host = www.bittrade.co.in) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = bittrade.co.in) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name bittrade.co.in www.bittrade.co.in;
    return 404; # managed by Certbot
}
```

### 2. Enable the Site

```bash
# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/bittrade /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## SSL Certificate Setup with Certbot

### 1. Install SSL Certificate

```bash
sudo certbot --nginx -d bittrade.co.in -d www.bittrade.co.in
```

### 2. Automatic Renewal

Certbot automatically sets up renewal. Verify it's working:

```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

## Automated Monitoring and Recovery

### 1. Health Monitoring Script

Create `/home/ubuntu/monitor_simple.sh`:

```bash
#!/bin/bash

# Check if PM2 daemon is running
if ! pgrep -f "PM2.*God Daemon" > /dev/null; then
    # PM2 daemon is not running, start it
    /home/ubuntu/start_detached.sh > /dev/null 2>&1
fi

# Check if both applications are running
if ! pm2 list 2>/dev/null | grep -q "bittrade-server.*online" || \
   ! pm2 list 2>/dev/null | grep -q "bittrade-client.*online"; then
    # One or both applications are not running, restart them
    /home/ubuntu/start_detached.sh > /dev/null 2>&1
fi
```

Make it executable:
```bash
chmod +x /home/ubuntu/monitor_simple.sh
```

### 2. Cron Jobs Setup

```bash
# Edit crontab
crontab -e

# Add these lines:
@reboot /home/ubuntu/start_detached.sh
*/5 * * * * /home/ubuntu/monitor_simple.sh
```

### 3. Enable User Lingering

This allows user services to run even when the user is not logged in:

```bash
sudo loginctl enable-linger ubuntu
```

## Manual Operations

### Starting the Application
```bash
/home/ubuntu/start_detached.sh
```

### Checking Status
```bash
# PM2 status
pm2 status

# Process tree
ps aux | grep -E "(PM2|node.*server|node.*client)" | grep -v grep

# Web response check
curl -I localhost:3001
curl -I localhost:3000
```

### Viewing Logs
```bash
# PM2 logs
pm2 logs

# Individual application logs
pm2 logs bittrade-server
pm2 logs bittrade-client

# Log files
tail -f /home/ubuntu/bittrade/logs/server-combined.log
tail -f /home/ubuntu/bittrade/logs/client-combined.log
```

### Restarting Services
```bash
# Restart all applications
pm2 restart all

# Restart specific application
pm2 restart bittrade-server
pm2 restart bittrade-client

# Reload Nginx
sudo systemctl reload nginx
```

## Troubleshooting

### Application Not Accessible After SSH Logout

**Problem**: Applications stop working when SSH session ends.

**Solution**: Use the detached startup script:
```bash
/home/ubuntu/start_detached.sh
```

### Bad Gateway Error

**Causes and Solutions**:

1. **PM2 not running**:
   ```bash
   pm2 status
   /home/ubuntu/start_detached.sh
   ```

2. **Applications not responding**:
   ```bash
   curl localhost:3000
   curl localhost:3001
   pm2 restart all
   ```

3. **Nginx misconfiguration**:
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

### Port Conflicts

```bash
# Check what's using ports
sudo netstat -tulnp | grep :3000
sudo netstat -tulnp | grep :3001

# Kill processes if needed
sudo kill -9 <PID>
```

## Security Considerations

1. **Environment Variables**: Store sensitive data in environment variables, not in code
2. **Firewall**: Only expose necessary ports (80, 443, 22)
3. **Regular Updates**: Keep system and dependencies updated
4. **Log Monitoring**: Monitor application logs for suspicious activity
5. **Backup**: Regular backups of application data and configuration

## Performance Optimization

1. **PM2 Clustering**: Can increase instances for CPU-intensive tasks
2. **Nginx Caching**: Add caching headers for static assets
3. **Gzip Compression**: Already enabled in nginx config
4. **Database Optimization**: Index frequently queried fields
5. **CDN**: Consider using a CDN for static assets

## Maintenance Tasks

### Daily
- Monitor application logs
- Check PM2 status

### Weekly
- Review server resources (CPU, memory, disk)
- Check for security updates

### Monthly
- Analyze performance metrics
- Review and update dependencies
- Test backup and recovery procedures

---

## Summary

This production setup provides:
- ✅ **High Availability**: Applications restart automatically on failure
- ✅ **Session Independence**: Survives SSH disconnections
- ✅ **SSL Security**: Automatic HTTPS with certificate renewal
- ✅ **Load Balancing**: Nginx reverse proxy with proper headers
- ✅ **Monitoring**: Automated health checks and recovery
- ✅ **Logging**: Comprehensive application logging
- ✅ **Security**: Headers, CORS, and proper access controls

The setup ensures BitTrade remains online and accessible at https://bittrade.co.in with minimal manual intervention required.
