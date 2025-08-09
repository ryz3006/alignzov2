# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY backend/package*.json ./
RUN npm install --only=production

# Copy application source code
COPY backend/ ./

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependencies from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the application port
EXPOSE 3001

# Start the application
CMD ["node", "dist/src/main"]
