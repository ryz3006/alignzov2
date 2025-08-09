#!/usr/bin/env node

/**
 * Import Data to Supabase
 * This script helps import data to your Supabase database with proper validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const CONFIG = {
  // Supabase database connection
  supabaseDbUrl: process.env.DATABASE_URL,
  
  // Import directory (created by export script)
  importDir: path.join(__dirname, '..', 'supabase-export'),
  
  // Validation settings
  validateData: true,
  dryRun: process.argv.includes('--dry-run'),
  force: process.argv.includes('--force'),
};

class SupabaseImporter {
  constructor() {
    this.client = null;
    this.stats = {
      tablesCreated: 0,
      recordsImported: 0,
      errors: 0,
      warnings: 0
    };
  }

  async connect() {
    try {
      this.client = new Client({ connectionString: CONFIG.supabaseDbUrl });
      await this.client.connect();
      console.log('✅ Connected to Supabase database');
    } catch (error) {
      console.error('❌ Failed to connect to Supabase:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      console.log('🔌 Disconnected from database');
    }
  }

  async validateConnection() {
    console.log('🔍 Validating database connection...');
    
    try {
      const result = await this.client.query('SELECT version()');
      console.log('✅ Database version:', result.rows[0].version);
      
      // Check if uuid-ossp extension is available
      const extensions = await this.client.query(`
        SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp'
      `);
      
      if (extensions.rows.length === 0) {
        console.warn('⚠️  uuid-ossp extension not found. Installing...');
        await this.client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log('✅ uuid-ossp extension installed');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Database validation failed:', error.message);
      return false;
    }
  }

  async checkExistingData() {
    console.log('🔍 Checking for existing data...');
    
    try {
      const tables = ['users', 'organizations', 'projects', 'work_logs'];
      const existingData = {};
      
      for (const table of tables) {
        try {
          const result = await this.client.query(`SELECT COUNT(*) as count FROM "${table}"`);
          existingData[table] = parseInt(result.rows[0].count);
        } catch (error) {
          // Table might not exist yet
          existingData[table] = 0;
        }
      }
      
      const hasData = Object.values(existingData).some(count => count > 0);
      
      if (hasData && !CONFIG.force) {
        console.log('⚠️  Existing data found:');
        Object.entries(existingData).forEach(([table, count]) => {
          if (count > 0) {
            console.log(`   ${table}: ${count} records`);
          }
        });
        console.log('\nUse --force to overwrite existing data');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error checking existing data:', error.message);
      return false;
    }
  }

  async applySchema() {
    console.log('🔄 Applying database schema...');
    
    const schemaFile = path.join(__dirname, 'supabase-migration.sql');
    
    if (!fs.existsSync(schemaFile)) {
      console.error('❌ Schema file not found:', schemaFile);
      return false;
    }
    
    try {
      if (CONFIG.dryRun) {
        console.log('🧪 DRY RUN: Would apply schema from', schemaFile);
        return true;
      }
      
      const schema = fs.readFileSync(schemaFile, 'utf8');
      await this.client.query(schema);
      
      console.log('✅ Schema applied successfully');
      this.stats.tablesCreated++;
      return true;
    } catch (error) {
      console.error('❌ Error applying schema:', error.message);
      return false;
    }
  }

  async importData() {
    console.log('🔄 Importing data...');
    
    const dataFile = path.join(CONFIG.importDir, 'data.sql');
    
    if (!fs.existsSync(dataFile)) {
      console.warn('⚠️  Data file not found:', dataFile);
      console.log('   You may need to run the export script first');
      return true; // Not a failure, just no data to import
    }
    
    try {
      if (CONFIG.dryRun) {
        console.log('🧪 DRY RUN: Would import data from', dataFile);
        return true;
      }
      
      // Disable triggers and constraints for faster import
      await this.client.query('SET session_replication_role = replica;');
      
      console.log('📥 Reading data file...');
      const dataSQL = fs.readFileSync(dataFile, 'utf8');
      
      // Split into individual statements (basic approach)
      const statements = dataSQL
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('--'))
        .join('\n')
        .split(';')
        .filter(stmt => stmt.trim());
      
      console.log(`📦 Found ${statements.length} SQL statements to execute`);
      
      let imported = 0;
      let errors = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (!statement) continue;
        
        try {
          await this.client.query(statement);
          imported++;
          
          if (imported % 100 === 0) {
            console.log(`   Processed ${imported}/${statements.length} statements...`);
          }
        } catch (error) {
          errors++;
          this.stats.errors++;
          
          if (errors < 10) { // Only show first 10 errors
            console.error(`⚠️  Error in statement ${i + 1}:`, error.message);
          } else if (errors === 10) {
            console.error(`⚠️  Too many errors, suppressing further error messages...`);
          }
        }
      }
      
      // Re-enable triggers and constraints
      await this.client.query('SET session_replication_role = DEFAULT;');
      
      console.log(`✅ Data import completed: ${imported} statements executed, ${errors} errors`);
      this.stats.recordsImported = imported;
      
      return errors === 0;
    } catch (error) {
      console.error('❌ Error importing data:', error.message);
      
      try {
        // Re-enable triggers in case of error
        await this.client.query('SET session_replication_role = DEFAULT;');
      } catch (e) {
        // Ignore
      }
      
      return false;
    }
  }

  async validateImport() {
    if (!CONFIG.validateData) {
      console.log('⏭️  Skipping data validation');
      return true;
    }
    
    console.log('🔍 Validating imported data...');
    
    try {
      const validations = [
        {
          name: 'Users count',
          query: 'SELECT COUNT(*) as count FROM "users"',
          expected: 'Should have users'
        },
        {
          name: 'Organizations count', 
          query: 'SELECT COUNT(*) as count FROM "organizations"',
          expected: 'Should have organizations'
        },
        {
          name: 'Projects count',
          query: 'SELECT COUNT(*) as count FROM "projects"',
          expected: 'Should have projects'
        },
        {
          name: 'Foreign key integrity',
          query: `
            SELECT COUNT(*) as count 
            FROM "users" u 
            LEFT JOIN "organizations" o ON u."organizationId" = o.id 
            WHERE u."organizationId" IS NOT NULL AND o.id IS NULL
          `,
          expected: 'Should be 0 (no orphaned users)'
        }
      ];
      
      let validationsPassed = 0;
      
      for (const validation of validations) {
        try {
          const result = await this.client.query(validation.query);
          const count = parseInt(result.rows[0].count);
          
          console.log(`   ${validation.name}: ${count} (${validation.expected})`);
          
          if (validation.name.includes('integrity') && count > 0) {
            console.warn(`⚠️  Data integrity issue: ${validation.name}`);
            this.stats.warnings++;
          } else {
            validationsPassed++;
          }
        } catch (error) {
          console.error(`❌ Validation failed for ${validation.name}:`, error.message);
          this.stats.errors++;
        }
      }
      
      console.log(`✅ Validation completed: ${validationsPassed}/${validations.length} checks passed`);
      return this.stats.errors === 0;
    } catch (error) {
      console.error('❌ Error during validation:', error.message);
      return false;
    }
  }

  async updateSequences() {
    console.log('🔄 Updating database sequences...');
    
    try {
      // Get all tables with UUID primary keys (no sequences needed for UUID)
      // But update any integer sequences if they exist
      const sequenceQuery = `
        SELECT schemaname, sequencename, tablename, columnname
        FROM pg_sequences 
        WHERE schemaname = 'public'
      `;
      
      const sequences = await this.client.query(sequenceQuery);
      
      if (sequences.rows.length === 0) {
        console.log('ℹ️  No sequences to update (using UUIDs)');
        return true;
      }
      
      for (const seq of sequences.rows) {
        try {
          const maxQuery = `SELECT MAX("${seq.columnname}") as max_val FROM "${seq.tablename}"`;
          const maxResult = await this.client.query(maxQuery);
          const maxVal = maxResult.rows[0].max_val;
          
          if (maxVal !== null) {
            const updateQuery = `SELECT setval('${seq.sequencename}', ${maxVal})`;
            await this.client.query(updateQuery);
            console.log(`   Updated ${seq.sequencename} to ${maxVal}`);
          }
        } catch (error) {
          console.warn(`⚠️  Could not update sequence ${seq.sequencename}:`, error.message);
          this.stats.warnings++;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error updating sequences:', error.message);
      return false;
    }
  }

  async generateReport() {
    console.log('\n📊 Import Summary');
    console.log('================');
    console.log(`Database: ${CONFIG.supabaseDbUrl.replace(/:[^:]*@/, ':***@')}`);
    console.log(`Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'LIVE IMPORT'}`);
    console.log(`Tables Created: ${this.stats.tablesCreated}`);
    console.log(`Records Imported: ${this.stats.recordsImported}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`Warnings: ${this.stats.warnings}`);
    
    if (this.stats.errors > 0) {
      console.log('\n⚠️  Import completed with errors. Please review the log above.');
    } else if (this.stats.warnings > 0) {
      console.log('\n✅ Import completed successfully with warnings.');
    } else {
      console.log('\n🎉 Import completed successfully!');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test your application connection');
    console.log('2. Verify data integrity');
    console.log('3. Configure Row Level Security policies');
    console.log('4. Update your application environment variables');
    console.log('5. Deploy to production');
  }

  async run() {
    try {
      console.log('🚀 Starting Supabase import process...');
      
      if (CONFIG.dryRun) {
        console.log('🧪 Running in DRY RUN mode - no changes will be made');
      }
      
      // Step 1: Connect to database
      await this.connect();
      
      // Step 2: Validate connection
      const connectionOk = await this.validateConnection();
      if (!connectionOk) {
        throw new Error('Database validation failed');
      }
      
      // Step 3: Check existing data
      const canProceed = await this.checkExistingData();
      if (!canProceed) {
        throw new Error('Existing data detected. Use --force to overwrite.');
      }
      
      // Step 4: Apply schema
      const schemaOk = await this.applySchema();
      if (!schemaOk) {
        throw new Error('Schema application failed');
      }
      
      // Step 5: Import data
      const importOk = await this.importData();
      if (!importOk) {
        console.warn('⚠️  Data import had errors but continuing...');
      }
      
      // Step 6: Update sequences
      await this.updateSequences();
      
      // Step 7: Validate import
      const validationOk = await this.validateImport();
      if (!validationOk) {
        console.warn('⚠️  Data validation had issues but import is complete');
      }
      
      // Step 8: Generate report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// CLI Help
function showHelp() {
  console.log(`
Supabase Import Tool for AlignzoV2

Usage: node import-to-supabase.js [options]

Options:
  --dry-run     Run without making changes (validation only)
  --force       Overwrite existing data without prompting
  --help        Show this help message

Environment Variables:
  DATABASE_URL  Supabase PostgreSQL connection string

Examples:
  node import-to-supabase.js --dry-run    # Validate without changes
  node import-to-supabase.js --force      # Force import over existing data
  node import-to-supabase.js              # Normal import

Make sure to run the export script first to generate the data files.
`);
}

// CLI execution
if (require.main === module) {
  if (process.argv.includes('--help')) {
    showHelp();
    process.exit(0);
  }
  
  if (!CONFIG.supabaseDbUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('Set it to your Supabase PostgreSQL connection string');
    process.exit(1);
  }
  
  const importer = new SupabaseImporter();
  importer.run();
}

module.exports = SupabaseImporter;
