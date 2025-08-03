# BitTrade Production Setup

This document details the entire setup for running the BitTrade application in a production environment using PM2 on Ubuntu.

## Components Setup

1. **PM2**: A process manager for Node.js applications. Ensures our apps remain online.

2. **Detached Session**: Applications run independently of SSH connections, preventing downtime after disconnects.

3. **Auto-Recovery**: Automated startups and health checks ensure BitTrade remains available without manual intervention.

## Configuration Steps

1. **Starting Applications in Detached Session**

   Utilizes `start_detached.sh` script:
   - **setsid** creates a new session, detaching from the terminal.
   - **nohup** ignores hangup signals, ensuring continuity post-SSH logout.
   - Location: `/home/ubuntu/start_detached.sh`.

   ```bash
   #!/bin/bash
   
   # Kill any existing PM2
   pkill -f PM2 2>/dev/null
   sleep 2
   
   # Start PM2 detached
   setsid nohup pm2 start /home/ubuntu/bittrade/ecosystem.config.js >/dev/null 2>&1 &
   sleep 5
   
   # Save configuration
   pm2 save >/dev/null 2>&1
   
   echo "BitTrade started in detached session"
   ```

2. **Cron Jobs**

   - **Startup Automation**: Ensures PM2 apps start on boot.
   - **Health Monitoring**: Checks every 5 minutes and restarts if needed.

   ```bash
   @reboot /home/ubuntu/start_detached.sh
   */5 * * * * /home/ubuntu/monitor_simple.sh
   ```

3. **Monitor Script**

   Location: `/home/ubuntu/monitor_simple.sh`.

   ```bash
   #!/bin/bash

   # Check PM2 status
   if ! pgrep -f "PM2.*God Daemon" >/dev/null; then
       /home/ubuntu/start_detached.sh >/dev/null 2>&1
   fi

   # Check app status
   if ! pm2 list 2>/dev/null | grep -q "bittrade-server.*online" || \
      ! pm2 list 2>/dev/null | grep -q "bittrade-client.*online"; then
       /home/ubuntu/start_detached.sh >/dev/null 2>&1
   fi
   ```

4. **User Lingering**

   Enabled so `systemd` services run without active user sessions.

   ```bash
   sudo loginctl enable-linger ubuntu
   ```

## Nginx Reverse Proxy and SSL Setup

### Nginx Configuration

Configuration file location: `/etc/nginx/sites-available/bittrade`

```nginx
server {
    server_name bittrade.co.in www.bittrade.co.in;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

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

### Certbot Setup

- Utilizes Certbot for automatic SSL certificate management.
- Certificates are renewed automatically.
- Relevant paths for SSL in the Nginx configuration are managed by Certbot.

## Manual Checks

1. **Process Status**
   ```bash
   pm2 status
   ```

2. **Validate Process Tree**
   ```bash
   ps aux | grep -E "(PM2|node.*server|node.*client)" | grep -v grep
   ```

3. **Web Response Check**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" localhost:3001
   ```

## Conclusion

This setup ensures that your BitTrade application remains operational and efficiently managed. The use of PM2, careful configurations, and strategic automation offers resilience against downtime and lost connections.
