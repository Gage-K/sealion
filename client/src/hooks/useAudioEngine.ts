import { createContext, useContext } from "react";
import type { AudioEngine } from "../audio/AudioEngine";

export const AudioEngineContext = createContext<AudioEngine | null>(null);

export const useAudioEngine = () => {
  const engine = useContext(AudioEngineContext);
  if (!engine) {
    throw new Error("useAudioEngine must be used within an AudioEngineProvider");
  }
  return engine;
};
