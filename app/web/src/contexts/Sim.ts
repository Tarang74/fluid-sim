/* eslint-disable react-x/no-use-context */
import { useContext, createContext } from "react";
import type { DownloadSimImageResponseBody } from "@tarang-and-tina/shared/dist/sim";
import type {
  SimImage,
  SimMetadata,
  SimRecording,
} from "@tarang-and-tina/shared/dist/domain";

interface SimContextType {
  simId: string | null;
  simMetadata: SimMetadata | null;
  simMetadataList: SimMetadata[];
  recordings: SimRecording[];
  selectedRecording: SimRecording | null;
  recordingsNextToken: string | null;
  images: SimImage[];
  imagesNextToken: string | null;
  simsLoading: boolean;
  imagesLoading: boolean;
  simWorker: Worker | null;
  simPaused: boolean;
  toggleSim: () => void;
  stepSim: () => void;
  createSim: () => Promise<void>;
  setSim: (index: number) => void;
  getSim: (id: string) => Promise<void>;
  updateSim: (id: string, metadata: Partial<SimMetadata>) => Promise<void>;
  deleteSim: (id: string) => Promise<void>;
  // uploadSimImage: (
  //   id: string,
  //   frameCount: number,
  //   mime: string,
  // ) => Promise<void>;
  downloadSimImage: (
    id: string,
    timestamp: string,
    filename: string,
  ) => Promise<DownloadSimImageResponseBody>;
  deleteSimImage: (
    id: string,
    timestamp: string,
    filename: string,
  ) => Promise<void>;
  setRecording: (index: number) => void;
  refreshRecordings: () => void;
  refreshImages: (recording: SimRecording) => void;
  listMoreRecordings: () => Promise<void>;
  listMoreImages: () => Promise<void>;
}

export const SimContext = createContext<SimContextType | null>(null);

export function useSim() {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error("useSim must be used inside SimProvider");
  return ctx;
}
