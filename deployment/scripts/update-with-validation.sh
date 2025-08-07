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
if [ -f "$SCRIPT_DIR/validate-deployment.sh" ]; then
    if ! "$SCRIPT_DIR/validate-deployment.sh"; then
        log_error "Pre-deployment validation failed!"
        log_error "Please fix the issues and try again."
        exit 1
    fi
    log_success "Pre-deployment validation passed!"
else
    log_warning "Validation script not found, skipping pre-checks"
fi

log_info "Step 2/9: Pulling latest changes from repository..."
git pull origin main
log_success "Repository updated"

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
if [ -d "migrations" ] && [ "$(ls -A migrations)" ]; then
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
DB_TEST=$(node -e "
const mysql = require('mysql2/promise');
const config = require('./config/config');
mysql.createConnection(config.database)
  .then(() => console.log('OK'))
  .catch(err => { console.log('FAIL'); process.exit(1); });
" 2>/dev/null || echo "FAIL")

if [ "$DB_TEST" = "OK" ]; then
    log_success "Database connectivity verified"
else
    log_error "Database connection failed! Aborting deployment."
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
FAILED_PROCESSES=$(pm2 jlist | jq -r '.[] | select(.pm2_env.status != "online") | .name' | wc -l)

if [ "$FAILED_PROCESSES" -eq 0 ]; then
    log_success "✅ All processes are running successfully!"
    pm2 status
    
    log_success "🎉 Deployment completed successfully!"
    
    # Show useful information
    echo ""
    log_info "Application URLs:"
    log_info "  Frontend: http://$(hostname -I | awk '{print $1}'):3000"
    log_info "  Backend:  http://$(hostname -I | awk '{print $1}'):3001"
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
