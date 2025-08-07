#!/usr/bin/env node

/**
 * Database Restoration Script for Alignzo
 * This script restores the PostgreSQL database with proper user setup and permissions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  adminUsername: 'postgres',
  adminPassword: 'postgres',
  appUsername: 'alignzo',
  appPassword: 'alignzo',
  database: 'alignzo_v2',
  testDatabase: 'alignzo_test'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description, options = { stdio: 'inherit' }) {
  try {
    log(`🔄 ${description}...`, 'blue');
    execSync(command, options);
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    if (!options.continueOnError) {
      process.exit(1);
    }
  }
}

function runPsqlCommand(sql, description, username = DB_CONFIG.adminUsername, password = DB_CONFIG.adminPassword) {
  const connectionString = `postgresql://${username}:${password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;
  const tempFile = path.join(__dirname, 'temp.sql');
  
  try {
    fs.writeFileSync(tempFile, sql);
    runCommand(`psql "${connectionString}" -f "${tempFile}"`, description);
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

function checkPrerequisites() {
  log('🔍 Checking prerequisites...', 'cyan');
  
  try {
    // Check if PostgreSQL is installed
    execSync('psql --version', { stdio: 'pipe' });
    log('✅ PostgreSQL is installed', 'green');
  } catch (error) {
    log('❌ PostgreSQL is not installed or not in PATH', 'red');
    log('Please install PostgreSQL and ensure it\'s running', 'yellow');
    process.exit(1);
  }

  try {
    // Check if Node.js is installed
    execSync('node --version', { stdio: 'pipe' });
    log('✅ Node.js is installed', 'green');
  } catch (error) {
    log('❌ Node.js is not installed', 'red');
    process.exit(1);
  }

  try {
    // Check if npm is installed
    execSync('npm --version', { stdio: 'pipe' });
    log('✅ npm is installed', 'green');
  } catch (error) {
    log('❌ npm is not installed', 'red');
    process.exit(1);
  }
}

function testAdminConnection() {
  log('🔍 Testing admin database connection...', 'cyan');
  
  const adminConnectionString = `postgresql://${DB_CONFIG.adminUsername}:${DB_CONFIG.adminPassword}@${DB_CONFIG.host}:${DB_CONFIG.port}/postgres`;
  
  try {
    execSync(`psql "${adminConnectionString}" -c "SELECT 1"`, { stdio: 'pipe' });
    log('✅ Admin database connection successful', 'green');
  } catch (error) {
    log('❌ Admin database connection failed', 'red');
    log('Please ensure PostgreSQL is running with postgres user', 'yellow');
    log(`Connection string: ${adminConnectionString}`, 'yellow');
    process.exit(1);
  }
}

function createDatabase() {
  log('🗄️ Creating database...', 'cyan');
  
  const adminConnectionString = `postgresql://${DB_CONFIG.adminUsername}:${DB_CONFIG.adminPassword}@${DB_CONFIG.host}:${DB_CONFIG.port}/postgres`;
  
  try {
    // Drop database if exists
    execSync(`psql "${adminConnectionString}" -c "DROP DATABASE IF EXISTS ${DB_CONFIG.database};"`, { stdio: 'pipe' });
    log('✅ Dropped existing database', 'green');
  } catch (error) {
    log('⚠️ Could not drop existing database (this is normal if it doesn\'t exist)', 'yellow');
  }
  
  try {
    // Create database
    execSync(`psql "${adminConnectionString}" -c "CREATE DATABASE ${DB_CONFIG.database};"`, { stdio: 'pipe' });
    log('✅ Database created successfully', 'green');
  } catch (error) {
    log('❌ Failed to create database', 'red');
    process.exit(1);
  }
}

function createAppUser() {
  log('👤 Creating application user...', 'cyan');
  
  const sql = `
    -- Create application user
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_CONFIG.appUsername}') THEN
        CREATE USER ${DB_CONFIG.appUsername} WITH PASSWORD '${DB_CONFIG.appPassword}';
      END IF;
    END
    \$\$;
    
    -- Grant necessary privileges
    GRANT CONNECT ON DATABASE ${DB_CONFIG.database} TO ${DB_CONFIG.appUsername};
    GRANT USAGE ON SCHEMA public TO ${DB_CONFIG.appUsername};
    GRANT CREATE ON SCHEMA public TO ${DB_CONFIG.appUsername};
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_CONFIG.appUsername};
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_CONFIG.appUsername};
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO ${DB_CONFIG.appUsername};
    
    -- Grant future privileges
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_CONFIG.appUsername};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_CONFIG.appUsername};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${DB_CONFIG.appUsername};
  `;
  
  runPsqlCommand(sql, 'Creating application user and granting privileges');
}

function installExtensions() {
  log('🔧 Installing PostgreSQL extensions...', 'cyan');
  
  const sql = `
    -- Enable required extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgvector";
  `;
  
  runPsqlCommand(sql, 'Installing PostgreSQL extensions');
}

function setupPrisma() {
  log('🗄️ Setting up Prisma...', 'cyan');
  
  try {
    // Change to backend directory
    const backendDir = path.join(__dirname, '../backend');
    process.chdir(backendDir);
    
    // Generate Prisma client
    runCommand('npx prisma generate', 'Generating Prisma client');
    
    // Push database schema
    runCommand('npx prisma db push', 'Pushing database schema');
    
    // Seed database
    runCommand('npx prisma db seed', 'Seeding database with initial data');
    
    // Change back to original directory
    process.chdir(__dirname);
    
  } catch (error) {
    log('❌ Prisma setup failed', 'red');
    process.exit(1);
  }
}

function addSampleData() {
  log('📝 Adding sample data...', 'cyan');
  
  try {
    // Change to backend directory
    const backendDir = path.join(__dirname, '../backend');
    process.chdir(backendDir);
    
    // Run sample work logs script
    runCommand('npx ts-node scripts/add-sample-work-logs.ts', 'Adding sample work logs');
    
    // Change back to original directory
    process.chdir(__dirname);
    
  } catch (error) {
    log('⚠️ Could not add sample data (this is optional)', 'yellow');
  }
}

function verifySetup() {
  log('🔍 Verifying database setup...', 'cyan');
  
  const appConnectionString = `postgresql://${DB_CONFIG.appUsername}:${DB_CONFIG.appPassword}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;
  
  try {
    // Test application connection
    execSync(`psql "${appConnectionString}" -c "SELECT COUNT(*) FROM users;"`, { stdio: 'pipe' });
    log('✅ Application database connection successful', 'green');
    
    // Test tables exist
    execSync(`psql "${appConnectionString}" -c "SELECT COUNT(*) FROM projects;"`, { stdio: 'pipe' });
    log('✅ Database tables created successfully', 'green');
    
    // Test data exists
    execSync(`psql "${appConnectionString}" -c "SELECT COUNT(*) FROM work_logs;"`, { stdio: 'pipe' });
    log('✅ Sample data added successfully', 'green');
    
  } catch (error) {
    log('❌ Database verification failed', 'red');
    log('Please check the setup and try again', 'yellow');
    process.exit(1);
  }
}

function showSuccess() {
  log('\n🎉 Database restoration completed successfully!', 'green');
  log('\nDatabase Information:', 'cyan');
  log(`Host: ${DB_CONFIG.host}`, 'yellow');
  log(`Port: ${DB_CONFIG.port}`, 'yellow');
  log(`Database: ${DB_CONFIG.database}`, 'yellow');
  log(`Admin User: ${DB_CONFIG.adminUsername}`, 'yellow');
  log(`Application User: ${DB_CONFIG.appUsername}`, 'yellow');
  log('\nConnection Strings:', 'cyan');
  log(`Admin: postgresql://${DB_CONFIG.adminUsername}:${DB_CONFIG.adminPassword}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`, 'yellow');
  log(`App: postgresql://${DB_CONFIG.appUsername}:${DB_CONFIG.appPassword}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`, 'yellow');
  log('\nNext steps:', 'cyan');
  log('1. Start the backend server: cd backend && npm run dev', 'yellow');
  log('2. Start the frontend server: cd frontend && npm run dev', 'yellow');
  log('3. Access the application at http://localhost:3000', 'yellow');
  log('4. Login with: riyas.siddikk@6dtech.co.in (Google OAuth)', 'yellow');
}

// Main execution
function main() {
  log('🚀 Starting Alignzo Database Restoration', 'green');
  log('=' .repeat(50), 'green');
  
  checkPrerequisites();
  testAdminConnection();
  createDatabase();
  createAppUser();
  installExtensions();
  setupPrisma();
  addSampleData();
  verifySetup();
  showSuccess();
}

// Command line options
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Alignzo Database Restoration Script

Usage: node restore-database.js [options]

Options:
  --help     Show this help message

This script will:
1. Create the alignzo_v2 database
2. Create the alignzo user with proper permissions
3. Install required PostgreSQL extensions
4. Set up Prisma schema and generate client
5. Seed the database with initial data
6. Add sample work logs

Prerequisites:
- PostgreSQL running with postgres user
- Node.js and npm installed
- Project dependencies installed

Example:
  node restore-database.js
  `);
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  DB_CONFIG,
  createDatabase,
  createAppUser,
  setupPrisma
}; 