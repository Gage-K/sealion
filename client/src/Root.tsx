import Lobby from "./components/Lobby";
import RoomView from "./components/RoomView";
import { codeFromPath } from "./config/server";
import { usePathname } from "./routing";

/**
 * The app shell: `/room/<code>` renders that room, anything else the lobby
 * (design D5). RoomView is keyed by code so switching rooms fully remounts the
 * provider stack onto a fresh document.
 */
export default function Root() {
  const pathname = usePathname();
  const code = codeFromPath(pathname);

  if (!code) return <Lobby />;
  return <RoomView key={code} code={code} />;
}
