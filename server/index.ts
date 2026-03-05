import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { registerCustomAuthRoutes, setupLocalAuth } from "./auth";
import { registerRoutes } from "./routes";
import { registerAIRoutes } from "./ai";

const app = express();
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Debug endpoint — remove after deployment is stable
app.get("/api/debug", (_req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    HAS_SESSION_SECRET: !!process.env.SESSION_SECRET,
    HAS_OPENAI_KEY: !!process.env.OPENAI_API_KEY,
  });
});

let initError: Error | null = null;
try {
  setupLocalAuth(app);
  registerCustomAuthRoutes(app);
  registerRoutes(app);
  registerAIRoutes(app);
} catch (e: any) {
  initError = e;
  console.error("App initialization error:", e);
}

app.use((req: any, res: any, next: any) => {
  if (initError) return res.status(500).json({ error: "Init failed", message: initError.message, stack: initError.stack });
  next();
});

const isProd = process.env.NODE_ENV === "production";
const port = isProd ? 5000 : 3001;

if (isProd && process.env.VERCEL !== "1") {
  const distPath = path.join(process.cwd(), "dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

if (process.env.VERCEL !== "1") {
  app.listen(port, "0.0.0.0", () => {
    console.log(`API server running on port ${port}`);
  });
}

export default app;
