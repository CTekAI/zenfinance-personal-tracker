import { pgTable, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default("USD"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const income = pgTable("income", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  source: varchar("source").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category").notNull(),
  frequency: varchar("frequency").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const outgoings = pgTable("outgoings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  description: varchar("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category").notNull(),
  date: varchar("date").notNull(),
  frequency: varchar("frequency").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savings = pgTable("savings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
  target: numeric("target", { precision: 12, scale: 2 }),
  category: varchar("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const debt = pgTable("debt", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(),
  minPayment: numeric("min_payment", { precision: 12, scale: 2 }).notNull(),
  priority: varchar("priority").notNull(),
  deadline: varchar("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wishlist = pgTable("wishlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  item: varchar("item").notNull(),
  cost: numeric("cost", { precision: 12, scale: 2 }).notNull(),
  saved: numeric("saved", { precision: 12, scale: 2 }).notNull().default("0"),
  priority: varchar("priority").notNull(),
  deadline: varchar("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
});
