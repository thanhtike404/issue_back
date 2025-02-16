# -------- STAGE 1: Build Stage --------
    FROM node:18-alpine AS builder

    # Install OpenSSL and other dependencies
    RUN apk add --no-cache openssl
    
    # Set working directory
    WORKDIR /app
    
    # Install dependencies
    COPY package*.json ./
    RUN npm ci
    
    # Copy the rest of the code
    COPY . .
    
    # Generate Prisma Client
    RUN npx prisma generate
    

    
    # Build TypeScript project
    RUN npm run build
    
    # -------- STAGE 2: Production Stage --------
    FROM node:18-alpine AS runner
    
    # Install OpenSSL and other dependencies
    RUN apk add --no-cache openssl
    
    # Set working directory
    WORKDIR /app
    
    # Copy only necessary files from builder stage
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/prisma ./prisma
    COPY --from=builder /app/package*.json ./
    
    # Expose the port
    EXPOSE 3000
    
    # Run the application
    CMD ["node", "dist/app.js"]