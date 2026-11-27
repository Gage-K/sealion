import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { CRDTProvider } from "./contexts/CRDTContext.tsx";
import { SyncProvider } from "./sync/SyncProvider.tsx";
import { AudioEngineProvider } from "./contexts/AudioEngineContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CRDTProvider>
      <SyncProvider>
        <AudioEngineProvider>
          <App />
        </AudioEngineProvider>
      </SyncProvider>
    </CRDTProvider>
  </StrictMode>
);
