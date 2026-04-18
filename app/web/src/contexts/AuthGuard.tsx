import { type ReactNode, useEffect, useState } from "react";
import Loader from "../pages/loader";
import { useAuth } from "./Auth";
import { getMfaRequest, refreshTokenRequest } from "../api/auth";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { authenticated, setUser, setAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    refreshTokenRequest()
      .then((data) => {
        setAuthenticated(true);

        if (!data.user.federated) {
          getMfaRequest()
            .then((data2) => {
              const user = data.user;
              user.mfaEnabled = data2.mfaEnabled;
              setUser(user);
            })
            .catch(() => {
              setUser(data.user);
            });
        } else {
          setUser(data.user);
        }
      })
      .catch(() => {
        setAuthenticated(false);
        setUser(null);
        window.location.href = "/login";
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setAuthenticated, setUser]);

  if (loading) {
    return (
      <main
        style={{ height: "100vh", width: "100vw", backgroundColor: "#f0f0f0" }}
      >
        <Loader loading={loading} />
      </main>
    );
  }

  return authenticated ? <>{children}</> : null;
}
