FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
COPY packages/admin/package.json packages/admin/

# Install dependencies
RUN npm install --omit=dev 2>/dev/null; npm install

# Copy source code
COPY packages/shared/ packages/shared/
COPY packages/backend/ packages/backend/
COPY packages/admin/dist/ packages/admin/dist/

# Generate Prisma client
WORKDIR /app/packages/backend
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start server
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]
