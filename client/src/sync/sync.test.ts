import { describe, it, expect } from "vitest";
import { makeDrumSynthCRDT } from "../config/makeCRDT";
import { InMemoryHub, InMemoryTransport } from "./InMemoryTransport";

/**
 * Wire a CRDT to a transport exactly as SyncProvider does: broadcast local
 * changes, merge remote state. Returns both so a test can drive the transport
 * (e.g. requestState) directly.
 */
function connect(id: string, hub: InMemoryHub) {
  const crdt = makeDrumSynthCRDT(id);
  const transport = new InMemoryTransport(hub, {
    peerId: crdt.id,
    getState: () => crdt.state,
  });
  transport.onRemote((state) => crdt.merge(state));
  crdt.subscribeLocal(() => transport.broadcast(crdt.state));
  return { crdt, transport };
}

describe("sync seam", () => {
  it("converges: a local change on one peer reaches the others", () => {
    const hub = new InMemoryHub();
    const a = connect("A", hub);
    const b = connect("B", hub);

    // A global setting.
    a.crdt.globalSettings.setBPM(140);
    expect(b.crdt.getBpm()).toBe(140);

    // A step edit. Track 0's default pattern leaves step index 1 off, so this
    // turns it on; B must see the same.
    a.crdt.tracks[0].sequence.toggleStep(1);
    expect(b.crdt.getSequenceGrid()[0][1]).toBe(true);
    expect(b.crdt.getSequenceGrid()[0][1]).toBe(
      a.crdt.getSequenceGrid()[0][1]
    );
  });

  it("resolves concurrent edits to the same register deterministically (LWW tie-break)", () => {
    // Same logical timestamp (each register's first write is ts 1), different
    // peer ids. The larger peer id wins the tie, so both converge to B's value.
    const a = makeDrumSynthCRDT("A");
    const b = makeDrumSynthCRDT("B");

    a.tracks[0].sequence.setStep(1, [true]);
    b.tracks[0].sequence.setStep(1, [false]);

    const aState = a.state;
    const bState = b.state;
    a.merge(bState);
    b.merge(aState);

    expect(a.getSequenceGrid()[0][1]).toBe(b.getSequenceGrid()[0][1]);
    expect(a.getSequenceGrid()[0][1]).toBe(false); // peer "B" > "A" wins
  });

  it("does not re-broadcast an applied merge (no echo)", () => {
    const a = makeDrumSynthCRDT("A");
    const b = makeDrumSynthCRDT("B");

    a.tracks[0].sequence.toggleStep(1);
    a.globalSettings.setBPM(150);

    let localFires = 0;
    let renderFires = 0;
    b.subscribeLocal(() => localFires++);
    b.subscribe(() => renderFires++);

    b.merge(a.state);

    expect(localFires).toBe(0); // merge must not fire the local channel
    expect(renderFires).toBeGreaterThan(0); // but it must update the UI
    expect(b.getBpm()).toBe(150);
  });

  it("does not loop when two wired peers exchange a change", () => {
    // If merge echoed, this would recurse until the stack blew. Reaching the
    // assertion is the real check.
    const hub = new InMemoryHub();
    const a = connect("A", hub);
    const b = connect("B", hub);

    a.crdt.globalSettings.setSwing(0.5);

    expect(b.crdt.getSwing()).toBe(0.5);
  });

  it("serves current state to a peer that joins late (requestState)", () => {
    const hub = new InMemoryHub();
    const a = connect("A", hub);
    a.crdt.globalSettings.setBPM(128);

    const c = connect("C", hub);
    c.transport.requestState();

    expect(c.crdt.getBpm()).toBe(128);
  });
});
