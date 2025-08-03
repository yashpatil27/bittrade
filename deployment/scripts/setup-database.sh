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

print_header "🗄️  Starting BitTrade Database Setup..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

print_status "Step 1/8: Updating system packages..."
sudo apt update

print_status "Step 2/8: Installing MySQL Server..."
# Set MySQL root password non-interactively
sudo debconf-set-selections <<< "mysql-server mysql-server/root_password password $DB_ROOT_PASSWORD"
sudo debconf-set-selections <<< "mysql-server mysql-server/root_password_again password $DB_ROOT_PASSWORD"

sudo apt install -y mysql-server mysql-client

# Secure MySQL installation (automated)
print_status "Step 3/8: Securing MySQL installation..."
sudo mysql -u root -p$DB_ROOT_PASSWORD <<EOF
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
FLUSH PRIVILEGES;
EOF

print_status "Step 4/8: Installing Redis Server..."
sudo apt install -y redis-server

# Configure Redis
print_status "Configuring Redis..."
sudo sed -i 's/# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
sudo sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

# Start and enable services
print_status "Step 5/8: Starting database services..."
sudo systemctl start mysql
sudo systemctl enable mysql
sudo systemctl start redis-server
sudo systemctl enable redis-server

print_status "Step 6/8: Creating BitTrade database and user..."
print_warning "Dropping existing database if it exists..."
sudo mysql -u root -p$DB_ROOT_PASSWORD <<EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

print_status "Step 7/8: Setting up database schema..."
if [ -f "database/schema.sql" ]; then
    print_status "Found schema.sql, importing database structure..."
    mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < database/schema.sql
    print_status "✅ Schema imported successfully"
else
    print_warning "schema.sql not found in database/ directory, creating basic structure..."
    # Create basic tables if schema.sql doesn't exist
    mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME <<EOF
-- Basic BitTrade schema
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    balance DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('buy', 'sell', 'deposit', 'withdraw') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    price DECIMAL(10, 2),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    key_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
EOF
    print_status "✅ Basic schema created"
fi

print_status "Step 8/8: Seeding admin data..."
if [ -f "database/seed_admin.sql" ]; then
    print_status "Found seed_admin.sql, importing admin data..."
    mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < database/seed_admin.sql
    print_status "✅ Admin data seeded successfully"
else
    print_warning "seed_admin.sql not found, creating default admin user..."
    # Create default admin user if seed file doesn't exist
    mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME <<EOF
-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role, balance) VALUES 
('admin', 'admin@bittrade.co.in', '\$2b\$10\$8K1p/a0dUrynzTbN/F4b7e.QAL8oNNXO8P7k1I6YHH.r9UhN1AGC.', 'admin', 10000.00);

-- Insert default settings
INSERT INTO settings (key_name, key_value) VALUES 
('site_name', 'BitTrade'),
('maintenance_mode', 'false'),
('trading_enabled', 'true'),
('min_deposit', '10.00'),
('max_deposit', '10000.00');
EOF
    print_status "✅ Default admin user created (username: admin, password: admin123)"
fi

# Test database connections
print_status "Testing database connections..."

# Test MySQL
if mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT 1;" > /dev/null 2>&1; then
    print_status "✅ MySQL connection successful"
else
    print_error "❌ MySQL connection failed"
    exit 1
fi

# Test Redis
if redis-cli ping > /dev/null 2>&1; then
    print_status "✅ Redis connection successful"
else
    print_error "❌ Redis connection failed"
    exit 1
fi

# Create database backup script
print_status "Creating database backup script..."
cat > /home/ubuntu/backup-database.sh << 'EOF'
#!/bin/bash

# BitTrade Database Backup Script
BACKUP_DIR="/home/ubuntu/backups"
DB_NAME="bittrade"
DB_USER="bittrade"
DB_PASSWORD="bittrade123"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory
mkdir -p $BACKUP_DIR

# Create MySQL backup
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/bittrade_backup_$TIMESTAMP.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "bittrade_backup_*.sql" -mtime +7 -delete

echo "Database backup completed: bittrade_backup_$TIMESTAMP.sql"
EOF

chmod +x /home/ubuntu/backup-database.sh

# Add backup to crontab (daily at 2 AM)
(crontab -l 2>/dev/null || true; echo "0 2 * * * /home/ubuntu/backup-database.sh") | crontab -

print_status "✅ Database setup completed successfully!"
echo ""
echo "📊 Database Information:"
echo "   MySQL Database: $DB_NAME"
echo "   MySQL User: $DB_USER"
echo "   MySQL Password: $DB_PASSWORD"
echo "   Redis: Running on default port 6379"
echo ""
echo "🔐 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   Email: admin@bittrade.co.in"
echo ""
echo "💾 Database Management:"
echo "   Backup script: /home/ubuntu/backup-database.sh"
echo "   Daily backups: Scheduled at 2 AM"
echo "   Connection test: mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME"
echo ""
echo "🔧 Service Management:"
echo "   MySQL: sudo systemctl {start|stop|restart|status} mysql"
echo "   Redis:  sudo systemctl {start|stop|restart|status} redis-server"
echo ""
print_status "You can now run the main deployment script!"
