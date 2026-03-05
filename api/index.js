var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express from "express";
import path2 from "path";
import fs2 from "fs";

// server/auth.ts
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import session from "express-session";
import passport from "passport";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accounts: () => accounts,
  debt: () => debt,
  income: () => income,
  notifications: () => notifications,
  outgoings: () => outgoings,
  savings: () => savings,
  sessions: () => sessions,
  spendingLog: () => spendingLog,
  users: () => users,
  wishlist: () => wishlist
});

// shared/models/auth.ts
import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  currency: varchar("currency").default("USD")
});

// shared/models/finance.ts
import { pgTable as pgTable2, varchar as varchar2, numeric, timestamp as timestamp2, integer, boolean } from "drizzle-orm/pg-core";
import { sql as sql2 } from "drizzle-orm";
var accounts = pgTable2("accounts", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  userId: varchar2("user_id").notNull(),
  name: varchar2("name").notNull(),
  type: varchar2("type").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
  currency: varchar2("currency").notNull().default("USD"),
  createdAt: timestamp2("created_at").defaultNow()
});
var income = pgTable2("income", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  userId: varchar2("user_id").notNull(),
  source: varchar2("source").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar2("category").notNull(),
  frequency: varchar2("frequency").notNull(),
  currency: varchar2("currency").notNull().default("USD"),
  dayOfMonth: integer("day_of_month"),
  createdAt: timestamp2("created_at").defaultNow()
});
var outgoings = pgTable2("outgoings", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  userId: varchar2("user_id").notNull(),
  description: varchar2("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar2("category").notNull(),
  date: varchar2("date").notNull(),
  frequency: varchar2("frequency").notNull(),
  currency: varchar2("currency").notNull().default("USD"),
  dayOfMonth: integer("day_of_month"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  createdAt: timestamp2("created_at").defaultNow()
});
var savings = pgTable2("savings", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  userId: varchar2("user_id").notNull(),
  name: varchar2("name").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
  target: numeric("target", { precision: 12, scale: 2 }),
  category: varchar2("category").notNull(),
  currency: varchar2("currency").notNull().default("USD"),
  createdAt: timestamp2("created_at").defaultNow()
});
var debt = pgTable2("debt", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  userId: varchar2("user_id").notNull(),
  name: varchar2("name").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(),
  minPayment: numeric("min_payment", { precision: 12, scale: 2 }).notNull(),
  priority: varchar2("priority").notNull(),
  deadline: varchar2("deadline"),
  currency: varchar2("currency").notNull().default("USD"),
  createdAt: timestamp2("created_at").defaultNow()
});
var wishlist = pgTable2("wishlist", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  userId: varchar2("user_id").notNull(),
  item: varchar2("item").notNull(),
  cost: numeric("cost", { precision: 12, scale: 2 }).notNull(),
  saved: numeric("saved", { precision: 12, scale: 2 }).notNull().default("0"),
  priority: varchar2("priority").notNull(),
  deadline: varchar2("deadline"),
  currency: varchar2("currency").notNull().default("USD"),
  createdAt: timestamp2("created_at").defaultNow()
});
var spendingLog = pgTable2("spending_log", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  userId: varchar2("user_id").notNull(),
  description: varchar2("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar2("currency").notNull().default("USD"),
  category: varchar2("category").notNull(),
  date: varchar2("date").notNull(),
  createdAt: timestamp2("created_at").defaultNow()
});
var notifications = pgTable2("notifications", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  userId: varchar2("user_id").notNull(),
  type: varchar2("type").notNull(),
  title: varchar2("title").notNull(),
  message: varchar2("message").notNull(),
  read: boolean("read").notNull().default(false),
  relatedId: varchar2("related_id"),
  createdAt: timestamp2("created_at").defaultNow()
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/auth.ts
import { eq } from "drizzle-orm";
var uploadsDir = process.env.VERCEL === "1" ? "/tmp/uploads/avatars" : path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
var storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
var upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
    }
  }
});
var SALT_ROUNDS = 12;
var DrizzleSessionStore = class extends session.Store {
  constructor(ttlMs) {
    super();
    this.ttl = ttlMs;
  }
  async get(sid, cb) {
    try {
      const [row] = await db.select().from(sessions).where(eq(sessions.sid, sid));
      if (!row || row.expire < /* @__PURE__ */ new Date()) return cb(null, null);
      cb(null, row.sess);
    } catch (e) {
      console.error("[session.get]", e);
      cb(e);
    }
  }
  async set(sid, sess, cb) {
    try {
      const expire = new Date(Date.now() + this.ttl);
      await db.insert(sessions).values({ sid, sess, expire }).onConflictDoUpdate({ target: sessions.sid, set: { sess, expire } });
      cb(null);
    } catch (e) {
      console.error("[session.set]", e);
      cb(e);
    }
  }
  async destroy(sid, cb) {
    try {
      await db.delete(sessions).where(eq(sessions.sid, sid));
      cb(null);
    } catch (e) {
      console.error("[session.destroy]", e);
      cb(e);
    }
  }
  async touch(sid, sess, cb) {
    try {
      const expire = new Date(Date.now() + this.ttl);
      await db.update(sessions).set({ expire }).where(eq(sessions.sid, sid));
      cb(null);
    } catch (e) {
      console.error("[session.touch]", e);
      cb(e);
    }
  }
};
function setupLocalAuth(app2) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const sessionStore = new DrizzleSessionStore(sessionTtl);
  app2.use(
    session({
      secret: process.env.SESSION_SECRET,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: sessionTtl
      }
    })
  );
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
}
function registerCustomAuthRoutes(app2) {
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (existing.length > 0) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const [newUser] = await db.insert(users).values({
        email: email.toLowerCase(),
        password: hashedPassword
      }).returning();
      req.login(
        {
          claims: { sub: newUser.id, email: newUser.email },
          expires_at: Math.floor(Date.now() / 1e3) + 7 * 24 * 60 * 60,
          authType: "email"
        },
        (err) => {
          if (err) {
            console.error("Session creation error:", err);
            return res.status(500).json({ message: "Account created but login failed" });
          }
          return res.json({
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            profileImageUrl: newUser.profileImageUrl,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
          });
        }
      );
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.login(
        {
          claims: { sub: user.id, email: user.email },
          expires_at: Math.floor(Date.now() / 1e3) + 7 * 24 * 60 * 60,
          authType: "email"
        },
        (err) => {
          if (err) {
            console.error("Session creation error:", err);
            return res.status(500).json({ message: "Login failed. Please try again." });
          }
          return res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          });
        }
      );
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed. Please try again." });
    }
  });
  app2.get("/api/auth/me", async (req, res) => {
    const user = req.user;
    if (!req.isAuthenticated() || !user || !user.claims) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.authType === "email") {
      const now = Math.floor(Date.now() / 1e3);
      if (!user.expires_at || now > user.expires_at) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }
    try {
      const userId = user.claims.sub;
      const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
        currency: dbUser.currency || "USD",
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.put("/api/auth/profile", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;
      const [updated] = await db.update(users).set({
        firstName: firstName || null,
        lastName: lastName || null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, userId)).returning();
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        profileImageUrl: updated.profileImageUrl,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      });
    } catch (error) {
      console.error("Profile update error:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.put("/api/auth/password", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.password) {
        return res.status(400).json({ message: "Password change is not available for this account type" });
      }
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await db.update(users).set({ password: hashedPassword, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
      return res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      return res.status(500).json({ message: "Failed to change password" });
    }
  });
  app2.post("/api/auth/profile-photo", isAuthenticatedCustom, (req, res) => {
    upload.single("photo")(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "File is too large. Maximum size is 5MB." });
          }
          return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({ message: err.message || "Upload failed" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      try {
        const userId = req.user.claims.sub;
        const photoUrl = `/uploads/avatars/${req.file.filename}`;
        const [oldUser] = await db.select().from(users).where(eq(users.id, userId));
        if (oldUser?.profileImageUrl && oldUser.profileImageUrl.startsWith("/uploads/")) {
          const oldPath = path.join(process.cwd(), oldUser.profileImageUrl);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        const [updated] = await db.update(users).set({ profileImageUrl: photoUrl, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).returning();
        return res.json({
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          profileImageUrl: updated.profileImageUrl,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt
        });
      } catch (error) {
        console.error("Photo upload error:", error);
        return res.status(500).json({ message: "Failed to save profile photo" });
      }
    });
  });
  app2.put("/api/auth/currency", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currency } = req.body;
      const validCurrencies = ["USD", "GBP", "EUR", "IDR"];
      if (!currency || !validCurrencies.includes(currency)) {
        return res.status(400).json({ message: "Invalid currency" });
      }
      const [updated] = await db.update(users).set({ currency, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).returning();
      if (!updated) return res.status(404).json({ message: "User not found" });
      return res.json({ currency: updated.currency });
    } catch (error) {
      console.error("Currency update error:", error);
      return res.status(500).json({ message: "Failed to update currency" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        res.clearCookie("connect.sid");
        return res.json({ message: "Logged out" });
      });
    });
  });
}
var isAuthenticatedCustom = (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (user.expires_at && now <= user.expires_at) {
    return next();
  }
  return res.status(401).json({ message: "Session expired" });
};

// server/routes.ts
import { eq as eq2, and, desc } from "drizzle-orm";
function registerRoutes(app2) {
  const toNum = (v) => v ? parseFloat(v) : 0;
  const toNumOrUndef = (v) => v ? parseFloat(v) : void 0;
  const toIntOrNull = (v) => v != null ? v : null;
  app2.get("/api/finance", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const [incomeData, outgoingsData, savingsData, debtData, wishlistData, accountsData, spendingData] = await Promise.all([
        db.select().from(income).where(eq2(income.userId, userId)),
        db.select().from(outgoings).where(eq2(outgoings.userId, userId)),
        db.select().from(savings).where(eq2(savings.userId, userId)),
        db.select().from(debt).where(eq2(debt.userId, userId)),
        db.select().from(wishlist).where(eq2(wishlist.userId, userId)),
        db.select().from(accounts).where(eq2(accounts.userId, userId)),
        db.select().from(spendingLog).where(eq2(spendingLog.userId, userId)).orderBy(desc(spendingLog.createdAt))
      ]);
      res.json({
        income: incomeData.map((r) => ({ id: r.id, source: r.source, amount: toNum(r.amount), category: r.category, frequency: r.frequency, currency: r.currency || "USD", dayOfMonth: toIntOrNull(r.dayOfMonth) })),
        outgoings: outgoingsData.map((r) => ({ id: r.id, description: r.description, amount: toNum(r.amount), category: r.category, date: r.date, frequency: r.frequency, currency: r.currency || "USD", dayOfMonth: toIntOrNull(r.dayOfMonth), isRecurring: r.isRecurring ?? false })),
        savings: savingsData.map((r) => ({ id: r.id, name: r.name, balance: toNum(r.balance), target: toNumOrUndef(r.target), category: r.category, currency: r.currency || "USD" })),
        debt: debtData.map((r) => ({ id: r.id, name: r.name, balance: toNum(r.balance), interestRate: toNum(r.interestRate), minPayment: toNum(r.minPayment), priority: r.priority, deadline: r.deadline || void 0, currency: r.currency || "USD" })),
        wishlist: wishlistData.map((r) => ({ id: r.id, item: r.item, cost: toNum(r.cost), saved: toNum(r.saved), priority: r.priority, deadline: r.deadline || void 0, currency: r.currency || "USD" })),
        accounts: accountsData.map((r) => ({ id: r.id, name: r.name, type: r.type, balance: toNum(r.balance), currency: r.currency })),
        spendingLog: spendingData.map((r) => ({ id: r.id, description: r.description, amount: toNum(r.amount), currency: r.currency || "USD", category: r.category, date: r.date }))
      });
    } catch (error) {
      console.error("Error fetching finance data:", error);
      res.status(500).json({ message: "Failed to fetch finance data" });
    }
  });
  app2.post("/api/finance/income", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { source, amount, category, frequency, currency, dayOfMonth } = req.body;
      const [row] = await db.insert(income).values({
        userId,
        source,
        amount: String(amount),
        category,
        frequency,
        currency: currency || "USD",
        dayOfMonth: dayOfMonth || null
      }).returning();
      res.json({ id: row.id, source: row.source, amount: parseFloat(row.amount), category: row.category, frequency: row.frequency, currency: row.currency || "USD", dayOfMonth: toIntOrNull(row.dayOfMonth) });
    } catch (error) {
      console.error("Error adding income:", error);
      res.status(500).json({ message: "Failed to add income" });
    }
  });
  app2.put("/api/finance/income/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { source, amount, category, frequency, currency, dayOfMonth } = req.body;
      const [row] = await db.update(income).set({
        source,
        amount: String(amount),
        category,
        frequency,
        currency: currency || "USD",
        dayOfMonth: dayOfMonth || null
      }).where(and(eq2(income.id, req.params.id), eq2(income.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, source: row.source, amount: parseFloat(row.amount), category: row.category, frequency: row.frequency, currency: row.currency || "USD", dayOfMonth: toIntOrNull(row.dayOfMonth) });
    } catch (error) {
      console.error("Error updating income:", error);
      res.status(500).json({ message: "Failed to update income" });
    }
  });
  app2.delete("/api/finance/income/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(income).where(and(eq2(income.id, req.params.id), eq2(income.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting income:", error);
      res.status(500).json({ message: "Failed to delete income" });
    }
  });
  app2.post("/api/finance/outgoings", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { description, amount, category, date, frequency, currency, dayOfMonth, isRecurring } = req.body;
      const [row] = await db.insert(outgoings).values({
        userId,
        description,
        amount: String(amount),
        category,
        date,
        frequency,
        currency: currency || "USD",
        dayOfMonth: dayOfMonth || null,
        isRecurring: isRecurring ?? false
      }).returning();
      res.json({ id: row.id, description: row.description, amount: parseFloat(row.amount), category: row.category, date: row.date, frequency: row.frequency, currency: row.currency || "USD", dayOfMonth: toIntOrNull(row.dayOfMonth), isRecurring: row.isRecurring ?? false });
    } catch (error) {
      console.error("Error adding outgoing:", error);
      res.status(500).json({ message: "Failed to add expense" });
    }
  });
  app2.put("/api/finance/outgoings/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { description, amount, category, date, frequency, currency, dayOfMonth, isRecurring } = req.body;
      const [row] = await db.update(outgoings).set({
        description,
        amount: String(amount),
        category,
        date,
        frequency,
        currency: currency || "USD",
        dayOfMonth: dayOfMonth || null,
        isRecurring: isRecurring ?? false
      }).where(and(eq2(outgoings.id, req.params.id), eq2(outgoings.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, description: row.description, amount: parseFloat(row.amount), category: row.category, date: row.date, frequency: row.frequency, currency: row.currency || "USD", dayOfMonth: toIntOrNull(row.dayOfMonth), isRecurring: row.isRecurring ?? false });
    } catch (error) {
      console.error("Error updating outgoing:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });
  app2.delete("/api/finance/outgoings/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(outgoings).where(and(eq2(outgoings.id, req.params.id), eq2(outgoings.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting outgoing:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });
  app2.post("/api/finance/savings", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, balance, target, category, currency } = req.body;
      const [row] = await db.insert(savings).values({
        userId,
        name,
        balance: String(balance),
        target: target != null ? String(target) : null,
        category,
        currency: currency || "USD"
      }).returning();
      res.json({ id: row.id, name: row.name, balance: parseFloat(row.balance), target: row.target ? parseFloat(row.target) : void 0, category: row.category, currency: row.currency || "USD" });
    } catch (error) {
      console.error("Error adding savings:", error);
      res.status(500).json({ message: "Failed to add savings" });
    }
  });
  app2.put("/api/finance/savings/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, balance, target, category, currency } = req.body;
      const [row] = await db.update(savings).set({
        name,
        balance: String(balance),
        target: target != null ? String(target) : null,
        category,
        currency: currency || "USD"
      }).where(and(eq2(savings.id, req.params.id), eq2(savings.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, name: row.name, balance: parseFloat(row.balance), target: row.target ? parseFloat(row.target) : void 0, category: row.category, currency: row.currency || "USD" });
    } catch (error) {
      console.error("Error updating savings:", error);
      res.status(500).json({ message: "Failed to update savings" });
    }
  });
  app2.delete("/api/finance/savings/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(savings).where(and(eq2(savings.id, req.params.id), eq2(savings.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting savings:", error);
      res.status(500).json({ message: "Failed to delete savings" });
    }
  });
  app2.post("/api/finance/debt", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, balance, interestRate, minPayment, priority, deadline, currency } = req.body;
      const [row] = await db.insert(debt).values({
        userId,
        name,
        balance: String(balance),
        interestRate: String(interestRate),
        minPayment: String(minPayment),
        priority,
        deadline: deadline || null,
        currency: currency || "USD"
      }).returning();
      res.json({ id: row.id, name: row.name, balance: parseFloat(row.balance), interestRate: parseFloat(row.interestRate), minPayment: parseFloat(row.minPayment), priority: row.priority, deadline: row.deadline || void 0, currency: row.currency || "USD" });
    } catch (error) {
      console.error("Error adding debt:", error);
      res.status(500).json({ message: "Failed to add debt" });
    }
  });
  app2.put("/api/finance/debt/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, balance, interestRate, minPayment, priority, deadline, currency } = req.body;
      const [row] = await db.update(debt).set({
        name,
        balance: String(balance),
        interestRate: String(interestRate),
        minPayment: String(minPayment),
        priority,
        deadline: deadline || null,
        currency: currency || "USD"
      }).where(and(eq2(debt.id, req.params.id), eq2(debt.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, name: row.name, balance: parseFloat(row.balance), interestRate: parseFloat(row.interestRate), minPayment: parseFloat(row.minPayment), priority: row.priority, deadline: row.deadline || void 0, currency: row.currency || "USD" });
    } catch (error) {
      console.error("Error updating debt:", error);
      res.status(500).json({ message: "Failed to update debt" });
    }
  });
  app2.delete("/api/finance/debt/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(debt).where(and(eq2(debt.id, req.params.id), eq2(debt.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting debt:", error);
      res.status(500).json({ message: "Failed to delete debt" });
    }
  });
  app2.post("/api/finance/wishlist", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { item, cost, saved, priority, deadline, currency } = req.body;
      const [row] = await db.insert(wishlist).values({
        userId,
        item,
        cost: String(cost),
        saved: String(saved || 0),
        priority,
        deadline: deadline || null,
        currency: currency || "USD"
      }).returning();
      res.json({ id: row.id, item: row.item, cost: parseFloat(row.cost), saved: parseFloat(row.saved), priority: row.priority, deadline: row.deadline || void 0, currency: row.currency || "USD" });
    } catch (error) {
      console.error("Error adding wishlist item:", error);
      res.status(500).json({ message: "Failed to add wishlist item" });
    }
  });
  app2.put("/api/finance/wishlist/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { item, cost, saved, priority, deadline, currency } = req.body;
      const [row] = await db.update(wishlist).set({
        item,
        cost: String(cost),
        saved: String(saved || 0),
        priority,
        deadline: deadline || null,
        currency: currency || "USD"
      }).where(and(eq2(wishlist.id, req.params.id), eq2(wishlist.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, item: row.item, cost: parseFloat(row.cost), saved: parseFloat(row.saved), priority: row.priority, deadline: row.deadline || void 0, currency: row.currency || "USD" });
    } catch (error) {
      console.error("Error updating wishlist item:", error);
      res.status(500).json({ message: "Failed to update wishlist item" });
    }
  });
  app2.delete("/api/finance/wishlist/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(wishlist).where(and(eq2(wishlist.id, req.params.id), eq2(wishlist.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      res.status(500).json({ message: "Failed to delete wishlist item" });
    }
  });
  app2.post("/api/finance/accounts", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, type, balance, currency } = req.body;
      const [row] = await db.insert(accounts).values({
        userId,
        name,
        type,
        balance: String(balance),
        currency: currency || "USD"
      }).returning();
      res.json({ id: row.id, name: row.name, type: row.type, balance: parseFloat(row.balance), currency: row.currency });
    } catch (error) {
      console.error("Error adding account:", error);
      res.status(500).json({ message: "Failed to add account" });
    }
  });
  app2.put("/api/finance/accounts/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, type, balance, currency } = req.body;
      const [row] = await db.update(accounts).set({
        name,
        type,
        balance: String(balance),
        currency: currency || "USD"
      }).where(and(eq2(accounts.id, req.params.id), eq2(accounts.userId, userId))).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ id: row.id, name: row.name, type: row.type, balance: parseFloat(row.balance), currency: row.currency });
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ message: "Failed to update account" });
    }
  });
  app2.delete("/api/finance/accounts/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(accounts).where(and(eq2(accounts.id, req.params.id), eq2(accounts.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
  app2.post("/api/finance/spending", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { description, amount, currency, category, date } = req.body;
      const [row] = await db.insert(spendingLog).values({
        userId,
        description,
        amount: String(amount),
        currency: currency || "USD",
        category,
        date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      }).returning();
      res.json({ id: row.id, description: row.description, amount: parseFloat(row.amount), currency: row.currency || "USD", category: row.category, date: row.date });
    } catch (error) {
      console.error("Error adding spending:", error);
      res.status(500).json({ message: "Failed to add spending entry" });
    }
  });
  app2.delete("/api/finance/spending/:id", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.delete(spendingLog).where(and(eq2(spendingLog.id, req.params.id), eq2(spendingLog.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting spending:", error);
      res.status(500).json({ message: "Failed to delete spending entry" });
    }
  });
  app2.get("/api/notifications", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const upcoming = await db.select().from(outgoings).where(and(eq2(outgoings.userId, userId), eq2(outgoings.isRecurring, true)));
      const today = /* @__PURE__ */ new Date();
      const currentDay = today.getDate();
      for (const expense of upcoming) {
        if (expense.dayOfMonth) {
          let daysUntil = expense.dayOfMonth - currentDay;
          if (daysUntil < 0) daysUntil += 30;
          if (daysUntil <= 3 && daysUntil >= 0) {
            const existing = await db.select().from(notifications).where(
              and(eq2(notifications.userId, userId), eq2(notifications.relatedId, expense.id), eq2(notifications.type, "bill_due"))
            );
            const recentExists = existing.some((n) => {
              const created = new Date(n.createdAt);
              return today.getTime() - created.getTime() < 24 * 60 * 60 * 1e3;
            });
            if (!recentExists) {
              await db.insert(notifications).values({
                userId,
                type: "bill_due",
                title: `${expense.description} due soon`,
                message: `Your ${expense.description} payment of ${expense.amount} is due on day ${expense.dayOfMonth} of this month.`,
                relatedId: expense.id
              });
            }
          }
        }
      }
      const savingsData = await db.select().from(savings).where(eq2(savings.userId, userId));
      for (const s of savingsData) {
        if (s.target) {
          const balance = parseFloat(s.balance);
          const target = parseFloat(s.target);
          const pct = balance / target * 100;
          const milestones = [25, 50, 75, 100];
          for (const m of milestones) {
            if (pct >= m) {
              const existing = await db.select().from(notifications).where(
                and(eq2(notifications.userId, userId), eq2(notifications.relatedId, s.id), eq2(notifications.type, `savings_${m}`))
              );
              if (existing.length === 0) {
                await db.insert(notifications).values({
                  userId,
                  type: `savings_${m}`,
                  title: `${s.name} hit ${m}%!`,
                  message: `Your ${s.name} savings has reached ${m}% of its target. ${m === 100 ? "Congratulations!" : "Keep going!"}`,
                  relatedId: s.id
                });
              }
            }
          }
        }
      }
      const notifs = await db.select().from(notifications).where(eq2(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
      res.json(notifs.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        relatedId: n.relatedId,
        createdAt: n.createdAt?.toISOString() || (/* @__PURE__ */ new Date()).toISOString()
      })));
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app2.put("/api/notifications/:id/read", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.update(notifications).set({ read: true }).where(and(eq2(notifications.id, req.params.id), eq2(notifications.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  app2.post("/api/notifications/mark-all-read", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.update(notifications).set({ read: true }).where(and(eq2(notifications.userId, userId), eq2(notifications.read, false)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });
  app2.post("/api/finance/accounts/:id/deduct", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      const [account] = await db.select().from(accounts).where(and(eq2(accounts.id, req.params.id), eq2(accounts.userId, userId)));
      if (!account) return res.status(404).json({ message: "Account not found" });
      const newBalance = parseFloat(account.balance) - parseFloat(String(amount));
      const [row] = await db.update(accounts).set({ balance: String(newBalance) }).where(eq2(accounts.id, req.params.id)).returning();
      res.json({ id: row.id, name: row.name, type: row.type, balance: parseFloat(row.balance), currency: row.currency });
    } catch (error) {
      console.error("Error deducting from account:", error);
      res.status(500).json({ message: "Failed to deduct from account" });
    }
  });
}

// server/ai.ts
import { eq as eq3 } from "drizzle-orm";
import OpenAI from "openai";
var openaiClient = null;
function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}
async function getFinancialSnapshot(userId) {
  const toNum = (v) => {
    if (v == null) return 0;
    const n = typeof v === "number" ? v : parseFloat(v);
    return isNaN(n) ? 0 : n;
  };
  const [incomeData, outgoingsData, savingsData, debtData, wishlistData, spendingData, accountsData] = await Promise.all([
    db.select().from(income).where(eq3(income.userId, userId)),
    db.select().from(outgoings).where(eq3(outgoings.userId, userId)),
    db.select().from(savings).where(eq3(savings.userId, userId)),
    db.select().from(debt).where(eq3(debt.userId, userId)),
    db.select().from(wishlist).where(eq3(wishlist.userId, userId)),
    db.select().from(spendingLog).where(eq3(spendingLog.userId, userId)),
    db.select().from(accounts).where(eq3(accounts.userId, userId))
  ]);
  const allCurrencies = /* @__PURE__ */ new Set();
  incomeData.forEach((r) => allCurrencies.add(r.currency || "USD"));
  outgoingsData.forEach((r) => allCurrencies.add(r.currency || "USD"));
  savingsData.forEach((r) => allCurrencies.add(r.currency || "USD"));
  debtData.forEach((r) => allCurrencies.add(r.currency || "USD"));
  wishlistData.forEach((r) => allCurrencies.add(r.currency || "USD"));
  spendingData.forEach((r) => allCurrencies.add(r.currency || "USD"));
  accountsData.forEach((r) => allCurrencies.add(r.currency || "USD"));
  const accountBalancesByCurrency = {};
  accountsData.forEach((r) => {
    const cur = r.currency || "USD";
    if (!accountBalancesByCurrency[cur]) {
      accountBalancesByCurrency[cur] = { accounts: [], total: 0 };
    }
    const bal = toNum(r.balance);
    accountBalancesByCurrency[cur].accounts.push({ name: r.name, type: r.type, balance: bal });
    accountBalancesByCurrency[cur].total += bal;
  });
  const now = /* @__PURE__ */ new Date();
  const currentDay = now.getDate();
  const upcomingExpenses = outgoingsData.filter((r) => r.isRecurring && r.dayOfMonth).map((r) => {
    const day = r.dayOfMonth;
    const daysUntil = day >= currentDay ? day - currentDay : 30 - currentDay + day;
    return {
      description: r.description,
      amount: toNum(r.amount),
      currency: r.currency || "USD",
      category: r.category,
      dayOfMonth: day,
      daysUntilDue: daysUntil
    };
  }).sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  const spendingByCategory = {};
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
  spendingData.forEach((r) => {
    const d = new Date(r.date);
    if (d >= last30Days) {
      const key = `${r.category}|${r.currency || "USD"}`;
      if (!spendingByCategory[key]) {
        spendingByCategory[key] = { total: 0, count: 0, currency: r.currency || "USD" };
      }
      spendingByCategory[key].total += toNum(r.amount);
      spendingByCategory[key].count += 1;
    }
  });
  const spendingPatterns = Object.entries(spendingByCategory).map(([key, val]) => {
    const category = key.split("|")[0];
    return { category, currency: val.currency, totalSpent: val.total, transactionCount: val.count };
  });
  return {
    currencies: Array.from(allCurrencies),
    income: incomeData.map((r) => ({
      source: r.source,
      amount: toNum(r.amount),
      category: r.category,
      frequency: r.frequency,
      currency: r.currency || "USD",
      dayOfMonth: r.dayOfMonth || void 0
    })),
    expenses: outgoingsData.map((r) => ({
      description: r.description,
      amount: toNum(r.amount),
      category: r.category,
      frequency: r.frequency,
      currency: r.currency || "USD",
      dayOfMonth: r.dayOfMonth || void 0,
      isRecurring: r.isRecurring
    })),
    debts: debtData.map((r) => ({
      name: r.name,
      balance: toNum(r.balance),
      interestRate: toNum(r.interestRate),
      minPayment: toNum(r.minPayment),
      priority: r.priority,
      deadline: r.deadline || void 0,
      currency: r.currency || "USD"
    })),
    savings: savingsData.map((r) => ({
      name: r.name,
      balance: toNum(r.balance),
      target: r.target ? parseFloat(r.target) : void 0,
      category: r.category,
      currency: r.currency || "USD"
    })),
    wishlist: wishlistData.map((r) => ({
      item: r.item,
      cost: toNum(r.cost),
      saved: toNum(r.saved),
      priority: r.priority,
      deadline: r.deadline || void 0,
      currency: r.currency || "USD"
    })),
    recentSpending: spendingData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50).map((r) => ({
      description: r.description,
      amount: toNum(r.amount),
      currency: r.currency || "USD",
      category: r.category,
      date: r.date
    })),
    spendingPatterns,
    upcomingExpenses,
    accountBalancesByCurrency
  };
}
function registerAIRoutes(app2) {
  app2.post("/api/ai/advice", isAuthenticatedCustom, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { question } = req.body;
      if (!question || typeof question !== "string") {
        return res.status(400).json({ ok: false, error: "A question is required." });
      }
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ ok: false, error: "OpenAI API key is not configured." });
      }
      const snapshot = await getFinancialSnapshot(userId);
      const currencyList = snapshot.currencies.join(", ");
      const systemPrompt = `You are ZenAdvisor, a safe, friendly financial coach.
Your job is to help everyday people take control of their money.
Rules:
- Only give general guidance, never regulated financial advice.
- The user works with the following currencies: ${currencyList}. Always use the correct currency code/symbol for each amount based on the data (e.g. GBP 500, IDR 3,000,000, USD 1,200). Never assume a single currency \u2014 always match the currency to each specific item.
- Be encouraging but realistic.
- ONLY base your advice on the financial data provided below. Do NOT assume or invent any figures.
- When relevant, reference upcoming due dates for recurring expenses (the data includes dayOfMonth and daysUntilDue). Warn about bills coming due soon.
- Analyze spending patterns from the daily spending log. If a category has high spending (e.g. lots of coffee or entertainment purchases), suggest specific cutbacks.
- Reference debt priorities (High/Medium/Low) when advising on debt repayment strategy.
- Reference wishlist deadlines and progress when advising on savings goals.
- Consider account balances per currency when assessing the user's financial position.
- Understand multi-currency context \u2014 do not mix or convert currencies unless the user asks.
- Always respond with valid JSON in this exact format:
  { "summary": "<one-paragraph overview>", "steps": ["<step 1>", "<step 2>", ...] }
- The summary should directly address the user's question.
- Provide 3-6 concrete, actionable steps.
- Do NOT include any text outside the JSON object.`;
      const userMessage = `Here is my financial snapshot:
${JSON.stringify(snapshot, null, 2)}

My question: ${question}`;
      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1024,
        temperature: 0.7
      });
      const raw = response.choices[0]?.message?.content;
      if (!raw) {
        console.error("AI advice: empty response from OpenAI", JSON.stringify(response.choices));
        return res.status(500).json({ ok: false, error: "No response from AI. Please try again." });
      }
      let advice;
      try {
        advice = JSON.parse(raw);
      } catch (parseErr) {
        console.error("AI advice: failed to parse JSON response:", raw);
        return res.status(500).json({ ok: false, error: "AI returned an unexpected format. Please try again." });
      }
      return res.json({ ok: true, advice });
    } catch (error) {
      console.error("AI advice error:", error?.message || error);
      let message = "Failed to get AI advice. Please try again.";
      if (error?.status === 401) {
        message = "Invalid OpenAI API key. Please check your key in settings.";
      } else if (error?.status === 429) {
        message = "Rate limit reached. Please wait a moment and try again.";
      } else if (error?.status === 404) {
        message = "AI model not available. Please check your OpenAI account.";
      }
      return res.status(500).json({ ok: false, error: message });
    }
  });
}

// server/index.ts
var app = express();
app.use(express.json());
app.use("/uploads", express.static(path2.join(process.cwd(), "uploads")));
setupLocalAuth(app);
registerCustomAuthRoutes(app);
registerRoutes(app);
registerAIRoutes(app);
app.get("/api/session-test", (req, res) => {
  req.session.testVal = (req.session.testVal || 0) + 1;
  req.session.save((err) => {
    res.json({ sessionId: req.sessionID, testVal: req.session.testVal, saveErr: err?.message || null });
  });
});
var isProd = process.env.NODE_ENV === "production";
var port = isProd ? 5e3 : 3001;
if (isProd && process.env.VERCEL !== "1") {
  const distPath = path2.join(process.cwd(), "dist");
  if (fs2.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
}
if (process.env.VERCEL !== "1") {
  app.listen(port, "0.0.0.0", () => {
    console.log(`API server running on port ${port}`);
  });
}
var server_default = app;

// api/_src.ts
var src_default = server_default;
export {
  src_default as default
};
