import { pgTable, text, serial, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";

export const featuredDestinationsTable = pgTable("featured_destinations", {
  id:              serial("id").primaryKey(),
  name:            text("name").notNull(),
  nameAr:          text("name_ar").notNull().default(""),
  description:     text("description").notNull().default(""),
  descriptionAr:   text("description_ar").notNull().default(""),
  imageUrl:        text("image_url").notNull().default(""),
  location:        text("location").notNull().default(""),
  locationAr:      text("location_ar").notNull().default(""),
  lat:             real("lat").notNull().default(31.9),
  lng:             real("lng").notNull().default(35.2),
  discountPercent: integer("discount_percent").notNull().default(0),
  bonusPoints:     integer("bonus_points").notNull().default(100),
  isActive:        boolean("is_active").notNull().default(false),
  monthLabel:      text("month_label").notNull().default(""),
  monthLabelAr:    text("month_label_ar").notNull().default(""),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FeaturedDestination = typeof featuredDestinationsTable.$inferSelect;
