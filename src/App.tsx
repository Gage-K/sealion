import Keyboard from "./components/Keyboard";
import * as Tone from "tone";
import { useState } from "react";

function App() {
  const [runningAudio, setRunningAudio] = useState(false);

  async function runAudio() {
    await Tone.start();
    setRunningAudio(true);
  }

  const clock = new Tone.Clock((time) => {
    console.log(time);
  }, 1);

  clock.start();

  return (
    <>
      <div className="px-16">
        <h1 className="font-bold text-xl">Tone.js Playground</h1>
        <button onClick={async () => runAudio()}>Run audio</button>
        {runningAudio && (
          <>
            <Keyboard />
          </>
        )}
      </div>
    </>
  );
}

export default App;
