FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY client/package.json client/

RUN npm install --workspace=client

COPY client/ ./client/

WORKDIR /app/client

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/client/.next/standalone ./client/
COPY --from=builder /app/client/.next/static ./client/.next/static

WORKDIR /app/client

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
