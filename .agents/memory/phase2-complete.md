---
name: Phase 2 features complete
description: All 9 Phase 2 PalTur features shipped — routes, pages, tables, translations, nav
---

## What was built
9 new features added to PalTur:

1. **Carbon Footprint** — `/carbon` — slider+mode selector, emissions calc, tree planting (50 pts/tree)
2. **Community Tours** — `/tours`, `/tours/create` — browse/filter/book, seeded with 3 tours
3. **Destination of Month** — `/destination-of-month` — hero banner with discount/bonus badges
4. **Suggestions** — `/suggestions`, `/suggestions/create` — upvote/downvote toggle, category filter
5. **Complaints** — `/complaints`, `/complaints/create` — PLT-XXXXXX tracking IDs, 4-status pipeline
6. **Chatbot** — `Chatbot.tsx` floating widget bottom-right — rule-based, bilingual, quick-chips
7. **Fuel Intelligence** — `/fuel` — station list, confidence bars, report dialog (20 pts), book dialog
8. **Event Recommendations** — GET /api/events/recommendations — category-preference algorithm (must be before /:id route)
9. **DB tables** — created via psql: carbon_offsets, tours, tour_bookings, featured_destinations, suggestions, suggestion_votes, complaints, fuel_stations, fuel_reports, fuel_bookings

## Key conventions used
- All pages wrap with `<AppLayout>` (no title prop)
- API base: `const BASE = import.meta.env.BASE_URL.replace(/\/$/, "")`
- Auth fallback: `getAppUserId(req)` returns integer; falls back to 1 for guests
- Sidebar has 3 sections: "City Control", "City Services", "Community"
- Chatbot is mounted once in App.tsx outside the Router (renders on all pages)
- Seeding: fuel.ts seeds 4 Ramallah stations, tours.ts seeds 3 tours, suggestions.ts seeds 3 suggestions, destinations.ts seeds Al-Manara Square

**Why:** New tables were pushed directly via psql (not drizzle-kit push) because drizzle-kit requires TTY — same pattern as prior auth tables.
