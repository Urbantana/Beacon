import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accessibilityPathsTable = pgTable("accessibility_paths", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pathType: text("path_type").notNull(), // wheelchair, blind_friendly, both
  waypoints: real("waypoints").array().notNull(), // flat array: [lat1, lng1, lat2, lng2, ...]
  isActive: boolean("is_active").notNull().default(true),
  surfaceType: text("surface_type").notNull().default("paved"),
  hasAudioCues: boolean("has_audio_cues").notNull().default(false),
  hasHapticMarkers: boolean("has_haptic_markers").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAccessibilityPathSchema = createInsertSchema(accessibilityPathsTable).omit({ id: true, createdAt: true });
export type InsertAccessibilityPath = z.infer<typeof insertAccessibilityPathSchema>;
export type AccessibilityPath = typeof accessibilityPathsTable.$inferSelect;

export const obstaclesTable = pgTable("obstacles", {
  id: serial("id").primaryKey(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  obstacleType: text("obstacle_type").notNull(), // pothole, barrier, parked_vehicle, construction, other
  severity: text("severity").notNull(), // low, medium, high
  isActive: boolean("is_active").notNull().default(true),
  description: text("description").notNull().default(""),
  affectsPathId: integer("affects_path_id"),
  userId: integer("user_id"),
  reporterUsername: text("reporter_username"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertObstacleSchema = createInsertSchema(obstaclesTable).omit({ id: true, createdAt: true });
export type InsertObstacle = z.infer<typeof insertObstacleSchema>;
export type Obstacle = typeof obstaclesTable.$inferSelect;
