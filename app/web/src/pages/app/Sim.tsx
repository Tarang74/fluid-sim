import { useEffect, useState } from "react";

import ImagePanel from "./ImagePanel.tsx";
import Sidebar from "./Sidebar.tsx";
import Loader from "../loader";
import SimCanvas from "./sim-canvas/index.tsx";
import { useSim } from "../../contexts/Sim.ts";

export default function Sim() {
  const { simsLoading, imagesLoading } = useSim();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (message !== "") {
      const timeout = setTimeout(() => {
        setMessage("");
      }, 10000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [message]);

  return (
    <main className="app-main">
      <SimCanvas />
      <ImagePanel setMessage={setMessage} />
      <Sidebar setMessage={setMessage} />

      <div className={`message ${message !== "" ? "visible" : "hidden"}`}>
        {message}
      </div>
      <Loader loading={simsLoading || imagesLoading} />
    </main>
  );
}
