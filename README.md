# Elsawah Travel Transportation System

A scalable SaaS-style transportation booking platform built with Next.js 15, Node.js, Express, and MongoDB.

## Architecture
- **Monorepo** structure using npm workspaces.
- **Frontend**: Next.js 15 App Router, Tailwind CSS, shadcn/ui, Zustand, Framer Motion.
- **Backend**: Express.js, TypeScript, Mongoose (with Transactions), JWT Auth, Socket.IO.
- **Database**: MongoDB (Replica Set required for transactions).

## Prerequisites
- Node.js 20+
- MongoDB instance (Atlas recommended)

## Setup

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```

2. **Environment Variables**
   - Create `server/.env` with `MONGO_URI`, `JWT_SECRET`, etc.
   - Create `client/.env.local` with `NEXT_PUBLIC_API_URL`.

3. **Run Application (Development)**
   ```bash
   npm run dev
   ```
   This command starts both the Next.js client and the Express backend concurrently.

4. **Run via Docker**
   ```bash
   docker-compose up --build
   ```

## Features Implemented
- Strict transaction-based queue-safe booking engine.
- Real-time seat updates via Socket.IO.
- Admin dashboard with Recharts analytics.
- Data export (CSV/XLSX) from the backend.
- Mobile-optimized minimal student booking flow.
- Swagger API Documentation (`/api-docs`).
