# PalTur – Technical Report

> Generated: 2026-08-04

---

## Project Overview

**PalTur** is a smart city and tourism platform for Palestine (Ramallah area). It provides residents and tourists with real-time city intelligence — traffic, events, fuel availability, community suggestions, complaints, eco rewards, carbon footprint tracking, and heritage-store redemptions — all tied together with a Jawwal Points loyalty system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | pnpm workspaces |
| **Frontend** | React 18 + Vite + TypeScript, Wouter (routing), TanStack Query, Tailwind CSS + shadcn/ui |
| **Backend** | Node.js + Express 5, TypeScript, esbuild (bundler) |
| **Database** | PostgreSQL via Replit managed DB, Drizzle ORM |
| **Auth** | Replit OIDC (OpenID Connect + PKCE), express-session |
| **Mobile** | Expo SDK ~54 (React Native), Expo Router |
| **i18n** | Custom `translations.ts` key map + `useI18n()` hook (English / Arabic, RTL-aware) |
| **API Spec** | OpenAPI 3.0 (`lib/api-spec/openapi.yaml`), Orval codegen → Zod + React Query client |
| **Logging** | pino |

---

## File Structure

```
workspace/
├── artifacts/
│   ├── api-server/                  # Express backend
│   │   └── src/
│   │       ├── app.ts               # Express app setup
│   │       ├── index.ts             # Server entry point
│   │       ├── lib/
│   │       │   ├── getAppUserId.ts  # OIDC → integer user bridge
│   │       │   └── session.ts
│   │       ├── middlewares/
│   │       └── routes/
│   │           ├── index.ts         # Root router (mounts all sub-routers)
│   │           ├── auth.ts          # OIDC login/callback/logout
│   │           ├── profile.ts       # GET/PUT /profile
│   │           ├── dashboard.ts     # Summary, activity feed, leaderboard
│   │           ├── events.ts        # Events CRUD + bookings + recommendations
│   │           ├── tours.ts         # Tours CRUD + bookings
│   │           ├── suggestions.ts   # Citizen suggestions + voting
│   │           ├── complaints.ts    # Complaint tracking (PLT-XXXXXX IDs)
│   │           ├── carbon.ts        # Carbon calculator + tree offsets
│   │           ├── fuel.ts          # Fuel station crowdsourcing + bookings
│   │           ├── destinations.ts  # Destination of the Month
│   │           ├── store.ts         # Heritage store + point redemption
│   │           ├── points.ts        # Wallet + redemption
│   │           ├── traffic.ts       # Traffic reports
│   │           ├── waste.ts         # Waste reports
│   │           ├── accessibility.ts # Accessible paths/obstacles
│   │           ├── municipality.ts  # Municipality data
│   │           ├── chatbot.ts       # Rule-based bilingual chatbot
│   │           ├── tourist.ts       # Tourist spots + events
│   │           └── health.ts        # GET /healthz
│   │
│   ├── urban-up/                    # React web app
│   │   └── src/
│   │       ├── App.tsx              # Router (Wouter)
│   │       ├── components/
│   │       │   ├── Chatbot.tsx      # Floating chat widget
│   │       │   ├── layout/
│   │       │   │   ├── AppLayout.tsx
│   │       │   │   └── Sidebar.tsx
│   │       │   ├── map/
│   │       │   └── ui/              # 50+ shadcn/ui primitives
│   │       ├── hooks/
│   │       ├── lib/
│   │       │   ├── translations.ts  # i18n key map
│   │       │   ├── i18n-context.tsx
│   │       │   └── theme-context.tsx
│   │       └── pages/
│   │           ├── dashboard.tsx
│   │           ├── traffic.tsx / safe-paths.tsx
│   │           ├── eco.tsx / wallet.tsx / store.tsx
│   │           ├── municipality.tsx
│   │           ├── events.tsx / events-create.tsx / event-detail.tsx
│   │           ├── tours.tsx / tours-create.tsx
│   │           ├── carbon.tsx
│   │           ├── destination-of-month.tsx
│   │           ├── suggestions.tsx / suggestions-create.tsx
│   │           ├── complaints.tsx / complaints-create.tsx
│   │           ├── fuel.tsx
│   │           └── not-found.tsx
│   │
│   ├── paltur-mobile/               # Expo React Native app
│   └── mockup-sandbox/              # Component preview server (Vite)
│
└── lib/
    ├── db/                          # Drizzle ORM schema + client
    │   └── src/schema/
    │       ├── users.ts
    │       ├── sessions.ts
    │       ├── events.ts
    │       ├── tours.ts
    │       ├── suggestions.ts
    │       ├── complaints.ts
    │       ├── carbon.ts
    │       ├── fuel.ts
    │       ├── destinations.ts
    │       ├── points.ts
    │       ├── traffic.ts
    │       ├── waste.ts
    │       ├── accessibility.ts
    │       └── tourist.ts
    ├── api-spec/                    # OpenAPI 3.0 spec
    └── api-zod/                     # Orval-generated Zod types
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| username | text | |
| replit_id | varchar | Replit OIDC subject |

### `sessions`
| Column | Type | Notes |
|---|---|---|
| sid | varchar PK | |
| sess | json | |
| expire | timestamp | |

### `events`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| title / titleAr | text | Bilingual |
| description / descriptionAr | text | |
| category | text | cultural, music, sports… |
| location / locationAr / lat / lng | | |
| startDate / endDate | timestamptz | |
| capacity / currentAttendees | int | |
| price / pointsRequired / pointsReward | int | |
| status | text | upcoming, ongoing, completed, cancelled |
| createdBy | int | FK → users |

### `event_bookings`
| Column | Type |
|---|---|
| id | serial PK |
| eventId / userId | int |
| status | text |
| bookedAt | timestamptz |

### `tours`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| title / titleAr | text | Bilingual |
| category | text | cultural, historical, food, adventure, nature |
| durationMinutes | int | |
| maxParticipants / currentParticipants | int | |
| pricePoints / pointsReward | int | |
| tourDate | timestamptz | |
| status | text | upcoming, ongoing, completed |
| guideId / guideName | | |

### `tour_bookings`
| Column | Type |
|---|---|
| id | serial PK |
| tourId / userId | int |
| pointsUsed / status | |

### `suggestions`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| title / titleAr | text | Bilingual |
| category | text | infrastructure, environment, transport… |
| upvotes / downvotes | int | |
| status | text | pending, under_review, approved, rejected |
| userId / username | | |

### `suggestion_votes`
| Column | Type |
|---|---|
| id | serial PK |
| suggestionId / userId | int |
| vote | text (up/down) |

### `complaints`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| trackingId | text UNIQUE | PLT-XXXXXX |
| title / description | text | |
| category / location | text | |
| status | text | pending, reviewing, in_progress, resolved |
| userId / username | | |

### `carbon_offsets`
| Column | Type |
|---|---|
| id | serial PK |
| userId / treesPlanted / pointsSpent | int |

### `fuel_stations`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| name / nameAr | text | |
| status | text | available, unavailable, unknown |
| queueLength / estimatedWaitMinutes / confidenceLevel | int | |
| petrolAvailable / dieselAvailable | boolean | |

### `fuel_reports`
| Column | Type |
|---|---|
| id | serial PK |
| stationId / userId | int |
| isAvailable | boolean |
| queueLength | int |
| reportedAt | timestamptz |

### `fuel_bookings`
| Column | Type |
|---|---|
| id | serial PK |
| stationId / userId | int |
| bookingCode | text UNIQUE |
| scheduledAt | timestamptz |
| status | text |

### `featured_destinations`
| Column | Type |
|---|---|
| id | serial PK |
| name / nameAr | text |
| discountPercent / bonusPoints | int |
| isActive | boolean |

### `points_transactions`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| userId | int | |
| points | int | positive = earned, negative = spent |
| type | text | earn / spend |
| category / description | text | |

### `traffic_reports`
| Column | Type |
|---|---|
| id | serial PK |
| userId / location / status | |

### `waste_reports`
| Column | Type |
|---|---|
| id | serial PK |
| userId / type / status | |

---

## API Routes

### Auth
| Method | Path | Description |
|---|---|---|
| GET | /auth/user | Current session user |
| GET | /login | Redirect → Replit OIDC |
| GET | /callback | OIDC callback |
| GET | /logout | Clear session |
| POST | /mobile-auth/token-exchange | Mobile PKCE exchange |
| POST | /mobile-auth/logout | Mobile logout |

### Dashboard
| Method | Path | Description |
|---|---|---|
| GET | /api/dashboard/summary | Aggregated city metrics |
| GET | /api/dashboard/activity-feed | Recent activity |
| GET | /api/dashboard/leaderboard | Top points earners |

### Events
| Method | Path |
|---|---|
| GET | /api/events |
| GET | /api/events/my-bookings |
| GET | /api/events/recommendations |
| GET | /api/events/:id |
| POST | /api/events |
| POST | /api/events/book |
| PUT | /api/events/:id |
| DELETE | /api/events/:id |

### Tours
| GET | /api/tours |
| GET | /api/tours/my-bookings |
| GET | /api/tours/:id |
| POST | /api/tours |
| POST | /api/tours/:id/book |

### Suggestions
| GET | /api/suggestions |
| GET | /api/suggestions/my-votes |
| GET | /api/suggestions/:id |
| POST | /api/suggestions |
| POST | /api/suggestions/:id/vote |
| PATCH | /api/suggestions/:id/status |

### Complaints
| GET | /api/complaints |
| GET | /api/complaints/all |
| GET | /api/complaints/:id |
| POST | /api/complaints |
| PATCH | /api/complaints/:id/status |

### Carbon
| GET | /api/carbon/summary |
| GET | /api/carbon/calculate |
| POST | /api/carbon/offset |

### Fuel
| GET | /api/fuel/stations |
| GET | /api/fuel/stations/:id |
| GET | /api/fuel/bookings |
| POST | /api/fuel/report |
| POST | /api/fuel/book |
| DELETE | /api/fuel/bookings/:id |

### Other
| Method | Path | Description |
|---|---|---|
| GET | /api/profile | Current user profile |
| PUT | /api/profile | Update profile |
| GET | /api/points/wallet | Points balance + history |
| POST | /api/points/redeem | Redeem points |
| GET | /api/store/heritage | Heritage store items |
| POST | /api/store/redeem | Redeem store item |
| GET | /api/tourist/spots | Tourist spots |
| GET | /api/tourist/events | Tourist events |
| GET | /api/destination | Active destination of month |
| GET | /api/destination/all | All destinations |
| POST | /api/destination | Set new destination |
| GET | /api/traffic/reports | Traffic reports |
| POST | /api/traffic/reports | Submit traffic report |
| GET | /api/waste/reports | Waste reports |
| POST | /api/waste/reports | Submit waste report |
| GET | /api/accessibility/paths | Accessible paths |
| GET | /api/accessibility/obstacles | Obstacles |
| POST | /api/accessibility/obstacles | Report obstacle |
| POST | /api/chatbot | Chatbot query |
| GET | /api/admin/stats | Admin dashboard metrics |
| GET | /healthz | Health check |

---

## Frontend Pages & Routes

| Route | File | Description |
|---|---|---|
| `/dashboard` | dashboard.tsx | Main city dashboard |
| `/traffic` | traffic.tsx | Traffic map & reports |
| `/safe-paths` | safe-paths.tsx | Accessible route finder |
| `/eco` | eco.tsx | Eco rewards + leaderboard |
| `/wallet` | wallet.tsx | Jawwal Points wallet |
| `/municipality` | municipality.tsx | Waste + obstacle reports |
| `/store` | store.tsx | Palestinian Heritage Store |
| `/events` | events.tsx | Browse & book events |
| `/events/create` | events-create.tsx | Create new event |
| `/events/:id` | event-detail.tsx | Event detail + booking |
| `/carbon` | carbon.tsx | Carbon footprint calculator |
| `/tours` | tours.tsx | Community tours browser |
| `/tours/create` | tours-create.tsx | Create tour |
| `/destination-of-month` | destination-of-month.tsx | Featured destination |
| `/suggestions` | suggestions.tsx | Citizen suggestions voting |
| `/suggestions/create` | suggestions-create.tsx | Submit suggestion |
| `/complaints` | complaints.tsx | Complaint tracking |
| `/complaints/create` | complaints-create.tsx | File complaint |
| `/fuel` | fuel.tsx | Fuel station crowdsourcing |
| `/admin/status` | admin-status.tsx | **Admin Status Dashboard** |

---

## Key Components

| Component | Purpose |
|---|---|
| `AppLayout` | Main shell with Sidebar + topbar |
| `Sidebar` | Nav with City Control / City Services / Community / Administration sections |
| `Chatbot` | Floating chat widget (all pages), bilingual, quick-reply chips |
| `useI18n()` | Returns `{ t, lang, isRtl, toggleLang }` |
| `useAuth()` | Replit OIDC auth state (from `@workspace/replit-auth-web`) |
| `useGetProfile()` | TanStack Query hook for `/api/profile` |
| `getAppUserId(req)` | Express helper: maps OIDC string sub → integer user ID (lazy create) |

---

## Integration Points

| Service | How |
|---|---|
| **Replit OIDC** | `passport-replit-oidc`, session stored in PostgreSQL `sessions` table |
| **PostgreSQL** | Replit managed DB; accessed via `DATABASE_URL` env var, Drizzle ORM |
| **Jawwal Points** | Internal points ledger (`points_transactions` table); earned by reporting, booking, planting trees |
| **Expo Go** | Mobile app scans QR for local dev; auth via PKCE token exchange with api-server |
