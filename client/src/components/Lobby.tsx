import { useState } from "react";
import Button from "./core/NewButton";
import { createRoom, parseJoinInput, roomPath } from "../config/server";
import { getNickname, setNickname } from "../config/identity";
import { navigate } from "../routing";

/**
 * The entry screen (design D5): create a new room or join one by code/link.
 * No room means connected to nothing — you land here. The nickname is captured
 * for presence (Phase 3) and defaults to a random animal name.
 */
export default function Lobby() {
  const [nickname, setNick] = useState(getNickname);
  const [joinInput, setJoinInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const enterRoom = (code: string) => {
    setNickname(nickname);
    navigate(roomPath(code));
  };

  const handleCreate = async () => {
    setError(null);
    setCreating(true);
    try {
      const code = await createRoom();
      enterRoom(code);
    } catch {
      setError("Couldn't reach the server. Is it running?");
      setCreating(false);
    }
  };

  const handleJoin = () => {
    const code = parseJoinInput(joinInput);
    if (!code) {
      setError("That doesn't look like a valid room code.");
      return;
    }
    enterRoom(code);
  };

  const inputClass =
    "bg-transparent border border-zinc-600 text-zinc-100 px-2 py-1 " +
    "focus:outline-none focus:border-cyan-400 placeholder:text-zinc-600";

  return (
    <div className="bg-zinc-900 min-h-screen w-screen text-zinc-100 grid place-items-center text-sm">
      <div className="w-80 border border-zinc-600 rounded-sm p-6 flex flex-col gap-6">
        <h1 className="text-cyan-400 text-lg tracking-widest text-center">
          SEALION
        </h1>

        <label className="flex flex-col gap-1">
          <span className="text-zinc-400 text-xs">NICKNAME</span>
          <input
            className={inputClass}
            value={nickname}
            maxLength={24}
            onChange={(e) => setNick(e.target.value)}
            aria-label="Nickname"
          />
        </label>

        <Button active className="py-2 tracking-widest" onClick={handleCreate}>
          {creating ? "CREATING…" : "CREATE ROOM"}
        </Button>

        <div className="flex items-center gap-2 text-zinc-600 text-xs">
          <span className="flex-1 border-t border-zinc-700" />
          OR
          <span className="flex-1 border-t border-zinc-700" />
        </div>

        <div className="flex flex-col gap-2">
          <input
            className={`${inputClass} uppercase tracking-widest`}
            value={joinInput}
            placeholder="CODE OR LINK"
            onChange={(e) => {
              setJoinInput(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            aria-label="Room code or link"
          />
          <Button className="py-2 tracking-widest" onClick={handleJoin}>
            JOIN ROOM
          </Button>
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
