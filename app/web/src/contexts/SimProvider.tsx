/* eslint-disable react-x/no-context-provider */
import { useCallback, useEffect, useMemo, useState } from "react";

import { SimContext } from "./Sim";
import {
  createSimRequest,
  deleteSimImageRequest,
  deleteSimRequest,
  downloadSimImageRequest,
  getSimRequest,
  listSimImagesRequest,
  listSimRecordingsRequest,
  listSimsRequest,
  updateSimRequest,
} from "../api/sim";

import type {
  SimMetadata,
  SimImage,
  SimRecording,
} from "@tarang-and-tina/shared/dist/domain";

export default function SimProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [simId, setSimId] = useState<string | null>(null);
  const [simMetadata, setSimMetadata] = useState<SimMetadata | null>(null);
  const [simMetadataList, setSimMetadataList] = useState<SimMetadata[]>([]);
  const [simsLoading, setSimsLoading] = useState(false);

  const [recordings, setRecordings] = useState<SimRecording[]>([]);
  const [selectedRecording, setSelectedRecording] =
    useState<SimRecording | null>(null);
  const [recordingsNextToken, setRecordingNextToken] = useState<string | null>(
    null,
  );

  const [images, setImages] = useState<SimImage[]>([]);
  const [imagesNextToken, setImagesNextToken] = useState<string | null>(null);
  const [imagesLoading, setImagesLoading] = useState<boolean>(false);

  const [simWorker, setSimWorker] = useState<Worker | null>(null);
  const [simPaused, setSimPaused] = useState(true);

  useEffect(() => {
    setSimWorker(
      new Worker(new URL("../workers/simWorkerScript.ts", import.meta.url), {
        type: "module",
      }),
    );

    return () => {
      if (!simWorker) return;
      simWorker.terminate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSim = useCallback(() => {
    if (!simWorker) return;

    if (simPaused) {
      simWorker.postMessage({ type: "START" });
    } else {
      simWorker.postMessage({ type: "STOP" });
    }

    setSimPaused((prev) => !prev);
  }, [simWorker, simPaused]);

  const stepSim = useCallback(() => {
    if (!simWorker) return;

    if (simPaused) {
      simWorker.postMessage({ type: "STEP" });
    }
  }, [simPaused, simWorker]);

  // Get all simulations
  const refreshSims = useCallback(async () => {
    setSimsLoading(true);
    try {
      const data = await listSimsRequest();
      setSimMetadataList(data.metadataList);

      if (data.metadataList.length > 0) {
        // Try to keep existing simId
        const existing = data.metadataList.find((m) => m.id === simId);
        if (existing) {
          setSimMetadata(existing);
        } else {
          setSimId(data.metadataList[0].id);
          setSimMetadata(data.metadataList[0]);
        }
      } else {
        setSimId(null);
        setSimMetadata(null);
      }
    } catch {
      setSimMetadataList([]);
    } finally {
      setSimsLoading(false);
    }
  }, [simId]);

  // Initial get all simulations
  useEffect(() => {
    void refreshSims();
  }, [refreshSims]);

  // Get all recordings
  const refreshRecordings = useCallback(() => {
    if (!simId) return;

    listSimRecordingsRequest(simId, 10)
      .then((data) => {
        setRecordings(data.items);

        setRecordingNextToken(data.nextToken ?? null);
      })
      .catch(() => {
        setRecordings([]);
        setRecordingNextToken(null);
      });
  }, [simId]);

  const refreshImages = useCallback(
    (recording: SimRecording) => {
      if (!simId) return;

      setImagesLoading(true);
      listSimImagesRequest(simId, recording.timestamp, 10)
        .then((data) => {
          setImages(data.items);
          setImagesNextToken(data.nextToken ?? null);
        })
        .catch(() => {
          setImages([]);
          setImagesNextToken(null);
        })
        .finally(() => {
          setImagesLoading(false);
        });
    },
    [simId],
  );

  useEffect(() => {
    refreshRecordings();
  }, [refreshRecordings]);

  // Create new simulation
  const createSim = useCallback(async () => {
    try {
      const data = await createSimRequest();
      setSimId(data.metadata.id);
      setSimMetadata(data.metadata);
      await refreshSims();
    } catch (err) {
      setSimId(null);
      setSimMetadata(null);
      throw err;
    }
  }, [refreshSims]);

  // Set simulation
  const setSim = useCallback(
    async (index: number) => {
      await refreshSims();
      setSimId(simMetadataList[index].id);
      setSimMetadata(simMetadataList[index]);
    },
    [refreshSims, simMetadataList],
  );

  // Get simulation
  const getSim = useCallback(async (id: string) => {
    try {
      const data = await getSimRequest(id);
      setSimId(data.metadata.id);
      setSimMetadata(data.metadata);
    } catch (err) {
      setSimId(null);
      setSimMetadata(null);
      throw err;
    }
  }, []);

  // Update simulation metadata
  const updateSim = useCallback(
    async (id: string, metadata: Partial<SimMetadata>) => {
      const data = await updateSimRequest(id, metadata);

      if (simId === id) {
        setSimMetadata(data.metadata);
      }

      setSimMetadataList((prev) =>
        prev.map((m) => (m.id === id ? data.metadata : m)),
      );
    },
    [simId],
  );

  // Mark simulation for deletion
  const deleteSim = useCallback(
    async (id: string) => {
      try {
        await deleteSimRequest(id);
      } finally {
        if (simId === id) {
          setSimId(null);
          setSimMetadata(null);
        }
        await refreshSims();
      }
    },
    [simId, refreshSims],
  );

  // // Upload image to S3 and obtain presign URL
  // const uploadSimImage = useCallback(
  //   async (id: string, frameCount: number, mime: string) => {
  //     await uploadSimImageRequest(id, frameCount, mime);
  //
  //     const data = await listSimImagesRequest(id, 10);
  //     setImages(data.items);
  //     setImagesNextToken(data.nextToken ?? null);
  //   },
  //   [],
  // );

  // Download existing image from S3, and send Promise back to caller
  const downloadSimImage = useCallback(
    async (id: string, timestamp: string, filename: string) => {
      return downloadSimImageRequest(id, timestamp, filename);
    },
    [],
  );

  // Delete image from S3
  const deleteSimImage = useCallback(
    async (id: string, timestamp: string, filename: string) => {
      await deleteSimImageRequest(id, timestamp, filename);

      const data = await listSimImagesRequest(id, timestamp, 10);
      setImages(data.items);
      setImagesNextToken(data.nextToken ?? null);
    },
    [],
  );

  // List more recordings using next token
  const listMoreRecordings = useCallback(async () => {
    if (!simId || !recordingsNextToken) return;

    try {
      const data = await listSimRecordingsRequest(
        simId,
        10,
        recordingsNextToken,
      );
      setRecordings((prev) => [...prev, ...data.items]);
      setRecordingNextToken(data.nextToken ?? null);
    } catch (e) {
      console.log("Could not fetch recordings", e);
    }
  }, [simId, recordingsNextToken]);

  // List more images using next token
  const listMoreImages = useCallback(async () => {
    if (!simId || !selectedRecording) return;

    setImagesLoading(true);
    try {
      const data = await listSimImagesRequest(
        simId,
        selectedRecording.timestamp,
        10,
        imagesNextToken ?? undefined,
      );
      setImages((prev) => [...prev, ...data.items]);
      setImagesNextToken(data.nextToken ?? null);
    } finally {
      setImagesLoading(false);
    }
  }, [simId, selectedRecording, imagesNextToken]);

  const setRecording = useCallback(
    (index: number) => {
      setSelectedRecording(recordings[index]);
      refreshImages(recordings[index]);
    },
    [refreshImages, recordings],
  );

  const memoized = useMemo(
    () => ({
      simId,
      simMetadata,
      simMetadataList,
      recordings,
      selectedRecording,
      recordingsNextToken,
      images,
      imagesNextToken,
      simsLoading,
      imagesLoading,
      simWorker,
      simPaused,
      toggleSim,
      stepSim,
      createSim,
      setSim,
      getSim,
      updateSim,
      deleteSim,
      // uploadSimImage,
      downloadSimImage,
      deleteSimImage,
      setRecording,
      refreshRecordings,
      refreshImages,
      listMoreRecordings,
      listMoreImages,
    }),
    [
      simId,
      simMetadata,
      simMetadataList,
      recordings,
      selectedRecording,
      recordingsNextToken,
      images,
      imagesNextToken,
      simsLoading,
      imagesLoading,
      simWorker,
      simPaused,
      toggleSim,
      stepSim,
      createSim,
      setSim,
      getSim,
      updateSim,
      deleteSim,
      downloadSimImage,
      deleteSimImage,
      setRecording,
      refreshRecordings,
      refreshImages,
      listMoreRecordings,
      listMoreImages,
    ],
  );

  return <SimContext.Provider value={memoized}>{children}</SimContext.Provider>;
}
