import { CLIENTS } from "./clients";
import { userSimsKey, simMetadataKey } from "./redis";
import type { SimMetadata } from "@tarang-and-tina/shared/dist/domain";

export class SimCache {
  private static METADATA_TTL = 900; // 15 minutes
  private static LIST_TTL = 300; // 5 minutes

  // Cache simulation metadata
  static async cacheSim(simId: string, metadata: SimMetadata): Promise<void> {
    try {
      const key = simMetadataKey(simId);
      await CLIENTS.redis.setex(
        key,
        this.METADATA_TTL,
        JSON.stringify(metadata),
      );
    } catch (error) {
      console.error("Failed to cache sim metadata:", error);
    }
  }

  // Get cached simulation metadata
  static async getCachedSim(simId: string): Promise<SimMetadata | null> {
    try {
      const key = simMetadataKey(simId);
      const cached = await CLIENTS.redis.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as SimMetadata;
    } catch (error) {
      console.error("Failed to get cached sim metadata:", error);
      return null;
    }
  }

  // Cache user simulation list
  static async cacheSimList(
    userId: string,
    sims: SimMetadata[],
  ): Promise<void> {
    try {
      const key = userSimsKey(userId);
      await CLIENTS.redis.setex(key, this.LIST_TTL, JSON.stringify(sims));
    } catch (error) {
      console.error("Failed to cache user sims:", error);
    }
  }

  // Get cached user simulation list
  static async getCachedSimList(userId: string): Promise<SimMetadata[] | null> {
    try {
      const key = userSimsKey(userId);
      const cached = await CLIENTS.redis.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as SimMetadata[];
    } catch (error) {
      console.error("Failed to get cached user sims:", error);
      return null;
    }
  }

  // Invalidate simulation cache entries
  static async invalidateSim(simId: string, userId: string): Promise<void> {
    try {
      const simkey = simMetadataKey(simId);
      await CLIENTS.redis.del(simkey);

      const userKey = userSimsKey(userId);
      await CLIENTS.redis.del(userKey);
    } catch (error) {
      console.error("Failed to invalidate sim cache:", error);
    }
  }

  static async invalidateSimList(userId: string): Promise<void> {
    try {
      const key = userSimsKey(userId);
      await CLIENTS.redis.del(key);
    } catch (error) {
      console.error("Failed to invalidate user sims cache:", error);
    }
  }
}
