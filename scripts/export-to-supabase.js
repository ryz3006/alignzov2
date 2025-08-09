#!/usr/bin/env node

/**
 * Export Alignzo Database to Supabase
 * This script exports the current database structure and data for Supabase migration
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CONFIG = {
  // Current database connection
  currentDbUrl: process.env.DATABASE_URL,
  
  // Export directory
  exportDir: path.join(__dirname, '..', 'supabase-export'),
  
  // Supabase configuration
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

class SupabaseExporter {
  constructor() {
    this.ensureExportDirectory();
  }

  ensureExportDirectory() {
    if (!fs.existsSync(CONFIG.exportDir)) {
      fs.mkdirSync(CONFIG.exportDir, { recursive: true });
    }
  }

  async exportSchema() {
    console.log('🔄 Exporting database schema...');
    
    try {
      // Export schema using pg_dump
      const schemaFile = path.join(CONFIG.exportDir, 'schema.sql');
      
      execSync(`pg_dump "${CONFIG.currentDbUrl}" --schema-only --no-owner --no-privileges > "${schemaFile}"`, {
        stdio: 'inherit'
      });
      
      console.log('✅ Schema exported to:', schemaFile);
      return schemaFile;
    } catch (error) {
      console.error('❌ Error exporting schema:', error.message);
      throw error;
    }
  }

  async exportData() {
    console.log('🔄 Exporting database data...');
    
    try {
      // Export data using pg_dump
      const dataFile = path.join(CONFIG.exportDir, 'data.sql');
      
      execSync(`pg_dump "${CONFIG.currentDbUrl}" --data-only --no-owner --no-privileges --disable-triggers > "${dataFile}"`, {
        stdio: 'inherit'
      });
      
      console.log('✅ Data exported to:', dataFile);
      return dataFile;
    } catch (error) {
      console.error('❌ Error exporting data:', error.message);
      throw error;
    }
  }

  async createSupabaseCompatibleSchema() {
    console.log('🔄 Creating Supabase-compatible schema...');
    
    const schemaFile = path.join(CONFIG.exportDir, 'schema.sql');
    const supabaseSchemaFile = path.join(CONFIG.exportDir, 'supabase-schema.sql');
    
    if (!fs.existsSync(schemaFile)) {
      throw new Error('Schema file not found. Run exportSchema() first.');
    }
    
    let schema = fs.readFileSync(schemaFile, 'utf8');
    
    // Supabase-specific modifications
    schema = this.modifyForSupabase(schema);
    
    fs.writeFileSync(supabaseSchemaFile, schema);
    console.log('✅ Supabase-compatible schema created:', supabaseSchemaFile);
    
    return supabaseSchemaFile;
  }

  modifyForSupabase(schema) {
    // Remove PostgreSQL-specific elements that might conflict with Supabase
    
    // Remove comments and SET commands that might not be compatible
    schema = schema.replace(/^SET .*$/gm, '');
    schema = schema.replace(/^SELECT pg_catalog\..*$/gm, '');
    schema = schema.replace(/^--.*$/gm, '');
    
    // Ensure uuid-ossp extension is properly handled
    if (!schema.includes('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')) {
      schema = 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n' + schema;
    }
    
    // Add Row Level Security (RLS) setup for Supabase
    const rlsSetup = `
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (customize as needed)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id);

-- Organization access policies
CREATE POLICY "Users can view organization data" ON organizations FOR SELECT 
  USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text));

-- Project access policies  
CREATE POLICY "Users can view organization projects" ON projects FOR SELECT 
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()::text));

-- Work logs policies
CREATE POLICY "Users can view own work logs" ON work_logs FOR SELECT 
  USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own work logs" ON work_logs FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update own work logs" ON work_logs FOR UPDATE 
  USING (user_id = auth.uid()::text);

-- Time sessions policies
CREATE POLICY "Users can view own time sessions" ON time_sessions FOR SELECT 
  USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own time sessions" ON time_sessions FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update own time sessions" ON time_sessions FOR UPDATE 
  USING (user_id = auth.uid()::text);

`;
    
    schema += rlsSetup;
    
    return schema;
  }

  async generateMigrationSQL() {
    console.log('🔄 Generating migration SQL files...');
    
    const migrationDir = path.join(CONFIG.exportDir, 'migrations');
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir);
    }
    
    // Create timestamped migration file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const migrationFile = path.join(migrationDir, `${timestamp}-initial-migration.sql`);
    
    const supabaseSchemaFile = path.join(CONFIG.exportDir, 'supabase-schema.sql');
    
    if (!fs.existsSync(supabaseSchemaFile)) {
      await this.createSupabaseCompatibleSchema();
    }
    
    const schema = fs.readFileSync(supabaseSchemaFile, 'utf8');
    fs.writeFileSync(migrationFile, schema);
    
    console.log('✅ Migration file created:', migrationFile);
    return migrationFile;
  }

  async exportForSupabase() {
    try {
      console.log('🚀 Starting Supabase export process...');
      
      // Step 1: Export current schema and data
      const schemaFile = await this.exportSchema();
      const dataFile = await this.exportData();
      
      // Step 2: Create Supabase-compatible schema
      const supabaseSchemaFile = await this.createSupabaseCompatibleSchema();
      
      // Step 3: Generate migration file
      const migrationFile = await this.generateMigrationSQL();
      
      // Step 4: Create instructions file
      await this.createInstructions();
      
      console.log('\n✅ Export completed successfully!');
      console.log(`📁 All files exported to: ${CONFIG.exportDir}`);
      console.log('\n📖 Next steps:');
      console.log('1. Read the instructions.md file');
      console.log('2. Set up your Supabase project');
      console.log('3. Run the migration files');
      console.log('4. Import your data');
      
    } catch (error) {
      console.error('❌ Export failed:', error.message);
      process.exit(1);
    }
  }

  async createInstructions() {
    const instructionsFile = path.join(CONFIG.exportDir, 'instructions.md');
    
    const instructions = `# Supabase Migration Instructions

## Prerequisites

1. **Supabase Project**: Create a new project at [supabase.com](https://supabase.com)
2. **PostgreSQL Tools**: Ensure you have \`psql\` and \`pg_dump\` installed
3. **Environment Variables**: Set up the following variables:

\`\`\`bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
\`\`\`

## Migration Steps

### 1. Apply Schema Migration

\`\`\`bash
# Using psql
psql "\$SUPABASE_DB_URL" -f supabase-schema.sql

# Or using Supabase CLI
supabase db reset --linked
supabase migration new initial_schema
# Copy content from supabase-schema.sql to the new migration file
supabase db push
\`\`\`

### 2. Import Data

\`\`\`bash
# Import data (disable triggers temporarily for faster import)
psql "\$SUPABASE_DB_URL" -c "SET session_replication_role = replica;"
psql "\$SUPABASE_DB_URL" -f data.sql
psql "\$SUPABASE_DB_URL" -c "SET session_replication_role = DEFAULT;"
\`\`\`

### 3. Update Your Application

#### Update Prisma Schema

Update your \`DATABASE_URL\` in \`.env\`:

\`\`\`env
DATABASE_URL="\$SUPABASE_DB_URL"
\`\`\`

#### Regenerate Prisma Client

\`\`\`bash
npx prisma generate
npx prisma db pull  # Optional: to verify schema sync
\`\`\`

### 4. Configure Row Level Security (RLS)

The migration includes basic RLS policies. Review and customize them:

1. Open Supabase Dashboard → Authentication → Policies
2. Review the automatically created policies
3. Customize access rules based on your requirements

### 5. Set up Supabase Auth (Optional)

If you want to use Supabase Auth instead of Firebase:

1. Configure auth providers in Supabase Dashboard
2. Update your frontend auth integration
3. Modify user creation logic to work with Supabase Auth

## Environment Variables for Production

Add these to your Render environment:

\`\`\`env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
\`\`\`

## Post-Migration Checklist

- [ ] Schema applied successfully
- [ ] Data imported without errors
- [ ] RLS policies configured
- [ ] Application connects to Supabase
- [ ] All features working as expected
- [ ] Performance is acceptable
- [ ] Backup and monitoring configured

## Troubleshooting

### Common Issues

1. **UUID Extension Error**: Ensure \`uuid-ossp\` extension is enabled
2. **Permission Denied**: Use service role key for schema operations
3. **RLS Blocking Queries**: Temporarily disable RLS during debugging
4. **Connection Limits**: Use connection pooling for production

### Getting Help

- Supabase Documentation: https://supabase.com/docs
- Discord Community: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase

## Files in this Export

- \`schema.sql\`: Original database schema
- \`supabase-schema.sql\`: Supabase-compatible schema with RLS
- \`data.sql\`: Database data export
- \`migrations/\`: Timestamped migration files
- \`instructions.md\`: This file
`;

    fs.writeFileSync(instructionsFile, instructions);
    console.log('✅ Instructions created:', instructionsFile);
  }
}

// CLI execution
if (require.main === module) {
  const exporter = new SupabaseExporter();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'schema':
      exporter.exportSchema();
      break;
    case 'data':
      exporter.exportData();
      break;
    case 'all':
    default:
      exporter.exportForSupabase();
      break;
  }
}

module.exports = SupabaseExporter;
