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

setupLocalAuth(app);
registerCustomAuthRoutes(app);
registerRoutes(app);
registerAIRoutes(app);


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
