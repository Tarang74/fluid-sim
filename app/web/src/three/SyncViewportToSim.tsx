import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { useSim } from "../contexts/Sim";

export default function SyncViewportToSim() {
  const { simWorker } = useSim();
  const { camera } = useThree();
  const prev = useRef({ worldW: 0, worldH: 0 });

  useFrame(() => {
    const cam = camera as THREE.OrthographicCamera;
    const worldWidth = cam.right - cam.left;
    const worldHeight = cam.top - cam.bottom;
    if (
      worldWidth !== prev.current.worldW ||
      worldHeight !== prev.current.worldH
    ) {
      if (simWorker) {
        simWorker.postMessage({
          type: "SET_WORLD_DIMENSIONS",
          payload: {
            worldWidth: worldWidth / 100,
            worldHeight: worldHeight / 100,
          },
        });
      }
      prev.current = { worldW: worldWidth, worldH: worldHeight };
    }
  });

  return null;
}
