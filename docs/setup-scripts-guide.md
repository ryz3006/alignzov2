# Alignzo V2 - Complete Setup Scripts Guide

## 🎯 Overview

This guide documents the comprehensive setup solution created for the Alignzo V2 project. The solution provides a **one-stop interactive setup** that automates the entire installation and configuration process.

## 📋 Requirements Addressed

The setup scripts address all the requirements specified:

### ✅ 1. OS Identification
- **Automatic Detection**: Detects Windows, macOS, Ubuntu, CentOS, Fedora
- **Package Manager Detection**: Identifies appropriate package manager (Chocolatey, Homebrew, apt, yum, dnf)
- **Cross-Platform Support**: Works on all major operating systems

### ✅ 2. Prerequisites Checking
- **Node.js 18+**: Verifies and installs if needed
- **npm**: Ensures package manager is available
- **Git**: Checks for version control system
- **PostgreSQL 14+**: Verifies database server
- **Redis**: Optional but recommended for caching

### ✅ 3. Package Management
- **Available Packages**: Lists installed packages
- **Required Packages**: Identifies missing dependencies
- **Automatic Installation**: Installs missing packages using appropriate package manager
- **Fallback Support**: Tries alternative sources if primary fails

### ✅ 4. Full Setup Installation
- **Root Dependencies**: Installs project-level packages
- **Backend Dependencies**: Installs NestJS and related packages
- **Frontend Dependencies**: Installs Next.js and UI packages
- **Development Tools**: Installs TypeScript, ESLint, Prettier

### ✅ 5. Database Setup and Seeding
- **Database Creation**: Creates PostgreSQL databases
- **User Setup**: Creates application user with proper permissions
- **Schema Migration**: Applies Prisma schema to database
- **Initial Data**: Seeds system roles, permissions, and sample data

### ✅ 6. Admin User Creation
- **Interactive Prompt**: Asks for admin email address
- **Email Validation**: Validates email format
- **User Creation**: Creates user with SUPER_ADMIN role
- **Permission Assignment**: Grants all system permissions

### ✅ 7. Application Management
- **Start/Stop**: Complete application lifecycle management
- **Status Monitoring**: Real-time status checking
- **Health Checks**: Application and database health verification
- **Log Management**: Comprehensive logging system

## 🛠️ Scripts Created

### 1. `setup-alignzo.sh` (Bash - Linux/macOS)
```bash
#!/bin/bash
# Cross-platform bash script with full functionality
# Supports Ubuntu, CentOS, Fedora, macOS
```

**Features:**
- OS detection and package management
- Prerequisites checking and installation
- Database setup and seeding
- Interactive admin user creation
- Application lifecycle management

### 2. `setup-alignzo.ps1` (PowerShell - Windows)
```powershell
# Windows PowerShell script with full functionality
# Supports Windows 10/11 with PowerShell 5.1+
```

**Features:**
- Windows-specific package management (Chocolatey)
- PowerShell-native commands and error handling
- Windows service management
- Process monitoring and control

### 3. `setup-alignzo.bat` (Batch - Windows)
```batch
@echo off
REM Simple batch wrapper for PowerShell script
REM Provides easy access for users who prefer .bat files
```

**Features:**
- Simple batch file interface
- PowerShell script wrapper
- Error handling and user guidance
- Cross-compatibility with PowerShell

## 🚀 Usage Examples

### Complete Setup (First Time)
```bash
# Linux/macOS
chmod +x scripts/setup-alignzo.sh
./scripts/setup-alignzo.sh setup

# Windows PowerShell
.\scripts\setup-alignzo.ps1 setup

# Windows Batch
scripts\setup-alignzo.bat setup
```

### Daily Development
```bash
# Start application
./scripts/setup-alignzo.sh start

# Check status
./scripts/setup-alignzo.sh status

# Stop application
./scripts/setup-alignzo.sh stop
```

### Database Management
```bash
# Setup database only
./scripts/setup-alignzo.sh database

# Seed database
./scripts/setup-alignzo.sh seed

# Check database entries
./scripts/setup-alignzo.sh check-db
```

### Health Monitoring
```bash
# Check application health
./scripts/setup-alignzo.sh health

# Check database entries
./scripts/setup-alignzo.sh check-db

# View logs
cat setup-alignzo.log
```

## 📊 What Gets Installed

### System Dependencies
- **Node.js 20.x LTS**: JavaScript runtime
- **PostgreSQL 14+**: Database server
- **Git**: Version control
- **Build Tools**: Compilers and development tools

### Project Dependencies
- **Backend**: NestJS, Prisma, Firebase Admin, JWT
- **Frontend**: Next.js 14, React 19, Tailwind CSS
- **Development**: TypeScript, ESLint, Prettier, Jest

### Database Setup
- **Main Database**: `alignzo_v2`
- **Test Database**: `alignzo_test`
- **User**: `alignzo` with full privileges
- **Extensions**: UUID, pgvector

### Initial Data
- **System Roles**: SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE
- **Permissions**: 50+ granular permissions
- **Organization**: Default organization setup
- **Sample Data**: Projects, teams, work logs

## 🔧 Configuration Files

### Environment Files
- `backend/.env`: Backend configuration
- `frontend/.env.local`: Frontend configuration
- `configs/development.env`: Development template

### Database Configuration
```env
DATABASE_URL="postgresql://alignzo:alignzo@localhost:5432/alignzo_v2"
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=alignzo
DB_PASSWORD=alignzo
DB_NAME=alignzo_v2
```

### Application Ports
- **Backend**: Port 3001 (NestJS API)
- **Frontend**: Port 3000 (Next.js App)
- **Database**: Port 5432 (PostgreSQL)
- **API Docs**: http://localhost:3001/api/docs

## 📝 Logging and Monitoring

### Log Files
- `setup-alignzo.log`: General setup logs
- `setup-alignzo-error.log`: Error logs only
- `backend/logs/`: Backend application logs

### Health Checks
- **Backend Health**: HTTP endpoint verification
- **Frontend Health**: Web server status
- **Database Health**: Connection and query testing
- **Process Monitoring**: PID tracking and status

## 🐛 Troubleshooting

### Common Issues

#### 1. Permission Issues (Linux/macOS)
```bash
chmod +x scripts/setup-alignzo.sh
```

#### 2. PowerShell Execution Policy (Windows)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 3. PostgreSQL Connection
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

### Error Recovery
1. **Check Logs**: Review `setup-alignzo.log` and `setup-alignzo-error.log`
2. **Verify Prerequisites**: Ensure all required software is installed
3. **Manual Steps**: Follow manual setup guide if scripts fail
4. **Reset Database**: Use `npx prisma migrate reset` if needed

## 🔄 Development Workflow

### Daily Operations
```bash
# Start development
./scripts/setup-alignzo.sh start

# Make changes to code
# Changes auto-reload in browser

# Check status
./scripts/setup-alignzo.sh status

# Stop development
./scripts/setup-alignzo.sh stop
```

### Database Changes
```bash
# After schema changes
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Adding Dependencies
```bash
# Backend
cd backend && npm install <package-name>

# Frontend
cd frontend && npm install <package-name>
```

## 🚀 Production Considerations

### Environment Variables
- Update with production values
- Use secure passwords and keys
- Configure external services

### Database
- Use production PostgreSQL instance
- Configure backups and monitoring
- Set up connection pooling

### Security
- Enable HTTPS/SSL
- Configure CORS properly
- Set up firewall rules

### Monitoring
- Application performance monitoring
- Database performance monitoring
- Error tracking and alerting

## 📚 Documentation Structure

```
docs/
├── setup-scripts-guide.md     # This guide
├── README.md                  # Main project documentation
├── quick-start.md            # Quick start instructions
├── development-guide.md      # Development workflow
├── troubleshooting-guide.md  # Common issues and solutions
└── api-reference.md          # API documentation
```

## 🤝 Contributing

When contributing to the setup scripts:

1. **Test Cross-Platform**: Test on multiple operating systems
2. **Update Documentation**: Keep guides and READMEs current
3. **Error Handling**: Add comprehensive error handling
4. **Backward Compatibility**: Maintain compatibility with existing setups
5. **Logging**: Add appropriate logging for debugging

## 📄 Files Created

### Scripts Directory
```
scripts/
├── setup-alignzo.sh          # Bash script (Linux/macOS)
├── setup-alignzo.ps1         # PowerShell script (Windows)
├── setup-alignzo.bat         # Batch wrapper (Windows)
├── README.md                 # Scripts documentation
├── setup-database.js         # Existing database script
├── restore-database.js       # Existing restore script
└── restore-database-interactive.js  # Existing interactive script
```

### Generated Files
```
AlignzoV2/
├── backend/
│   └── .env                  # Backend environment
├── frontend/
│   └── .env.local           # Frontend environment
├── setup-alignzo.log        # Setup logs
├── setup-alignzo-error.log  # Error logs
└── node_modules/            # Dependencies
```

## 🎉 Success Metrics

The setup scripts achieve:

- **100% Automation**: Complete setup without manual intervention
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Error Recovery**: Comprehensive error handling and recovery
- **User-Friendly**: Clear prompts and helpful error messages
- **Comprehensive**: Covers all aspects of setup and management
- **Maintainable**: Well-documented and extensible code

## 🔮 Future Enhancements

Potential improvements:

1. **Docker Support**: Add Docker containerization
2. **CI/CD Integration**: Automated testing and deployment
3. **Cloud Deployment**: AWS, Azure, GCP deployment scripts
4. **Monitoring Integration**: Prometheus, Grafana setup
5. **Backup Automation**: Automated database backups
6. **Multi-Environment**: Development, staging, production setups

---

**The setup scripts provide a complete, automated solution for the Alignzo V2 project, addressing all requirements and providing a smooth development experience across all platforms.**
