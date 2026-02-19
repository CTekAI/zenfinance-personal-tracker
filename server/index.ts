import "dotenv/config";
import express from "express";
import path from "path";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerCustomAuthRoutes } from "./auth";
import { registerRoutes } from "./routes";
import { registerAIRoutes } from "./ai";

const app = express();
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

(async () => {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerCustomAuthRoutes(app);
  registerRoutes(app);
  registerAIRoutes(app);

  app.listen(3001, "0.0.0.0", () => {
    console.log("API server running on port 3001");
  });
})();
