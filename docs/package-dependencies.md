# 📦 Package Dependencies Summary

Current dependencies and their purposes for the Alignzo project.

---

## 🏗️ Root Package.json

### Core Dependencies
```json
{
  "@prisma/client": "^6.13.0"
}
```

### Development Dependencies
```json
{
  "@commitlint/cli": "^18.0.0",
  "@commitlint/config-conventional": "^18.0.0",
  "concurrently": "^8.2.2",
  "husky": "^8.0.3",
  "lint-staged": "^15.0.0",
  "prettier": "^3.0.0",
  "prisma": "^6.13.0"
}
```

**Purpose**: Root-level tooling for development workflow, code quality, and database management.

---

## 🔧 Backend Dependencies (NestJS)

### Core Framework
```json
{
  "@nestjs/common": "^10.3.3",
  "@nestjs/config": "^3.2.0",
  "@nestjs/core": "^10.3.3",
  "@nestjs/platform-express": "^10.3.3",
  "@nestjs/swagger": "^7.3.0",
  "@nestjs/throttler": "^5.1.0"
}
```

### Authentication & Security
```json
{
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "firebase-admin": "^12.0.0",
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "passport-jwt": "^4.0.1",
  "bcryptjs": "^2.4.3"
}
```

### Database & ORM
```json
{
  "@prisma/client": "^6.13.0"
}
```

### Validation & Utilities
```json
{
  "class-transformer": "^0.5.1",
  "class-validator": "^0.14.1",
  "zod": "^3.23.8"
}
```

### Security & Middleware
```json
{
  "helmet": "^8.0.0",
  "cors": "^2.8.5",
  "compression": "^1.7.4",
  "express-rate-limit": "^7.3.1",
  "cookie-parser": "^1.4.7"
}
```

### Development Dependencies
```json
{
  "@nestjs/cli": "^10.3.3",
  "@nestjs/testing": "^10.3.3",
  "typescript": "^5.7.3",
  "jest": "^30.0.0",
  "eslint": "^9.18.0",
  "prettier": "^3.4.2",
  "prisma": "^6.13.0"
}
```

---

## 🎨 Frontend Dependencies (Next.js)

### Core Framework
```json
{
  "next": "15.4.5",
  "react": "19.1.0",
  "react-dom": "19.1.0"
}
```

### Authentication
```json
{
  "firebase": "^12.0.0"
}
```

### UI & Styling
```json
{
  "@headlessui/react": "^2.2.7",
  "@heroicons/react": "^2.2.0",
  "lucide-react": "^0.536.0",
  "framer-motion": "^12.23.12",
  "tailwindcss": "^4"
}
```

### State Management & Data Fetching
```json
{
  "@tanstack/react-query": "^5.84.1",
  "zustand": "^5.0.7"
}
```

### Form Handling & Validation
```json
{
  "react-hook-form": "^7.62.0",
  "@hookform/resolvers": "^5.2.1",
  "zod": "^3.25.76"
}
```

### Utilities
```json
{
  "react-hot-toast": "^2.5.2"
}
```

### Development Dependencies
```json
{
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "typescript": "^5",
  "eslint": "^9",
  "eslint-config-next": "15.4.5",
  "@tailwindcss/postcss": "^4"
}
```

---

## 🔑 Key Dependencies by Purpose

### Authentication System
- **Backend**: `firebase-admin`, `passport`, `passport-jwt`, `passport-google-oauth20`
- **Frontend**: `firebase`
- **Purpose**: Firebase Google OAuth with JWT token management

### Database Management
- **Backend**: `@prisma/client`
- **Root**: `prisma`
- **Purpose**: PostgreSQL ORM with type-safe database operations

### API Development
- **Backend**: `@nestjs/*` packages, `@nestjs/swagger`
- **Purpose**: RESTful API with automatic documentation

### UI Development
- **Frontend**: `@headlessui/react`, `@heroicons/react`, `lucide-react`, `framer-motion`
- **Purpose**: Modern, accessible UI components with animations

### State Management
- **Frontend**: `@tanstack/react-query`, `zustand`
- **Purpose**: Server state management and client state management

### Form Handling
- **Frontend**: `react-hook-form`, `@hookform/resolvers`, `zod`
- **Purpose**: Type-safe form validation and handling

### Security
- **Backend**: `helmet`, `cors`, `express-rate-limit`, `bcryptjs`
- **Purpose**: Security headers, CORS, rate limiting, password hashing

### Development Tools
- **Root**: `concurrently`, `husky`, `lint-staged`, `prettier`
- **Purpose**: Development workflow, git hooks, code formatting

---

## 📊 Dependency Statistics

### Total Dependencies
- **Root**: 7 dev dependencies
- **Backend**: 25 dependencies + 20 dev dependencies
- **Frontend**: 13 dependencies + 7 dev dependencies
- **Total**: 72 packages

### Key Versions
- **Node.js**: >=20.0.0
- **NestJS**: 10.3.3
- **Next.js**: 15.4.5
- **React**: 19.1.0
- **TypeScript**: 5.7.3
- **Prisma**: 6.13.0
- **Firebase**: 12.0.0 (frontend), 12.0.0 (backend admin)

---

## 🔄 Update Commands

### Update All Dependencies
```bash
# Root dependencies
npm update

# Backend dependencies
cd backend && npm update

# Frontend dependencies
cd frontend && npm update
```

### Check for Security Issues
```bash
# Security audit
npm run security:audit

# Fix security issues
npm run security:fix
```

### Update Specific Packages
```bash
# Update Prisma
npm install prisma@latest @prisma/client@latest

# Update Firebase
cd frontend && npm install firebase@latest
cd backend && npm install firebase-admin@latest

# Update NestJS
cd backend && npm install @nestjs/common@latest @nestjs/core@latest
```

---

## 📝 Notes

### Version Compatibility
- NestJS 10.3.3 is stable and compatible with all current dependencies
- Next.js 15.4.5 is the latest version with App Router
- React 19.1.0 is the latest stable version
- Firebase 12.0.0 is the latest version for both frontend and backend

### Security Considerations
- All dependencies are regularly updated for security patches
- Firebase Admin SDK is properly configured with service account
- JWT tokens are stored in HTTP-only cookies
- Rate limiting and CORS are properly configured

### Performance Considerations
- React Query for efficient server state management
- Zustand for lightweight client state
- Tailwind CSS for optimized CSS bundle
- Prisma for efficient database queries

---

*Last Updated: August 5, 2025* 