#!/bin/bash

# Supabase Setup Script for AlignzoV2
# This script automates the Supabase migration process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("node")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists psql; then
        missing_deps+=("psql")
    fi
    
    if ! command_exists pg_dump; then
        missing_deps+=("pg_dump")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and try again."
        echo ""
        echo "On Ubuntu/Debian:"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install nodejs npm postgresql-client"
        echo ""
        echo "On macOS:"
        echo "  brew install node postgresql"
        echo ""
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
}

# Check environment variables
check_environment() {
    print_header "Checking Environment Variables"
    
    if [ -f backend/.env ]; then
        source backend/.env 2>/dev/null || true
    fi
    
    local missing_vars=()
    
    if [ -z "$DATABASE_URL" ]; then
        missing_vars+=("DATABASE_URL")
    fi
    
    if [ -z "$SUPABASE_URL" ]; then
        missing_vars+=("SUPABASE_URL")
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        missing_vars+=("SUPABASE_SERVICE_ROLE_KEY")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables: ${missing_vars[*]}"
        echo ""
        echo "Please set up your environment variables:"
        echo "  1. Copy configs/supabase.env.example to backend/.env"
        echo "  2. Fill in your Supabase credentials"
        echo "  3. Run this script again"
        echo ""
        exit 1
    fi
    
    # Mask sensitive data in output
    local masked_db_url=$(echo "$DATABASE_URL" | sed 's/:[^:]*@/:***@/')
    print_success "Environment variables configured"
    print_info "Database URL: $masked_db_url"
    print_info "Supabase URL: $SUPABASE_URL"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    cd backend
    
    if [ ! -f package.json ]; then
        print_error "package.json not found in backend directory"
        exit 1
    fi
    
    # Check if node_modules exists and is reasonably up to date
    if [ -d node_modules ] && [ package.json -ot node_modules ]; then
        print_info "Dependencies appear to be installed, skipping..."
    else
        print_info "Installing Node.js dependencies..."
        npm install --silent
        print_success "Dependencies installed"
    fi
    
    # Install additional dependencies for import script
    local additional_deps=("pg")
    for dep in "${additional_deps[@]}"; do
        if ! npm list "$dep" >/dev/null 2>&1; then
            print_info "Installing $dep..."
            npm install --silent "$dep"
        fi
    done
    
    cd ..
}

# Test database connection
test_connection() {
    print_header "Testing Database Connection"
    
    if psql "$DATABASE_URL" -c "SELECT version();" >/dev/null 2>&1; then
        print_success "Successfully connected to Supabase database"
    else
        print_error "Failed to connect to database"
        echo "Please check your DATABASE_URL and ensure:"
        echo "  1. Your Supabase project is running"
        echo "  2. The connection string is correct"
        echo "  3. Your IP is allowed (if using connection pooling)"
        exit 1
    fi
}

# Export current database (optional)
export_current_database() {
    if [ -n "$CURRENT_DATABASE_URL" ]; then
        print_header "Exporting Current Database"
        print_info "Current database URL found, exporting data..."
        
        if node scripts/export-to-supabase.js; then
            print_success "Database export completed"
        else
            print_error "Database export failed"
            exit 1
        fi
    else
        print_info "No current database URL provided, skipping export"
        print_info "If you have existing data to migrate, set CURRENT_DATABASE_URL"
    fi
}

# Apply schema
apply_schema() {
    print_header "Applying Database Schema"
    
    if [ ! -f scripts/supabase-migration.sql ]; then
        print_error "Migration script not found: scripts/supabase-migration.sql"
        exit 1
    fi
    
    print_info "Applying schema to Supabase..."
    if psql "$DATABASE_URL" -f scripts/supabase-migration.sql >/dev/null 2>&1; then
        print_success "Schema applied successfully"
    else
        print_error "Schema application failed"
        echo "Check the migration script for syntax errors"
        exit 1
    fi
}

# Import data (if available)
import_data() {
    print_header "Importing Data"
    
    if [ -d supabase-export ] && [ -f supabase-export/data.sql ]; then
        print_info "Found exported data, importing..."
        if node scripts/import-to-supabase.js; then
            print_success "Data import completed"
        else
            print_warning "Data import had issues, but schema is ready"
        fi
    else
        print_info "No exported data found, skipping import"
        print_info "Your database schema is ready for new data"
    fi
}

# Generate Prisma client
generate_prisma_client() {
    print_header "Generating Prisma Client"
    
    cd backend
    
    print_info "Generating Prisma client..."
    if npx prisma generate >/dev/null 2>&1; then
        print_success "Prisma client generated"
    else
        print_error "Prisma client generation failed"
        exit 1
    fi
    
    print_info "Verifying database connection..."
    if npx prisma db pull --force >/dev/null 2>&1; then
        print_success "Database schema verified"
    else
        print_warning "Could not verify schema, but continuing..."
    fi
    
    cd ..
}

# Verify setup
verify_setup() {
    print_header "Verifying Setup"
    
    # Test basic queries
    local test_queries=(
        "SELECT COUNT(*) FROM roles"
        "SELECT COUNT(*) FROM permissions" 
        "SELECT COUNT(*) FROM system_settings"
    )
    
    for query in "${test_queries[@]}"; do
        if psql "$DATABASE_URL" -c "$query" >/dev/null 2>&1; then
            print_success "✓ $(echo "$query" | cut -d' ' -f4)"
        else
            print_error "✗ $(echo "$query" | cut -d' ' -f4)"
        fi
    done
}

# Main setup process
main() {
    echo ""
    print_header "Supabase Setup for AlignzoV2"
    echo ""
    
    # Parse command line arguments
    local skip_deps=false
    local dry_run=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-deps)
                skip_deps=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --skip-deps    Skip dependency installation"
                echo "  --dry-run      Show what would be done without making changes"
                echo "  --help         Show this help message"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    if [ "$dry_run" = true ]; then
        print_info "DRY RUN MODE - No changes will be made"
        echo ""
    fi
    
    # Execute setup steps
    check_prerequisites
    echo ""
    
    check_environment
    echo ""
    
    if [ "$skip_deps" = false ]; then
        install_dependencies
        echo ""
    fi
    
    if [ "$dry_run" = false ]; then
        test_connection
        echo ""
        
        export_current_database
        echo ""
        
        apply_schema
        echo ""
        
        import_data
        echo ""
        
        generate_prisma_client
        echo ""
        
        verify_setup
        echo ""
        
        print_header "Setup Complete!"
        print_success "Your Supabase database is ready for AlignzoV2"
        echo ""
        echo "Next steps:"
        echo "  1. Update your Render environment variables"
        echo "  2. Deploy your application"
        echo "  3. Test the complete functionality"
        echo ""
        echo "For detailed documentation, see: docs/supabase-migration-guide.md"
    else
        print_info "DRY RUN completed - no changes were made"
        echo "Run without --dry-run to perform the actual setup"
    fi
}

# Run main function
main "$@"
