import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/Auth";
import { cognitoCallbackRequest } from "../../api/auth";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthenticated, setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`OAuth error: ${errorParam}`);
      return;
    }

    if (!code) {
      setError("No authorisation code received");
      return;
    }

    cognitoCallbackRequest(code)
      .then((response) => {
        setAuthenticated(true);
        setUser(response.user);
        void navigate("/app");
      })
      .catch((err: unknown) => {
        setError(`Login failed: ${String(err)}`);
      });
  }, [searchParams, navigate, setAuthenticated, setUser]);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
        }}
      >
        <h2>Login Failed</h2>
        <p style={{ color: "red", marginBottom: "2rem" }}>{error}</p>
        <button
          type="button"
          onClick={() => {
            void navigate("/login");
          }}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#222",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Back to Login
        </button>
      </div>
    );
  } else {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <h2>Logging you in...</h2>
      </div>
    );
  }
}
