import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AuthProvider from "./contexts/AuthProvider.tsx";
import OAuthCallback from "./pages/auth/OAuthCallback.tsx";

const root = document.getElementById("root");
if (!root) throw new Error('No element with id "root" found');

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <OAuthCallback />
    </AuthProvider>
  </StrictMode>,
);
