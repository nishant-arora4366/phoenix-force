# Phoenix Force Database Setup Docker Image
FROM node:18-alpine

# Install PostgreSQL client tools
RUN apk add --no-cache postgresql-client

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all setup files
COPY . .

# Create directories for backups
RUN mkdir -p data-backup/json data-backup/sql

# Make scripts executable
RUN chmod +x *.js

# Set environment variables
ENV NODE_ENV=production

# Default command
CMD ["node", "fetch-database-info.js"]
