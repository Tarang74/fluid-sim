import { Router } from "express";
import HttpError from "../errors/HttpError";
import { CLIENTS } from "../clients/clients";

const redisRoutes = Router();

redisRoutes.get("/ping", async (_, res) => {
  try {
    const pong = await CLIENTS.redis.ping();
    res
      .status(200)
      .send({ status: "ok", message: `Hello from Redis server: ${pong}` });
  } catch (err: unknown) {
    console.error("Redis ping failed:", err);

    throw new HttpError(503, "Redis unreachable");
  }
});

export default redisRoutes;
