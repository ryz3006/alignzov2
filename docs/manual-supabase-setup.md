# Manual Supabase Setup Instructions

## 🚨 Network Issue Detected
Since we're experiencing connectivity issues with your Supabase database, please follow these manual steps to set up your database schema.

## Step 1: Apply Schema via Supabase Dashboard

### 1.1 Access Supabase Dashboard
1. Go to: https://app.supabase.com/projects
2. Select your project: **slckdzqmavqmnotptkct**
3. Click on **"SQL Editor"** in the left sidebar

### 1.2 Apply Migration Script
1. Click **"New Query"**
2. Copy the **entire contents** of `scripts/supabase-migration.sql`
3. Paste it into the SQL Editor
4. Click **"RUN"** to execute the script

### 1.3 Verify Schema Creation
After running the script, check that these tables were created:
- ✅ `users`
- ✅ `organizations` 
- ✅ `projects`
- ✅ `work_logs`
- ✅ `time_sessions`
- ✅ `roles`
- ✅ `permissions`

You can verify by going to **Table Editor** in the left sidebar.

## Step 2: Check Database Connection

### 2.1 Verify Project Settings
1. Go to **Settings** → **Database**
2. Confirm your connection details match:
   - **Host**: `db.slckdzqmavqmnotptkct.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`

### 2.2 Test Connection from Supabase
1. In **SQL Editor**, run this test query:
   ```sql
   SELECT 'Connection successful!' as status, version();
   ```
2. You should see a success message and PostgreSQL version

## Step 3: Troubleshoot Connection Issues

### 3.1 Common Issues
1. **Project Not Ready**: Wait 2-3 minutes after project creation
2. **IP Restrictions**: Check if IP allowlist is configured
3. **SSL Requirements**: Ensure SSL is enabled

### 3.2 Alternative Connection Strings
Try these if the main connection fails:

**With SSL mode:**
```
postgresql://postgres:alignzov2%236582@db.slckdzqmavqmnotptkct.supabase.co:5432/postgres?sslmode=require
```

**With connection pooling:**
```
postgresql://postgres:alignzov2%236582@db.slckdzqmavqmnotptkct.supabase.co:6543/postgres?pgbouncer=true
```

## Step 4: Verify Everything Works

### 4.1 Test Basic Queries
Run these in SQL Editor to confirm setup:

```sql
-- Test roles table
SELECT COUNT(*) as role_count FROM roles;

-- Test permissions table  
SELECT COUNT(*) as permission_count FROM permissions;

-- Test system settings
SELECT COUNT(*) as settings_count FROM system_settings;

-- Test UUID generation
SELECT gen_random_uuid() as test_uuid;
```

### 4.2 Expected Results
- **role_count**: 5 (super_admin, org_admin, project_manager, team_lead, user)
- **permission_count**: 12 (various CRUD permissions)
- **settings_count**: 5 (app settings)
- **test_uuid**: A valid UUID string

## Step 5: Update Your Application

Once the schema is applied successfully:

### 5.1 Generate Prisma Client
```bash
cd backend
npx prisma generate
npx prisma db pull
```

### 5.2 Test Application Connection
Create a simple test in your application to verify connectivity.

## 🔧 If You Continue Having Issues

### Option 1: Reset Database Password
1. Go to **Settings** → **Database**
2. Click **"Reset database password"**
3. Update your connection string with the new password

### Option 2: Create New Project
If the current project has issues:
1. Create a new Supabase project
2. Use the new connection details
3. Apply the migration script again

### Option 3: Use psql Command Line
If you have `psql` installed:
```bash
psql "postgresql://postgres:alignzov2%236582@db.slckdzqmavqmnotptkct.supabase.co:5432/postgres" -f scripts/supabase-migration.sql
```

## 📞 Next Steps

After completing the manual setup:
1. ✅ Confirm all tables are created
2. ✅ Test basic queries work
3. ✅ Update your application's `.env` file
4. ✅ Generate Prisma client
5. ✅ Test your application connectivity

## 🆘 Need Help?

If you continue experiencing issues:
1. Check Supabase status: https://status.supabase.com/
2. Verify your project region matches your location
3. Contact Supabase support via their dashboard
4. Consider creating a new project if this one seems corrupted
