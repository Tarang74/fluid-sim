import { Router } from "express";
import authRoutes from "./auth";
import simRoutes from "./sim";
import oauthRoutes from "./oauth";

const apiRoutes = Router();

// Mount feature routes
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/oauth", oauthRoutes);
apiRoutes.use("/sims", simRoutes);

// Server health check
apiRoutes.get("/health", (_, res) => {
  // Don't cache request
  res.set("Cache-Control", "no-store");
  res.status(200).send({ status: "ok", message: "Hello from server" });
});

export default apiRoutes;
