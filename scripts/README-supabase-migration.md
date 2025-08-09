# Supabase Migration Scripts

This directory contains all the tools and scripts needed to migrate your AlignzoV2 database to Supabase.

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `export-to-supabase.js` | Export current database schema and data |
| `import-to-supabase.js` | Import data to Supabase with validation |
| `supabase-migration.sql` | Complete schema migration for Supabase |
| `setup-supabase.sh` | Automated setup script (Linux/macOS) |
| `setup-supabase.ps1` | Automated setup script (Windows) |

## 🚀 Quick Start

### For Windows Users

1. **Prepare Environment**:
   ```powershell
   # Copy and configure environment file
   Copy-Item configs/supabase.env.example backend/.env
   # Edit backend/.env with your Supabase credentials
   ```

2. **Run Setup**:
   ```powershell
   # Option 1: Manual step-by-step
   node scripts/export-to-supabase.js     # Export current data (if any)
   psql $env:DATABASE_URL -f scripts/supabase-migration.sql  # Apply schema
   node scripts/import-to-supabase.js     # Import data
   
   # Option 2: Automated (if you have WSL or Git Bash)
   bash scripts/setup-supabase.sh
   ```

### For Linux/macOS Users

1. **Prepare Environment**:
   ```bash
   # Copy and configure environment file
   cp configs/supabase.env.example backend/.env
   # Edit backend/.env with your Supabase credentials
   ```

2. **Run Automated Setup**:
   ```bash
   # Make script executable
   chmod +x scripts/setup-supabase.sh
   
   # Run setup
   ./scripts/setup-supabase.sh
   ```

## 📋 Manual Migration Steps

If you prefer to run the migration manually:

### Step 1: Set Up Environment

Create `backend/.env` based on `configs/supabase.env.example`:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 2: Apply Schema

```bash
# Apply the complete schema to Supabase
psql "$DATABASE_URL" -f scripts/supabase-migration.sql
```

### Step 3: Export Current Data (Optional)

If you have existing data to migrate:

```bash
# Set your current database URL
export CURRENT_DATABASE_URL="your-current-postgres-url"

# Export schema and data
node scripts/export-to-supabase.js
```

### Step 4: Import Data (If Exported)

```bash
# Import your data to Supabase
node scripts/import-to-supabase.js
```

### Step 5: Generate Prisma Client

```bash
cd backend
npx prisma generate
npx prisma db pull  # Verify schema sync
```

## 🔧 Script Options

### Export Script (`export-to-supabase.js`)

```bash
node scripts/export-to-supabase.js [command]

Commands:
  schema    Export schema only
  data      Export data only
  all       Export everything (default)
```

### Import Script (`import-to-supabase.js`)

```bash
node scripts/import-to-supabase.js [options]

Options:
  --dry-run     Validate without making changes
  --force       Overwrite existing data
  --help        Show help message
```

### Setup Script (`setup-supabase.sh`)

```bash
./scripts/setup-supabase.sh [options]

Options:
  --skip-deps   Skip dependency installation
  --dry-run     Show what would be done
  --help        Show help message
```

## ⚠️ Important Notes

### Prerequisites

- **Node.js**: Version 18+ recommended
- **PostgreSQL Tools**: `psql` and `pg_dump` must be installed
- **Supabase Project**: Create and configure your project first

### Environment Variables

Make sure these are set in your `backend/.env`:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | ✅ |
| `SUPABASE_URL` | Your Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Public anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (keep secret!) | ✅ |

### Security Considerations

1. **Service Role Key**: Never expose this in client-side code
2. **Connection String**: Contains password, keep secure
3. **RLS Policies**: Review and customize the default policies
4. **Environment Files**: Never commit `.env` files to version control

## 🐛 Troubleshooting

### Common Issues

1. **"uuid-ossp extension not found"**
   ```sql
   -- Run in Supabase SQL Editor
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **"Permission denied"**
   - Ensure you're using the service role key for schema operations
   - Check that your IP is allowed in Supabase settings

3. **"Connection timeout"**
   - Verify your DATABASE_URL is correct
   - Check if connection pooling is enabled (port 6543 vs 5432)

4. **"Data import errors"**
   ```bash
   # Run with verbose logging
   node scripts/import-to-supabase.js --dry-run
   ```

5. **"RLS blocking queries"**
   ```sql
   -- Temporarily disable RLS for debugging
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

### Getting Help

- **Supabase Documentation**: https://supabase.com/docs
- **Community Discord**: https://discord.supabase.com
- **Project Issues**: Create issues in your project repository

## 📊 What Gets Migrated

### Schema Components
- ✅ All tables with proper relationships
- ✅ Indexes for performance
- ✅ Enums and custom types
- ✅ Constraints and validations
- ✅ Row Level Security policies
- ✅ Triggers for `updatedAt` fields

### Data Components
- ✅ All existing records
- ✅ Foreign key relationships
- ✅ JSON/JSONB data
- ✅ Array fields
- ✅ Timestamps and UUIDs

### Features Added
- 🆕 Row Level Security for multi-tenancy
- 🆕 Optimized indexes for Supabase
- 🆕 Default roles and permissions
- 🆕 System settings configuration
- 🆕 Audit trail setup

## 🎯 Post-Migration Checklist

- [ ] Schema applied successfully
- [ ] Data imported without errors
- [ ] Prisma client regenerated
- [ ] Application connects to Supabase
- [ ] Authentication flow works
- [ ] CRUD operations functional
- [ ] RLS policies configured
- [ ] Performance is acceptable
- [ ] Render deployment updated
- [ ] Environment variables set
- [ ] Monitoring configured

## 🚀 Deployment to Render

After successful migration, update your Render service:

### Environment Variables
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

### Build Commands
```bash
# Build Command
npm install && npm run db:generate && npm run build

# Start Command  
npm run start:prod
```

## 📖 Additional Resources

- [Complete Migration Guide](../docs/supabase-migration-guide.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma with Supabase](https://supabase.com/docs/guides/integrations/prisma)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
