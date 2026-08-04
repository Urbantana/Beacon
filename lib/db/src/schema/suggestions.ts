import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";

export const suggestionsTable = pgTable("suggestions", {
  id:            serial("id").primaryKey(),
  title:         text("title").notNull(),
  titleAr:       text("title_ar").notNull().default(""),
  description:   text("description").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  // infrastructure | environment | transport | tourism | public_services | other
  category:      text("category").notNull().default("other"),
  location:      text("location").notNull().default(""),
  lat:           real("lat"),
  lng:           real("lng"),
  userId:        integer("user_id").notNull(),
  username:      text("username").notNull().default("Citizen"),
  upvotes:       integer("upvotes").notNull().default(0),
  downvotes:     integer("downvotes").notNull().default(0),
  // pending | under_review | approved | rejected | implemented
  status:        text("status").notNull().default("pending"),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Suggestion = typeof suggestionsTable.$inferSelect;

export const suggestionVotesTable = pgTable("suggestion_votes", {
  id:           serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").notNull(),
  userId:       integer("user_id").notNull(),
  // up | down
  vote:         text("vote").notNull(),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SuggestionVote = typeof suggestionVotesTable.$inferSelect;
