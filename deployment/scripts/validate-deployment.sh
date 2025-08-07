#!/bin/bash

echo "🔍 BitTrade Deployment Validation Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print status
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ((ERRORS++))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

echo ""
echo "1. Checking Database Configuration..."

# Check if config uses localhost instead of IP
if grep -q "localhost" /home/ubuntu/bittrade/server/config/config.js; then
    print_warning "Config uses 'localhost' - should use explicit IP address"
fi

# Check MySQL service
systemctl is-active mysql >/dev/null 2>&1
print_status "MySQL service running" $?

# Check MySQL binding
MYSQL_BINDING=$(ss -tlnp | grep :3306 | grep "127.0.0.1")
if [ -n "$MYSQL_BINDING" ]; then
    print_status "MySQL listening on IPv4 (127.0.0.1:3306)" 0
else
    print_status "MySQL IPv4 binding" 1
fi

echo ""
echo "2. Checking Environment Files..."

# Check for required env files
[ -f "/home/ubuntu/bittrade/server/.env.production" ]
print_status ".env.production exists" $?

[ -f "/home/ubuntu/bittrade/server/.env.development" ]
print_status ".env.development exists" $?

echo ""
echo "3. Testing Database Connection..."

# Test database connection with timeout and proper cleanup
cd /home/ubuntu/bittrade/server

# Test with production environment (this is what the app will use)
NODE_ENV=production timeout 10 node -e "
const mysql = require('mysql2/promise');
const config = require('./config/config');

async function testConnection() {
  let connection;
  try {
    connection = await mysql.createConnection(config.database);
    console.log('SUCCESS');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.log('FAILED: ' + err.message);
    if (connection) {
      try { await connection.end(); } catch(e) {}
    }
    process.exit(1);
  }
}

testConnection();
" 2>/dev/null
DB_TEST_EXIT_CODE=$?

if [ $DB_TEST_EXIT_CODE -eq 0 ]; then
    print_status "Database connection test (production mode)" 0
else
    if [ $DB_TEST_EXIT_CODE -eq 124 ]; then
        print_status "Database connection test (TIMEOUT)" 1
    else
        print_status "Database connection test (FAILED)" 1
    fi
fi

echo ""
echo "4. Checking Environment Variable Loading..."

# Test environment variable loading with timeout
cd /home/ubuntu/bittrade/server
NODE_ENV=production timeout 5 node -e "
const env = process.env.NODE_ENV || 'development';
try {
  const result = require('dotenv').config({ path: \`.env.\${env}\` });
  if (result.parsed && Object.keys(result.parsed).length > 0) {
    console.log('SUCCESS: ' + Object.keys(result.parsed).length + ' variables loaded');
  } else {
    console.log('SUCCESS: Using environment defaults (no .env file needed)');
  }
} catch(err) {
  console.log('FAILED: ' + err.message);
}
process.exit(0);
" 2>/dev/null
ENV_TEST_EXIT_CODE=$?

if [ $ENV_TEST_EXIT_CODE -eq 0 ]; then
    print_status "Environment variable loading" 0
else
    print_status "Environment variable loading (TIMEOUT/FAILED)" 1
fi

echo ""
echo "5. Checking PM2 Configuration..."

# Check if ecosystem config exists
[ -f "/home/ubuntu/bittrade/ecosystem.config.js" ]
print_status "PM2 ecosystem config exists" $?

# Check if both processes are defined
if grep -q "bittrade-server" /home/ubuntu/bittrade/ecosystem.config.js && grep -q "bittrade-client" /home/ubuntu/bittrade/ecosystem.config.js; then
    print_status "Both server and client processes defined" 0
else
    print_status "Both server and client processes defined" 1
fi

echo ""
echo "6. Checking Build Status..."

# Check if client build exists
[ -d "/home/ubuntu/bittrade/client/build" ]
print_status "Client build directory exists" $?

[ -f "/home/ubuntu/bittrade/client/build/index.html" ]
print_status "Client build files exist" $?

echo ""
echo "========================================"
echo "📊 Validation Summary:"
echo "   Errors: $ERRORS"
echo "   Warnings: $WARNINGS"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Deployment validation passed!${NC}"
    exit 0
else
    echo -e "${RED}💥 Deployment validation failed with $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the issues above before deploying."
    echo "See DEPLOYMENT_TROUBLESHOOTING.md for detailed solutions."
    exit 1
fi
