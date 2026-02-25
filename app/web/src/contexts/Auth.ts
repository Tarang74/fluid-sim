/* eslint-disable react-x/no-use-context */
import {
  useContext,
  createContext,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { User } from "@tarang-and-tina/shared/dist/domain";

interface AuthContextType {
  authenticated: boolean;
  setAuthenticated: Dispatch<SetStateAction<boolean>>;
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  logout: () => Promise<void>;
  verifyMfa: (username: string, mfaCode: string) => Promise<boolean>;
  verifyMfaChallenge: (
    username: string,
    mfaCode: string,
    session: string,
  ) => Promise<boolean>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
