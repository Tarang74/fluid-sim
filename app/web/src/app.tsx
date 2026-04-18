import "./index.css";
import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import AuthProvider from "./contexts/AuthProvider.tsx";
import AuthGuard from "./contexts/AuthGuard.tsx";
import Loader from "./pages/loader/index.tsx";

const App = lazy(() => import("./pages/app/index.tsx"));

const root = document.getElementById("root");
if (!root) throw new Error('No element with id "root" found');

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <AuthGuard>
        <Suspense fallback={<Loader loading={true} />}>
          <App />
        </Suspense>
      </AuthGuard>
    </AuthProvider>
  </StrictMode>,
);
