import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { CRDTProvider } from "./contexts/CRDTContext.tsx";
import { WebSocketProvider } from "./contexts/WebSocketContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CRDTProvider>
      <WebSocketProvider>
        <App />
      </WebSocketProvider>
    </CRDTProvider>
  </StrictMode>
);
