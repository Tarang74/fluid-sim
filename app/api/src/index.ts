import express from "express";
import apiRoutes from "./routes/api";
import redisRoutes from "./routes/redis";
import { registerMiddlewares } from "./middleware/register";
import { errorHandler } from "./middleware/errorHandler";
import { loadParameters } from "./clients/parameters";
import { loadSecrets } from "./clients/secrets";
import { loadClients } from "./clients/clients";

async function main() {
  await loadParameters();
  await loadSecrets();
  loadClients();

  const app = express();
  app.enable("strict");
  registerMiddlewares(app);

  // Routes
  app.use("/api", apiRoutes);
  app.use("/redis", redisRoutes);

  // HTTP request error handling
  app.use(errorHandler());

  // Start server
  const PORT = process.env.API_PORT_CONTAINER!;
  app.listen(PORT, () => {
    console.log(`Express server is listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
