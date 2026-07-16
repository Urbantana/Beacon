import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pointsTransactionsTable = pgTable("points_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // earn, spend
  points: integer("points").notNull(),
  category: text("category").notNull(), // traffic, waste, accessibility, tourism, redemption
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPointsTransactionSchema = createInsertSchema(pointsTransactionsTable).omit({ id: true, createdAt: true });
export type InsertPointsTransaction = z.infer<typeof insertPointsTransactionSchema>;
export type PointsTransaction = typeof pointsTransactionsTable.$inferSelect;

export const rewardsTable = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pointsCost: integer("points_cost").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  isAvailable: integer("is_available").notNull().default(1), // 1 = true, 0 = false
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRewardSchema = createInsertSchema(rewardsTable).omit({ id: true, createdAt: true });
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewardsTable.$inferSelect;

export const activityFeedTable = pgTable("activity_feed", {
  id: serial("id").primaryKey(),
  module: text("module").notNull(), // traffic, waste, accessibility, tourism, points
  action: text("action").notNull(),
  description: text("description").notNull(),
  points: integer("points"),
  username: text("username"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActivityFeedSchema = createInsertSchema(activityFeedTable).omit({ id: true, createdAt: true });
export type InsertActivityFeed = z.infer<typeof insertActivityFeedSchema>;
export type ActivityFeed = typeof activityFeedTable.$inferSelect;
