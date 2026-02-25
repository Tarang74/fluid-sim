import type { ServerMessage, ClientMessage } from "./protocol";
type Listener = (msg: ServerMessage) => void;

export class SimSocket {
  private ws: WebSocket;
  private listeners = new Set<Listener>();
  ready = false;

  constructor(path: string) {
    const wsURL = location.origin.replace("/^http/", "ws") + path;
    this.ws = new WebSocket(wsURL);

    this.ws.addEventListener("message", (ev: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(ev.data) as ServerMessage;
        for (const fn of this.listeners) fn(msg);
      } catch (err: unknown) {
        console.log("Error calling listener: ", err);
      }
    });

    this.ready = false;

    this.onMessage((m) => {
      if (m.type === "ready") {
        console.log("Simulation WebSocket Server Ready");
        this.ready = true;
      }
    });
  }

  onMessage(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private open(): Promise<void> {
    if (this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((res) => {
      this.ws.addEventListener(
        "open",
        () => {
          res();
        },
        { once: true },
      );
    });
  }

  async send(message: ClientMessage) {
    await this.open();
    this.ws.send(JSON.stringify(message));
  }

  startRecording(
    simulationId: string,
    particleCount: number,
    particleRadius: number,
    worldWidth: number,
    worldHeight: number,
    gravity: number,
    targetDensity: number,
    pressureMultiplier: number,
    viscosityStrength: number,
    smoothingRadius: number,
    interactionStrength: number,
    interactionRadius: number,
  ) {
    return this.send({
      type: "startRecording",
      simulationId,
      particleCount,
      particleRadius,
      worldWidth,
      worldHeight,
      gravity,
      targetDensity,
      pressureMultiplier,
      viscosityStrength,
      smoothingRadius,
      interactionStrength,
      interactionRadius,
    });
  }

  stopRecording(frame: number, simulationId: string) {
    return this.send({ type: "stopRecording", frame, simulationId });
  }

  step(frame: number, dt: number) {
    return this.send({ type: "step", frame, dt });
  }

  setGravity(frame: number, gravity: number) {
    return this.send({ type: "setGravity", frame, gravity });
  }
  setTargetDensity(frame: number, targetDensity: number) {
    return this.send({ type: "setTargetDensity", frame, targetDensity });
  }
  setPressureMultiplier(frame: number, pressureMultiplier: number) {
    return this.send({
      type: "setPressureMultiplier",
      frame,
      pressureMultiplier,
    });
  }
  setViscosityStrength(frame: number, viscosityStrength: number) {
    return this.send({
      type: "setViscosityStrength",
      frame,
      viscosityStrength,
    });
  }
  setSmoothingRadius(frame: number, smoothingRadius: number) {
    return this.send({ type: "setSmoothingRadius", frame, smoothingRadius });
  }
  setInteractionStrength(frame: number, interactionStrength: number) {
    return this.send({
      type: "setInteractionStrength",
      frame,
      interactionStrength,
    });
  }
  setInteractionRadius(frame: number, interactionRadius: number) {
    return this.send({
      type: "setInteractionRadius",
      frame,
      interactionRadius,
    });
  }

  enablePushInteraction(frame: number, x: number, y: number) {
    return this.send({ type: "enablePushInteraction", frame, x, y });
  }
  enablePullInteraction(frame: number, x: number, y: number) {
    return this.send({ type: "enablePullInteraction", frame, x, y });
  }
  disableInteraction(frame: number) {
    return this.send({ type: "disableInteraction", frame });
  }

  close() {
    this.ws.close();
    this.ready = false;
  }
}

let singleton: SimSocket | undefined;
export function getSimSocket() {
  singleton ??= new SimSocket("/sim");
  return singleton;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    singleton?.close();
    singleton = undefined;
  });
}
