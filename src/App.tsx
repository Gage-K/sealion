// import * as Tone from "tone";
// import { useState } from "react";

// import Keyboard from "./components/Keyboard";
// import Metronome from "./components/Metronome";
import Sequencer from "./components/Sequencer";
import { useClock } from "./hooks/useClock";

function App() {
  const { isPlaying, togglePlay, currentNote } = useClock();

  return (
    <>
      <div className="px-16 grid place-items-center gap-4 mt-30">
        <button onClick={togglePlay}>{isPlaying ? "Stop" : "Start"}</button>
        <p>{currentNote}</p>
        <Sequencer>
          <></>
        </Sequencer>

        {/* <h2 className="font-bold text-xl">Metronome</h2>
        <Metronome /> */}
      </div>
    </>
  );
}

export default App;
