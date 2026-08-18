import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  bio: text("bio").notNull().default(""),
  skills: text("skills").notNull().default(""),
  portfolioUrl: text("portfolio_url").notNull().default(""),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, table => [uniqueIndex("profiles_email_unique").on(table.email)]);

export const offers = sqliteTable("offers", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  description: text("description").notNull(),
  platforms: text("platforms").notNull(),
  budgetCents: integer("budget_cents").notNull(),
  cpmCents: integer("cpm_cents").notNull().default(0),
  status: text("status").notNull().default("open"),
  createdAt: integer("created_at").notNull(),
}, table => [index("offers_status_created_idx").on(table.status, table.createdAt)]);

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  offerId: text("offer_id").notNull(),
  clipperEmail: text("clipper_email").notNull(),
  message: text("message").notNull(),
  portfolioUrl: text("portfolio_url").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at").notNull(),
}, table => [uniqueIndex("applications_offer_clipper_unique").on(table.offerId, table.clipperEmail),index("applications_offer_idx").on(table.offerId)]);
