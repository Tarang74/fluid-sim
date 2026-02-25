import type { ApiRequest, ApiResponse } from "./api";
import type { SimMetadata, SimImage, SimRecording } from "./domain";

// Create metadata
export interface CreateSimRequestBody {
  metadata: Partial<SimMetadata>;
}
export interface CreateSimResponseBody {
  metadata: SimMetadata;
}
export type CreateSimRequest = ApiRequest<
  {},
  CreateSimRequestBody,
  CreateSimResponseBody
>;
export type CreateSimResponse = ApiResponse<CreateSimResponseBody>;

// Fetch metadata
export interface GetSimParams {
  simId: string;
}
export interface GetSimResponseBody {
  metadata: SimMetadata;
}
export type GetSimRequest = ApiRequest<GetSimParams, GetSimResponseBody>;
export type GetSimResponse = ApiResponse<GetSimResponseBody>;

// Update metadata
export interface UpdateSimParams {
  simId: string;
}
export interface UpdateSimResponseBody {
  metadata: SimMetadata;
}
export interface UpdateSimRequestBody {
  metadata: Partial<SimMetadata>;
}
export type UpdateSimRequest = ApiRequest<
  UpdateSimParams,
  UpdateSimResponseBody,
  UpdateSimRequestBody
>;

// Delete metadata
export interface DeleteSimParams {
  simId: string;
}
export interface DeleteSimResponseBody {}
export type DeleteSimRequest = ApiRequest<
  DeleteSimParams,
  DeleteSimResponseBody
>;
export type DeleteSimResponse = ApiResponse<DeleteSimResponseBody>;

// Fetch all metadata
export interface GetSimsResponseBody {
  metadataList: SimMetadata[];
}
export type GetSimsResponse = ApiResponse<GetSimResponseBody>;

// Upload image
export interface UploadSimImageParams {
  simId: string;
  timestamp: string;
}
export interface UploadSimImageResponseBody {
  filename: string;
  uploadUrl: string;
}
export interface UploadSimImageRequestBody {
  frameCount: number;
  mime: string;
}
export type UploadSimImageRequest = ApiRequest<
  UploadSimImageParams,
  UploadSimImageResponseBody,
  UploadSimImageRequestBody
>;
export type UploadSimImageResponse = ApiResponse<UploadSimImageResponseBody>;

// Download image
export interface DownloadSimImageParams {
  simId: string;
  timestamp: string;
  filename: string;
}
export interface DownloadSimImageResponseBody {
  downloadUrl: string;
}
export type DownloadSimImageRequest = ApiRequest<
  DownloadSimImageParams,
  DownloadSimImageResponseBody
>;
export type DownloadSimImageResponse =
  ApiResponse<DownloadSimImageResponseBody>;

// Fetch recording list
export interface GetSimRecordingsParams {
  simId: string;
}
export interface GetSimRecordingsResponseBody {
  items: SimRecording[];
  nextToken?: string;
}
export interface GetSimRecordingsQuery
  extends Record<string, string | number | undefined> {
  limit: number;
  token?: string;
}
export type GetSimRecordingsRequest = ApiRequest<
  GetSimRecordingsParams,
  GetSimRecordingsResponseBody,
  {},
  GetSimRecordingsQuery
>;
export type GetSimRecordingsResponse =
  ApiResponse<GetSimRecordingsResponseBody>;

// Fetch image list
export interface GetSimImagesParams {
  simId: string;
  timestamp: string;
}
export interface GetSimImagesResponseBody {
  items: SimImage[];
  nextToken?: string;
}
export interface GetSimImagesQuery
  extends Record<string, string | number | undefined> {
  limit: number;
  token?: string;
}
export type GetSimImagesRequest = ApiRequest<
  GetSimImagesParams,
  GetSimImagesResponseBody,
  {},
  GetSimImagesQuery
>;
export type GetSimImagesResponse = ApiResponse<GetSimImagesResponseBody>;

// Delete image
export interface DeleteSimImageParams {
  simId: string;
  timestamp: string;
  filename: string;
}
export interface DeleteSimImageResponseBody {}
export type DeleteSimImageRequest = ApiRequest<
  DeleteSimImageParams,
  DeleteSimImageResponseBody
>;
export type DeleteSimImageResponse = ApiResponse<DeleteSimImageResponseBody>;
