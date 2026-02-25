import {
  CreateSimResponseBody,
  GetSimResponseBody,
  GetSimsResponseBody,
  UpdateSimResponseBody,
} from "@tarang-and-tina/shared/dist/sim";
import { getUser } from "./cognito";
import HttpError from "../errors/HttpError";
import { CLIENTS } from "./clients";
import { SimCache } from "./simCache";
import { SimMetadata } from "@tarang-and-tina/shared/dist/domain";

export async function createSim(
  idToken: string,
  accessToken: string,
): Promise<CreateSimResponseBody> {
  const user = await getUser(idToken, accessToken);

  try {
    const metadata: SimMetadata = await CLIENTS.prisma.simMetadata.create({
      data: {
        userId: user.id,
        description: "New simulation",
        gravity: -12.0,
        targetDensity: 75.0,
        pressureMultiplier: 500.0,
        viscosityStrength: 0.03,
        smoothingRadius: 0.35,
        interactionStrength: 90.0,
        interactionRadius: 2.0,
      },
    });

    await SimCache.invalidateSimList(user.id);

    return { metadata };
  } catch (err: unknown) {
    console.error("Error creating simulation:", err);
    throw new HttpError(500, `Failed to create simulation: ${String(err)}`);
  }
}

export async function getSim(
  idToken: string,
  accessToken: string,
  simId: string,
): Promise<GetSimResponseBody> {
  const user = await getUser(idToken, accessToken);

  const cached = await SimCache.getCachedSim(simId);
  if (cached) {
    return { metadata: cached };
  }

  const metadata = await CLIENTS.prisma.simMetadata.findFirst({
    where: { id: simId, userId: user.id },
  });

  if (!metadata) {
    throw new HttpError(404, "Metadata not found");
  }

  await SimCache.cacheSim(simId, metadata);

  return { metadata };
}

export async function updateSim(
  idToken: string,
  accessToken: string,
  simId: string,
  patch: Partial<SimMetadata>,
): Promise<UpdateSimResponseBody> {
  const user = await getUser(idToken, accessToken);

  // Ensure the sim belongs to this user
  const existing = await CLIENTS.prisma.simMetadata.findFirst({
    where: { id: simId, userId: user.id },
    select: { id: true },
  });
  if (!existing) {
    throw new HttpError(404, "Metadata not found");
  }

  const allowed: Partial<SimMetadata> = {
    description: patch.description,
    gravity: patch.gravity,
    targetDensity: patch.targetDensity,
    pressureMultiplier: patch.pressureMultiplier,
    viscosityStrength: patch.viscosityStrength,
    smoothingRadius: patch.smoothingRadius,
    interactionStrength: patch.interactionStrength,
    interactionRadius: patch.interactionRadius,
  };

  const data = Object.fromEntries(
    Object.entries(allowed).filter(([, v]) => v !== undefined),
  );

  try {
    const updated = await CLIENTS.prisma.simMetadata.update({
      where: { id: simId },
      data,
    });

    await SimCache.invalidateSim(simId, user.id);

    return { metadata: updated };
  } catch (err: unknown) {
    throw new HttpError(500, `Failed to save metadata: ${String(err)}`);
  }
}

export async function deleteSim(
  idToken: string,
  accessToken: string,
  simId: string,
): Promise<void> {
  const user = await getUser(idToken, accessToken);

  const res = await CLIENTS.prisma.simMetadata.deleteMany({
    where: { id: simId, userId: user.id },
  });

  if (res.count === 0) {
    throw new HttpError(404, "Metadata not found");
  }

  await SimCache.invalidateSim(simId, user.id);
}

export async function listSims(
  idToken: string,
  accessToken: string,
): Promise<GetSimsResponseBody> {
  const user = await getUser(idToken, accessToken);

  // 1. Try cache first
  const cached = await SimCache.getCachedSimList(user.id);
  if (cached) {
    return { metadataList: cached };
  }

  // 2. Fallback to database
  const metadataList = await CLIENTS.prisma.simMetadata.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // 3. Cache the result
  await SimCache.cacheSimList(user.id, metadataList);

  return { metadataList };
}
