/* eslint-disable react-x/no-context-provider */
import { useCallback, useState, useMemo, type ReactNode } from "react";
import type { User } from "@tarang-and-tina/shared/dist/domain";
import {
  logoutRequest,
  verifyMfaRequest,
  verifyMfaChallengeRequest,
} from "../api/auth";
import { AuthContext } from "./Auth";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutRequest();
    } finally {
      setAuthenticated(false);
      setUser(null);
      setLoading(false);
    }
  }, []);

  const verifyMfa = useCallback(async (username: string, mfaCode: string) => {
    setLoading(true);
    try {
      const response = await verifyMfaRequest(username, mfaCode);
      if (response.success) {
        setAuthenticated(true);
        return true;
      } else {
        return false;
      }
    } catch (err: unknown) {
      console.error("MFA verification failed:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyMfaChallenge = useCallback(
    async (username: string, mfaCode: string, session: string) => {
      setLoading(true);
      try {
        const response = await verifyMfaChallengeRequest(
          username,
          mfaCode,
          session,
        );
        setAuthenticated(true);
        setUser(response.user);
        return true;
      } catch (err: unknown) {
        console.error("MFA challenge verification failed:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const memoized = useMemo(
    () => ({
      authenticated,
      setAuthenticated,
      user,
      setUser,
      logout,
      verifyMfa,
      verifyMfaChallenge,
      loading,
      setLoading,
    }),
    [authenticated, user, logout, verifyMfa, verifyMfaChallenge, loading],
  );

  return (
    <AuthContext.Provider value={memoized}>{children}</AuthContext.Provider>
  );
}
