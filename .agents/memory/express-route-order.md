---
name: Express route ordering
description: Specific named sub-routes must be declared before wildcard /:id routes
---

**Rule:** When defining routes like `/events/my-bookings` alongside `/events/:id`, declare the named route FIRST in the file, before the wildcard.

**Why:** Express matches routes top-to-bottom. `/events/my-bookings` matches `/:id` with id="my-bookings", causing `parseInt("my-bookings")` → NaN → 400 error.

**How to apply:** Any time a route file has both a named sub-path and a `/:id` wildcard, put all named sub-paths before the wildcard definition.

**Example fix applied:** In `events.ts`, `/events/my-bookings` was moved above `router.get("/events/:id", ...)`.
