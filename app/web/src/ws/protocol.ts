export type ServerMessage =
  | { type: "ready" }
  | { type: "recordingStarted"; recordingId: string }
  | { type: "recordingStopped"; recordingId: string }
  | { type: "error"; message: string }
  | {
      type: "acknowledge";
      recordingId: string;
      frame: number;
      parameterChanged: boolean;
    };

export type ClientMessage =
  | {
      type: "startRecording";
      simulationId: string;
      particleCount: number;
      particleRadius: number;
      worldWidth: number;
      worldHeight: number;
      gravity: number;
      targetDensity: number;
      pressureMultiplier: number;
      viscosityStrength: number;
      smoothingRadius: number;
      interactionStrength: number;
      interactionRadius: number;
    }
  | { type: "stopRecording"; frame: number; simulationId: string }
  | { type: "step"; frame: number; dt: number }
  | { type: "setGravity"; frame: number; gravity: number }
  | { type: "setTargetDensity"; frame: number; targetDensity: number }
  | { type: "setPressureMultiplier"; frame: number; pressureMultiplier: number }
  | { type: "setViscosityStrength"; frame: number; viscosityStrength: number }
  | { type: "setSmoothingRadius"; frame: number; smoothingRadius: number }
  | {
      type: "setInteractionStrength";
      frame: number;
      interactionStrength: number;
    }
  | { type: "setInteractionRadius"; frame: number; interactionRadius: number }
  | { type: "enablePushInteraction"; frame: number; x: number; y: number }
  | { type: "enablePullInteraction"; frame: number; x: number; y: number }
  | { type: "disableInteraction"; frame: number };
