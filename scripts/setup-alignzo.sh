#!/bin/bash

# =============================================================================
# Alignzo V2 - Complete Setup Script
# =============================================================================
# This script provides a one-stop solution for setting up the entire Alignzo
# project including prerequisites, dependencies, database, and initial data.
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="Alignzo V2"
PROJECT_VERSION="2.0"
SCRIPT_VERSION="1.0"

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_USERNAME="alignzo"
DB_PASSWORD="alignzo"
DB_NAME="alignzo_v2"
DB_TEST_NAME="alignzo_test"

# Application ports
BACKEND_PORT="3001"
FRONTEND_PORT="3000"

# File paths
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
CONFIGS_DIR="configs"
SCRIPTS_DIR="scripts"

# Logging
LOG_FILE="setup-alignzo.log"
ERROR_LOG_FILE="setup-alignzo-error.log"

# Function to log messages
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "STEP")
            echo -e "${BLUE}[STEP]${NC} $message"
            ;;
        "HEADER")
            echo -e "${PURPLE}$message${NC}"
            ;;
        *)
            echo -e "${CYAN}[$level]${NC} $message"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Function to log errors
log_error() {
    local message=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR]${NC} $message"
    echo "[$timestamp] [ERROR] $message" >> "$ERROR_LOG_FILE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if package is installed (for different package managers)
package_installed() {
    local package=$1
    local package_manager=$2
    
    case $package_manager in
        "apt")
            dpkg -l "$package" >/dev/null 2>&1
            ;;
        "yum"|"dnf")
            rpm -q "$package" >/dev/null 2>&1
            ;;
        "brew")
            brew list "$package" >/dev/null 2>&1
            ;;
        *)
            command_exists "$package"
            ;;
    esac
}

# Function to check if npm package is installed
npm_package_installed() {
    local package_name=$1
    local package_dir=$2
    
    if [[ -d "$package_dir/node_modules" ]] && [[ -f "$package_dir/package-lock.json" ]]; then
        return 0  # Package is installed
    else
        return 1  # Package is not installed
    fi
}

# Function to detect OS
detect_os() {
    log "STEP" "Detecting operating system..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command_exists apt-get; then
            OS="ubuntu"
            PACKAGE_MANAGER="apt"
        elif command_exists yum; then
            OS="centos"
            PACKAGE_MANAGER="yum"
        elif command_exists dnf; then
            OS="fedora"
            PACKAGE_MANAGER="dnf"
        else
            OS="linux"
            PACKAGE_MANAGER="unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PACKAGE_MANAGER="brew"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
        PACKAGE_MANAGER="choco"
    else
        OS="unknown"
        PACKAGE_MANAGER="unknown"
    fi
    
    log "INFO" "Detected OS: $OS ($OSTYPE)"
    log "INFO" "Package manager: $PACKAGE_MANAGER"
}

# Function to check prerequisites
check_prerequisites() {
    log "STEP" "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        log "INFO" "Node.js version: $NODE_VERSION"
        
        # Check if version is >= 18
        NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)
        if [[ $NODE_MAJOR -lt 18 ]]; then
            missing_deps+=("Node.js 18+ (current: $NODE_VERSION)")
        fi
    else
        missing_deps+=("Node.js 18+")
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        log "INFO" "npm version: $NPM_VERSION"
    else
        missing_deps+=("npm")
    fi
    
    # Check Git
    if command_exists git; then
        GIT_VERSION=$(git --version | cut -d' ' -f3)
        log "INFO" "Git version: $GIT_VERSION"
    else
        missing_deps+=("Git")
    fi
    
    # Check PostgreSQL
    if command_exists psql; then
        PSQL_VERSION=$(psql --version | cut -d' ' -f3)
        log "INFO" "PostgreSQL version: $PSQL_VERSION"
    else
        missing_deps+=("PostgreSQL 14+")
    fi
    
    # Check Redis (optional but recommended)
    if command_exists redis-server; then
        log "INFO" "Redis is available"
    else
        log "WARN" "Redis not found (optional for development)"
    fi
    
    # Report missing dependencies
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log "ERROR" "Missing prerequisites:"
        for dep in "${missing_deps[@]}"; do
            log "ERROR" "  - $dep"
        done
        return 1
    fi
    
    log "SUCCESS" "All prerequisites are satisfied"
    return 0
}

# Function to install missing packages
install_packages() {
    log "STEP" "Installing required packages..."
    
    case $OS in
        "ubuntu"|"debian")
            log "INFO" "Installing packages using apt..."
            sudo apt-get update -y
            
            # Check and install packages only if not already installed
            local packages=("curl" "wget" "gcc" "g++" "make" "python3")
            for package in "${packages[@]}"; do
                if ! package_installed "$package" "apt"; then
                    log "INFO" "Installing $package..."
                    sudo apt-get install -y "$package"
                else
                    log "INFO" "$package is already installed, skipping..."
                fi
            done
            ;;
        "centos"|"rhel")
            log "INFO" "Installing packages using yum..."
            sudo yum update -y
            
            local packages=("curl" "wget" "gcc" "gcc-c++" "make" "python3")
            for package in "${packages[@]}"; do
                if ! package_installed "$package" "yum"; then
                    log "INFO" "Installing $package..."
                    sudo yum install -y "$package"
                else
                    log "INFO" "$package is already installed, skipping..."
                fi
            done
            ;;
        "fedora")
            log "INFO" "Installing packages using dnf..."
            sudo dnf update -y
            
            local packages=("curl" "wget" "gcc" "gcc-c++" "make" "python3")
            for package in "${packages[@]}"; do
                if ! package_installed "$package" "dnf"; then
                    log "INFO" "Installing $package..."
                    sudo dnf install -y "$package"
                else
                    log "INFO" "$package is already installed, skipping..."
                fi
            done
            ;;
        "macos")
            log "INFO" "Installing packages using Homebrew..."
            if ! command_exists brew; then
                log "INFO" "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew update
            
            local packages=("curl" "wget" "python3")
            for package in "${packages[@]}"; do
                if ! package_installed "$package" "brew"; then
                    log "INFO" "Installing $package..."
                    brew install "$package"
                else
                    log "INFO" "$package is already installed, skipping..."
                fi
            done
            ;;
        "windows")
            log "WARN" "Windows detected. Please use the PowerShell script: setup-alignzo.ps1"
            log "INFO" "Or run: .\setup-alignzo.ps1 setup"
            return 1
            ;;
        *)
            log "WARN" "Unknown OS, skipping package installation"
            ;;
    esac
    
    log "SUCCESS" "Package installation completed"
}

# Function to check and install Node.js if needed
install_nodejs() {
    if ! command_exists node || [[ $(node --version | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
        log "STEP" "Installing Node.js 18+..."
        
        case $OS in
            "ubuntu"|"debian")
                if ! package_installed "nodejs" "apt"; then
                    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                else
                    log "INFO" "Node.js is already installed, checking version..."
                    NODE_VERSION=$(node --version)
                    log "INFO" "Node.js version: $NODE_VERSION"
                fi
                ;;
            "centos"|"rhel"|"fedora")
                if ! package_installed "nodejs" "yum"; then
                    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
                    sudo yum install -y nodejs
                else
                    log "INFO" "Node.js is already installed, checking version..."
                    NODE_VERSION=$(node --version)
                    log "INFO" "Node.js version: $NODE_VERSION"
                fi
                ;;
            "macos")
                if ! package_installed "node@20" "brew"; then
                    brew install node@20
                else
                    log "INFO" "Node.js is already installed, checking version..."
                    NODE_VERSION=$(node --version)
                    log "INFO" "Node.js version: $NODE_VERSION"
                fi
                ;;
            "windows")
                log "WARN" "Windows detected. Please use the PowerShell script: setup-alignzo.ps1"
                return 1
                ;;
            *)
                log "ERROR" "Cannot install Node.js on this OS automatically"
                log "INFO" "Please install Node.js 18+ manually from https://nodejs.org/"
                return 1
                ;;
        esac
        
        # Verify installation
        if command_exists node; then
            NODE_VERSION=$(node --version)
            log "SUCCESS" "Node.js installed: $NODE_VERSION"
        else
            log "ERROR" "Node.js installation failed"
            return 1
        fi
    else
        NODE_VERSION=$(node --version)
        log "INFO" "Node.js is already installed: $NODE_VERSION"
    fi
}

# Function to check and install PostgreSQL if needed
install_postgresql() {
    if ! command_exists psql; then
        log "STEP" "Installing PostgreSQL..."
        
        case $OS in
            "ubuntu"|"debian")
                if ! package_installed "postgresql" "apt"; then
                    sudo apt-get install -y postgresql postgresql-contrib
                    sudo systemctl start postgresql
                    sudo systemctl enable postgresql
                else
                    log "INFO" "PostgreSQL is already installed, starting service..."
                    sudo systemctl start postgresql
                    sudo systemctl enable postgresql
                fi
                ;;
            "centos"|"rhel"|"fedora")
                if ! package_installed "postgresql" "yum"; then
                    sudo yum install -y postgresql postgresql-server postgresql-contrib
                    sudo postgresql-setup initdb
                    sudo systemctl start postgresql
                    sudo systemctl enable postgresql
                else
                    log "INFO" "PostgreSQL is already installed, starting service..."
                    sudo systemctl start postgresql
                    sudo systemctl enable postgresql
                fi
                ;;
            "macos")
                if ! package_installed "postgresql@14" "brew"; then
                    brew install postgresql@14
                    brew services start postgresql@14
                else
                    log "INFO" "PostgreSQL is already installed, starting service..."
                    brew services start postgresql@14
                fi
                ;;
            "windows")
                log "WARN" "Windows detected. Please use the PowerShell script: setup-alignzo.ps1"
                return 1
                ;;
            *)
                log "ERROR" "Cannot install PostgreSQL on this OS automatically"
                log "INFO" "Please install PostgreSQL 14+ manually"
                return 1
                ;;
        esac
        
        # Verify installation
        if command_exists psql; then
            PSQL_VERSION=$(psql --version)
            log "SUCCESS" "PostgreSQL installed: $PSQL_VERSION"
        else
            log "ERROR" "PostgreSQL installation failed"
            return 1
        fi
    else
        PSQL_VERSION=$(psql --version)
        log "INFO" "PostgreSQL is already installed: $PSQL_VERSION"
    fi
}

# Function to setup database
setup_database() {
    log "STEP" "Setting up database..."
    
    # Create database user and database
    log "INFO" "Creating database user and database..."
    
    case $OS in
        "ubuntu"|"debian"|"centos"|"rhel"|"fedora")
            # Switch to postgres user to create database
            sudo -u postgres psql -c "CREATE USER $DB_USERNAME WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || log "WARN" "User $DB_USERNAME might already exist"
            sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USERNAME;" 2>/dev/null || log "WARN" "Database $DB_NAME might already exist"
            sudo -u postgres psql -c "CREATE DATABASE $DB_TEST_NAME OWNER $DB_USERNAME;" 2>/dev/null || log "WARN" "Test database $DB_TEST_NAME might already exist"
            sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USERNAME;" 2>/dev/null || true
            sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_TEST_NAME TO $DB_USERNAME;" 2>/dev/null || true
            ;;
        "macos")
            # On macOS, postgres user might not exist, try direct connection
            createdb -h localhost $DB_NAME 2>/dev/null || log "WARN" "Database $DB_NAME might already exist"
            createdb -h localhost $DB_TEST_NAME 2>/dev/null || log "WARN" "Test database $DB_TEST_NAME might already exist"
            ;;
        "windows")
            # On Windows, use psql directly
            psql -U postgres -c "CREATE USER $DB_USERNAME WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || log "WARN" "User $DB_USERNAME might already exist"
            psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USERNAME;" 2>/dev/null || log "WARN" "Database $DB_NAME might already exist"
            psql -U postgres -c "CREATE DATABASE $DB_TEST_NAME OWNER $DB_USERNAME;" 2>/dev/null || log "WARN" "Test database $DB_TEST_NAME might already exist"
            ;;
    esac
    
    log "SUCCESS" "Database setup completed"
}

# Function to install project dependencies
install_dependencies() {
    log "STEP" "Installing project dependencies..."
    
    # Install root dependencies
    if [[ -f "package.json" ]]; then
        if npm_package_installed "root" "."; then
            log "INFO" "Root dependencies are already installed, skipping..."
        else
            log "INFO" "Installing root dependencies..."
            npm install
        fi
    fi
    
    # Install backend dependencies
    if [[ -d "$BACKEND_DIR" ]] && [[ -f "$BACKEND_DIR/package.json" ]]; then
        if npm_package_installed "backend" "$BACKEND_DIR"; then
            log "INFO" "Backend dependencies are already installed, skipping..."
        else
            log "INFO" "Installing backend dependencies..."
            cd "$BACKEND_DIR"
            npm install
            cd ..
        fi
    fi
    
    # Install frontend dependencies
    if [[ -d "$FRONTEND_DIR" ]] && [[ -f "$FRONTEND_DIR/package.json" ]]; then
        if npm_package_installed "frontend" "$FRONTEND_DIR"; then
            log "INFO" "Frontend dependencies are already installed, skipping..."
        else
            log "INFO" "Installing frontend dependencies..."
            cd "$FRONTEND_DIR"
            npm install
            cd ..
        fi
    fi
    
    log "SUCCESS" "Dependencies installation completed"
}

# Function to setup environment files
setup_environment() {
    log "STEP" "Setting up environment files..."
    
    # Copy backend environment
    if [[ -f "$CONFIGS_DIR/development.env" ]] && [[ ! -f "$BACKEND_DIR/.env" ]]; then
        cp "$CONFIGS_DIR/development.env" "$BACKEND_DIR/.env"
        log "INFO" "Backend environment file created"
    fi
    
    # Copy frontend environment
    if [[ -f "$CONFIGS_DIR/frontend.env.example" ]] && [[ ! -f "$FRONTEND_DIR/.env.local" ]]; then
        cp "$CONFIGS_DIR/frontend.env.example" "$FRONTEND_DIR/.env.local"
        log "INFO" "Frontend environment file created"
    fi
    
    log "SUCCESS" "Environment setup completed"
}

# Function to setup Prisma and database schema
setup_prisma() {
    log "STEP" "Setting up Prisma and database schema..."
    
    cd "$BACKEND_DIR"
    
    # Check if Prisma client is already generated
    if [[ -d "node_modules/.prisma" ]] && [[ -f "node_modules/.prisma/client/index.js" ]]; then
        log "INFO" "Prisma client is already generated, skipping generation..."
    else
        # Generate Prisma client
        log "INFO" "Generating Prisma client..."
        npx prisma generate
    fi
    
    # Push database schema
    log "INFO" "Pushing database schema..."
    npx prisma db push
    
    cd ..
    
    log "SUCCESS" "Prisma setup completed"
}

# Function to seed database
seed_database() {
    log "STEP" "Seeding database with initial data..."
    
    cd "$BACKEND_DIR"
    
    # Check if database is already seeded by checking for existing data
    log "INFO" "Checking if database is already seeded..."
    SEEDED=$(npx ts-node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function checkSeeded() {
        try {
            const userCount = await prisma.user.count();
            const roleCount = await prisma.role.count();
            const orgCount = await prisma.organization.count();
            
            // Consider seeded if we have users, roles, and organizations
            if (userCount > 0 && roleCount > 0 && orgCount > 0) {
                console.log('true');
            } else {
                console.log('false');
            }
        } catch (error) {
            console.log('false');
        } finally {
            await prisma.\$disconnect();
        }
    }
    
    checkSeeded();
    ")
    
    if [[ "$SEEDED" == "true" ]]; then
        log "INFO" "Database is already seeded, skipping..."
    else
        # Run database seed
        log "INFO" "Running database seed..."
        npx prisma db seed
    fi
    
    cd ..
    
    log "SUCCESS" "Database seeding completed"
}

# Function to create admin user
create_admin_user() {
    log "STEP" "Creating admin user..."
    
    # Ask for admin email
    echo -e "${CYAN}Enter the email address for the admin user:${NC}"
    read -r ADMIN_EMAIL
    
    if [[ -z "$ADMIN_EMAIL" ]]; then
        log "ERROR" "Admin email is required"
        return 1
    fi
    
    # Validate email format
    if [[ ! "$ADMIN_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        log "ERROR" "Invalid email format"
        return 1
    fi
    
    log "INFO" "Creating admin user with email: $ADMIN_EMAIL"
    
    # Create admin user using the script
    cd "$BACKEND_DIR"
    
    # Check if the script exists
    if [[ -f "scripts/activate-user.ts" ]]; then
        log "INFO" "Using activate-user script..."
        npx ts-node scripts/activate-user.ts "$ADMIN_EMAIL"
    else
        log "WARN" "activate-user script not found, creating user manually..."
        # Create user directly in database
        npx ts-node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function createAdminUser() {
            try {
                const user = await prisma.user.upsert({
                    where: { email: '$ADMIN_EMAIL' },
                    update: {},
                    create: {
                        email: '$ADMIN_EMAIL',
                        firstName: 'Admin',
                        lastName: 'User',
                        displayName: 'Admin User',
                        isActive: true,
                        organizationId: null
                    }
                });
                
                const superAdminRole = await prisma.role.findUnique({
                    where: { name: 'SUPER_ADMIN' }
                });
                
                if (superAdminRole) {
                    await prisma.userRole.upsert({
                        where: {
                            userId_roleId: {
                                userId: user.id,
                                roleId: superAdminRole.id
                            }
                        },
                        update: {},
                        create: {
                            userId: user.id,
                            roleId: superAdminRole.id
                        }
                    });
                }
                
                console.log('Admin user created successfully');
            } catch (error) {
                console.error('Error creating admin user:', error);
            } finally {
                await prisma.\$disconnect();
            }
        }
        
        createAdminUser();
        "
    fi
    
    cd ..
    
    log "SUCCESS" "Admin user created: $ADMIN_EMAIL"
}

# Function to check application health
check_health() {
    log "STEP" "Checking application health..."
    
    # Check if backend is running
    if curl -s "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
        log "SUCCESS" "Backend is running on port $BACKEND_PORT"
    else
        log "WARN" "Backend is not running on port $BACKEND_PORT"
    fi
    
    # Check if frontend is running
    if curl -s "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
        log "SUCCESS" "Frontend is running on port $FRONTEND_PORT"
    else
        log "WARN" "Frontend is not running on port $FRONTEND_PORT"
    fi
    
    # Check database connection
    if psql "postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        log "SUCCESS" "Database connection is working"
    else
        log "ERROR" "Database connection failed"
        return 1
    fi
}

# Function to check database entries
check_database_entries() {
    log "STEP" "Checking database entries..."
    
    cd "$BACKEND_DIR"
    
    # Check users
    USER_COUNT=$(npx ts-node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function checkUsers() {
        try {
            const count = await prisma.user.count();
            console.log(count);
        } catch (error) {
            console.log('0');
        } finally {
            await prisma.\$disconnect();
        }
    }
    
    checkUsers();
    ")
    
    log "INFO" "Users in database: $USER_COUNT"
    
    # Check organizations
    ORG_COUNT=$(npx ts-node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function checkOrgs() {
        try {
            const count = await prisma.organization.count();
            console.log(count);
        } catch (error) {
            console.log('0');
        } finally {
            await prisma.\$disconnect();
        }
    }
    
    checkOrgs();
    ")
    
    log "INFO" "Organizations in database: $ORG_COUNT"
    
    # Check roles
    ROLE_COUNT=$(npx ts-node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function checkRoles() {
        try {
            const count = await prisma.role.count();
            console.log(count);
        } catch (error) {
            console.log('0');
        } finally {
            await prisma.\$disconnect();
        }
    }
    
    checkRoles();
    ")
    
    log "INFO" "Roles in database: $ROLE_COUNT"
    
    cd ..
    
    log "SUCCESS" "Database entries check completed"
}

# Function to start application
start_application() {
    log "STEP" "Starting application..."
    
    # Start backend
    log "INFO" "Starting backend server..."
    cd "$BACKEND_DIR"
    npm run start:dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait a bit for backend to start
    sleep 5
    
    # Start frontend
    log "INFO" "Starting frontend server..."
    cd "$FRONTEND_DIR"
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Wait a bit for frontend to start
    sleep 5
    
    log "SUCCESS" "Application started"
    log "INFO" "Backend PID: $BACKEND_PID"
    log "INFO" "Frontend PID: $FRONTEND_PID"
    log "INFO" "Backend URL: http://localhost:$BACKEND_PORT"
    log "INFO" "Frontend URL: http://localhost:$FRONTEND_PORT"
    log "INFO" "API Documentation: http://localhost:$BACKEND_PORT/api/docs"
}

# Function to stop application
stop_application() {
    log "STEP" "Stopping application..."
    
    # Kill backend process
    if [[ -n "$BACKEND_PID" ]]; then
        kill $BACKEND_PID 2>/dev/null || true
        log "INFO" "Backend stopped"
    fi
    
    # Kill frontend process
    if [[ -n "$FRONTEND_PID" ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
        log "INFO" "Frontend stopped"
    fi
    
    # Kill any processes on the ports
    pkill -f "node.*$BACKEND_PORT" 2>/dev/null || true
    pkill -f "next.*$FRONTEND_PORT" 2>/dev/null || true
    
    log "SUCCESS" "Application stopped"
}

# Function to show status
show_status() {
    log "STEP" "Checking application status..."
    
    # Check if processes are running
    if pgrep -f "nest.*start" >/dev/null; then
        log "SUCCESS" "Backend is running"
    else
        log "WARN" "Backend is not running"
    fi
    
    if pgrep -f "next.*dev" >/dev/null; then
        log "SUCCESS" "Frontend is running"
    else
        log "WARN" "Frontend is not running"
    fi
    
    # Check ports
    if netstat -tuln 2>/dev/null | grep ":$BACKEND_PORT " >/dev/null; then
        log "SUCCESS" "Backend port $BACKEND_PORT is in use"
    else
        log "WARN" "Backend port $BACKEND_PORT is not in use"
    fi
    
    if netstat -tuln 2>/dev/null | grep ":$FRONTEND_PORT " >/dev/null; then
        log "SUCCESS" "Frontend port $FRONTEND_PORT is in use"
    else
        log "WARN" "Frontend port $FRONTEND_PORT is not in use"
    fi
}

# Function to show help
show_help() {
    echo -e "${CYAN}Alignzo V2 Setup Script${NC}"
    echo -e "${CYAN}Version: $SCRIPT_VERSION${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup           Complete setup (prerequisites, dependencies, database, seed)"
    echo "  install         Install dependencies only"
    echo "  database        Setup database only"
    echo "  seed            Seed database with initial data"
    echo "  admin           Create admin user"
    echo "  start           Start the application"
    echo "  stop            Stop the application"
    echo "  status          Show application status"
    echo "  health          Check application health"
    echo "  check-db        Check database entries"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup        # Complete setup"
    echo "  $0 start        # Start application"
    echo "  $0 status       # Check status"
    echo ""
}

# Function to run complete setup
run_complete_setup() {
    log "HEADER" "Starting complete Alignzo V2 setup..."
    log "HEADER" "=========================================="
    
    # Initialize log files
    > "$LOG_FILE"
    > "$ERROR_LOG_FILE"
    
    # Run setup steps
    detect_os
    check_prerequisites || {
        log "ERROR" "Prerequisites check failed. Installing missing packages..."
        install_packages
        install_nodejs
        install_postgresql
        check_prerequisites || {
            log "ERROR" "Prerequisites still not satisfied after installation"
            exit 1
        }
    }
    
    install_dependencies
    setup_database
    setup_environment
    setup_prisma
    seed_database
    create_admin_user
    
    log "HEADER" "Setup completed successfully!"
    log "INFO" "You can now start the application with: $0 start"
    log "INFO" "Check status with: $0 status"
    log "INFO" "View logs in: $LOG_FILE"
}

# Main script logic
main() {
    case "${1:-setup}" in
        "setup")
            run_complete_setup
            ;;
        "install")
            detect_os
            install_dependencies
            ;;
        "database")
            setup_database
            setup_prisma
            ;;
        "seed")
            seed_database
            ;;
        "admin")
            create_admin_user
            ;;
        "start")
            start_application
            ;;
        "stop")
            stop_application
            ;;
        "status")
            show_status
            ;;
        "health")
            check_health
            ;;
        "check-db")
            check_database_entries
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log "ERROR" "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Trap to handle script interruption
trap 'log "ERROR" "Script interrupted"; stop_application; exit 1' INT TERM

# Run main function with all arguments
main "$@"
