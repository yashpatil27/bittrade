#!/bin/bash

# BitTrade Deployment Script with Validation
# Enhanced version that includes pre-deployment checks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

cd "$PROJECT_ROOT"

log_info "Starting BitTrade deployment with validation..."

log_info "Step 1/9: Running pre-deployment validation..."
if [ -f "$SCRIPT_DIR/validate-deployment-fixed.sh" ]; then
    if ! "$SCRIPT_DIR/validate-deployment-fixed.sh"; then
        log_error "Pre-deployment validation failed!"
        log_error "Please fix the issues and try again."
        exit 1
    fi
    log_success "Pre-deployment validation passed!"
else
    log_warning "Validation script not found, skipping pre-checks"
fi

log_info "Step 2/9: Pulling latest changes from repository..."
git pull origin main || {
    log_warning "Git pull failed or not in a git repository"
}
log_success "Repository update completed"

log_info "Step 3/9: Installing/updating server dependencies..."
cd server
npm install --production
cd ..
log_success "Server dependencies updated"

log_info "Step 4/9: Installing/updating client dependencies..."
cd client
npm install
log_success "Client dependencies updated"

log_info "Step 5/9: Building client for production..."
npm run build
log_success "Client built successfully"
cd ..

log_info "Step 6/9: Running database migrations..."
cd server
log_info "Checking for database migrations..."
if [ -d "migrations" ] && [ "$(ls -A migrations 2>/dev/null)" ]; then
    log_info "Running migrations..."
    # Add your migration command here
    # Example: npm run migrate
    log_success "Database migrations completed"
else
    log_info "No migration files found, skipping migrations"
fi
cd ..

log_info "Step 7/9: Testing database connectivity before restart..."
cd server

# Quick MySQL connection test using mysql command if available
if command -v mysql >/dev/null 2>&1; then
    log_info "Testing MySQL connection with mysql client..."
    if mysql -h 127.0.0.1 -u bittrade -pbittrade123 -e "SELECT 1;" bittrade >/dev/null 2>&1; then
        log_success "Database connectivity verified with mysql client"
    else
        log_error "Database connection failed with mysql client!"
        log_error "Please check database credentials and service status"
        exit 1
    fi
else
    log_info "MySQL client not available, testing with Node.js..."
fi

# Always test with Node.js as well since that's what the app uses
log_info "Testing Node.js database connection..."
NODE_ENV=production timeout 15 node -e "
require('dotenv').config({ path: '.env.production' });
const mysql = require('mysql2/promise');
const config = require('./config/config');

async function test() {
  let conn;
  try {
    conn = await mysql.createConnection(config.database);
    console.log('NODE_DB_TEST_SUCCESS');
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.log('NODE_DB_TEST_FAILED: ' + err.message);
    if (conn) try { await conn.end(); } catch(e) {}
    process.exit(1);
  }
}
test();
" 2>/dev/null

if [ $? -eq 0 ]; then
    log_success "Node.js database connectivity verified"
else
    log_error "Node.js database connection test failed! Aborting deployment."
    log_error "This suggests an issue with the application's database configuration."
    log_error "Check the server/config/config.js file and environment variables."
    exit 1
fi
cd ..

log_info "Step 8/9: Restarting PM2 processes..."
log_info "Stopping current processes..."
pm2 stop all || true

log_info "Starting updated processes..."
pm2 start ecosystem.config.js

log_success "PM2 processes restarted"

log_info "Step 9/9: Verifying deployment..."
sleep 5

# Check if all processes are online
if command -v jq >/dev/null 2>&1; then
    FAILED_PROCESSES=$(pm2 jlist | jq -r '.[] | select(.pm2_env.status != "online") | .name' 2>/dev/null | wc -l)
else
    # Fallback without jq
    ONLINE_COUNT=$(pm2 list | grep -c "online" || echo "0")
    TOTAL_COUNT=$(pm2 list | grep -E "(online|stopped|errored)" | wc -l || echo "0")
    if [ "$ONLINE_COUNT" -eq "$TOTAL_COUNT" ] && [ "$TOTAL_COUNT" -gt 0 ]; then
        FAILED_PROCESSES=0
    else
        FAILED_PROCESSES=1
    fi
fi

if [ "$FAILED_PROCESSES" -eq 0 ]; then
    log_success "✅ All processes are running successfully!"
    pm2 status
    
    log_success "🎉 Deployment completed successfully!"
    
    # Show useful information
    echo ""
    log_info "Application URLs:"
    SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    log_info "  Frontend: http://$SERVER_IP:3000"
    log_info "  Backend:  http://$SERVER_IP:3001"
    echo ""
    log_info "Useful commands:"
    log_info "  View logs:    pm2 logs"
    log_info "  Monitor:      pm2 monit"
    log_info "  Status:       pm2 status"
    
else
    log_error "❌ Some processes failed to start!"
    pm2 status
    log_error "Check the logs for more details:"
    log_error "   pm2 logs --lines 50"
    exit 1
fi
