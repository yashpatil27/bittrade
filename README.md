# BitTrade Application

A cryptocurrency trading platform built with Node.js, React, and MySQL.

## Quick Start

### Development
```bash
# Start server (development)
cd server && npm run dev

# Start client (development) 
cd client && npm start
```

### Production Deployment
```bash
# Enhanced deployment script with validation
./deployment/scripts/update-with-validation.sh

# Original deployment script  
./deployment/scripts/update.sh

# Pre-deployment validation only
./deployment/scripts/validate-deployment.sh
```

## Project Structure
```
bittrade/
├── server/              # Node.js backend
├── client/              # React frontend
├── deployment/
│   └── scripts/         # Deployment scripts
├── ecosystem.config.js  # PM2 configuration
└── DEPLOYMENT_TROUBLESHOOTING.md  # Critical deployment guide
```

## Production Services
- **Backend API**: Port 3001 (PM2: bittrade-server)
- **Frontend**: Port 3000 (PM2: bittrade-client)
- **Database**: MySQL on port 3306
- **Cache**: Redis on port 6379

## Important Notes
⚠️ **Before deploying, read [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md)**

This guide contains critical fixes for common deployment issues including:
- Database connection failures (IPv4/IPv6 localhost issues)
- Environment variable loading problems
- PM2 configuration mistakes

## Monitoring
```bash
pm2 status          # Check process status
pm2 logs            # View logs
pm2 monit           # Real-time monitoring
```

## Support
For deployment issues, see [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) first.
