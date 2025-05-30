import * as Tone from "tone";

import { useState, useEffect } from "react";
import { Pause, Play } from "phosphor-react";
// import Pad from "./Pad";

interface SequencerProps {
  children: React.ReactNode;
}

interface Clock {
  tempo: number; // i.e., bpm
  beats: number; // num of beats each measure
  totalSteps: number;
  swing: number; // off-beat skew metric (percentage 0–100)
}

type Track = boolean[];

interface Sequence {
  // volume
  // eventually, objects instead of booleans with data like volume, velocity, etc.
  track1: Track;
  track2: Track;
}

const ticker = new Tone.Synth().toDestination();
const dotStyle =
  "w-4 h-4 rounded-sm border-b inset-shadow-sm ease-in-out duration-100";

const styles = {
  dotInactive: `${dotStyle} bg-neutral-200 border-b-neutral-100`,
  dotActive: `${dotStyle} bg-cyan-200 border-b-cyan-100 shadow-cyan-200/50`,
  dotActiveStart: `${dotStyle} bg-orange-400 border-b-orange-300 shadow-orange-400/50`,
  input: "bg-neutral-100 px-2 py-1 rounded-sm",
  label: "font-medium",
  roundButton:
    "bg-neutral-200 p-4 rounded-3xl hover:bg-neutral-300 hover:cursor-pointer hover:shadow-sm active:bg-neutral-100",
};

export default function Sequencer({ children }: SequencerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState(4);
  const [currentStep, setCurrentStep] = useState(1);

  const sequenceLength = timeSignature * 4;

  const generateTrack = (timeSignature: number) => {
    const length = timeSignature * 4;
    const track: Track = Array(length).fill(false);
    return track;
  };

  const [track, setTrack] = useState(generateTrack(timeSignature));

  // const defaultSequence: Sequence = {
  //   track1: generateTrack(timeSignature),
  //   track2: generateTrack(timeSignature),
  // };

  // const [sequence, setSequence] = useState(defaultSequence);

  // TODO:
  // - clicking on button updates state for that button
  // - grid for each track
  // - play back for each grid item on the track should be synced

  useEffect(() => {
    const clockData: Clock = {
      tempo: tempo,
      beats: timeSignature,
      totalSteps: sequenceLength,
      swing: 50,
    };

    const clockWorker = new Worker("../../build/workers/clock.js");
    Tone.start();

    if (isPlaying) {
      clockWorker.postMessage(clockData);

      clockWorker.onmessage = (e) => {
        setCurrentStep(e.data.step);
        if (track[e.data.step - 1] === true)
          ticker.triggerAttackRelease("C5", "64n");
      };
    }

    return () => {
      clockWorker.terminate();
      setCurrentStep(1);
    };
  }, [isPlaying, tempo, timeSignature, sequenceLength, track]);

  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = parseInt(e.target.value);
    setTempo(newTempo);
  };

  const handleTimeSignatureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newTimeSignature = parseInt(e.target.value);
    setTimeSignature(newTimeSignature);
  };

  // const handleStepClick = (index: number) => {
  //   setSequence((prev: Sequence) => {
  //     return {
  //       ...prev,
  //       track1: [...prev.track1, (prev.track1[index] = !prev.track1[index])],
  //     };
  //   });
  // };
  const handleStepClick = (index: number) => {
    console.log(track[index]);
    setTrack((prev) =>
      prev.map((element, i) => {
        if (i === index) {
          return !element;
        } else {
          return element;
        }
      })
    );
  };

  return (
    <>
      <h2 className="font-bold text-xl">Sequencer</h2>
      <form className="flex gap-4 items-center">
        <label htmlFor="tempo" className={styles.label}>
          Tempo
        </label>
        <input
          id="tempo"
          className={styles.input}
          type="number"
          min="60"
          max="240"
          value={tempo}
          onChange={handleTempoChange}
        />

        <label htmlFor="time-signature" className={styles.label}>
          Beats
        </label>
        <input
          id="time-signature"
          className={styles.input}
          type="number"
          min="1"
          max="8"
          value={timeSignature}
          onChange={handleTimeSignatureChange}
        />
      </form>
      <button
        className={styles.roundButton}
        aria-label={`${isPlaying ? "Pause" : "Play"} Audio`}
        onClick={() => {
          setIsPlaying((isPlaying) => !isPlaying);
        }}>
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div className="flex gap-2">
        <div className="flex gap-2 items-center">
          <h3>Track 1</h3>
          {track.map((step, index) => {
            return (
              <button
                key={index + 1}
                onClick={() => handleStepClick(index)}
                className={`w-8 h-8 rounded-sm cursor-pointer ${
                  track[index] === true
                    ? "bg-blue-400"
                    : index + 1 === currentStep
                    ? "bg-red-400"
                    : "bg-neutral-300"
                }`}></button>
            );
          })}
        </div>
      </div>
      {children}
    </>
  );
}

//   function playTestSound(): void {
//     const synth = new Tone.Synth().toDestination();

//     synth.triggerAttackRelease("C4", "8n");
//   }

//   return (
//     <>
//       <h2 className="font-bold text-xl">Sequencer</h2>
//       <Pad aria="test" action={() => playTestSound()} name="test" />
//       {children}
//       <button
//         className="px-4 py-2 bg-indigo-800 text-neutral-50 rounded-sm"
//         onClick={playTestSound}>
//         Test Sound
//       </button>
//     </>
//   );
// }
