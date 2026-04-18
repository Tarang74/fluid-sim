import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AuthProvider from "./contexts/AuthProvider.tsx";
import Auth from "./pages/auth/index.tsx";

const root = document.getElementById("root");
if (!root) throw new Error('No element with id "root" found');

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <Auth />
    </AuthProvider>
  </StrictMode>,
);
