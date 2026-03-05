import type { Express, RequestHandler } from "express";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

const uploadsDir = process.env.VERCEL === "1"
  ? "/tmp/uploads/avatars"
  : path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
    }
  },
});

const SALT_ROUNDS = 12;
const JWT_EXPIRY = "7d";

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET must be set");
  return secret;
}

function signToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email }, getJwtSecret(), { expiresIn: JWT_EXPIRY });
}

export const isAuthenticatedCustom: RequestHandler = (req: any, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { sub: string; email: string };
    req.user = { claims: { sub: payload.sub, email: payload.email } };
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export function setupLocalAuth(_app: Express) {
  // No-op: session setup removed, using JWT instead
}

export function registerCustomAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req, res) => {
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
        password: hashedPassword,
      }).returning();

      const token = signToken(newUser.id, newUser.email!);
      return res.json({
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          profileImageUrl: newUser.profileImageUrl,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
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

      const token = signToken(user.id, user.email!);
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  app.get("/api/auth/me", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
        updatedAt: dbUser.updatedAt,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/auth/profile", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;

      const [updated] = await db
        .update(users)
        .set({ firstName: firstName || null, lastName: lastName || null, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      if (!updated) return res.status(404).json({ message: "User not found" });

      return res.json({
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        profileImageUrl: updated.profileImageUrl,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/auth/password", isAuthenticatedCustom, async (req: any, res) => {
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
      if (!user) return res.status(404).json({ message: "User not found" });
      if (!user.password) {
        return res.status(400).json({ message: "Password change is not available for this account type" });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await db.update(users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(users.id, userId));

      return res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      return res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.post("/api/auth/profile-photo", isAuthenticatedCustom, (req: any, res) => {
    upload.single("photo")(req, res, async (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "File is too large. Maximum size is 5MB." });
        }
        return res.status(400).json({ message: err.message || "Upload failed" });
      }
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      try {
        const userId = req.user.claims.sub;
        const photoUrl = `/uploads/avatars/${req.file.filename}`;

        const [oldUser] = await db.select().from(users).where(eq(users.id, userId));
        if (oldUser?.profileImageUrl && oldUser.profileImageUrl.startsWith("/uploads/")) {
          const oldPath = path.join(process.cwd(), oldUser.profileImageUrl);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const [updated] = await db
          .update(users)
          .set({ profileImageUrl: photoUrl, updatedAt: new Date() })
          .where(eq(users.id, userId))
          .returning();

        return res.json({
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          profileImageUrl: updated.profileImageUrl,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        });
      } catch (error) {
        console.error("Photo upload error:", error);
        return res.status(500).json({ message: "Failed to save profile photo" });
      }
    });
  });

  app.put("/api/auth/currency", isAuthenticatedCustom, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currency } = req.body;
      const validCurrencies = ["USD", "GBP", "EUR", "IDR"];
      if (!currency || !validCurrencies.includes(currency)) {
        return res.status(400).json({ message: "Invalid currency" });
      }
      const [updated] = await db
        .update(users)
        .set({ currency, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      if (!updated) return res.status(404).json({ message: "User not found" });
      return res.json({ currency: updated.currency });
    } catch (error) {
      console.error("Currency update error:", error);
      return res.status(500).json({ message: "Failed to update currency" });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    // JWT is stateless — client clears the token from localStorage
    return res.json({ message: "Logged out" });
  });
}
