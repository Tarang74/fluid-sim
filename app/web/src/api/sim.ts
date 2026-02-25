import type { UpdateSimRequestBody } from "@tarang-and-tina/shared/dist/sim";

export function createSimRequest() {
  return Promise.resolve({
    metadata: {
      id: "1",
      createdAt: new Date(),
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
      createdAt: new Date(),
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
  _simId: string,
  metadata: UpdateSimRequestBody["metadata"],
) {
  return Promise.resolve({
    metadata: {
      id: metadata.id || "1",
      createdAt: metadata.createdAt || new Date(),
      description: metadata.description || "New Simulation",
      // Simulation parameters
      gravity: metadata.gravity || -12.0,
      targetDensity: metadata.targetDensity || 75.0,
      pressureMultiplier: metadata.pressureMultiplier || 500.0,
      viscosityStrength: metadata.viscosityStrength || 0.03,
      smoothingRadius: metadata.smoothingRadius || 0.35,
      interactionStrength: metadata.interactionStrength || 90.0,
      interactionRadius: metadata.interactionRadius || 2.0,
    },
  });
  // return patch<UpdateSimResponseBody>(
  //   `/api/sims/${simId}`,
  //   JSON.stringify({ metadata }),
  // );
}

export function deleteSimRequest(_simId: string) {
  return Promise.resolve({});
  // return del<DeleteSimResponseBody>(`/api/sims/${simId}`);
}

export function listSimsRequest() {
  return Promise.resolve({
    metadataList: [
      {
        id: "1",
        createdAt: new Date(),
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
  _simId: string,
  _timestamp: string,
  _frameCount: number,
  _mime: string,
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
  _simId: string,
  _timestamp: string,
  _filename: string,
) {
  return Promise.resolve({
    downloadUrl: "https://tarangjanawalkar.com/frame.png",
  });
  // return get<DownloadSimImageResponseBody>(
  //   `/api/sims/${simId}/images/${timestamp}/${filename}`,
  // );
}

export function deleteSimImageRequest(
  _simId: string,
  _timestamp: string,
  _filename: string,
) {
  return Promise.resolve({});
  // return del<DeleteSimImageResponseBody>(
  //   `/api/sims/${simId}/images/${timestamp}/${filename}`,
  // );
}

export function listSimRecordingsRequest(
  _simId: string,
  _limit: number,
  _token?: string,
) {
  return Promise.resolve({
    items: [],
    nextToken: undefined,
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
  _simId: string,
  _timestamp: string,
  _limit: number,
  _token?: string,
) {
  return Promise.resolve({
    items: [],
    nextToken: undefined,
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
