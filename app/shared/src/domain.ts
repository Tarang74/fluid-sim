export interface User {
  id: string;
  username: string;
  email: string;
  mfaEnabled: boolean;
  federated: boolean;
}

export interface SimMetadata {
  id: string;
  createdAt: Date;
  description?: string;
  // Simulation parameters
  gravity: number;
  targetDensity: number;
  pressureMultiplier: number;
  viscosityStrength: number;
  smoothingRadius: number;
  interactionStrength: number;
  interactionRadius: number;
}

export interface SimRecording {
  timestamp: string;
}

export interface SimImage {
  filename: string;
  size: number;
}
