export const userSessionKey = (sessionId: string) => `session:${sessionId}`;

export const userSimKey = (userId: string, simId: string) =>
  `user:${userId}:${simId}`;
export const userSimsKey = (userId: string) => `user:${userId}:sims`;
export const simMetadataKey = (simId: string) => `sim:${simId}:metadata`;
