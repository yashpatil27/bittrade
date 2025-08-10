#!/bin/bash

# BitTrade Simple Update Script
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

cd "$PROJECT_ROOT"

log_info "Starting BitTrade update..."

log_info "Step 1/6: Pulling latest changes..."
git pull origin main || true

log_info "Step 2/6: Updating server dependencies..."
cd server && npm install --production && cd ..

log_info "Step 3/6: Updating client dependencies..."
cd client && npm install

log_info "Step 4/6: Building client..."
npm run build && cd ..

log_info "Step 5/6: Restarting PM2 processes..."
pm2 restart all

log_info "Step 6/6: Waiting for services..."
sleep 3

log_success "✅ Update completed!"
pm2 status
