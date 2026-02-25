import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
  deleteImage,
  getDownloadUrl,
  getUploadUrl,
  listImages,
  listRecordings,
} from "../clients/s3";
import {
  CreateSimRequestBody,
  CreateSimResponseBody,
  DeleteSimImageParams,
  DeleteSimImageResponseBody,
  DeleteSimParams,
  DeleteSimResponseBody,
  DownloadSimImageParams,
  DownloadSimImageResponseBody,
  GetSimImagesParams,
  GetSimImagesQuery,
  GetSimImagesResponseBody,
  GetSimParams,
  GetSimRecordingsParams,
  GetSimRecordingsQuery,
  GetSimRecordingsResponseBody,
  GetSimResponseBody,
  GetSimsResponseBody,
  UpdateSimParams,
  UpdateSimRequestBody,
  UpdateSimResponseBody,
  UploadSimImageParams,
  UploadSimImageRequestBody,
  UploadSimImageResponseBody,
} from "@tarang-and-tina/shared/dist/sim";

import CookieMap from "../types/CookieMap";
import HttpError from "../errors/HttpError";
import {
  createSim,
  deleteSim,
  getSim,
  listSims,
  updateSim,
} from "../clients/postgres";
import { userSessionKey } from "../clients/redis";
import Session from "../types/Session";
import { CLIENTS } from "../clients/clients";

const simRoutes = Router();

// Create simulation
simRoutes.post<"/", {}, CreateSimResponseBody, CreateSimRequestBody>(
  "/",
  jwtAuth<{}, CreateSimResponseBody, CreateSimRequestBody>,
  async (req, res) => {
    const cookies = req.cookies as CookieMap;
    if (!cookies.sessionId) {
      throw new HttpError(400, "Token cookies not found");
    }
    const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
    if (!raw) {
      throw new HttpError(400, "Could not find session tokens");
    }
    const payload = JSON.parse(raw) as Session;

    const result = await createSim(payload.idToken, payload.accessToken);
    res.status(201).json(result); // { metadata }
  },
);

// Fetch simulation metadata
simRoutes.get<"/:simId", GetSimParams, GetSimResponseBody>(
  "/:simId",
  jwtAuth<GetSimParams, GetSimResponseBody>,
  async (req, res) => {
    const cookies = req.cookies as CookieMap;
    if (!cookies.sessionId) {
      throw new HttpError(400, "Token cookies not found");
    }
    const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
    if (!raw) {
      throw new HttpError(400, "Could not find session tokens");
    }
    const payload = JSON.parse(raw) as Session;

    const { simId } = req.params;
    const result = await getSim(payload.idToken, payload.accessToken, simId);
    res.status(200).json(result); // { metadata }
  },
);

// Update simulation metadata
simRoutes.patch<
  "/:simId",
  UpdateSimParams,
  UpdateSimResponseBody,
  UpdateSimRequestBody
>("/:simId", jwtAuth, async (req, res) => {
  const cookies = req.cookies as CookieMap;
  if (!cookies.sessionId) {
    throw new HttpError(400, "Token cookies not found");
  }
  const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
  if (!raw) {
    throw new HttpError(400, "Could not find session tokens");
  }
  const payload = JSON.parse(raw) as Session;

  const { simId } = req.params;
  const { metadata } = req.body;
  const result = await updateSim(
    payload.idToken,
    payload.accessToken,
    simId,
    metadata,
  );
  res.status(201).json(result); // { metadata }
});

// Delete simulation
simRoutes.delete<"/:simId", DeleteSimParams, DeleteSimResponseBody>(
  "/:simId",
  jwtAuth<DeleteSimParams, DeleteSimResponseBody>,
  async (req, res) => {
    const cookies = req.cookies as CookieMap;
    if (!cookies.sessionId) {
      throw new HttpError(400, "Token cookies not found");
    }
    const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
    if (!raw) {
      throw new HttpError(400, "Could not find session tokens");
    }
    const payload = JSON.parse(raw) as Session;

    const { simId } = req.params;
    await deleteSim(payload.idToken, payload.accessToken, simId);
    res.status(200).json({});
  },
);

// Get all simulations
simRoutes.get<"/", {}, GetSimsResponseBody>(
  "/",
  jwtAuth<{}, GetSimsResponseBody>,
  async (req, res) => {
    const cookies = req.cookies as CookieMap;
    if (!cookies.sessionId) {
      throw new HttpError(400, "Token cookies not found");
    }
    const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
    if (!raw) {
      throw new HttpError(400, "Could not find session tokens");
    }
    const payload = JSON.parse(raw) as Session;

    const result = await listSims(payload.idToken, payload.accessToken);
    res.status(200).json(result);
  },
);

// Upload image and get URL/filename to image
simRoutes.post<
  "/:simId/images/:timestamp",
  UploadSimImageParams,
  UploadSimImageResponseBody,
  UploadSimImageRequestBody
>(
  "/:simId/images/:timestamp",
  jwtAuth<
    UploadSimImageParams,
    UploadSimImageResponseBody,
    UploadSimImageRequestBody
  >,
  async (req, res) => {
    const cookies = req.cookies as CookieMap;
    if (!cookies.sessionId) {
      throw new HttpError(400, "Token cookies not found");
    }
    const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
    if (!raw) {
      throw new HttpError(400, "Could not find session tokens");
    }
    const payload = JSON.parse(raw) as Session;

    const { simId, timestamp } = req.params;
    const { frameCount, mime } = req.body;
    const result = await getUploadUrl(
      payload.idToken,
      payload.accessToken,
      simId,
      timestamp,
      frameCount,
      mime,
    );
    res.status(201).json(result); // { filename, uploadUrl }
  },
);

// Get a presigned download URL for an image
simRoutes.get<
  "/:simId/images/:timestamp/:filename",
  DownloadSimImageParams,
  DownloadSimImageResponseBody
>(
  "/:simId/images/:timestamp/:filename",
  jwtAuth<DownloadSimImageParams, DownloadSimImageResponseBody>,
  async (req, res) => {
    const cookies = req.cookies as CookieMap;
    if (!cookies.sessionId) {
      throw new HttpError(400, "Token cookies not found");
    }
    const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
    if (!raw) {
      throw new HttpError(400, "Could not find session tokens");
    }
    const payload = JSON.parse(raw) as Session;

    const { simId, timestamp, filename } = req.params;
    const result = await getDownloadUrl(
      payload.idToken,
      payload.accessToken,
      simId,
      timestamp,
      filename,
    );
    res.status(200).json(result); // { downloadUrl }
  },
);

// Delete an image
simRoutes.delete<
  "/:simId/images/:timestamp/:filename",
  DeleteSimImageParams,
  DeleteSimImageResponseBody
>(
  "/:simId/images/:timestamp/:filename",
  jwtAuth<DeleteSimImageParams, DeleteSimImageResponseBody>,
  async (req, res) => {
    const cookies = req.cookies as CookieMap;
    if (!cookies.sessionId) {
      throw new HttpError(400, "Token cookies not found");
    }
    const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
    if (!raw) {
      throw new HttpError(400, "Could not find session tokens");
    }
    const payload = JSON.parse(raw) as Session;

    const { simId, timestamp, filename } = req.params;
    await deleteImage(
      payload.idToken,
      payload.accessToken,
      simId,
      timestamp,
      filename,
    );
    res.status(200).json({});
  },
);

// List simulation recordings
simRoutes.get<
  "/:simId/images",
  GetSimRecordingsParams,
  GetSimRecordingsResponseBody,
  {},
  GetSimRecordingsQuery
>(
  "/:simId/images",
  jwtAuth<
    GetSimRecordingsParams,
    GetSimRecordingsResponseBody,
    {},
    GetSimRecordingsQuery
  >,
  async (req, res) => {
    const cookies = req.cookies as CookieMap;
    if (!cookies.sessionId) {
      throw new HttpError(400, "Token cookies not found");
    }
    const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
    if (!raw) {
      throw new HttpError(400, "Could not find session tokens");
    }
    const payload = JSON.parse(raw) as Session;

    const { simId } = req.params;
    const limit = req.query.limit;
    const token = req.query.token;
    const result = await listRecordings(
      payload.idToken,
      payload.accessToken,
      simId,
      limit,
      token,
    );
    res.status(200).json(result); // { metadata }
  },
);

// List simulation images (paginated)
simRoutes.get<
  "/:simId/images/:timestamp",
  GetSimImagesParams,
  GetSimImagesResponseBody,
  {},
  GetSimImagesQuery
>(
  "/:simId/images/:timestamp",
  jwtAuth<GetSimImagesParams, GetSimImagesResponseBody, {}, GetSimImagesQuery>,
  async (req, res) => {
    const cookies = req.cookies as CookieMap;
    if (!cookies.sessionId) {
      throw new HttpError(400, "Token cookies not found");
    }
    const raw = await CLIENTS.redis.get(userSessionKey(cookies.sessionId));
    if (!raw) {
      throw new HttpError(400, "Could not find session tokens");
    }
    const payload = JSON.parse(raw) as Session;

    const { simId, timestamp } = req.params;
    const limit = req.query.limit;
    const token = req.query.token;
    const result = await listImages(
      payload.idToken,
      payload.accessToken,
      simId,
      timestamp,
      limit,
      token,
    );
    res.status(200).json(result); // { items, nextToken }
  },
);

export default simRoutes;
