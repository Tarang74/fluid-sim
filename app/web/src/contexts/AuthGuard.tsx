import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "../pages/loader";
import { useAuth } from "./Auth";
import { useEffect, useState } from "react";
import { getMfaRequest, refreshTokenRequest } from "../api/auth";

export default function AuthGuard() {
  const { authenticated, setUser, setAuthenticated } = useAuth();
  const location = useLocation();
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, [location.pathname, setAuthenticated, setUser]);

  if (loading) {
    return (
      <main
        style={{ height: "100vh", width: "100vw", backgroundColor: "#f0f0f0" }}
      >
        <Loader loading={loading} />
      </main>
    );
  } else {
    return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
  }
}
