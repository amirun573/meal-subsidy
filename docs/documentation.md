# Meal Subsidy System - Architecture & Technical Documentation

This document provides a comprehensive overview of the **Meal Subsidy System**, including its architecture, technical implementation, Prisma database management, credit distribution mechanics, and deployment workflow.

---

## 1. Overall Project Overview

The **Meal Subsidy System** is a Next.js (App Router) full-stack web application designed to manage employee meal subsidies, digital QR redemptions, automated schedule distributions, and administrative reporting.

### Core Capabilities
- **Subsidy Schedule Management (`/subsidy`)**: Configure automated cron routines (Daily, Weekly, Monthly) and manual credit triggers with single-active-routine rules.
- **Execution History & Audit Logs**: Detailed logs for every credit distribution (Cron vs Manual) timestamped in `Asia/Kuala_Lumpur` timezone.
- **Employee Credit & Cards (`/card-setup`, `/employee-details`)**: Manage employee profiles, card assignments, and real-time balance updates.
- **QR Redemption Scanner (`/scan`)**: Real-time scanner interface for redeeming meal credits.
- **Reporting & Analytics (`/report`)**: Exportable reports on subsidy distributions and card redemptions.

---

## 2. Technical Stack & Architecture

### Backend & Framework
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database & ORM**: PostgreSQL managed via **Prisma ORM**
- **Cron Server**: `node-cron` integrated in `cron.ts` running in `Asia/Kuala_Lumpur` (UTC+8)
- **API Architecture**: Custom action-code routing pattern using `StatusAPICode` enums over REST endpoints (`/api/subsidy`, `/api/user`, `/api/department`).

### Code Structure
```
web/
├── cron.ts                         # Automated scheduler routine for subsidy distribution
├── prisma/
│   ├── schema.prisma               # Prisma models and DB schemas
│   └── migrations/                 # Migration files
└── src/
    ├── _Common/
    │   └── enum/
    │       └── status-api-code.enum.ts  # API action codes enum
    ├── app/
    │   ├── api/
    │   │   └── subsidy/            # API routes, models, and service layer
    │   │       ├── route.ts
    │   │       ├── model/
    │   │       └── service/
    │   └── subsidy/                # Subsidy schedule management page
    │       └── page.tsx
    └── components/                 # Shared UI components & layout
```

---

## 3. Subsidy Schedule Mechanics & Financial Guardrails

1. **Single Active Routine Rule**:
   - To prevent duplicate money distribution, **only 1 `ROUTINE` schedule can be active at a time**.
   - Activating a routine schedule automatically deactivates any existing active routine schedules on the backend.
2. **Custom Credit Amount**:
   - When a schedule triggers (automatically via cron or manually via **"Trigger Now"**), the exact credit amount (`schedule.amount`) configured in the schedule is granted to active eligible employees.
3. **Execution Logging**:
   - Successful executions are recorded in the `SubsidyScheduleLog` table with the source (`CRON` vs `MANUAL`), amount distributed, number of affected users, and timestamp. Failed transactions roll back without a success log and are reported in the server logs.
4. **Cron fallback**:
   - The custom server checks once per minute. An active `ROUTINE` controls the daily, weekly, or monthly trigger time and credit amount. When there is no active routine, the original daily 05:50 `Asia/Kuala_Lumpur` credit trigger remains in effect.
   - Each Kuala Lumpur calendar day has one unique automated run key, so concurrent workers or a same-day routine change cannot distribute credits twice automatically. Manual triggers remain separate. A missed trigger while the server is down is not automatically replayed.
   - `RANGE` schedules are stored but are not run automatically by this routine checker.

---

## 4. Prisma Database & Workflows

### Database Schema Models
- **`SubsidySchedule`**: Manages schedules (`uuid`, `title`, `schedule_type`, `routine_frequency`, `trigger_time`, `day_of_week`, `day_of_month`, `amount`, `active`).
- **`SubsidyScheduleLog`**: Stores execution history (`uuid`, `triggered_by_source`, `amount`, `status`, `notes`, `created_at`).
- **`Subsidy` & `SubsidyCredit`**: Manages user subsidy status and balance balances.

### Standard Prisma Commands

```bash
# 1. Generate Prisma Client after schema changes
npx prisma generate

# 2. Run Database Migrations (Development)
npx prisma migrate dev --name <migration_name>

# 3. Apply committed migrations to Production DB
npx prisma migrate deploy

# 4. Open Prisma Studio to inspect DB UI
npx prisma studio
```

---

## 5. How to Deploy

### Prerequisites
- Node.js (v18 or v20 recommended)
- PostgreSQL Database
- Environment file `.env` configured in `/web/.env`:
  ```env
  DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
  NEXT_PUBLIC_SERVER_URL="https://your-app.example.com"
  JWT_SECRET_KEY="generate-a-unique-random-secret"
  HASHING_SECRET_KEY="generate-another-unique-random-secret"
  Initialization_Vector="generate-another-unique-random-value"
  ENCRYPTION_METHOD="aes-256-cbc"
  ```

  Keep `.env` private. The server currently listens on port 3000; setting `PORT` does not change it.

### Build & Deployment Steps

1. **Deploy the current source**: Confirm the checkout has the expected `prisma/schema.prisma` models and their committed migration files. If a model is missing from the schema on the server, update the checkout before reinstalling packages or generating Prisma Client.

2. **Install build dependencies**:
   ```bash
   cd web
   npm ci --include=dev
   ```

3. **Apply committed migrations and build**:
   ```bash
   npm run deploy:build
   ```

   This runs `prisma migrate deploy`, then the production build. The build runs `prisma generate` against `prisma/schema.prisma` before compiling. Run `migrate dev` only against a development database, and commit its new migration files before deploying.

4. **Start Production Application Server & Cron Routine**:
   ```bash
   # Option A: Built-in production start script
   npm run start-prod

   # Option B: Managed via PM2 Process Manager
   pm2 start npm --name "meal-subsidy-web" -- run start-prod
   ```

---

## 6. Maintenance & Troubleshooting

- **Check Logs**: Inspect Winston logs in the app log directory or via PM2: `pm2 logs meal-subsidy-web`.
- **Cronjob Verification**: Ensure server system clock or process timezone handles `Asia/Kuala_Lumpur` correctly for cron execution.
