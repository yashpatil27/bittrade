#!/bin/bash

# BitTrade Database Setup Script
# Sets up MySQL, Redis, creates database schema, and seeds admin data

set -e

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
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# Database configuration
DB_NAME="bittrade"
DB_USER="bittrade"
DB_PASSWORD="bittrade123"
DB_ROOT_PASSWORD="root123"

# Database files paths
SCHEMA_FILE="/home/ubuntu/bittrade/database/schema.sql"
SEED_FILE="/home/ubuntu/bittrade/database/seed_admin.sql"

print_header "🗄️  Starting BitTrade Database Setup..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Verify database files exist
print_status "Verifying database files..."
if [ ! -f "$SCHEMA_FILE" ]; then
    print_error "❌ Schema file not found at $SCHEMA_FILE"
    exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
    print_error "❌ Seed file not found at $SEED_FILE"
    exit 1
fi

print_status "✅ Database files found"
print_status "   Schema: $SCHEMA_FILE"
print_status "   Seed:   $SEED_FILE"

print_status "Step 1/7: Updating system packages..."
sudo apt update > /dev/null 2>&1

print_status "Step 2/7: Installing MySQL Server (if needed)..."
if ! command -v mysql > /dev/null 2>&1; then
    # Set MySQL root password non-interactively
    sudo debconf-set-selections <<< "mysql-server mysql-server/root_password password $DB_ROOT_PASSWORD"
    sudo debconf-set-selections <<< "mysql-server mysql-server/root_password_again password $DB_ROOT_PASSWORD"
    sudo apt install -y mysql-server mysql-client > /dev/null 2>&1
    print_status "MySQL installed"
else
    print_status "MySQL already installed"
fi

print_status "Step 3/7: Installing Redis Server (if needed)..."
if ! command -v redis-server > /dev/null 2>&1; then
    sudo apt install -y redis-server > /dev/null 2>&1
    print_status "Redis installed"
else
    print_status "Redis already installed"
fi

# Start and enable services
print_status "Step 4/7: Starting database services..."
sudo systemctl start mysql
sudo systemctl enable mysql > /dev/null 2>&1
sudo systemctl start redis-server
sudo systemctl enable redis-server > /dev/null 2>&1

print_status "Step 5/7: Creating fresh BitTrade database..."
print_warning "Dropping existing database if it exists..."
sudo mysql -u root -p$DB_ROOT_PASSWORD <<MYSQL_EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
MYSQL_EOF

print_status "✅ Fresh database created"

print_status "Step 6/7: Importing database schema..."
mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < "$SCHEMA_FILE"
print_status "✅ Schema imported from $SCHEMA_FILE"

print_status "Step 7/7: Seeding admin data..."
mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < "$SEED_FILE"
print_status "✅ Admin data seeded from $SEED_FILE"

# Validate database setup
print_status "Validating database setup..."

# Test MySQL connection and count tables
TABLE_COUNT=$(mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" -s -N)
print_status "✅ MySQL connection successful - $TABLE_COUNT tables created"

# Verify critical tables exist
REQUIRED_TABLES=("users" "transactions" "bitcoin_data" "bitcoin_sentiment" "bitcoin_chart_data" "settings" "active_plans" "loans")
MISSING_TABLES=""

for table in "${REQUIRED_TABLES[@]}"; do
    if ! mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "DESCRIBE $table;" > /dev/null 2>&1; then
        MISSING_TABLES="$MISSING_TABLES $table"
    fi
done

if [ -n "$MISSING_TABLES" ]; then
    print_error "❌ Missing required tables:$MISSING_TABLES"
    print_error "Database schema import may have failed"
    exit 1
else
    print_status "✅ All required database tables verified"
fi

# Test Redis
if redis-cli ping > /dev/null 2>&1; then
    print_status "✅ Redis connection successful"
else
    print_error "❌ Redis connection failed"
    exit 1
fi

# Check admin user
ADMIN_COUNT=$(mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT COUNT(*) FROM users WHERE is_admin = 1;" -s -N)
if [ "$ADMIN_COUNT" -gt 0 ]; then
    print_status "✅ Admin user(s) created - $ADMIN_COUNT admin(s) found"
else
    print_warning "⚠️  No admin users found in database"
fi

print_status "✅ Database setup completed successfully!"
echo ""
echo "📊 Database Summary:"
echo "   Database: $DB_NAME ($TABLE_COUNT tables)"
echo "   Admin users: $ADMIN_COUNT"
echo "   MySQL: Running"
echo "   Redis: Running" 
echo ""
echo "🔐 Login to your application with the admin credentials from seed_admin.sql"
echo ""
print_status "✅ Ready to run update-with-validation.sh!"
