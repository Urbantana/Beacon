---
name: Bhimitkom Inclusivity Features
description: 5 Bhimitkom Phase 2 features — implementation notes, API endpoints, and gotchas
---

## Features implemented

1. `/services-directory` — `GET /api/organizations` (static seed data in route file)
2. `/report-obstacle` — reuses existing `POST /api/accessibility/obstacles` (+15 pts); 10 obstacle types including ramps, curb cuts, audio signals
3. `/awareness` — `GET /api/awareness/courses`, `POST /api/awareness/enroll/:id`, `POST /api/awareness/complete/:id`; enrollment tracked in-memory Map (resets on server restart)
4. `/bhimitkom` — fully static about page; links to /services-directory, /store/bhimitkom, /awareness
5. `/store/bhimitkom` — `GET /api/store/bhimitkom` (category="bhimitkom" items); 8 items seeded in `rewards` table

## Sidebar section
"Inclusivity" section added BEFORE "Administration" in Sidebar.tsx, using icons: Heart, TriangleAlert, BookOpen, Star, Store

## API routes registered in routes/index.ts
- `organizationsRouter` from `./organizations`
- `awarenessRouter` from `./awareness`
- `GET /store/bhimitkom` added to `store.ts` (before the POST /store/redeem)

## Known gotchas

- `GET /api/store/heritage` had a bug: parameter named `_req` but body used `req`. Fixed to `req`.
- `GET /api/points/wallet` returns `{ jawwalPoints, ecoPoints, ... }` — NOT `{ balance }`. Frontend must use `.jawwalPoints`.
- `isAvailable` column in `rewards` table is INTEGER (0/1), not boolean. Map with `r.isAvailable === 1`.
- Awareness course enrollment is in-memory — resets on server restart. Persistent solution requires a DB table.
- Bhimitkom store items use the existing `rewardsTable` with `category = "bhimitkom"`.

**Why:** Static org data avoids a DB migration for read-only reference data. In-memory awareness enrollment is acceptable for MVP; a `course_enrollments` table would be needed for production.
