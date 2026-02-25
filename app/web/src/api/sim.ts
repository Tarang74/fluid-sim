import type { UpdateSimRequestBody } from "@tarang-and-tina/shared/dist/sim";

export function createSimRequest() {
  return Promise.resolve({
    metadata: {
      id: "1",
      createdAt: new Date().toISOString(),
      description: "New Simulation",
      // Simulation parameters
      gravity: -12.0,
      targetDensity: 75.0,
      pressureMultiplier: 500.0,
      viscosityStrength: 0.03,
      smoothingRadius: 0.35,
      interactionStrength: 90.0,
      interactionRadius: 2.0,
    },
  });
  // return post<CreateSimResponseBody>("/api/sims", null);
}

export function getSimRequest(simId: string) {
  return Promise.resolve({
    metadata: {
      id: simId,
      createdAt: new Date().toISOString(),
      description: "New Simulation",
      // Simulation parameters
      gravity: -12.0,
      targetDensity: 75.0,
      pressureMultiplier: 500.0,
      viscosityStrength: 0.03,
      smoothingRadius: 0.35,
      interactionStrength: 90.0,
      interactionRadius: 2.0,
    },
  });
  // return get<GetSimResponseBody>(`/api/sims/${simId}`);
}

export function updateSimRequest(
  simId: string,
  metadata: UpdateSimRequestBody["metadata"],
) {
  return Promise.resolve({
    metadata: metadata,
  });
  // return patch<UpdateSimResponseBody>(
  //   `/api/sims/${simId}`,
  //   JSON.stringify({ metadata }),
  // );
}

export function deleteSimRequest(simId: string) {
  return Promise.resolve({});
  // return del<DeleteSimResponseBody>(`/api/sims/${simId}`);
}

export function listSimsRequest() {
  return Promise.resolve({
    metadataList: [
      {
        id: "1",
        createdAt: new Date().toISOString(),
        description: "New Simulation",
        // Simulation parameters
        gravity: -12.0,
        targetDensity: 75.0,
        pressureMultiplier: 500.0,
        viscosityStrength: 0.03,
        smoothingRadius: 0.35,
        interactionStrength: 90.0,
        interactionRadius: 2.0,
      },
    ],
  });
  // return get<GetSimsResponseBody>("/api/sims");
}

export function uploadSimImageRequest(
  simId: string,
  timestamp: string,
  frameCount: number,
  mime: string,
) {
  return Promise.resolve({
    filename: "frame.png",
    uploadUrl: "https://tarangjanawalkar.com/frame.png",
  });
  // return post<UploadSimImageResponseBody>(
  //   `/api/sims/${simId}/images/${timestamp}`,
  //   JSON.stringify({ frameCount, mime } as UploadSimImageRequestBody),
  // );
}

export function downloadSimImageRequest(
  simId: string,
  timestamp: string,
  filename: string,
) {
  return Promise.resolve({
    downloadUrl: "https://tarangjanawalkar.com/frame.png",
  });
  // return get<DownloadSimImageResponseBody>(
  //   `/api/sims/${simId}/images/${timestamp}/${filename}`,
  // );
}

export function deleteSimImageRequest(
  simId: string,
  timestamp: string,
  filename: string,
) {
  return Promise.resolve({});
  // return del<DeleteSimImageResponseBody>(
  //   `/api/sims/${simId}/images/${timestamp}/${filename}`,
  // );
}

export function listSimRecordingsRequest(
  simId: string,
  limit: number,
  token?: string,
) {
  return Promise.resolve({
    items: [],
  });
  // const query: GetSimRecordingsQuery = {
  //   limit: limit,
  //   token: token,
  // };

  // return get<GetSimRecordingsResponseBody>(
  //   `/api/sims/${simId}/images`,
  //   undefined,
  //   query,
  // );
}

export function listSimImagesRequest(
  simId: string,
  timestamp: string,
  limit: number,
  token?: string,
) {
  return Promise.resolve({
    items: [],
  });
  // const query: GetSimImagesQuery = {
  //   limit: limit,
  //   token: token,
  // };

  // return get<GetSimImagesResponseBody>(
  //   `/api/sims/${simId}/images/${timestamp}`,
  //   undefined,
  //   query,
  // );
}
