import { DrumSynthCRDT, type TrackDefault } from "@sealion/crdt";
import { DRUM_SYNTH_CONFIG } from "./drumSynthConfig";

/**
 * The per-track seeds this client builds documents with, derived from the drum
 * kit config. The shared @sealion/crdt package is deliberately config-free, so
 * the client injects these; the server supplies the equivalent kit on its side.
 */
export const TRACK_DEFAULTS: TrackDefault[] = DRUM_SYNTH_CONFIG.map((c) => ({
  envelope: c.envelope,
  pattern: c.pattern,
}));

type CRDTState = ConstructorParameters<typeof DrumSynthCRDT>[2];

/** Create a DrumSynthCRDT seeded with this client's drum kit defaults. */
export function makeDrumSynthCRDT(id: string, state?: CRDTState) {
  return new DrumSynthCRDT(id, TRACK_DEFAULTS, state);
}
