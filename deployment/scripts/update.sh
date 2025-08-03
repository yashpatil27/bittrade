#!/bin/bash

# BitTrade Update Script
# Pulls latest changes from GitHub, runs migrations, and restarts PM2 processes
# Usage: ./deployment/scripts/update.sh [branch_name]

set -e

# Configuration
APP_DIR="/home/ubuntu/bittrade"
DB_NAME="bittrade"
DB_USER="bittrade"
DB_PASSWORD="bittrade123"
BRANCH="${1:-main}"  # Default to main branch if no branch specified

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[UPDATE]${NC} $1"
}

# Function to check if PM2 is running
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 is not installed or not in PATH"
        exit 1
    fi
    
    if ! pgrep -f "PM2.*God Daemon" > /dev/null; then
        print_warning "PM2 daemon is not running, starting it..."
        pm2 ping
    fi
}

# Function to backup database before update
backup_database() {
    print_status "Creating database backup before update..."
    BACKUP_DIR="/home/ubuntu/backups"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    
    mkdir -p $BACKUP_DIR
    
    if mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/pre_update_backup_$TIMESTAMP.sql 2>/dev/null; then
        print_status "✅ Database backup created: pre_update_backup_$TIMESTAMP.sql"
        return 0
    else
        print_warning "⚠️  Database backup failed, continuing without backup"
        return 1
    fi
}

# Function to run database migrations
run_migrations() {
    print_status "Checking for database migrations..."
    
    # Check if there are any migration files
    if [ -d "$APP_DIR/database/migrations" ] && [ "$(ls -A $APP_DIR/database/migrations)" ]; then
        print_status "Found migration files, running migrations..."
        for migration_file in $APP_DIR/database/migrations/*.sql; do
            if [ -f "$migration_file" ]; then
                print_status "Running migration: $(basename $migration_file)"
                if mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < "$migration_file" 2>/dev/null; then
                    print_status "✅ Migration completed: $(basename $migration_file)"
                else
                    print_error "❌ Migration failed: $(basename $migration_file)"
                    return 1
                fi
            fi
        done
    elif [ -f "$APP_DIR/database/migrate.sql" ]; then
        print_status "Found migrate.sql, running database migration..."
        if mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < $APP_DIR/database/migrate.sql 2>/dev/null; then
            print_status "✅ Database migration completed"
        else
            print_error "❌ Database migration failed"
            return 1
        fi
    else
        print_status "No migration files found, skipping migrations"
    fi
    
    return 0
}

# Function to check if any files changed that require rebuild
check_client_changes() {
    print_status "Checking for client-side changes..."
    
    # Check if there are changes in client directory or package files
    if git diff HEAD~1 --name-only | grep -E "(client/|package\.json|package-lock\.json)" > /dev/null 2>&1; then
        print_status "Client-side changes detected, rebuild required"
        return 0
    else
        print_status "No client-side changes detected"
        return 1
    fi
}

# Main update process
main() {
    print_header "🚀 Starting BitTrade Update Process..."
    echo "Branch: $BRANCH"
    echo "Application Directory: $APP_DIR"
    echo ""
    
    # Change to application directory
    if [ ! -d "$APP_DIR" ]; then
        print_error "Application directory not found: $APP_DIR"
        exit 1
    fi
    
    cd $APP_DIR
    
    # Check if this is a git repository
    if [ ! -d ".git" ]; then
        print_error "Not a git repository. Please ensure the application was installed via git."
        exit 1
    fi
    
    # Check PM2 status
    check_pm2
    
    print_status "Step 1/8: Checking current status..."
    CURRENT_COMMIT=$(git rev-parse HEAD)
    print_status "Current commit: ${CURRENT_COMMIT:0:8}"
    
    # Show current PM2 status
    print_status "Current PM2 status:"
    pm2 list || true
    
    print_status "Step 2/8: Fetching latest changes from GitHub..."
    git fetch origin $BRANCH
    
    # Check if there are any updates
    LATEST_COMMIT=$(git rev-parse origin/$BRANCH)
    if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
        print_status "✅ Already up to date! No changes to deploy."
        print_status "Current version: ${CURRENT_COMMIT:0:8}"
        return 0
    fi
    
    print_status "New version available: ${LATEST_COMMIT:0:8}"
    print_status "Changes to be applied:"
    git log --oneline ${CURRENT_COMMIT}..${LATEST_COMMIT} | head -10
    echo ""
    
    # Backup database
    print_status "Step 3/8: Creating database backup..."
    backup_database
    
    print_status "Step 4/8: Pulling latest code..."
    git pull origin $BRANCH
    
    print_status "Step 5/8: Installing/updating dependencies..."
    npm install --production
    
    # Install server dependencies
    if [ -f "server/package.json" ]; then
        cd server && npm install --production && cd ..
    fi
    
    # Check if client rebuild is needed
    CLIENT_REBUILD_NEEDED=false
    if check_client_changes; then
        CLIENT_REBUILD_NEEDED=true
    fi
    
    # Install client dependencies and rebuild if needed
    if [ -f "client/package.json" ]; then
        cd client
        npm install --production
        if [ "$CLIENT_REBUILD_NEEDED" = true ]; then
            print_status "Rebuilding client application..."
            npm run build
        fi
        cd ..
    fi
    
    print_status "Step 6/8: Running database migrations..."
    if ! run_migrations; then
        print_error "Database migrations failed. Rolling back..."
        git checkout $CURRENT_COMMIT
        print_error "Update failed and rolled back to previous version"
        exit 1
    fi
    
    print_status "Step 7/8: Restarting PM2 processes..."
    
    # Stop current processes gracefully
    print_status "Stopping current processes..."
    pm2 delete all || true
    sleep 2
    
    # Ensure logs directory exists
    mkdir -p logs
    
    # Start processes using ecosystem.config.js
    print_status "Starting updated processes..."
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    print_status "Step 8/8: Verifying deployment..."
    sleep 5
    
    # Check if processes are running
    if pm2 list | grep -q "online"; then
        print_status "✅ Update completed successfully!"
        echo ""
        echo "📊 Updated Application Status:"
        pm2 list
        echo ""
        echo "🔄 Version Information:"
        echo "   Previous: ${CURRENT_COMMIT:0:8}"
        echo "   Current:  ${LATEST_COMMIT:0:8}"
        echo ""
        echo "📝 Recent Changes:"
        git log --oneline -5
        echo ""
        echo "🔧 Management Commands:"
        echo "   pm2 status          - Check application status"
        echo "   pm2 logs            - View application logs"
        echo "   pm2 restart all     - Restart all processes"
        echo "   pm2 reload all      - Reload all processes (zero-downtime)"
    else
        print_error "❌ Some processes failed to start!"
        pm2 list
        print_error "Check the logs for more details:"
        echo "   pm2 logs --lines 50"
        exit 1
    fi
}

# Error handling
trap 'print_error "Update process interrupted"; exit 1' INT TERM

# Check if running as the correct user (not root)
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   print_error "Please run as the application user (typically 'ubuntu')"
   exit 1
fi

# Run main function
main "$@"
