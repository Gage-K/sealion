// import * as Tone from "tone";
// import { useState } from "react";

// import Keyboard from "./components/Keyboard";
import Metronome from "./components/Metronome";

function App() {
  // const [runningAudio, setRunningAudio] = useState(false);

  // async function runAudio() {
  //   await Tone.start();
  //   setRunningAudio(true);
  // }

  // const clock = new Tone.Clock((time) => {
  //   console.log(time);
  // }, 1);

  // clock.start();

  return (
    <>
      <div className="px-16 grid place-items-center gap-4 mt-30">
        <h1 className="font-bold text-xl">Metronome</h1>
        <Metronome />
      </div>
    </>
  );
}

export default App;
