import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Root from "./Root.tsx";

// Routing picks the lobby or a room; each room owns its own provider stack
// (CRDT / sync / audio), mounted in RoomView after a room is chosen.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
