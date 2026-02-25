import init, { WasmSim2D as Sim2D } from "sim-wasm";
// import { getSimSocket } from "../ws/SimSocket.ts";

export const PARTICLE_COUNT = 5000;
export const PARTICLE_RADIUS = 0.025;

// Declare simMemory as a variable that can be reassigned
let simMemory: WebAssembly.Memory;

export type WorkerMessageEvent = MessageEvent<
  | {
      type: "INIT_WASM";
    }
  | {
      type: "INIT_SIM";
      payload: {
        worldWidth: number;
        worldHeight: number;
        gravity: number;
        targetDensity: number;
        pressureMultiplier: number;
        viscosityStrength: number;
        smoothingRadius: number;
        interactionStrength: number;
        interactionRadius: number;
      };
    }
  | { type: "START_RECORDING"; payload: { simulationId: string } }
  | { type: "STOP_RECORDING"; payload: { simulationId: string } }
  | { type: "START" }
  | { type: "STOP" }
  | { type: "STEP" }
  | {
      type: "SET_WORLD_DIMENSIONS";
      payload: { worldWidth: number; worldHeight: number };
    }
  | {
      type: "UPDATE_PARAMETER";
      payload: { parameter: "gravity"; gravity: number };
    }
  | {
      type: "UPDATE_PARAMETER";
      payload: { parameter: "targetDensity"; targetDensity: number };
    }
  | {
      type: "UPDATE_PARAMETER";
      payload: { parameter: "pressureMultiplier"; pressureMultiplier: number };
    }
  | {
      type: "UPDATE_PARAMETER";
      payload: { parameter: "viscosityStrength"; viscosityStrength: number };
    }
  | {
      type: "UPDATE_PARAMETER";
      payload: {
        parameter: "interactionStrength";
        interactionStrength: number;
      };
    }
  | {
      type: "UPDATE_PARAMETER";
      payload: { parameter: "interactionRadius"; interactionRadius: number };
    }
  | {
      type: "UPDATE_PARAMETER";
      payload: { parameter: "smoothingRadius"; smoothingRadius: number };
    }
  | { type: "ENABLE_PUSH_INTERACTION"; payload: { x: number; y: number } }
  | { type: "ENABLE_PULL_INTERACTION"; payload: { x: number; y: number } }
  | { type: "DISABLE_INTERACTION" }
>;

// WebSocket
// const simSocket = getSimSocket();
let recording = false;
let frame = 0;
// let parameters = {
//   worldWidth: 0,
//   worldHeight: 0,
//   gravity: 0,
//   targetDensity: 0,
//   pressureMultiplier: 0,
//   viscosityStrength: 0,
//   smoothingRadius: 0,
//   interactionStrength: 0,
//   interactionRadius: 0,
// };

// WebWorker
let simWasm: Sim2D | null = null;

const DT = 1 / 60.0;
let intervalId: NodeJS.Timeout | null = null;

onmessage = async (event: WorkerMessageEvent) => {
  const { type } = event.data;

  switch (type) {
    case "INIT_WASM": {
      const wasmInit = await init({
        module_or_path: new URL(
          "../sim-wasm-pkg/sim_wasm_bg.wasm",
          import.meta.url,
        ),
      });

      simMemory = wasmInit.memory;

      self.postMessage({ type: "READY" });
      console.log("Simulation Web Worker Ready");
      break;
    }
    case "INIT_SIM": {
      if (simWasm) {
        simWasm.free();
        simWasm = null;
      }

      const worldWidth = event.data.payload.worldWidth;
      const worldHeight = event.data.payload.worldHeight;
      const gravity = event.data.payload.gravity;
      const targetDensity = event.data.payload.targetDensity;
      const pressureMultiplier = event.data.payload.pressureMultiplier;
      const viscosityStrength = event.data.payload.viscosityStrength;
      const smoothingRadius = event.data.payload.smoothingRadius;
      const interactionStrength = event.data.payload.interactionStrength;
      const interactionRadius = event.data.payload.interactionRadius;

      simWasm = new Sim2D(
        PARTICLE_COUNT,
        PARTICLE_RADIUS,
        worldWidth,
        worldHeight,
        gravity,
        targetDensity,
        pressureMultiplier,
        viscosityStrength,
        smoothingRadius,
        interactionStrength,
        interactionRadius,
      );

      // parameters = {
      //   worldWidth,
      //   worldHeight,
      //   gravity,
      //   targetDensity,
      //   pressureMultiplier,
      //   viscosityStrength,
      //   smoothingRadius,
      //   interactionStrength,
      //   interactionRadius,
      // };

      self.postMessage({
        type: "UPDATE_POSITIONS",
        payload: {
          memoryBuffer: simMemory.buffer,
          positionsPtr: simWasm.get_positions_ptr(),
          velocityMagnitudesPtr: simWasm.get_velocity_magnitudes_ptr(),
        },
      });

      console.log("Simulation WebAssembly Instance Created");
      break;
    }
    case "START_RECORDING": {
      // if (simSocket.ready) {
      //   if (simWasm) {
      //     if (intervalId !== null) {
      //       clearInterval(intervalId);
      //       intervalId = null;
      //     }

      //     recording = true;
      //     frame = 0;
      //     simWasm.reset_sim();

      //     self.postMessage({
      //       type: "UPDATE_POSITIONS",
      //       payload: {
      //         memoryBuffer: simMemory.buffer,
      //         positionsPtr: simWasm.get_positions_ptr(),
      //         velocityMagnitudesPtr: simWasm.get_velocity_magnitudes_ptr(),
      //       },
      //     });

      //     await simSocket.startRecording(
      //       event.data.payload.simulationId,
      //       PARTICLE_COUNT,
      //       PARTICLE_RADIUS,
      //       parameters.worldWidth,
      //       parameters.worldHeight,
      //       parameters.gravity,
      //       parameters.targetDensity,
      //       parameters.pressureMultiplier,
      //       parameters.viscosityStrength,
      //       parameters.smoothingRadius,
      //       parameters.interactionStrength,
      //       parameters.interactionRadius,
      //     );
      //   }
      // }

      break;
    }
    case "STOP_RECORDING": {
      // if (simSocket.ready) {
      //   if (simWasm) {
      //     recording = false;

      //     await simSocket.stopRecording(frame, event.data.payload.simulationId);
      //   }
      // }
      break;
    }
    case "START": {
      intervalId ??= setInterval(() => {
        if (simWasm) {
          simWasm.step(DT);
          self.postMessage({
            type: "UPDATE_POSITIONS",
            payload: {
              memoryBuffer: simMemory.buffer,
              positionsPtr: simWasm.get_positions_ptr(),
              velocityMagnitudesPtr: simWasm.get_velocity_magnitudes_ptr(),
            },
          });
        }

        // if (recording)
        //   simSocket.step(frame, DT).catch((e: unknown) => {
        //     console.log("WebSocket error:", e);
        //   });

        frame += 1;
      }, DT * 1000);
      break;
    }
    case "STOP": {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      break;
    }
    case "STEP": {
      if (simWasm) {
        simWasm.step(DT);

        self.postMessage({
          type: "UPDATE_POSITIONS",
          payload: {
            memoryBuffer: simMemory.buffer,
            positionsPtr: simWasm.get_positions_ptr(),
            velocityMagnitudesPtr: simWasm.get_velocity_magnitudes_ptr(),
          },
        });

        // if (recording) await simSocket.step(frame, DT);

        frame += 1;
      }
      break;
    }
    case "SET_WORLD_DIMENSIONS": {
      if (!recording) {
        simWasm?.set_world_dimensions(
          event.data.payload.worldWidth,
          event.data.payload.worldHeight,
        );
      }
      break;
    }
    case "UPDATE_PARAMETER": {
      switch (event.data.payload.parameter) {
        case "gravity": {
          simWasm?.set_gravity(event.data.payload.gravity);
          // if (recording)
          //   await simSocket.setGravity(frame, event.data.payload.gravity);
          break;
        }
        case "targetDensity": {
          simWasm?.set_target_density(event.data.payload.targetDensity);
          // if (recording)
          //   await simSocket.setTargetDensity(
          //     frame,
          //     event.data.payload.targetDensity,
          //   );
          break;
        }
        case "pressureMultiplier": {
          simWasm?.set_pressure_multiplier(
            event.data.payload.pressureMultiplier,
          );
          // if (recording)
          //   await simSocket.setPressureMultiplier(
          //     frame,
          //     event.data.payload.pressureMultiplier,
          //   );
          break;
        }
        case "viscosityStrength": {
          simWasm?.set_viscosity_strength(event.data.payload.viscosityStrength);
          // if (recording)
          //   await simSocket.setViscosityStrength(
          //     frame,
          //     event.data.payload.viscosityStrength,
          //   );
          break;
        }
        case "smoothingRadius": {
          simWasm?.set_smoothing_radius(event.data.payload.smoothingRadius);
          // if (recording)
          //   await simSocket.setSmoothingRadius(
          //     frame,
          //     event.data.payload.smoothingRadius,
          //   );
          break;
        }
        case "interactionStrength": {
          simWasm?.set_interaction_strength(
            event.data.payload.interactionStrength,
          );
          // if (recording)
          //   await simSocket.setInteractionStrength(
          //     frame,
          //     event.data.payload.interactionStrength,
          //   );
          break;
        }
        case "interactionRadius": {
          simWasm?.set_interaction_radius(event.data.payload.interactionRadius);
          // if (recording)
          //   await simSocket.setInteractionRadius(
          //     frame,
          //     event.data.payload.interactionRadius,
          //   );
          break;
        }
      }
      break;
    }
    case "ENABLE_PUSH_INTERACTION": {
      simWasm?.enable_push_interaction(
        event.data.payload.x,
        event.data.payload.y,
      );
      // if (recording)
      //   await simSocket.enablePushInteraction(
      //     frame,
      //     event.data.payload.x,
      //     event.data.payload.y,
      //   );
      break;
    }
    case "ENABLE_PULL_INTERACTION": {
      simWasm?.enable_pull_interaction(
        event.data.payload.x,
        event.data.payload.y,
      );
      // if (recording)
      //   await simSocket.enablePullInteraction(
      //     frame,
      //     event.data.payload.x,
      //     event.data.payload.y,
      //   );
      break;
    }
    case "DISABLE_INTERACTION": {
      simWasm?.disable_interaction();
      // if (recording) await simSocket.disableInteraction(frame);
      break;
    }
  }
};
