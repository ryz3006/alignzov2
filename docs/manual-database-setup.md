# Manual Database Setup Guide

If the automated restoration script doesn't work, follow these manual steps to set up your Alignzo database.

## Prerequisites

1. **PostgreSQL** installed and running
2. **Node.js** and **npm** installed
3. **Project dependencies** installed

## Step 1: Connect to PostgreSQL

Open a terminal and connect to PostgreSQL as the admin user:

```bash
psql -U postgres -h localhost
```

You'll be prompted for the password. Enter your PostgreSQL admin password.

## Step 2: Create Database

Once connected to PostgreSQL, run these commands:

```sql
-- Create the database
CREATE DATABASE alignzo_v2;

-- Connect to the new database
\c alignzo_v2

-- Create the application user
CREATE USER alignzo WITH PASSWORD 'alignzo';

-- Grant privileges to the application user
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

-- Install required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Exit PostgreSQL
\q
```

## Step 3: Update Environment Configuration

Update your `configs/development.env` file to include both admin and application connections:

```env
# Admin connection (for database management)
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/alignzo_v2?schema=public"
DB_USERNAME=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD

# Application connection (for runtime)
APP_DATABASE_URL="postgresql://alignzo:alignzo@localhost:5432/alignzo_v2?schema=public"
APP_DB_USERNAME=alignzo
APP_DB_PASSWORD=alignzo
```

Replace `YOUR_POSTGRES_PASSWORD` with your actual PostgreSQL admin password.

## Step 4: Set Up Prisma

Navigate to the backend directory and set up Prisma:

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed the database
npx prisma db seed
```

## Step 5: Add Sample Data

Add sample work logs:

```bash
# Add sample work logs
npx ts-node scripts/add-sample-work-logs.ts
```

## Step 6: Verify Setup

Test the database connections:

```bash
# Test admin connection
psql "postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/alignzo_v2" -c "SELECT COUNT(*) FROM users;"

# Test application connection
psql "postgresql://alignzo:alignzo@localhost:5432/alignzo_v2" -c "SELECT COUNT(*) FROM projects;"
```

## Step 7: Start the Application

```bash
# Start backend server
cd backend
npm run dev

# In another terminal, start frontend server
cd frontend
npm run dev
```

## Troubleshooting

### Common Issues

1. **Password Authentication Failed**
   - Make sure you're using the correct PostgreSQL admin password
   - Check if PostgreSQL is running: `pg_isready -h localhost -p 5432`

2. **Permission Denied**
   - Ensure you're connected as the `postgres` user
   - Check if the user has sufficient privileges

3. **Extension Not Found**
   - Install pgvector extension: `CREATE EXTENSION IF NOT EXISTS "pgvector";`
   - Make sure PostgreSQL was compiled with pgvector support

4. **Prisma Errors**
   - Check if all dependencies are installed: `npm install`
   - Verify the schema file is correct
   - Check the database connection string

### Reset Database

If you need to start over:

```sql
-- Connect as postgres user
psql -U postgres -h localhost

-- Drop and recreate database
DROP DATABASE IF EXISTS alignzo_v2;
CREATE DATABASE alignzo_v2;

-- Follow steps 2-6 again
```

## Database Schema Overview

The Alignzo database includes these main tables:

- **users** - User management and authentication
- **roles** - Role-based access control
- **permissions** - System permissions
- **organizations** - Organization management
- **projects** - Project information
- **teams** - Team management
- **work_logs** - Time tracking entries
- **time_sessions** - Active time tracking
- **system_settings** - Application configuration

## Initial Data

After seeding, you'll have:

- **Super Admin User**: `riyas.siddikk@6dtech.co.in`
- **Default Organization**: 6D Technologies
- **Sample Projects**: Alignzo Platform Development, Website Redesign
- **System Roles**: SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE
- **Sample Work Logs**: Various time tracking entries

## Next Steps

1. Access the application at http://localhost:3000
2. Login using Google OAuth with `riyas.siddikk@6dtech.co.in`
3. Explore the dashboard and features
4. Create additional users, projects, and teams as needed 