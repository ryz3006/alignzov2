# Alignzo V2 - Setup Scripts

This directory contains comprehensive setup scripts for the Alignzo V2 project that provide a one-stop solution for installation, configuration, and management.

## 📋 Overview

The setup scripts automate the entire process of setting up the Alignzo V2 project, including:

- **OS Detection**: Automatically detects your operating system
- **Prerequisites Checking**: Verifies and installs required software
- **Dependency Management**: Installs all project dependencies
- **Database Setup**: Creates and configures PostgreSQL database
- **Environment Configuration**: Sets up environment files
- **Data Seeding**: Populates database with initial data
- **Admin User Creation**: Interactive admin user setup
- **Application Management**: Start, stop, and monitor the application
- **Health Monitoring**: Check application and database health

## 🚀 Quick Start

### For Windows Users (PowerShell)

```powershell
# Complete setup (recommended for first-time users)
.\setup-alignzo.ps1 setup

# Start the application
.\setup-alignzo.ps1 start

# Check status
.\setup-alignzo.ps1 status
```

### For Linux/macOS Users (Bash)

```bash
# Make script executable (first time only)
chmod +x setup-alignzo.sh

# Complete setup (recommended for first-time users)
./setup-alignzo.sh setup

# Start the application
./setup-alignzo.sh start

# Check status
./setup-alignzo.sh status
```

## 📖 Available Commands

### Core Setup Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `setup` | Complete setup (prerequisites, dependencies, database, seed) | `./setup-alignzo.sh setup` |
| `install` | Install dependencies only | `./setup-alignzo.sh install` |
| `database` | Setup database only | `./setup-alignzo.sh database` |
| `seed` | Seed database with initial data | `./setup-alignzo.sh seed` |
| `admin` | Create admin user | `./setup-alignzo.sh admin` |

### Application Management Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `start` | Start the application | `./setup-alignzo.sh start` |
| `stop` | Stop the application | `./setup-alignzo.sh stop` |
| `status` | Show application status | `./setup-alignzo.sh status` |

### Monitoring Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `health` | Check application health | `./setup-alignzo.sh health` |
| `check-db` | Check database entries | `./setup-alignzo.sh check-db` |
| `help` | Show help message | `./setup-alignzo.sh help` |

## 🔧 Prerequisites

The scripts will automatically check and install these prerequisites:

### Required Software
- **Node.js 18+**: JavaScript runtime
- **npm**: Node.js package manager
- **Git**: Version control system
- **PostgreSQL 14+**: Database server

### Optional Software
- **Redis**: Caching and session storage (recommended for production)
- **Docker**: Containerization (alternative setup method)

## 🏗️ What the Setup Scripts Do

### 1. OS Detection and Package Management
- Detects your operating system (Windows, macOS, Ubuntu, CentOS, Fedora)
- Installs appropriate package manager (Chocolatey, Homebrew, apt, yum, dnf)
- Installs system-level dependencies

### 2. Prerequisites Installation
- **Node.js**: Installs Node.js 20.x LTS
- **PostgreSQL**: Installs and configures PostgreSQL
- **Git**: Ensures Git is available for version control

### 3. Project Dependencies
- Installs root project dependencies
- Installs backend (NestJS) dependencies
- Installs frontend (Next.js) dependencies

### 4. Database Setup
- Creates PostgreSQL user (`alignzo`)
- Creates main database (`alignzo_v2`)
- Creates test database (`alignzo_test`)
- Grants necessary permissions

### 5. Environment Configuration
- Copies development environment files
- Sets up backend `.env` file
- Sets up frontend `.env.local` file

### 6. Database Schema and Seeding
- Generates Prisma client
- Pushes database schema
- Seeds initial data:
  - System roles (SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE)
  - System permissions (50+ granular permissions)
  - Default organization
  - Sample projects and teams

### 7. Admin User Creation
- Prompts for admin email address
- Creates user with SUPER_ADMIN role
- Assigns all system permissions

## 📊 Application Architecture

After setup, you'll have:

```
Alignzo V2 Application
├── Backend (NestJS) - Port 3001
│   ├── REST API
│   ├── Authentication (Firebase + JWT)
│   ├── Database (PostgreSQL + Prisma)
│   └── Swagger Documentation
├── Frontend (Next.js) - Port 3000
│   ├── React Application
│   ├── Tailwind CSS
│   ├── Authentication UI
│   └── Dashboard Interface
└── Database (PostgreSQL) - Port 5432
    ├── Users & Authentication
    ├── Organizations & Teams
    ├── Projects & Time Tracking
    └── Permissions & Roles
```

## 🔐 Authentication Setup

The application uses Firebase for authentication. The setup includes:

- **Google OAuth**: Sign in with Google accounts
- **Organization Validation**: Email domain validation
- **JWT Tokens**: Secure session management
- **Role-Based Access**: Granular permission control

### Default Admin Access
- **Email**: The one you provide during setup
- **Role**: SUPER_ADMIN
- **Permissions**: Full system access

## 📁 Generated Files

The setup scripts create these files:

```
AlignzoV2/
├── backend/
│   └── .env                    # Backend environment
├── frontend/
│   └── .env.local             # Frontend environment
├── setup-alignzo.log          # Setup logs
├── setup-alignzo-error.log    # Error logs
└── node_modules/              # Dependencies
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Permission Denied (Linux/macOS)
```bash
chmod +x setup-alignzo.sh
```

#### 2. PowerShell Execution Policy (Windows)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 3. PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS
```

#### 4. Port Conflicts
```bash
# Kill processes on ports
npx kill-port 3000 3001
```

#### 5. Node.js Version Issues
```bash
# Check Node.js version
node --version

# Install Node.js 18+ if needed
# Visit: https://nodejs.org/
```

### Log Files

Check these log files for detailed information:

- `setup-alignzo.log`: General setup logs
- `setup-alignzo-error.log`: Error logs only
- `backend/logs/`: Backend application logs
- `frontend/.next/`: Next.js build logs

### Getting Help

1. **Check the logs**: Review log files for specific error messages
2. **Verify prerequisites**: Ensure all required software is installed
3. **Check documentation**: Review the main project documentation
4. **Manual setup**: Follow the manual setup guide if scripts fail

## 🔄 Development Workflow

### Daily Development
```bash
# Start development servers
./setup-alignzo.sh start

# Check status
./setup-alignzo.sh status

# Stop servers
./setup-alignzo.sh stop
```

### Database Changes
```bash
# Reset database
cd backend
npx prisma migrate reset
npx prisma db seed
```

### Adding New Dependencies
```bash
# Backend dependencies
cd backend && npm install <package-name>

# Frontend dependencies
cd frontend && npm install <package-name>
```

## 🚀 Production Deployment

For production deployment, consider:

1. **Environment Variables**: Update with production values
2. **Database**: Use production PostgreSQL instance
3. **Firebase**: Configure production Firebase project
4. **SSL/TLS**: Enable HTTPS
5. **Monitoring**: Set up application monitoring
6. **Backup**: Configure database backups

## 📚 Additional Resources

- [Project Documentation](../docs/README.md)
- [API Reference](../docs/api-reference.md)
- [Development Guide](../docs/development-guide.md)
- [Troubleshooting Guide](../docs/troubleshooting-guide.md)
- [Architecture Guide](../docs/architecture.md)

## 🤝 Contributing

When contributing to the setup scripts:

1. Test on multiple operating systems
2. Update documentation for new features
3. Maintain backward compatibility
4. Add appropriate error handling
5. Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Need help?** Check the troubleshooting guide or create an issue in the project repository.
