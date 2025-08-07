# 🚀 Development Guide

This guide provides comprehensive instructions for setting up and developing the Alignzo project.

**Last Updated**: August 6, 2025

## 🆕 Recent Updates
- Fixed PrismaClientValidationError with missing `reportingTo` field
- Resolved TypeScript errors in auth.service.ts
- Enhanced DTO validation for user creation
- Improved authentication flow and user visibility
- Added comprehensive troubleshooting section

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Environment Configuration](#environment-configuration)
4. [API Development Guidelines](#api-development-guidelines)
5. [Frontend Development Guidelines](#frontend-development-guidelines)
6. [Backend Development Guidelines](#backend-development-guidelines)
7. [Testing Guidelines](#testing-guidelines)
8. [Deployment Guidelines](#deployment-guidelines)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Redis** (v6 or higher)
- **Git**

### Required Accounts
- **Firebase Project** (for authentication)
- **Google Cloud Console** (for OAuth)

---

## 🛠️ Project Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AlignzoV2
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup
```bash
# Start PostgreSQL and Redis
# (Use your system's package manager or Docker)

# Create database
createdb alignzo_v2

# Run migrations
cd backend
npm run db:migrate
npm run db:seed
```

---

## ⚙️ Environment Configuration

### 1. Backend Environment
```bash
# Copy development environment
cp configs/development.env backend/.env

# The file already contains all necessary configurations
# No additional setup required for development
```

### 2. Frontend Environment
```bash
# Copy frontend environment example
cp configs/frontend.env.example frontend/.env.local

# Update Firebase configuration with actual values
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCCOH7T907XnZoGxJaESLQghUE0xSDPiHk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dalignzo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dalignzo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dalignzo.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=901156603087
NEXT_PUBLIC_FIREBASE_APP_ID=1:901156603087:web:c95c9f4f714f8f0be263ba
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-36S66F65D6

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_VERSION=v1
```

### 3. Firebase Setup
```bash
# Ensure Firebase Admin SDK file exists
ls configs/firebase/dalignzo-firebase-adminsdk-fbsvc-326bf38898.json

# If missing, download from Firebase Console
# Project Settings > Service Accounts > Generate New Private Key
```

---

## 🔗 API Development Guidelines

### 1. API URL Standardization

**IMPORTANT:** All API calls must follow the standardized approach. See [API URL Standardization](./api-url-standardization.md) for detailed guidelines.

#### Key Principles:
- ✅ Use relative paths with `apiCall`
- ✅ Never use hardcoded URLs
- ✅ Use centralized configuration from `frontend/src/configs/api.ts`

#### Example Usage:
```typescript
import { useAuth } from '@/lib/auth-context';
import { API_CONFIG } from '@/configs/api';

const { apiCall } = useAuth();

// ✅ Correct - Use relative paths
const response = await apiCall('/api/users');
const response = await apiCall(`/api/users/${userId}`);

// ✅ Correct - Use API_CONFIG endpoints
const response = await apiCall(API_CONFIG.ENDPOINTS.USERS.LIST);

// ❌ Wrong - Don't use hardcoded URLs
const response = await apiCall('http://localhost:3001/api/users');
```

### 2. Adding New API Endpoints

#### Backend (NestJS)
```typescript
// 1. Create controller
@Controller('api/new-feature')
export class NewFeatureController {
  @Get()
  async findAll() {
    return this.newFeatureService.findAll();
  }
}

// 2. Add to module
@Module({
  controllers: [NewFeatureController],
  providers: [NewFeatureService],
})
export class NewFeatureModule {}
```

#### Frontend (Next.js)
```typescript
// 1. Add to API configuration
// frontend/src/configs/api.ts
export const API_CONFIG = {
  ENDPOINTS: {
    // ... existing endpoints
    NEW_FEATURE: {
      LIST: '/api/new-feature',
      CREATE: '/api/new-feature',
      UPDATE: (id: string) => `/api/new-feature/${id}`,
      DELETE: (id: string) => `/api/new-feature/${id}`,
    },
  },
};

// 2. Use in components
const response = await apiCall(API_CONFIG.ENDPOINTS.NEW_FEATURE.LIST);
```

### 3. API Response Standards

#### Success Response Format:
```typescript
{
  success: true,
  data: any,
  message?: string,
  meta?: {
    total?: number,
    page?: number,
    limit?: number,
  }
}
```

#### Error Response Format:
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any,
  }
}
```

---

## 🎨 Frontend Development Guidelines

### 1. Component Structure

#### File Organization:
```
frontend/src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── forms/        # Form components
│   └── layout/       # Layout components
├── app/              # Next.js app router pages
├── lib/              # Utility functions
├── configs/          # Configuration files
└── types/            # TypeScript type definitions
```

#### Component Template:
```typescript
// components/ui/example-component.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { API_CONFIG } from '@/configs/api';

interface ExampleComponentProps {
  // Define props
}

export default function ExampleComponent({ }: ExampleComponentProps) {
  const { apiCall } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/endpoint', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('API call failed');
      }
      
      // Handle success
    } catch (error) {
      console.error('Error:', error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### 2. State Management

#### Use React Query for Server State:
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const response = await apiCall('/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },
});

// Mutating data
const mutation = useMutation({
  mutationFn: async (data) => {
    const response = await apiCall('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },
});
```

### 3. Authentication

#### Using Firebase Auth:
```typescript
import { signInWithGoogle, signOut } from '@/configs/firebase/firebase-config';

// Sign in
const handleSignIn = async () => {
  try {
    const result = await signInWithGoogle();
    // Handle successful sign-in
  } catch (error) {
    console.error('Sign-in error:', error);
  }
};

// Sign out
const handleSignOut = async () => {
  try {
    await signOut();
    // Handle successful sign-out
  } catch (error) {
    console.error('Sign-out error:', error);
  }
};
```

---

## 🔧 Backend Development Guidelines

### 1. Controller Structure

#### Standard Controller Template:
```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('feature-name')
@Controller('api/feature-name')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Get()
  @ApiOperation({ summary: 'Get all features' })
  @ApiResponse({ status: 200, description: 'Features retrieved successfully' })
  async findAll(@Query() query: any) {
    return this.featureService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create new feature' })
  @ApiResponse({ status: 201, description: 'Feature created successfully' })
  async create(@Body() createFeatureDto: CreateFeatureDto) {
    return this.featureService.create(createFeatureDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update feature' })
  @ApiResponse({ status: 200, description: 'Feature updated successfully' })
  async update(@Param('id') id: string, @Body() updateFeatureDto: UpdateFeatureDto) {
    return this.featureService.update(id, updateFeatureDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete feature' })
  @ApiResponse({ status: 200, description: 'Feature deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.featureService.remove(id);
  }
}
```

### 2. Service Layer

#### Standard Service Template:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    return this.prisma.feature.findMany({
      where: query,
      include: {
        // Include related data
      },
    });
  }

  async create(createFeatureDto: CreateFeatureDto) {
    return this.prisma.feature.create({
      data: createFeatureDto,
    });
  }

  async update(id: string, updateFeatureDto: UpdateFeatureDto) {
    const feature = await this.prisma.feature.findUnique({
      where: { id },
    });

    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }

    return this.prisma.feature.update({
      where: { id },
      data: updateFeatureDto,
    });
  }

  async remove(id: string) {
    const feature = await this.prisma.feature.findUnique({
      where: { id },
    });

    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }

    return this.prisma.feature.delete({
      where: { id },
    });
  }
}
```

### 3. DTOs and Validation

#### Create DTO:
```typescript
import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeatureDto {
  @ApiProperty({ description: 'Feature name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Feature description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Feature email' })
  @IsEmail()
  email: string;
}
```

#### Update DTO:
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateFeatureDto } from './create-feature.dto';

export class UpdateFeatureDto extends PartialType(CreateFeatureDto) {}
```

---

## 🧪 Testing Guidelines

### 1. Frontend Testing

#### Component Testing:
```typescript
// __tests__/components/example.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ExampleComponent from '@/components/example';

describe('ExampleComponent', () => {
  it('renders correctly', () => {
    render(<ExampleComponent />);
    expect(screen.getByText('Example')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    render(<ExampleComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    // Assert expected behavior
  });
});
```

#### API Testing:
```typescript
// __tests__/api/example.test.ts
import { apiCall } from '@/lib/auth-context';

describe('API Calls', () => {
  it('fetches data successfully', async () => {
    const response = await apiCall('/api/test');
    expect(response.ok).toBe(true);
  });
});
```

### 2. Backend Testing

#### Controller Testing:
```typescript
// test/feature.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureController } from './feature.controller';
import { FeatureService } from './feature.service';

describe('FeatureController', () => {
  let controller: FeatureController;
  let service: FeatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeatureController],
      providers: [FeatureService],
    }).compile();

    controller = module.get<FeatureController>(FeatureController);
    service = module.get<FeatureService>(FeatureService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all features', async () => {
    const result = [{ id: '1', name: 'Test' }];
    jest.spyOn(service, 'findAll').mockImplementation(async () => result);
    expect(await controller.findAll({})).toBe(result);
  });
});
```

---

## 🚀 Deployment Guidelines

### 1. Environment Variables

#### Production Environment:
```bash
# Backend (.env)
NODE_ENV=production
API_URL=https://api.alignzo.com
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.alignzo.com
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_production_firebase_domain
```

### 2. Build Process

#### Backend Build:
```bash
cd backend
npm run build
npm run start:prod
```

#### Frontend Build:
```bash
cd frontend
npm run build
npm run start
```

### 3. Database Migration

#### Production Migration:
```bash
cd backend
npm run db:migrate:prod
npm run db:seed:prod
```

---

## 🏢 Teams, Projects & Users Development

### Overview
The Teams, Projects, and Users functionality provides comprehensive organizational management capabilities with enhanced hierarchy features.

### Key Features
- **Teams Management**: Create, edit, delete teams with leader and member management
- **Projects Management**: Complete project lifecycle with owner and team assignments
- **Enhanced Users Management**: Organizational hierarchy with project-specific reporting
- **Multiple Relationships**: Users can belong to multiple teams and projects
- **Project-Specific Escalation**: Separate reporting structure per project

### Database Schema
```sql
-- Enhanced User model with project-specific reporting
ALTER TABLE project_members ADD COLUMN "reportingToId" UUID REFERENCES users(id);

-- Key relationships:
-- User -> Manager (organizational hierarchy)
-- User -> Teams (multiple team memberships)
-- User -> Projects (multiple project assignments with reporting)
```

### Frontend Components
- **TeamForm**: `frontend/src/components/forms/team-form.tsx`
- **ProjectForm**: `frontend/src/components/forms/project-form.tsx`
- **UserForm**: `frontend/src/components/forms/user-form.tsx`
- **Teams Page**: `frontend/src/app/dashboard/teams/page.tsx`
- **Projects Page**: `frontend/src/app/dashboard/projects/page.tsx`
- **Users Page**: `frontend/src/app/dashboard/users/page.tsx`

### Backend Services
- **Teams Service**: `backend/src/teams/teams.service.ts`
- **Projects Service**: `backend/src/projects/projects.service.ts`
- **Users Service**: `backend/src/users/users.service.ts`

### Development Guidelines
1. **Form Validation**: Use Zod schemas for type-safe validation
2. **React Query**: Use for data fetching and caching
3. **Transactions**: Use Prisma transactions for complex operations
4. **Error Handling**: Comprehensive error states and user feedback
5. **Type Safety**: Full TypeScript support throughout

### Testing
```bash
# Test Teams functionality
npm run test:teams

# Test Projects functionality
npm run test:projects

# Test Users functionality
npm run test:users

# Test all functionality
npm run test
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Firebase Authentication Errors
**Problem:** `FirebaseError: Firebase: Error (auth/api-key-not-valid)`

**Solution:**
```bash
# 1. Check environment variables
echo $NEXT_PUBLIC_FIREBASE_API_KEY

# 2. Ensure .env.local exists in frontend directory
ls frontend/.env.local

# 3. Restart development server
npm run dev
```

#### 2. Database Connection Issues
**Problem:** `Connection refused` or `Authentication failed`

**Solution:**
```bash
# 1. Check PostgreSQL service
sudo systemctl status postgresql

# 2. Check database credentials
psql -h localhost -U alignzo -d alignzo_v2

# 3. Verify DATABASE_URL in .env
echo $DATABASE_URL
```

#### 3. Port Conflicts
**Problem:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# 1. Find process using port
netstat -ano | findstr :3001

# 2. Kill process
taskkill /PID <PID> /F

# 3. Or use different port
PORT=3002 npm run dev
```

#### 4. API Call Failures
**Problem:** `Failed to fetch` or CORS errors

**Solution:**
```bash
# 1. Check if backend is running
curl http://localhost:3001/api/health

# 2. Verify API URL configuration
echo $NEXT_PUBLIC_API_URL

# 3. Check CORS settings in backend
```

#### 5. User Creation Validation Errors
**Problem:** "ManagerId must be UUID" error when creating users

**Solution:**
```bash
# 1. Leave Manager field empty for first user
# 2. The validation now accepts empty/undefined values
# 3. Assign managers after creating multiple users
# 4. Check DTO validation in backend/src/users/dto/create-user.dto.ts
```

#### 6. Super Admin User Not Visible
**Problem:** Super admin user not appearing in users list

**Solution:**
```bash
# 1. Ensure you're logged in with riyas.siddikk@6dtech.co.in
# 2. Check if database is seeded: npm run db:seed
# 3. Verify authentication in browser console
# 4. Check API response at /api/users endpoint
```

#### 7. TypeScript Compilation Errors
**Problem:** TypeScript errors in auth.service.ts or other files

**Solution:**
```bash
# 1. Check for null pointer issues
# 2. Add proper null checks where needed
# 3. Run: npm run build to see all errors
# 4. Fix validation issues in DTOs
```

---

## 📚 Additional Resources

- [Teams, Projects & Users Implementation Summary](./teams-projects-users-implementation-summary.md)
- [API URL Standardization](./api-url-standardization.md)
- [Environment Setup](./environment-setup.md)
- [Firebase Setup](./firebase-setup.md)
- [API Reference](./api-reference.md)
- [Contributing Guidelines](./contributing.md)

---

## 🔄 Development Workflow

### 1. Feature Development
1. Create feature branch: `git checkout -b feature/new-feature`
2. Follow API standardization guidelines
3. Write tests for new functionality
4. Update documentation if needed
5. Create pull request

### 2. Code Review Checklist
- [ ] Follows API URL standardization
- [ ] Uses relative paths for API calls
- [ ] Includes proper error handling
- [ ] Has appropriate tests
- [ ] Documentation updated
- [ ] No hardcoded URLs or credentials

### 3. Testing Checklist
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] API endpoints work correctly
- [ ] Firebase authentication works
- [ ] Environment switching works
- [ ] No console errors

---

*This development guide ensures consistent development practices and helps maintain code quality across the project. Always refer to the [API URL Standardization](./api-url-standardization.md) document for API-related guidelines.* 