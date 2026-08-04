import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const carbonOffsetsTable = pgTable("carbon_offsets", {
  id:           serial("id").primaryKey(),
  userId:       integer("user_id").notNull(),
  treesPlanted: integer("trees_planted").notNull().default(1),
  pointsSpent:  integer("points_spent").notNull().default(0),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CarbonOffset = typeof carbonOffsetsTable.$inferSelect;
