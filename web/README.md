# Meal Subsidy web app

This is the Next.js app and Prisma project. Run all commands below from `web/`.

## Local development

Configure `DATABASE_URL` in `.env`, then run:

```bash
npm ci
npx prisma migrate dev
npm run dev
```

Use `migrate dev` only with a development database. Commit each new directory it creates under `prisma/migrations/` together with the schema change.

## Production deployment

First deploy the latest committed code. Confirm that the checkout contains the schema models and migrations you expect; reinstalling dependencies cannot add models to an old `schema.prisma`.

```bash
git status --short
git rev-parse --short HEAD
grep -n '^model SubsidySchedule' prisma/schema.prisma
ls prisma/migrations/20260918093042_mig/migration.sql
```

If the checkout is correct, configure `.env`, then install build dependencies, apply committed migrations, and build:

```bash
npm ci --include=dev
npm run deploy:build
npm run start-prod
```

`deploy:build` runs `prisma migrate deploy` and then `npm run build`. The build regenerates Prisma Client from `prisma/schema.prisma` before compiling Next.js and TypeScript. Do not run `migrate dev` against production.

If TypeScript says `prisma.subsidySchedule` does not exist, check the source schema first, then the generated client:

```bash
grep -n '^model SubsidySchedule' prisma/schema.prisma
grep -n 'get subsidySchedule' node_modules/.prisma/client/index.d.ts
```

If the first check is empty, deploy the correct checkout. If only the second is empty, run `npx prisma generate --schema=prisma/schema.prisma` and inspect its output.

See [the project documentation](../docs/documentation.md) for the architecture and database workflow.
