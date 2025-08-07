#!/usr/bin/env node

/**
 * Database Setup Script for Alignzo
 * This script sets up the PostgreSQL database and runs initial migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  username: 'alignzo',
  password: 'alignzo',
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

function runCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    process.exit(1);
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

function setupEnvironment() {
  log('🔧 Setting up environment...', 'cyan');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), 'configs', 'development.env');
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      log('✅ .env file created from development.env', 'green');
    } else {
      log('❌ No environment template found', 'red');
      process.exit(1);
    }
  } else {
    log('✅ .env file already exists', 'green');
  }
}

function testDatabaseConnection() {
  log('🔍 Testing database connection...', 'cyan');
  
  const connectionString = `postgresql://${DB_CONFIG.username}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;
  
  try {
    execSync(`psql "${connectionString}" -c "SELECT 1"`, { stdio: 'pipe' });
    log('✅ Database connection successful', 'green');
  } catch (error) {
    log('❌ Database connection failed', 'red');
    log('Please ensure PostgreSQL is running and credentials are correct', 'yellow');
    log(`Connection string: ${connectionString}`, 'yellow');
    process.exit(1);
  }
}

function installDependencies() {
  log('📦 Installing dependencies...', 'cyan');
  
  try {
    if (fs.existsSync(path.join(process.cwd(), 'package.json'))) {
      runCommand('npm install', 'Installing npm packages');
    } else {
      log('⚠️  No package.json found, skipping dependency installation', 'yellow');
    }
  } catch (error) {
    log('❌ Failed to install dependencies', 'red');
    process.exit(1);
  }
}

function setupPrisma() {
  log('🗄️  Setting up Prisma...', 'cyan');
  
  try {
    // Generate Prisma client
    runCommand('npx prisma generate', 'Generating Prisma client');
    
    // Push database schema
    runCommand('npx prisma db push', 'Pushing database schema');
    
    // Seed database if needed
    if (process.argv.includes('--seed')) {
      runCommand('npx prisma db seed', 'Seeding database');
    }
    
  } catch (error) {
    log('❌ Prisma setup failed', 'red');
    process.exit(1);
  }
}

function createTestDatabase() {
  log('🧪 Setting up test database...', 'cyan');
  
  const testConnectionString = `postgresql://${DB_CONFIG.username}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.testDatabase}`;
  
  try {
    // Create test database
    execSync(`createdb -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.username} ${DB_CONFIG.testDatabase}`, { stdio: 'pipe' });
    log('✅ Test database created', 'green');
  } catch (error) {
    if (error.message.includes('already exists')) {
      log('✅ Test database already exists', 'green');
    } else {
      log('⚠️  Could not create test database (this is optional)', 'yellow');
    }
  }
}

function showSuccess() {
  log('\n🎉 Database setup completed successfully!', 'green');
  log('\nNext steps:', 'cyan');
  log('1. Update your .env file with any additional configuration', 'yellow');
  log('2. Run "npm run dev" to start the development server', 'yellow');
  log('3. Run "npm test" to verify everything is working', 'yellow');
  log('\nDatabase Information:', 'cyan');
  log(`Host: ${DB_CONFIG.host}`, 'yellow');
  log(`Port: ${DB_CONFIG.port}`, 'yellow');
  log(`Database: ${DB_CONFIG.database}`, 'yellow');
  log(`Username: ${DB_CONFIG.username}`, 'yellow');
}

// Main execution
function main() {
  log('🚀 Starting Alignzo Database Setup', 'green');
  log('=' .repeat(50), 'green');
  
  checkPrerequisites();
  setupEnvironment();
  testDatabaseConnection();
  installDependencies();
  setupPrisma();
  createTestDatabase();
  showSuccess();
}

// Command line options
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Alignzo Database Setup Script

Usage: node setup-database.js [options]

Options:
  --seed     Seed the database with initial data
  --help     Show this help message

Example:
  node setup-database.js --seed
  `);
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  DB_CONFIG,
  setupEnvironment,
  testDatabaseConnection,
  setupPrisma
};