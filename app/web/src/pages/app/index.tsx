import "./index.css";

import SimProvider from "../../contexts/SimProvider.tsx";

import Sim from "./Sim.tsx";

export default function App() {
  return (
    <SimProvider>
      <Sim />
    </SimProvider>
  );
}
