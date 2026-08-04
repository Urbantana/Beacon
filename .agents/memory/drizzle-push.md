---
name: Drizzle push workflow
description: How to apply DB schema changes to the Replit-provisioned PostgreSQL database
---

**Command:** `pnpm --filter @workspace/db exec drizzle-kit push`

**Why:** The project uses Drizzle Kit with `drizzle.config.ts` in `lib/db/`. Running push applies schema diffs directly to the database without generating migration files.

**How to apply:** After adding a new table to `lib/db/src/schema/` and re-exporting it from `lib/db/src/schema/index.ts`, run the push command before restarting the API server. The API server's seed functions will then find the empty tables and seed them.
