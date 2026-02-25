import { useCallback, useEffect, useRef } from "react";

import * as THREE from "three";
import turboRGB from "../../../helpers/turboRGB";
import {
  PARTICLE_COUNT,
  PARTICLE_RADIUS,
} from "../../../workers/simWorkerScript.ts";
import { useSim } from "../../../contexts/Sim.ts";

export default function Particles() {
  const { simWorker, simPaused, toggleSim, stepSim } = useSim();
  const refs = useRef<Map<number, THREE.Mesh>>(new Map());

  const apply = useCallback(
    (
      memoryBuffer: ArrayBuffer,
      positionsPtr: number,
      velocityMagnitudesPtr: number,
    ) => {
      const positions = new Float32Array(
        memoryBuffer,
        positionsPtr,
        PARTICLE_COUNT * 2,
      );

      const velocityMagnitudes = new Float32Array(
        memoryBuffer,
        velocityMagnitudesPtr,
        PARTICLE_COUNT,
      );

      // Calculate velocity range for color mapping
      const maxVel = Math.max(...velocityMagnitudes);
      const minVel = Math.min(...velocityMagnitudes);

      // Adjust velocity range based on actual data
      const minV = Math.min(0.1, minVel);
      const span = Math.max(1.0, maxVel - minV);

      // Update meshes
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const mesh = refs.current.get(i);
        if (!mesh) continue;

        // Position
        const x = positions[i * 2];
        const y = positions[i * 2 + 1];
        mesh.position.set(x, y, 0);

        // Color
        const p = velocityMagnitudes[i];
        const t = (p - minV) / span;
        const { r, g, b } = turboRGB(t);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.color.setRGB(r, g, b);
      }
    },
    [],
  );

  useEffect(() => {
    if (!simWorker) return;

    const onWorkerMessage = (
      event: MessageEvent<{
        type: string;
        payload: {
          memoryBuffer: ArrayBuffer;
          positionsPtr: number;
          velocityMagnitudesPtr: number;
        };
      }>,
    ) => {
      const { type } = event.data;
      if (type === "UPDATE_POSITIONS") {
        const memoryBuffer = event.data.payload.memoryBuffer;
        apply(
          memoryBuffer,
          event.data.payload.positionsPtr,
          event.data.payload.velocityMagnitudesPtr,
        );
      } else if (type === "READY") {
        simWorker.postMessage({
          type: "INIT_SIM",
          payload: {
            worldWidth: window.innerWidth / 100,
            worldHeight: window.innerHeight / 100,
            gravity: -12.0,
            targetDensity: 55.0,
            pressureMultiplier: 500.0,
            viscosityStrength: 0.3,
            smoothingRadius: 0.35,
            interactionStrength: 90.0,
            interactionRadius: 2.0,
          },
        });
      }
    };

    simWorker.addEventListener("message", onWorkerMessage);
    simWorker.postMessage({ type: "INIT_WASM" });

    return () => {
      simWorker.postMessage({ type: "STOP" });
      simWorker.removeEventListener("message", onWorkerMessage);
      simWorker.terminate();
    };
  }, [apply, simWorker]);

  // Keyboard controls: Space = toggle pause, ArrowRight = single step (when paused)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts while typing
      const active = document.activeElement as HTMLElement | null;
      const typing =
        active &&
        (active.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/i.test(active.tagName));

      if (typing) return;

      if (e.code === "Space") {
        e.preventDefault();
        toggleSim();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        stepSim();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [apply, simWorker, simPaused, toggleSim, stepSim]);

  return (
    <>
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <group key={`particle-group-${i.toString()}`}>
          <mesh
            scale={new THREE.Vector3(1, 1, 1)}
            key={`particle-${i.toString()}`}
            ref={(m) => {
              if (m) refs.current.set(i, m);
            }}
          >
            <circleGeometry args={[PARTICLE_RADIUS, 32]} />
            <meshStandardMaterial />
          </mesh>
        </group>
      ))}
    </>
  );
}
