import * as Tone from "tone";
import Pad from "./Pad";

interface SequencerProps {
  children: React.ReactNode;
}

export default function Sequencer({ children }: SequencerProps) {
  function playTestSound(): void {
    const synth = new Tone.Synth().toDestination();

    synth.triggerAttackRelease("C4", "8n");
  }

  return (
    <>
      <h1 className="text-5xl font-bold">Sequencer</h1>
      <Pad aria="test" action={() => playTestSound()} name="test" />
      {children}
      <button
        className="px-4 py-2 bg-indigo-800 text-neutral-50 rounded-sm"
        onClick={playTestSound}>
        Test Sound
      </button>
    </>
  );
}
