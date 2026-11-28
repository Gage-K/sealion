import { DrumSynthCRDT, DEFAULT_KIT, type TrackDefault } from "@sealion/crdt";
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

// The authoritative server builds its CRDT from @sealion/crdt's DEFAULT_KIT. If
// the client kit and the shared kit ever drift in track COUNT, the server would
// silently drop edits to the extra tracks when it merges. Fail loudly instead.
if (TRACK_DEFAULTS.length !== DEFAULT_KIT.length) {
  throw new Error(
    `Track count drift: client kit has ${TRACK_DEFAULTS.length} tracks, ` +
      `@sealion/crdt DEFAULT_KIT has ${DEFAULT_KIT.length}. Keep them in sync.`
  );
}

type CRDTState = ConstructorParameters<typeof DrumSynthCRDT>[2];

/** Create a DrumSynthCRDT seeded with this client's drum kit defaults. */
export function makeDrumSynthCRDT(id: string, state?: CRDTState) {
  return new DrumSynthCRDT(id, TRACK_DEFAULTS, state);
}
