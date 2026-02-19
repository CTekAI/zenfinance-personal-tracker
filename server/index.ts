import "dotenv/config";
import express from "express";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());

(async () => {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerRoutes(app);

  app.listen(3001, "0.0.0.0", () => {
    console.log("API server running on port 3001");
  });
})();
