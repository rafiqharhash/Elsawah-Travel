FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package.json and server package.json
COPY package.json package-lock.json* ./
COPY server/package.json server/

# Install dependencies
RUN npm install --workspace=server

# Copy server source code
COPY server/ ./server/

# Build the TypeScript code
WORKDIR /app/server
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/dist ./server/dist

WORKDIR /app/server

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
