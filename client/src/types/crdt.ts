// The CRDT now lives in the shared @sealion/crdt package so the sync server can
// run the same document code. This module is kept as a thin re-export so the
// client's existing `../types/crdt` imports (DrumSynthCRDT, Envelope, Mixer,
// Step, GlobalSettings, …) keep resolving unchanged.
//
// Don't call `new DrumSynthCRDT(...)` directly — it now requires the per-track
// defaults. Use `makeDrumSynthCRDT` from ../config/makeCRDT, which injects them
// from DRUM_SYNTH_CONFIG.
export * from "@sealion/crdt";
