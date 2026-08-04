---
name: PalTur stack overview
description: Core architecture, routing, i18n, and DB patterns used across the project
---

**Frontend:** React + Vite artifact at `/` (`artifacts/urban-up/`). Router: wouter. Styling: Tailwind + shadcn/ui.

**Backend:** Express 5 artifact at `/api` (`artifacts/api-server/`). Routes live in `artifacts/api-server/src/routes/`. All routes registered in `routes/index.ts`.

**DB:** Replit-provisioned PostgreSQL via Drizzle ORM. Schema in `lib/db/src/schema/`. Apply changes: `pnpm --filter @workspace/db exec drizzle-kit push`.

**i18n:** `artifacts/urban-up/src/lib/translations.ts` — all strings as `{ en, ar }` objects. `useI18n()` hook provides `t()`, `lang`, `isRtl`.

**Single default user:** id=1 ("CityExplorer" / "RamallahDriver"). No auth.

**Pages so far:** dashboard, traffic, safe-paths, eco, wallet, municipality, store, events, events-create.

**Why:** Monorepo managed by pnpm workspaces; artifacts are separate packages under `artifacts/`.
