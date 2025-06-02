// import * as Tone from "tone";
import { useState } from "react";

// import Keyboard from "./components/Keyboard";
import Metronome from "./components/Metronome";
import Sequencer from "./components/Sequencer";
import { useClock } from "./hooks/useClock";

function App() {
  const [tempo, setTempo] = useState<number>(120);
  const [timeSignature, setTimeSignature] = useState<number>(4);
  const [sequenceLength, setSequenceLength] = useState<number>(16);
  const { isPlaying, togglePlay, currentNote } = useClock({ tempo });

  return (
    <>
      <div className="px-16 grid place-items-center gap-4 mt-30">
        {/* <button onClick={togglePlay}>{isPlaying ? "Stop" : "Start"}</button>
        <p>{currentNote}</p> */}
        <Metronome
          tempo={tempo}
          setTempo={setTempo}
          timeSignature={timeSignature}
          setTimeSignature={setTimeSignature}
          sequenceLength={sequenceLength}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          currentNote={currentNote}
        />
        {/* <Sequencer>
          <></>
        </Sequencer> */}

        {/* <h2 className="font-bold text-xl">Metronome</h2>
        <Metronome /> */}
      </div>
    </>
  );
}

export default App;
