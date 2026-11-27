# sealion

A collaborative drum machine: multiple peers edit one shared step sequencer in real time, each hearing the same pattern played through their own audio output.

## Language

### Sequencing

**Track**:
One drum voice and the settings that shape it — its sound, envelope, effects, and mixer level. A session has a fixed set (KICK, SNR, …).
_Avoid_: channel, instrument, lane.

**Step**:
One of the 16 slots in a track's row, either active or silent. On each pass the playhead triggers the track's voice wherever the step is active.
_Avoid_: cell, tick, note.

**Sequence**:
The live 16-step row of a single track — the steps as peers have edited them.
_Avoid_: grid (the grid is all tracks' sequences together), row.

**Pattern**:
A seeded default sequence for a track (e.g. a starting groove). It shows through only for steps no peer has touched; any edit or merge takes precedence.
_Avoid_: preset, default (when you mean the sound), template.

**Effect**:
An insert processor in a track's signal chain (delay, reverb, chorus, distortion, filter). Ordered, individually bypassable, and synced like any other track setting.
_Avoid_: plugin, filter (filter is one specific effect), FX node.

### Collaboration

**Peer**:
One connected client in a shared session, identified by a stable id. Every peer holds the whole session state and may edit any of it.
_Avoid_: client, user, node, player.

**Local change**:
A state edit that originates on this peer. It is broadcast to every other peer. Distinct from a merge, which must never be re-broadcast.
_Avoid_: update, write, mutation.

**Merge**:
Integrating a remote peer's state into this peer's own, with conflicts resolved last-write-wins. A merge updates what is shown and played but is not itself a local change.
_Avoid_: sync, apply, patch.

**SyncTransport**:
The seam through which peers exchange session state — it carries a local change out and delivers remote state in. The production transport is a WebSocket; an in-memory transport stands in for it in tests.
_Avoid_: socket, connection, channel, network layer.
