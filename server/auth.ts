import type { Express, RequestHandler } from "express";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 12;

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

      (req as any).login(
        {
          claims: { sub: newUser.id, email: newUser.email },
          expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
          authType: "email",
        },
        (err: any) => {
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
            updatedAt: newUser.updatedAt,
          });
        }
      );
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

      (req as any).login(
        {
          claims: { sub: user.id, email: user.email },
          expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
          authType: "email",
        },
        (err: any) => {
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
            updatedAt: user.updatedAt,
          });
        }
      );
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const user = req.user as any;
    if (!req.isAuthenticated() || !user || !user.claims) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.authType === "email") {
      const now = Math.floor(Date.now() / 1000);
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
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
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

export const isAuthenticatedCustom: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (user.authType === "email") {
    const now = Math.floor(Date.now() / 1000);
    if (user.expires_at && now <= user.expires_at) {
      return next();
    }
    return res.status(401).json({ message: "Session expired" });
  }

  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const client = await import("openid-client");
    const config = await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    user.claims = tokenResponse.claims();
    user.access_token = tokenResponse.access_token;
    user.refresh_token = tokenResponse.refresh_token;
    user.expires_at = user.claims?.exp;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
