import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Browser session storage for Replit Auth.
 * Stores serialised session data (JSON) keyed by a random session ID.
 */
export const sessionsTable = pgTable(
  "sessions",
  {
    sid:    varchar("sid").primaryKey(),
    sess:   jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);
