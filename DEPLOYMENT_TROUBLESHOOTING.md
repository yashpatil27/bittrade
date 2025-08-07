# BitTrade Deployment Troubleshooting Guide

## Common Deployment Issues and Solutions

This document outlines critical deployment issues encountered during production deployment and their solutions to prevent future incidents.

## Issue #1: Database Connection Failures (IPv4/IPv6 Localhost Resolution)

### Problem Description
- **Symptom**: Server fails to start with `ECONNREFUSED ::1:3306` error
- **Cause**: Node.js resolving `localhost` to IPv6 (`::1`) while MySQL only listens on IPv4 (`127.0.0.1`)
- **Impact**: Complete application failure, infinite restart loops

### Root Cause Analysis
1. Environment variables not loading properly in PM2 process
2. Config falls back to default `localhost` hostname
3. Node.js DNS resolution prefers IPv6 when available
4. MySQL configured to listen only on IPv4 interface

### Solution Implemented
```javascript
// BAD: Relies on environment variable fallback to 'localhost'
database: {
  host: process.env.DB_HOST || 'localhost', // This can resolve to IPv6!
}

// GOOD: Always use explicit IP address
database: {
  host: '127.0.0.1', // Explicit IPv4 address
  user: process.env.DB_USER || 'bittrade',
  password: process.env.DB_PASSWORD || 'bittrade123',
  database: process.env.DB_NAME || 'bittrade',
}
```

### Prevention Guidelines
1. **Always use explicit IP addresses** instead of `localhost` in production configs
2. **Test environment variable loading** in PM2 before deployment
3. **Verify MySQL binding** with `ss -tlnp | grep :3306` 
4. **Use connection testing** scripts during deployment

---

## Issue #2: Environment Variable Loading in PM2

### Problem Description
- **Symptom**: Environment variables showing as "injecting env (0)" in PM2 logs
- **Cause**: PM2 not correctly loading `.env.production` files
- **Impact**: Application falls back to development defaults

### Root Cause Analysis
1. PM2 ecosystem config defaulting to development mode
2. Missing `.env.development` file when NODE_ENV defaults to 'development'
3. Dotenv package unable to load non-existent files

### Solution Implemented
```javascript
// PM2 Ecosystem Config Fix
module.exports = {
  apps: [{
    name: 'bittrade-server',
    script: 'server/server.js',
    env: {
      NODE_ENV: 'production', // Explicit production mode
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

### Prevention Guidelines
1. **Always set explicit NODE_ENV** in PM2 configurations
2. **Create environment files** for all modes (development, production, staging)
3. **Test environment loading** with simple Node.js scripts before PM2 deployment
4. **Use PM2 env logs** to verify variable injection

---

## Issue #3: Missing Client Process Configuration

### Problem Description
- **Symptom**: Only server running, client not accessible
- **Cause**: PM2 configuration missing client process
- **Impact**: Frontend not served, incomplete deployment

### Solution Implemented
```javascript
// Complete PM2 configuration with both processes
module.exports = {
  apps: [
    {
      name: 'bittrade-server',
      script: 'server/server.js',
      // ... server config
    },
    {
      name: 'bittrade-client',
      script: 'client/static-server.js', // Static file server for built React app
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

### Prevention Guidelines
1. **Include all application components** in PM2 configuration
2. **Use static file serving** for production React builds
3. **Test both services** independently before combined deployment
4. **Document port assignments** clearly

---

## Diagnostic Commands Reference

### Database Connection Testing
```bash
# Check MySQL binding
ss -tlnp | grep :3306

# Test database connection from Node.js
cd /path/to/server
node -e "
const mysql = require('mysql2/promise');
const config = require('./config/config');
mysql.createConnection(config.database)
  .then(() => console.log('✅ DB Connected'))
  .catch(err => console.error('❌ DB Failed:', err.message));
"
```

### Environment Variable Debugging
```bash
# Test environment loading
cd /path/to/server
NODE_ENV=production node -e "
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: \`.env.\${env}\` });
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
"
```

### PM2 Troubleshooting
```bash
# Check process status
pm2 status

# View logs for specific issues
pm2 logs --lines 50

# Monitor in real-time
pm2 monit

# Restart with fresh config
pm2 delete all
pm2 start ecosystem.config.js
```

---

## Pre-Deployment Checklist

### Environment Setup
- [ ] All required `.env` files exist (`.env.production`, `.env.development`)
- [ ] Database credentials tested and verified
- [ ] MySQL service running and accessible on correct interface
- [ ] Redis service running (if applicable)

### Configuration Validation
- [ ] Database host uses explicit IP addresses, not `localhost`
- [ ] PM2 ecosystem config sets explicit NODE_ENV
- [ ] All application processes defined in PM2 config
- [ ] Port assignments documented and not conflicting

### Testing
- [ ] Database connection test passes
- [ ] Environment variables load correctly in PM2
- [ ] Both server and client start independently
- [ ] Application accessible on configured ports

### Post-Deployment Verification
- [ ] PM2 processes stable (no restart loops)
- [ ] Application logs show successful startup
- [ ] Database connections established
- [ ] Frontend serves correctly
- [ ] API endpoints responding

---

## Emergency Recovery Procedures

### If deployment fails:
1. **Stop all processes**: `pm2 stop all`
2. **Check logs**: `pm2 logs --lines 100`
3. **Verify database**: `ss -tlnp | grep :3306`
4. **Test config**: Run diagnostic commands above
5. **Apply fixes**: Modify configuration files
6. **Restart services**: `pm2 restart ecosystem.config.js`

### Rollback procedure:
1. Restore previous working configuration files
2. `pm2 delete all`
3. `pm2 start ecosystem.config.js`
4. Verify all services online

---

## Key Takeaways for Developers

1. **Never use `localhost` in production** - always use explicit IP addresses
2. **Always test environment variable loading** before deployment
3. **Include comprehensive logging** in application startup
4. **Use connection testing scripts** as part of deployment process
5. **Document all configuration changes** and test thoroughly
6. **Keep backup copies** of working configurations

---

*This document was created after resolving a critical production deployment issue on August 7, 2025. Keep it updated as new issues are discovered and resolved.*

## Issue #4: Validation Scripts Hanging During Database Tests

### Problem Description
- **Symptom**: Validation or deployment scripts get stuck at "Testing Database Connection..."
- **Cause**: Node.js database connection tests not properly closing connections or handling timeouts
- **Impact**: Deployment process hangs indefinitely

### Root Cause Analysis
1. MySQL connection objects not being properly closed after testing
2. No timeout mechanism for database connection attempts
3. Unhandled promise rejections causing process to hang

### Solution Implemented
```javascript
// BAD: Can hang indefinitely
const connection = await mysql.createConnection(config);
console.log('Connected');

// GOOD: Proper cleanup and timeout
async function testConnection() {
  let connection;
  try {
    connection = await mysql.createConnection(config.database);
    console.log('SUCCESS');
    await connection.end(); // Always close connection
    process.exit(0);
  } catch (err) {
    console.log('FAILED: ' + err.message);
    if (connection) {
      try { await connection.end(); } catch(e) {}
    }
    process.exit(1);
  }
}

// Add timeout to prevent hanging
setTimeout(() => {
  console.log('TIMEOUT');
  process.exit(1);
}, 5000);
```

### Prevention Guidelines
1. **Always close database connections** in test scripts
2. **Use timeout mechanisms** for all external service tests
3. **Handle both success and error cases** explicitly
4. **Use `process.exit()`** to ensure scripts terminate properly
5. **Test scripts independently** before including in deployment pipelines

### Alternative Testing Methods
```bash
# Using mysql client (faster and more reliable for connection testing)
mysql -h 127.0.0.1 -u bittrade -pbittrade123 -e "SELECT 1;" bittrade

# Using timeout with Node.js tests
timeout 10 node quick-db-test.js
```

