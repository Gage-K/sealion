import { useState } from "react";
import App from "../App";
import Button from "./core/NewButton";
import { CRDTProvider } from "../contexts/CRDTContext";
import { SyncProvider } from "../sync/SyncProvider";
import { AudioEngineProvider } from "../contexts/AudioEngineContext";
import { useRoomStatus } from "../hooks/useRoomStatus";
import { usePresence } from "../hooks/usePresence";
import { useCRDT } from "../hooks/useCRDT";
import { navigate } from "../routing";

/**
 * A single room, scoped to its join code. Mounts the provider stack
 * (CRDT → Sync(code) → AudioEngine) only after the authoritative seed arrives,
 * so the synth UI can't mutate the document before it's hydrated
 * (seed-before-edit, D10.i). Shows a connecting state meanwhile, and a
 * not-found state if the socket is rejected (unknown code).
 */
export default function RoomView({ code }: { code: string }) {
  return (
    <CRDTProvider>
      <SyncProvider code={code}>
        <RoomGate code={code} />
      </SyncProvider>
    </CRDTProvider>
  );
}

function RoomGate({ code }: { code: string }) {
  const status = useRoomStatus();

  if (status === "error") {
    return (
      <Centered>
        <p className="text-red-400 tracking-widest">ROOM NOT FOUND</p>
        <p className="text-zinc-500 text-xs">
          No room with code <span className="text-zinc-300">{code}</span>.
        </p>
        <Button className="px-3 py-1 tracking-widest" onClick={() => navigate("/")}>
          BACK TO LOBBY
        </Button>
      </Centered>
    );
  }

  if (status !== "ready") {
    return (
      <Centered>
        <p className="text-cyan-400 tracking-widest animate-pulse">CONNECTING…</p>
        <p className="text-zinc-500 text-xs">room {code}</p>
      </Centered>
    );
  }

  return (
    <AudioEngineProvider>
      <RoomBadge code={code} />
      <Roster />
      <App />
    </AudioEngineProvider>
  );
}

/** Live roster of who's in the room (design D11); the viewer is marked YOU. */
function Roster() {
  const members = usePresence();
  const selfId = useCRDT().id;
  if (members.length === 0) return null;
  return (
    <div className="fixed top-2 right-2 z-10 text-xs text-right">
      <div className="text-zinc-500 mb-1">{members.length} HERE</div>
      <ul className="flex flex-col gap-0.5">
        {members.map((m) => {
          const isSelf = m.connId === selfId;
          return (
            <li
              key={m.connId}
              className={isSelf ? "text-cyan-400" : "text-zinc-300"}
            >
              {m.nickname}
              {isSelf && <span className="text-zinc-600"> (YOU)</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 min-h-screen w-screen text-zinc-100 grid place-items-center text-sm">
      <div className="flex flex-col items-center gap-3">{children}</div>
    </div>
  );
}

/** Unobtrusive badge showing the room code + a copy-link affordance. */
function RoomBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the URL bar still has the shareable link */
    }
  };
  return (
    <div className="fixed top-2 left-2 z-10 flex items-center gap-2 text-xs">
      <span className="border border-zinc-700 text-zinc-400 px-2 py-1 rounded-xs">
        ROOM <span className="text-cyan-400 tracking-widest">{code}</span>
      </span>
      <Button className="px-2 py-1" onClick={copy} ariaLabel="Copy room link">
        {copied ? "COPIED" : "COPY LINK"}
      </Button>
    </div>
  );
}
