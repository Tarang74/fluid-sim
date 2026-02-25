import { Canvas } from "@react-three/fiber";
import "./index.css";

import Particles from "./Particles.tsx";
import { useEffect, useRef, useState } from "react";
import SyncViewportToSim from "../../../three/SyncViewportToSim.tsx";
import { useSim } from "../../../contexts/Sim.ts";

import { OrbitControls } from "@react-three/drei";

import * as THREE from "three";
import GroundPlane from "./GroundPlane.tsx";

export default function SimCanvas() {
  const { simId, simMetadata, simWorker, simPaused, toggleSim } = useSim();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointer = useRef<{
    x: number;
    y: number;
    isDown: boolean;
    button: number | null;
  }>({
    x: 0.0,
    y: 0.0,
    isDown: false,
    button: null,
  });

  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!simMetadata || !simWorker) return;

    simWorker.postMessage({
      type: "UPDATE_PARAMETER",
      payload: { parameter: "gravity", gravity: simMetadata.gravity },
    });
    simWorker.postMessage({
      type: "UPDATE_PARAMETER",
      payload: {
        parameter: "targetDensity",
        targetDensity: simMetadata.targetDensity,
      },
    });
    simWorker.postMessage({
      type: "UPDATE_PARAMETER",
      payload: {
        parameter: "pressureMultiplier",
        pressureMultiplier: simMetadata.pressureMultiplier,
      },
    });
    simWorker.postMessage({
      type: "UPDATE_PARAMETER",
      payload: {
        parameter: "viscosityStrength",
        viscosityStrength: simMetadata.viscosityStrength,
      },
    });
    simWorker.postMessage({
      type: "UPDATE_PARAMETER",
      payload: {
        parameter: "smoothingRadius",
        smoothingRadius: simMetadata.smoothingRadius,
      },
    });
    simWorker.postMessage({
      type: "UPDATE_PARAMETER",
      payload: {
        parameter: "interactionStrength",
        interactionStrength: simMetadata.interactionStrength,
      },
    });
    simWorker.postMessage({
      type: "UPDATE_PARAMETER",
      payload: {
        parameter: "interactionRadius",
        interactionRadius: simMetadata.interactionRadius,
      },
    });
  }, [simMetadata, simWorker]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !simWorker) return;

    // 0 = left, 2 = right
    pointer.current.isDown = true;
    pointer.current.button = e.button;

    if (e.button !== 0 && e.button !== 2) return;

    // const click = e.button === 2 ? "Push" : "Pull";
    // console.log(`${click} force:`, pointer.current.x, pointer.current.y);

    if (e.button === 2) {
      simWorker.postMessage({
        type: "ENABLE_PUSH_INTERACTION",
        payload: { x: pointer.current.x, y: pointer.current.y },
      });
    } else {
      simWorker.postMessage({
        type: "ENABLE_PULL_INTERACTION",
        payload: { x: pointer.current.x, y: pointer.current.y },
      });
    }
  };

  const onPointerMove = () => {
    if (!pointer.current.isDown || !canvasRef.current || !simWorker) return;

    // const click = pointerState.current.button === 2 ? "Push" : "Pull";
    // console.log(`${click} force:`, pointer.current.x, pointer.current.y);

    if (pointer.current.button === 2) {
      simWorker.postMessage({
        type: "ENABLE_PUSH_INTERACTION",
        payload: { x: pointer.current.x, y: pointer.current.y },
      });
    } else if (pointer.current.button === 0) {
      simWorker.postMessage({
        type: "ENABLE_PULL_INTERACTION",
        payload: { x: pointer.current.x, y: pointer.current.y },
      });
    }
  };

  const onPointerUp = () => {
    if (!simWorker) return;

    pointer.current.isDown = false;
    pointer.current.button = null;

    // console.log("Stop force");

    simWorker.postMessage({
      type: "DISABLE_INTERACTION",
    });
  };

  const startRecording = () => {
    if (!simWorker || !simId) {
      alert("No simulation selected!");
      return;
    }

    if (!simPaused) toggleSim();

    simWorker.postMessage({
      type: "START_RECORDING",
      payload: { simulationId: simId },
    });

    setIsRecording(true);
  };
  const stopRecording = () => {
    if (!simWorker || !simId) return;

    simWorker.postMessage({
      type: "STOP_RECORDING",
      payload: {
        simulationId: simId,
      },
    });

    setIsRecording(false);
  };

  return (
    <div className="canvas">
      <Canvas
        ref={canvasRef}
        dpr={1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        camera={{ position: [0, 0, 1], zoom: 100 }}
        orthographic
        style={{ background: "#000" }}
      >
        <SyncViewportToSim />
        <ambientLight intensity={1} />
        <directionalLight position={[0, 0, 5]} />

        <GroundPlane pointer={pointer} />
        <Particles />
        <OrbitControls
          mouseButtons={{ MIDDLE: THREE.MOUSE.PAN }}
          touches={{ TWO: THREE.TOUCH.PAN }}
          maxZoom={1000}
          minZoom={50}
        />
      </Canvas>

      <div
        className="sim-record-button visible"
        onClick={() => {
          if (isRecording) {
            stopRecording();
          } else {
            startRecording();
          }
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="#f0f0f0"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          {!isRecording ? (
            <>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z"
              />
            </>
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
