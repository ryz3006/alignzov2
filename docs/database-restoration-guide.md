# Database Restoration Guide for Alignzo

This guide will help you restore and set up the Alignzo database with proper user privileges and sample data.

## Overview

Alignzo uses PostgreSQL as its primary database with the following setup:
- **Admin User**: `postgres` (for database management)
- **Application User**: `alignzo` (for runtime operations)
- **Database**: `alignzo_v2`
- **Extensions**: `pgvector` (for AI embeddings), `uuid-ossp` (for UUID generation)

## Prerequisites

Before running the restoration script, ensure you have:

1. **PostgreSQL** installed and running
   - Default admin user: `postgres`
   - Default password: `postgres`
   - Port: `5432`

2. **Node.js** and **npm** installed

3. **Project dependencies** installed:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

## Quick Setup

### Option 1: Automated Restoration (Recommended)

Run the automated restoration script:

```bash
node scripts/restore-database.js
```

This script will:
1. ✅ Check prerequisites
2. ✅ Test admin database connection
3. ✅ Create the `alignzo_v2` database
4. ✅ Create the `alignzo` user with proper permissions
5. ✅ Install required PostgreSQL extensions
6. ✅ Set up Prisma schema and generate client
7. ✅ Seed the database with initial data
8. ✅ Add sample work logs
9. ✅ Verify the setup

### Option 2: Manual Setup

If you prefer manual setup or need to troubleshoot:

#### Step 1: Create Database and User

Connect to PostgreSQL as admin:
```bash
psql -U postgres -h localhost
```

Create database and user:
```sql
-- Create database
CREATE DATABASE alignzo_v2;

-- Create application user
CREATE USER alignzo WITH PASSWORD 'alignzo';

-- Grant privileges
GRANT CONNECT ON DATABASE alignzo_v2 TO alignzo;
GRANT USAGE ON SCHEMA public TO alignzo;
GRANT CREATE ON SCHEMA public TO alignzo;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO alignzo;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO alignzo;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO alignzo;

-- Grant future privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO alignzo;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO alignzo;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO alignzo;
```

#### Step 2: Install Extensions

Connect to the alignzo_v2 database:
```bash
psql -U postgres -h localhost -d alignzo_v2
```

Install required extensions:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
```

#### Step 3: Set Up Prisma

Navigate to the backend directory:
```bash
cd backend
```

Generate Prisma client:
```bash
npx prisma generate
```

Push database schema:
```bash
npx prisma db push
```

Seed the database:
```bash
npx prisma db seed
```

#### Step 4: Add Sample Data

Add sample work logs:
```bash
npx ts-node scripts/add-sample-work-logs.ts
```

## Configuration Files

### Environment Configuration

The project uses the following environment configuration:

**Admin Connection** (for database management):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/alignzo_v2?schema=public"
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

**Application Connection** (for runtime):
```
APP_DATABASE_URL="postgresql://alignzo:alignzo@localhost:5432/alignzo_v2?schema=public"
APP_DB_USERNAME=alignzo
APP_DB_PASSWORD=alignzo
```

### Database Schema

The database includes the following main tables:

#### Core Tables
- `users` - User management
- `roles` - Role-based access control
- `permissions` - System permissions
- `user_roles` - User-role assignments
- `role_permissions` - Role-permission assignments

#### Project Management
- `organizations` - Organization management
- `projects` - Project information
- `teams` - Team management
- `project_members` - Project-user assignments
- `team_members` - Team-user assignments

#### Time Tracking
- `work_logs` - Time entries and work logs
- `time_sessions` - Active time tracking sessions
- `tickets` - Integration tickets (JIRA, etc.)

#### System
- `system_settings` - Application configuration
- `audit_logs` - System audit trail
- `notifications` - User notifications

## Initial Data

The seeding process creates:

### System Roles
- **SUPER_ADMIN** - Full system access
- **ADMIN** - Organization-level administrator
- **MANAGER** - Team and project manager
- **EMPLOYEE** - Regular employee

### System Permissions
- User management permissions
- Project management permissions
- Time tracking permissions
- Work logs permissions
- Team management permissions
- System administration permissions

### Default User
- **Email**: `riyas.siddikk@6dtech.co.in`
- **Role**: SUPER_ADMIN
- **Name**: Riyas Siddikk

### Sample Data
- Default organization: 6D Technologies
- Sample projects: Alignzo Platform Development, Website Redesign
- Default team: Development Team
- Sample work logs with various activities

## Verification

After setup, verify the database is working:

```bash
# Test admin connection
psql "postgresql://postgres:postgres@localhost:5432/alignzo_v2" -c "SELECT COUNT(*) FROM users;"

# Test application connection
psql "postgresql://alignzo:alignzo@localhost:5432/alignzo_v2" -c "SELECT COUNT(*) FROM projects;"
```

## Troubleshooting

### Common Issues

#### 1. PostgreSQL Connection Failed
**Error**: `connection to server at "localhost" (127.0.0.1), port 5432 failed`
**Solution**: Ensure PostgreSQL is running and accessible

#### 2. Permission Denied
**Error**: `permission denied for database alignzo_v2`
**Solution**: Check user privileges and ensure proper grants

#### 3. Extension Not Found
**Error**: `extension "pgvector" is not available`
**Solution**: Install pgvector extension in PostgreSQL

#### 4. Prisma Client Generation Failed
**Error**: `Failed to generate Prisma Client`
**Solution**: Check schema syntax and ensure all dependencies are installed

### Reset Database

To completely reset the database:

```bash
# Drop and recreate database
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS alignzo_v2;"
psql -U postgres -h localhost -c "CREATE DATABASE alignzo_v2;"

# Run restoration script
node scripts/restore-database.js
```

## Next Steps

After successful database restoration:

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api/docs

4. **Login**:
   - Use Google OAuth with: `riyas.siddikk@6dtech.co.in`
   - Role: SUPER_ADMIN (full access)

## Security Notes

- The `postgres` user has full database privileges (admin)
- The `alignzo` user has application-level privileges only
- In production, use strong passwords and restrict network access
- Consider using connection pooling for better performance
- Enable SSL in production environments

## Support

If you encounter issues:

1. Check the logs in `backend/logs/`
2. Verify PostgreSQL is running and accessible
3. Ensure all prerequisites are met
4. Check the troubleshooting section above
5. Review the Prisma documentation for schema issues 