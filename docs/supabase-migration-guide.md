# Supabase Migration Guide for AlignzoV2

This guide walks you through migrating your AlignzoV2 database from any PostgreSQL provider to Supabase.

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **PostgreSQL Tools**: Install `psql` and `pg_dump`
3. **Node.js**: Ensure Node.js is installed for scripts
4. **Current Database**: Access to your existing PostgreSQL database

## 🚀 Step-by-Step Migration

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose your organization
3. Set a strong database password
4. Select a region closest to your users
5. Wait for project creation (usually 2-3 minutes)

### Step 2: Get Supabase Credentials

From your Supabase dashboard, collect:

```bash
# Project Settings > API
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Project Settings > Database > Connection string
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Step 3: Set Up Environment

Create a `.env` file in your backend directory:

```bash
cp configs/supabase.env.example backend/.env
```

Fill in your Supabase credentials in the `.env` file.

### Step 4: Export Current Database

```bash
# Make the export script executable
chmod +x scripts/export-to-supabase.js

# Run the export (requires your current DATABASE_URL in .env)
node scripts/export-to-supabase.js
```

This creates a `supabase-export/` directory with:
- `schema.sql` - Original database schema
- `supabase-schema.sql` - Supabase-optimized schema with RLS
- `data.sql` - All your data
- `migrations/` - Timestamped migration files
- `instructions.md` - Detailed instructions

### Step 5: Apply Schema to Supabase

#### Option A: Using Supabase SQL Editor (Recommended)

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy the contents of `scripts/supabase-migration.sql`
4. Paste and run the entire script
5. Verify all tables are created successfully

#### Option B: Using psql

```bash
psql "$DATABASE_URL" -f scripts/supabase-migration.sql
```

### Step 6: Import Your Data

```bash
# Connect to Supabase and import data
psql "$DATABASE_URL" -c "SET session_replication_role = replica;"
psql "$DATABASE_URL" -f supabase-export/data.sql
psql "$DATABASE_URL" -c "SET session_replication_role = DEFAULT;"
```

### Step 7: Update Application Configuration

#### Update Backend Environment

Update your backend `.env` file:

```env
# Replace with your Supabase database URL
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Add Supabase-specific variables
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Regenerate Prisma Client

```bash
cd backend
npx prisma generate
npx prisma db pull  # Verify schema sync
```

### Step 8: Configure Row Level Security (RLS)

The migration includes basic RLS policies. Customize them as needed:

1. **Review Policies**: Check Supabase Dashboard → Authentication → Policies
2. **Test Access**: Ensure your application can access data correctly
3. **Customize Rules**: Modify policies based on your security requirements

#### Example: Custom Project Access Policy

```sql
-- Allow project managers to see all projects in their organization
CREATE POLICY "Project managers can view org projects" ON "projects"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "user_roles" ur
      JOIN "roles" r ON r.id = ur."roleId"
      WHERE ur."userId" = auth.uid()::text 
      AND r.name = 'project_manager'
      AND ur."isActive" = true
    )
  );
```

### Step 9: Test Your Application

1. **Start Backend**: Ensure your NestJS backend connects to Supabase
2. **Test Authentication**: Verify user login/registration works
3. **Test CRUD Operations**: Check create, read, update, delete operations
4. **Test RLS**: Ensure users only see their authorized data

## 🔧 Render Deployment Configuration

### Environment Variables for Render

Set these environment variables in your Render service:

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NODE_ENV=production
PORT=3001
JWT_SECRET=your-jwt-secret

# If keeping Firebase Auth
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-service-account-email
```

### Build Commands for Render

**Build Command:**
```bash
npm install && npm run db:generate && npm run build
```

**Start Command:**
```bash
npm run start:prod
```

## 🔄 Migration Verification Checklist

- [ ] **Schema Applied**: All tables and indexes created
- [ ] **Data Imported**: All records transferred successfully
- [ ] **RLS Configured**: Security policies active and tested
- [ ] **Application Connects**: Backend successfully connects to Supabase
- [ ] **Authentication Works**: User login/registration functional
- [ ] **CRUD Operations**: All database operations working
- [ ] **Performance**: Query performance acceptable
- [ ] **Monitoring**: Set up alerts and monitoring

## 🚨 Troubleshooting

### Common Issues

#### 1. UUID Extension Error
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### 2. Permission Denied
- Use the service role key for schema operations
- Check RLS policies aren't blocking legitimate queries

#### 3. Connection Limits
```bash
# Use connection pooling in production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
```

#### 4. RLS Blocking Queries
```sql
-- Temporarily disable RLS for debugging
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- Re-enable after fixing
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

#### 5. Data Import Errors
```bash
# Check for constraint violations
psql "$DATABASE_URL" -c "SELECT conname, conrelid::regclass FROM pg_constraint WHERE NOT convalidated;"

# Re-run import with verbose logging
psql "$DATABASE_URL" -f data.sql -v ON_ERROR_STOP=1 -a
```

## 🔐 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files
- Use different secrets for different environments
- Rotate secrets regularly

### 2. RLS Policies
- Start with restrictive policies
- Test thoroughly before production
- Document your access patterns

### 3. Database Access
- Use service role key only for admin operations
- Use anon key for client-side operations
- Monitor access logs regularly

### 4. Connection Security
- Always use SSL connections
- Implement connection pooling
- Set up monitoring and alerts

## 📊 Performance Optimization

### 1. Indexes
The migration includes essential indexes. Add custom ones as needed:

```sql
-- Example: Add index for frequently queried fields
CREATE INDEX idx_work_logs_date_range ON "work_logs"("startTime", "endTime");
```

### 2. Connection Pooling
Use PgBouncer for production:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
```

### 3. Query Optimization
- Use Supabase's built-in query analyzer
- Monitor slow queries
- Optimize N+1 query patterns

## 🔄 Rollback Plan

If you need to rollback:

1. **Keep Original Database**: Don't delete until migration is confirmed successful
2. **Environment Switch**: Change `DATABASE_URL` back to original
3. **Prisma Reset**: Run `npx prisma generate` to reconnect
4. **Restart Services**: Restart your application

## 📞 Support

- **Supabase Docs**: https://supabase.com/docs
- **Community Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase/supabase/issues

## 🎉 Post-Migration Benefits

After successful migration to Supabase, you get:

1. **Built-in Authentication**: Optional migration from Firebase
2. **Real-time Features**: Instant database subscriptions
3. **Auto-generated APIs**: RESTful and GraphQL endpoints
4. **Storage**: File upload and management
5. **Edge Functions**: Serverless functions
6. **Dashboard**: Visual database management
7. **Monitoring**: Built-in analytics and logs

Happy migrating! 🚀
