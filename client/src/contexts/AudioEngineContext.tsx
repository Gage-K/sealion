import { useEffect, useRef } from "react";
import { AudioEngine } from "../audio/AudioEngine";
import { useCRDT } from "../hooks/useCRDT";
import { AudioEngineContext } from "../hooks/useAudioEngine";

/**
 * Owns the single AudioEngine instance for the whole tree (dependency
 * injection). The context value is a stable instance reference, so consumers
 * never re-render from the provider itself; instead they read slices of the
 * engine via useSyncExternalStore instead. Nest inside CRDTProvider.
 */
export const AudioEngineProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const crdt = useCRDT();

  const engineRef = useRef<AudioEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new AudioEngine();
  }
  const engine = engineRef.current;

  useEffect(() => {
    engine.init(crdt);
    return () => engine.dispose();
  }, [engine, crdt]);

  return (
    <AudioEngineContext.Provider value={engine}>
      {children}
    </AudioEngineContext.Provider>
  );
};
