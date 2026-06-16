# Build Stage for Frontend
FROM node:22-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Production Stage for Backend
FROM node:22-alpine
WORKDIR /app

# Install build tools for sqlite3
RUN apk add --no-cache python3 make g++ sqlite-dev

# Create necessary directories
RUN mkdir -p /app/data/uploads

# Install backend dependencies
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production --build-from-source sqlite3

# Copy backend source
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=build-frontend /app/frontend/dist /app/frontend/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/app/data/database.sqlite

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "index.js"]
