import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import AuthGuard from "./contexts/AuthGuard.tsx";
import AuthProvider from "./contexts/AuthProvider.tsx";

import Hero from "./pages/hero/index.tsx";
import Auth from "./pages/auth/index.tsx";
import App from "./pages/app/index.tsx";
import OAuthCallback from "./pages/auth/OAuthCallback.tsx";

const root = document.getElementById("root");
if (!root) throw new Error('No element with id "root" found');

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter basename="/fluid-sim">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/app" element={<AuthGuard />}>
            <Route index element={<App />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
