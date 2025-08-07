# =============================================================================
# Alignzo V2 - Complete Setup Script (PowerShell Version)
# =============================================================================
# This script provides a one-stop solution for setting up the entire Alignzo
# project including prerequisites, dependencies, database, and initial data.
# =============================================================================

param(
    [Parameter(Position=0)]
    [string]$Command = "setup"
)

# Error handling
$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_NAME = "Alignzo V2"
$PROJECT_VERSION = "2.0"
$SCRIPT_VERSION = "1.0"

# Database configuration
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_USERNAME = "alignzo"
$DB_PASSWORD = "alignzo"
$DB_NAME = "alignzo_v2"
$DB_TEST_NAME = "alignzo_test"

# Application ports
$BACKEND_PORT = "3001"
$FRONTEND_PORT = "3000"

# File paths
$BACKEND_DIR = "backend"
$FRONTEND_DIR = "frontend"
$CONFIGS_DIR = "configs"
$SCRIPTS_DIR = "scripts"

# Logging
$LOG_FILE = "setup-alignzo.log"
$ERROR_LOG_FILE = "setup-alignzo-error.log"

# Global variables
$script:OS = "windows"
$script:PACKAGE_MANAGER = "choco"
$script:BACKEND_PID = $null
$script:FRONTEND_PID = $null

# Function to log messages
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    switch ($Level) {
        "INFO" {
            Write-Host "[INFO] $Message" -ForegroundColor Green
        }
        "WARN" {
            Write-Host "[WARN] $Message" -ForegroundColor Yellow
        }
        "ERROR" {
            Write-Host "[ERROR] $Message" -ForegroundColor Red
        }
        "SUCCESS" {
            Write-Host "[SUCCESS] $Message" -ForegroundColor Green
        }
        "STEP" {
            Write-Host "[STEP] $Message" -ForegroundColor Blue
        }
        "HEADER" {
            Write-Host $Message -ForegroundColor Magenta
        }
        default {
            Write-Host "[$Level] $Message" -ForegroundColor Cyan
        }
    }
    
    Add-Content -Path $LOG_FILE -Value "[$timestamp] [$Level] $Message"
}

# Function to log errors
function Write-ErrorLog {
    param([string]$Message)
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    Add-Content -Path $ERROR_LOG_FILE -Value "[$timestamp] [ERROR] $Message"
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check if package is installed (for different package managers)
function Test-PackageInstalled {
    param(
        [string]$Package,
        [string]$PackageManager
    )
    
    switch ($PackageManager) {
        "choco" {
            try {
                choco list --local-only $Package | Out-Null
                return $true
            }
            catch {
                return $false
            }
        }
        "winget" {
            try {
                winget list $Package | Out-Null
                return $true
            }
            catch {
                return $false
            }
        }
        default {
            return Test-Command $Package
        }
    }
}

# Function to check if npm package is installed
function Test-NpmPackageInstalled {
    param(
        [string]$PackageName,
        [string]$PackageDir
    )
    
    $nodeModulesPath = Join-Path $PackageDir "node_modules"
    $packageLockPath = Join-Path $PackageDir "package-lock.json"
    
    if ((Test-Path $nodeModulesPath) -and (Test-Path $packageLockPath)) {
        return $true  # Package is installed
    }
    else {
        return $false  # Package is not installed
    }
}

# Function to detect OS
function Detect-OS {
    Write-Log "STEP" "Detecting operating system..."
    
    $script:OS = "windows"
    $script:PACKAGE_MANAGER = "choco"
    
    Write-Log "INFO" "Detected OS: $script:OS"
    Write-Log "INFO" "Package manager: $script:PACKAGE_MANAGER"
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Log "STEP" "Checking prerequisites..."
    
    $missingDeps = @()
    
    # Check Node.js
    if (Test-Command "node") {
        $nodeVersion = (node --version).TrimStart('v')
        Write-Log "INFO" "Node.js version: $nodeVersion"
        
        # Check if version is >= 18
        $majorVersion = [int]($nodeVersion.Split('.')[0])
        if ($majorVersion -lt 18) {
            $missingDeps += "Node.js 18+ (current: $nodeVersion)"
        }
    }
    else {
        $missingDeps += "Node.js 18+"
    }
    
    # Check npm
    if (Test-Command "npm") {
        $npmVersion = npm --version
        Write-Log "INFO" "npm version: $npmVersion"
    }
    else {
        $missingDeps += "npm"
    }
    
    # Check Git
    if (Test-Command "git") {
        $gitVersion = (git --version).Split(' ')[2]
        Write-Log "INFO" "Git version: $gitVersion"
    }
    else {
        $missingDeps += "Git"
    }
    
    # Check PostgreSQL
    if (Test-Command "psql") {
        $psqlVersion = (psql --version).Split(' ')[2]
        Write-Log "INFO" "PostgreSQL version: $psqlVersion"
    }
    else {
        $missingDeps += "PostgreSQL 14+"
    }
    
    # Report missing dependencies
    if ($missingDeps.Count -gt 0) {
        Write-Log "ERROR" "Missing prerequisites:"
        foreach ($dep in $missingDeps) {
            Write-Log "ERROR" "  - $dep"
        }
        return $false
    }
    
    Write-Log "SUCCESS" "All prerequisites are satisfied"
    return $true
}

# Function to install missing packages
function Install-Packages {
    Write-Log "STEP" "Installing required packages..."
    
    # Install Chocolatey if not present
    if (-not (Test-Command "choco")) {
        Write-Log "INFO" "Installing Chocolatey..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
    
    # Install basic packages only if not already installed
    $packages = @("curl", "wget", "python3")
    foreach ($package in $packages) {
        if (-not (Test-PackageInstalled $package "choco")) {
            Write-Log "INFO" "Installing $package..."
            choco install $package -y
        }
        else {
            Write-Log "INFO" "$package is already installed, skipping..."
        }
    }
    
    Write-Log "SUCCESS" "Package installation completed"
}

# Function to install Node.js if needed
function Install-NodeJS {
    if (-not (Test-Command "node") -or [int]((node --version).TrimStart('v').Split('.')[0]) -lt 18) {
        Write-Log "STEP" "Installing Node.js 18+..."
        
        if (-not (Test-PackageInstalled "nodejs" "choco")) {
            Write-Log "INFO" "Installing Node.js using Chocolatey..."
            choco install nodejs -y
        }
        else {
            Write-Log "INFO" "Node.js is already installed, checking version..."
            $nodeVersion = node --version
            Write-Log "INFO" "Node.js version: $nodeVersion"
        }
        
        # Verify installation
        if (Test-Command "node") {
            $nodeVersion = node --version
            Write-Log "SUCCESS" "Node.js installed: $nodeVersion"
        }
        else {
            Write-Log "ERROR" "Node.js installation failed"
            return $false
        }
    }
    else {
        $nodeVersion = node --version
        Write-Log "INFO" "Node.js is already installed: $nodeVersion"
    }
    
    return $true
}

# Function to install PostgreSQL if needed
function Install-PostgreSQL {
    if (-not (Test-Command "psql")) {
        Write-Log "STEP" "Installing PostgreSQL..."
        
        if (-not (Test-PackageInstalled "postgresql" "choco")) {
            Write-Log "INFO" "Installing PostgreSQL using Chocolatey..."
            choco install postgresql -y
        }
        else {
            Write-Log "INFO" "PostgreSQL is already installed, starting service..."
        }
        
        # Start PostgreSQL service
        try {
            Start-Service postgresql-x64-14 -ErrorAction Stop
            Set-Service postgresql-x64-14 -StartupType Automatic
            Write-Log "SUCCESS" "PostgreSQL service started"
        }
        catch {
            Write-Log "WARN" "Could not start PostgreSQL service automatically"
            Write-Log "INFO" "Please start PostgreSQL service manually"
        }
        
        # Verify installation
        if (Test-Command "psql") {
            $psqlVersion = psql --version
            Write-Log "SUCCESS" "PostgreSQL installed: $psqlVersion"
        }
        else {
            Write-Log "ERROR" "PostgreSQL installation failed"
            return $false
        }
    }
    else {
        $psqlVersion = psql --version
        Write-Log "INFO" "PostgreSQL is already installed: $psqlVersion"
    }
    
    return $true
}

# Function to setup database
function Setup-Database {
    Write-Log "STEP" "Setting up database..."
    
    Write-Log "INFO" "Creating database user and database..."
    
    try {
        # Create user
        psql -U postgres -c "CREATE USER $DB_USERNAME WITH PASSWORD '$DB_PASSWORD';" 2>$null
        Write-Log "INFO" "Database user created or already exists"
        
        # Create databases
        psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USERNAME;" 2>$null
        psql -U postgres -c "CREATE DATABASE $DB_TEST_NAME OWNER $DB_USERNAME;" 2>$null
        Write-Log "INFO" "Databases created or already exist"
        
        # Grant privileges
        psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USERNAME;" 2>$null
        psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_TEST_NAME TO $DB_USERNAME;" 2>$null
        
        Write-Log "SUCCESS" "Database setup completed"
    }
    catch {
        Write-Log "ERROR" "Database setup failed: $($_.Exception.Message)"
        return $false
    }
    return $true
}

# Function to install project dependencies
function Install-Dependencies {
    Write-Log "STEP" "Installing project dependencies..."
    
    # Install root dependencies
    if (Test-Path "package.json") {
        if (Test-NpmPackageInstalled "root" ".") {
            Write-Log "INFO" "Root dependencies are already installed, skipping..."
        }
        else {
            Write-Log "INFO" "Installing root dependencies..."
            npm install
        }
    }
    
    # Install backend dependencies
    if ((Test-Path $BACKEND_DIR) -and (Test-Path (Join-Path $BACKEND_DIR "package.json"))) {
        if (Test-NpmPackageInstalled "backend" $BACKEND_DIR) {
            Write-Log "INFO" "Backend dependencies are already installed, skipping..."
        }
        else {
            Write-Log "INFO" "Installing backend dependencies..."
            Push-Location $BACKEND_DIR
            npm install
            Pop-Location
        }
    }
    
    # Install frontend dependencies
    if ((Test-Path $FRONTEND_DIR) -and (Test-Path (Join-Path $FRONTEND_DIR "package.json"))) {
        if (Test-NpmPackageInstalled "frontend" $FRONTEND_DIR) {
            Write-Log "INFO" "Frontend dependencies are already installed, skipping..."
        }
        else {
            Write-Log "INFO" "Installing frontend dependencies..."
            Push-Location $FRONTEND_DIR
            npm install
            Pop-Location
        }
    }
    
    Write-Log "SUCCESS" "Dependencies installation completed"
}

# Function to setup environment files
function Setup-Environment {
    Write-Log "STEP" "Setting up environment files..."
    
    # Copy backend environment
    if ((Test-Path "$CONFIGS_DIR/development.env") -and -not (Test-Path "$BACKEND_DIR/.env")) {
        Copy-Item "$CONFIGS_DIR/development.env" "$BACKEND_DIR/.env"
        Write-Log "INFO" "Backend environment file created"
    }
    
    # Copy frontend environment
    if ((Test-Path "$CONFIGS_DIR/frontend.env.example") -and -not (Test-Path "$FRONTEND_DIR/.env.local")) {
        Copy-Item "$CONFIGS_DIR/frontend.env.example" "$FRONTEND_DIR/.env.local"
        Write-Log "INFO" "Frontend environment file created"
    }
    
    Write-Log "SUCCESS" "Environment setup completed"
}

# Function to setup Prisma and database schema
function Setup-Prisma {
    Write-Log "STEP" "Setting up Prisma and database schema..."
    
    Push-Location $BACKEND_DIR
    
    # Check if Prisma client is already generated
    $prismaClientPath = Join-Path "node_modules\.prisma\client" "index.js"
    if ((Test-Path "node_modules\.prisma") -and (Test-Path $prismaClientPath)) {
        Write-Log "INFO" "Prisma client is already generated, skipping generation..."
    }
    else {
        # Generate Prisma client
        Write-Log "INFO" "Generating Prisma client..."
        npx prisma generate
    }
    
    # Push database schema
    Write-Log "INFO" "Pushing database schema..."
    npx prisma db push
    
    Pop-Location
    
    Write-Log "SUCCESS" "Prisma setup completed"
}

# Function to seed database
function Seed-Database {
    Write-Log "STEP" "Seeding database with initial data..."
    
    Push-Location $BACKEND_DIR
    
    # Check if database is already seeded by checking for existing data
    Write-Log "INFO" "Checking if database is already seeded..."
    $seeded = npx ts-node -e "
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
    "
    
    if ($seeded -eq "true") {
        Write-Log "INFO" "Database is already seeded, skipping..."
    }
    else {
        # Run database seed
        Write-Log "INFO" "Running database seed..."
        npx prisma db seed
    }
    
    Pop-Location
    
    Write-Log "SUCCESS" "Database seeding completed"
}

# Function to create admin user
function Create-AdminUser {
    Write-Log "STEP" "Creating admin user..."
    
    # Ask for admin email
    $adminEmail = Read-Host "Enter the email address for the admin user"
    
    if ([string]::IsNullOrWhiteSpace($adminEmail)) {
        Write-Log "ERROR" "Admin email is required"
        return $false
    }
    
    # Validate email format
    $emailRegex = '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    if ($adminEmail -notmatch $emailRegex) {
        Write-Log "ERROR" "Invalid email format"
        return $false
    }
    
    Write-Log "INFO" "Creating admin user with email: $adminEmail"
    
    Push-Location $BACKEND_DIR
    
    try {
        # Check if the script exists
        if (Test-Path "scripts/activate-user.ts") {
            Write-Log "INFO" "Using activate-user script..."
            npx ts-node scripts/activate-user.ts $adminEmail
        }
        else {
            Write-Log "WARN" "activate-user script not found, creating user manually..."
            # Create user directly in database
            $createUserScript = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        const user = await prisma.user.upsert({
            where: { email: '$adminEmail' },
            update: {},
            create: {
                email: '$adminEmail',
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
"@
            $createUserScript | npx ts-node -
        }
        
        Write-Log "SUCCESS" "Admin user created: $adminEmail"
    }
    catch {
        Write-Log "ERROR" "Failed to create admin user: $($_.Exception.Message)"
        Pop-Location
        return $false
    }
    
    Pop-Location
    return $true
}

# Function to check application health
function Test-Health {
    Write-Log "STEP" "Checking application health..."
    
    # Check if backend is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$BACKEND_PORT/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Log "SUCCESS" "Backend is running on port $BACKEND_PORT"
        }
    }
    catch {
        Write-Log "WARN" "Backend is not running on port $BACKEND_PORT"
    }
    
    # Check if frontend is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$FRONTEND_PORT" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Log "SUCCESS" "Frontend is running on port $FRONTEND_PORT"
        }
    }
    catch {
        Write-Log "WARN" "Frontend is not running on port $FRONTEND_PORT"
    }
    
    # Check database connection
    try {
        $result = psql "postgresql://$DB_USERNAME`:$DB_PASSWORD@$DB_HOST`:$DB_PORT/$DB_NAME" -c "SELECT 1;" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "SUCCESS" "Database connection is working"
        }
        else {
            Write-Log "ERROR" "Database connection failed"
            return $false
        }
    }
    catch {
        Write-Log "ERROR" "Database connection failed"
        return $false
    }
    
    return $true
}

# Function to check database entries
function Test-DatabaseEntries {
    Write-Log "STEP" "Checking database entries..."
    
    Push-Location $BACKEND_DIR
    
    try {
        # Check users
        $userCount = npx ts-node -e "
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
        "
        Write-Log "INFO" "Users in database: $userCount"
        
        # Check organizations
        $orgCount = npx ts-node -e "
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
        "
        Write-Log "INFO" "Organizations in database: $orgCount"
        
        # Check roles
        $roleCount = npx ts-node -e "
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
        "
        Write-Log "INFO" "Roles in database: $roleCount"
        
        Write-Log "SUCCESS" "Database entries check completed"
    }
    catch {
        Write-Log "ERROR" "Failed to check database entries: $($_.Exception.Message)"
        Pop-Location
        return $false
    }
    
    Pop-Location
    return $true
}

# Function to start application
function Start-Application {
    Write-Log "STEP" "Starting application..."
    
    # Start backend
    Write-Log "INFO" "Starting backend server..."
    Push-Location $BACKEND_DIR
    $script:BACKEND_PID = Start-Process -FilePath "npm" -ArgumentList "run", "start:dev" -PassThru -WindowStyle Hidden
    Pop-Location
    
    # Wait a bit for backend to start
    Start-Sleep -Seconds 5
    
    # Start frontend
    Write-Log "INFO" "Starting frontend server..."
    Push-Location $FRONTEND_DIR
    $script:FRONTEND_PID = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
    Pop-Location
    
    # Wait a bit for frontend to start
    Start-Sleep -Seconds 5
    
    Write-Log "SUCCESS" "Application started"
    Write-Log "INFO" "Backend PID: $($script:BACKEND_PID.Id)"
    Write-Log "INFO" "Frontend PID: $($script:FRONTEND_PID.Id)"
    Write-Log "INFO" "Backend URL: http://localhost:$BACKEND_PORT"
    Write-Log "INFO" "Frontend URL: http://localhost:$FRONTEND_PORT"
    Write-Log "INFO" "API Documentation: http://localhost:$BACKEND_PORT/api/docs"
}

# Function to stop application
function Stop-Application {
    Write-Log "STEP" "Stopping application..."
    
    # Kill backend process
    if ($script:BACKEND_PID) {
        Stop-Process -Id $script:BACKEND_PID.Id -Force -ErrorAction SilentlyContinue
        Write-Log "INFO" "Backend stopped"
    }
    
    # Kill frontend process
    if ($script:FRONTEND_PID) {
        Stop-Process -Id $script:FRONTEND_PID.Id -Force -ErrorAction SilentlyContinue
        Write-Log "INFO" "Frontend stopped"
    }
    
    # Kill any processes on the ports
    Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.CommandLine -like "*$BACKEND_PORT*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.CommandLine -like "*$FRONTEND_PORT*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Log "SUCCESS" "Application stopped"
}

# Function to show status
function Show-Status {
    Write-Log "STEP" "Checking application status..."
    
    # Check if processes are running
    $backendProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.CommandLine -like "*nest*"}
    if ($backendProcesses) {
        Write-Log "SUCCESS" "Backend is running"
    }
    else {
        Write-Log "WARN" "Backend is not running"
    }
    
    $frontendProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.CommandLine -like "*next*"}
    if ($frontendProcesses) {
        Write-Log "SUCCESS" "Frontend is running"
    }
    else {
        Write-Log "WARN" "Frontend is not running"
    }
    
    # Check ports
    $backendPort = Get-NetTCPConnection -LocalPort $BACKEND_PORT -ErrorAction SilentlyContinue
    if ($backendPort) {
        Write-Log "SUCCESS" "Backend port $BACKEND_PORT is in use"
    }
    else {
        Write-Log "WARN" "Backend port $BACKEND_PORT is not in use"
    }
    
    $frontendPort = Get-NetTCPConnection -LocalPort $FRONTEND_PORT -ErrorAction SilentlyContinue
    if ($frontendPort) {
        Write-Log "SUCCESS" "Frontend port $FRONTEND_PORT is in use"
    }
    else {
        Write-Log "WARN" "Frontend port $FRONTEND_PORT is not in use"
    }
}

# Function to show help
function Show-Help {
    Write-Host "Alignzo V2 Setup Script" -ForegroundColor Cyan
    Write-Host "Version: $SCRIPT_VERSION" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\setup-alignzo.ps1 [COMMAND]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  setup           Complete setup (prerequisites, dependencies, database, seed)"
    Write-Host "  install         Install dependencies only"
    Write-Host "  database        Setup database only"
    Write-Host "  seed            Seed database with initial data"
    Write-Host "  admin           Create admin user"
    Write-Host "  start           Start the application"
    Write-Host "  stop            Stop the application"
    Write-Host "  status          Show application status"
    Write-Host "  health          Check application health"
    Write-Host "  check-db        Check database entries"
    Write-Host "  help            Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\setup-alignzo.ps1 setup        # Complete setup"
    Write-Host "  .\setup-alignzo.ps1 start        # Start application"
    Write-Host "  .\setup-alignzo.ps1 status       # Check status"
    Write-Host ""
}

# Function to run complete setup
function Invoke-CompleteSetup {
    Write-Log "HEADER" "Starting complete Alignzo V2 setup..."
    Write-Log "HEADER" "=========================================="
    
    # Initialize log files
    if (Test-Path $LOG_FILE) { Remove-Item $LOG_FILE -Force }
    if (Test-Path $ERROR_LOG_FILE) { Remove-Item $ERROR_LOG_FILE -Force }
    New-Item -ItemType File -Path $LOG_FILE -Force | Out-Null
    New-Item -ItemType File -Path $ERROR_LOG_FILE -Force | Out-Null
    
    # Run setup steps
    Detect-OS
    if (-not (Test-Prerequisites)) {
        Write-Log "ERROR" "Prerequisites check failed. Installing missing packages..."
        Install-Packages
        Install-NodeJS
        Install-PostgreSQL
        if (-not (Test-Prerequisites)) {
            Write-Log "ERROR" "Prerequisites still not satisfied after installation"
            exit 1
        }
    }
    
    Install-Dependencies
    Setup-Database
    Setup-Environment
    Setup-Prisma
    Seed-Database
    Create-AdminUser
    
    Write-Log "HEADER" "Setup completed successfully!"
    Write-Log "INFO" "You can now start the application with: .\setup-alignzo.ps1 start"
    Write-Log "INFO" "Check status with: .\setup-alignzo.ps1 status"
    Write-Log "INFO" "View logs in: $LOG_FILE"
}

# Main script logic
function Main {
    switch ($Command.ToLower()) {
        "setup" {
            Invoke-CompleteSetup
        }
        "install" {
            Detect-OS
            Install-Dependencies
        }
        "database" {
            Setup-Database
            Setup-Prisma
        }
        "seed" {
            Seed-Database
        }
        "admin" {
            Create-AdminUser
        }
        "start" {
            Start-Application
        }
        "stop" {
            Stop-Application
        }
        "status" {
            Show-Status
        }
        "health" {
            Test-Health
        }
        "check-db" {
            Test-DatabaseEntries
        }
        "help" {
            Show-Help
        }
        default {
            Write-Log "ERROR" "Unknown command: $Command"
            Show-Help
            exit 1
        }
    }
}

# Run main function
Main
