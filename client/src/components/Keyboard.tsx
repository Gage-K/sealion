import { getOctave } from "../utils/utils";
// import type { Octave } from "../utils/utils";
import { useState } from "react";
import Pad from "./Pad";
import * as Tone from "tone";

export default function Keyboard() {
  const [currentOctave, setCurrentOctave] = useState(4);
  const [currentNotes, setCurrentNotes] = useState(getOctave(currentOctave));

  const synth = new Tone.Synth().toDestination();

  const renderOctaveController = () => {
    return (
      <div className="control-container">
        <h3>Octave {currentOctave}</h3>
        <button
          className="px-2 bg-neutral-100 rounded-sm mr-2 hover:bg-neutral-200 active:bg-neutral-300"
          aria-label={`decrease octave to ${currentOctave - 1}`}
          onClick={() => handleOctaveChange(currentOctave - 1)}>
          -
        </button>
        <button
          className="px-2 bg-neutral-100 rounded-sm mr-2 hover:bg-neutral-200 active:bg-neutral-300"
          aria-label={`increase octave to ${currentOctave + 1}`}
          onClick={() => handleOctaveChange(currentOctave + 1)}>
          +
        </button>
      </div>
    );
  };

  const renderKeyboard = () => {
    return (
      <section className="keyboard">
        {renderOctaveController()}
        {currentNotes.map((note) => (
          <Pad
            key={note}
            aria={note}
            name={note}
            action={() => synth.triggerAttackRelease(note, "20n")}
          />
        ))}
      </section>
    );
  };

  function handleOctaveChange(targetOctave: number) {
    // possible octaves only exist in range of 0–8
    const min: number = 0;
    const max: number = 8;
    if (targetOctave >= min && targetOctave <= max) {
      setCurrentOctave(targetOctave);
      setCurrentNotes(getOctave(targetOctave));
    }
  }

  return <>{renderKeyboard()}</>;
}
