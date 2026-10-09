import { bigint, check, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const urls = pgTable(
  "urls",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    shortUrl: varchar("short_url", { length: 8 }).notNull().unique(),
    longUrl: text("long_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    usedCount: bigint("used_count", { mode: "number" }).notNull().default(0),
  },
  (table) => [check("urls_long_url_length_check", sql`length(${table.longUrl}) <= 2048`)],
);