import { useSyncExternalStore } from "react";
import type { Envelope, Mixer } from "../types/crdt";
import type { TrackEffectsMap } from "../types/effects";
import { useCRDT } from "./useCRDT";
import { useAudioEngine } from "./useAudioEngine";

/**
 * Reactive reads of external stores via useSyncExternalStore. Each hook
 * subscribes to a store and reads one slice; no state is mirrored into
 * useState, so there's a single source of truth and renders are tear-free.
 */

// --- Engine-owned state (local to this client) ---------------------------

export function useIsPlaying(): boolean {
  const engine = useAudioEngine();
  return useSyncExternalStore(engine.subscribe, engine.getIsPlaying);
}

export function useVolume(): number {
  const engine = useAudioEngine();
  return useSyncExternalStore(engine.subscribe, engine.getVolume);
}

export function useCurrentStep(): number | null {
  const engine = useAudioEngine();
  const isPlaying = useSyncExternalStore(engine.subscribe, engine.getIsPlaying);
  const beat = useSyncExternalStore(engine.subscribe, engine.getBeat);
  return isPlaying ? beat : null;
}

// --- CRDT-owned state (collaborative, synced across clients) --------------

export function useBpm(): number {
  const crdt = useCRDT();
  return useSyncExternalStore(crdt.subscribe, crdt.getBpm);
}

export function useSwing(): number {
  const crdt = useCRDT();
  return useSyncExternalStore(crdt.subscribe, crdt.getSwing);
}

export function useEnvelopes(): Envelope[] {
  const crdt = useCRDT();
  return useSyncExternalStore(crdt.subscribe, crdt.getEnvelopes);
}

export function useSequenceGrid(): boolean[][] {
  const crdt = useCRDT();
  return useSyncExternalStore(crdt.subscribe, crdt.getSequenceGrid);
}

export function usePan(): number {
  const crdt = useCRDT();
  return useSyncExternalStore(crdt.subscribe, crdt.getPan);
}

export function useTrackEffects(): TrackEffectsMap[] {
  const crdt = useCRDT();
  return useSyncExternalStore(crdt.subscribe, crdt.getTrackEffects);
}

export function useTrackMixers(): Mixer[] {
  const crdt = useCRDT();
  return useSyncExternalStore(crdt.subscribe, crdt.getTrackMixers);
}
