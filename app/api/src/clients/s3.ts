import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import HttpError from "../errors/HttpError";
import { SimImage, SimRecording } from "@tarang-and-tina/shared/dist/domain";
import {
  DeleteSimImageResponseBody,
  DownloadSimImageResponseBody,
  GetSimImagesResponseBody,
  GetSimRecordingsResponseBody,
  UploadSimImageResponseBody,
} from "@tarang-and-tina/shared/dist/sim";

import { getUser } from "./cognito";
import { PARAMETERS } from "../clients/parameters";
import { CLIENTS } from "./clients";

const PREFIX = (userId: string) => `users/${userId}/simulations/`;
const SIM_PREFIX = (userId: string, simId: string) =>
  `${PREFIX(userId)}${simId}/`;
const SIM_IMAGE_PREFIX = (userId: string, simId: string, timestamp: string) =>
  `${SIM_PREFIX(userId, simId)}${timestamp}/`;

export async function getUploadUrl(
  idToken: string,
  accessToken: string,
  simId: string,
  timestamp: string,
  frameCount: number,
  mime: string,
): Promise<UploadSimImageResponseBody> {
  const user = await getUser(idToken, accessToken);
  const filename = `${simId}-${timestamp}-${String(frameCount).padStart(
    5,
    "0",
  )}.png`;
  const key = `${SIM_IMAGE_PREFIX(user.id, simId, timestamp)}${filename}`;

  try {
    const command = new PutObjectCommand({
      Bucket: PARAMETERS.S3_RENDER_BUCKET,
      Key: key,
      ContentType: mime,
    });

    return {
      filename,
      uploadUrl: await getSignedUrl(CLIENTS.s3, command, { expiresIn: 3600 }),
    };
  } catch {
    throw new HttpError(500, "Failed to create upload URL");
  }
}

export async function getDownloadUrl(
  idToken: string,
  accessToken: string,
  simId: string,
  timestamp: string,
  filename: string,
): Promise<DownloadSimImageResponseBody> {
  const user = await getUser(idToken, accessToken);
  const key = `${SIM_IMAGE_PREFIX(user.id, simId, timestamp)}${filename}`;

  try {
    const command = new GetObjectCommand({
      Bucket: PARAMETERS.S3_RENDER_BUCKET,
      Key: key,
    });
    return {
      downloadUrl: await getSignedUrl(CLIENTS.s3, command, {
        expiresIn: 3600,
      }),
    };
  } catch {
    throw new HttpError(500, "Failed to create download URL");
  }
}

export async function listRecordings(
  idToken: string,
  accessToken: string,
  simId: string,
  limit: number,
  continuationToken?: string,
): Promise<GetSimRecordingsResponseBody> {
  const user = await getUser(idToken, accessToken);
  const prefix = SIM_PREFIX(user.id, simId);

  console.log(prefix);

  try {
    const command = new ListObjectsV2Command({
      Bucket: PARAMETERS.S3_RENDER_BUCKET,
      Prefix: prefix,
      Delimiter: "/",
      MaxKeys: limit,
      ContinuationToken: continuationToken,
    });

    const result = await CLIENTS.s3.send(command);

    const recordingMetadata: SimRecording[] = (result.CommonPrefixes ?? [])
      .map((p) => p.Prefix!)
      .map((p) => p.slice(prefix.length).replace(/\/$/, ""))
      .filter(Boolean)
      .map((timestamp) => ({ timestamp }));

    recordingMetadata.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

    return {
      items: recordingMetadata,
      nextToken: result.NextContinuationToken,
    };
  } catch {
    throw new HttpError(500, "Failed to list recordings");
  }
}

export async function listImages(
  idToken: string,
  accessToken: string,
  simId: string,
  timestamp: string,
  limit: number,
  continuationToken?: string,
): Promise<GetSimImagesResponseBody> {
  const user = await getUser(idToken, accessToken);
  const prefix = SIM_IMAGE_PREFIX(user.id, simId, timestamp);

  try {
    const command = new ListObjectsV2Command({
      Bucket: PARAMETERS.S3_RENDER_BUCKET,
      Prefix: prefix,
      MaxKeys: limit,
      ContinuationToken: continuationToken,
    });

    const result = await CLIENTS.s3.send(command);

    const images: SimImage[] = (result.Contents ?? [])
      .filter((obj) => obj.Key)
      .map((obj) => ({
        filename: obj.Key!.replace(prefix, ""),
        size: obj.Size ?? 0,
      }))
      .sort((a, b) => (a.filename > b.filename ? 1 : -1));

    return { items: images, nextToken: result.NextContinuationToken };
  } catch {
    throw new HttpError(500, "Failed to list images");
  }
}

export async function deleteImage(
  idToken: string,
  accessToken: string,
  simId: string,
  timestamp: string,
  filename: string,
): Promise<DeleteSimImageResponseBody> {
  const user = await getUser(idToken, accessToken);
  const key = `${SIM_IMAGE_PREFIX(user.id, simId, timestamp)}${filename}`;

  try {
    const command = new DeleteObjectCommand({
      Bucket: PARAMETERS.S3_RENDER_BUCKET,
      Key: key,
    });
    await CLIENTS.s3.send(command);
    return {};
  } catch {
    throw new HttpError(500, "Failed to delete image");
  }
}
