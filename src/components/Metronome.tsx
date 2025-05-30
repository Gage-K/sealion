import { useState, useEffect } from "react";
import * as Tone from "tone";
import { Play, Pause } from "phosphor-react";

interface Clock {
  tempo: number; // i.e., bpm
  beats: number; // num of beats each measure
  totalSteps: number;
  swing: number; // off-beat skew metric (percentage 0–100)
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

export default function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState(4);
  const [currentStep, setCurrentStep] = useState(1);

  const sequenceLength = timeSignature * 4;
  const sequence = Array(sequenceLength)
    .fill(0)
    .map((_, i) => i + 1);

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
        if (e.data.isFirstBeat) {
          ticker.triggerAttackRelease("C5", "64n");
        } else {
          ticker.triggerAttackRelease("C4", "64n");
        }
      };
    }

    return () => {
      clockWorker.terminate();
      setCurrentStep(1);
    };
  }, [isPlaying, tempo, timeSignature, sequenceLength]);

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

  return (
    <>
      <form className="flex gap-4 items-center">
        <label htmlFor="tempo" className={styles.label}>
          Tempo
        </label>
        <input
          id="tempo"
          className={styles.input}
          type="number"
          min="30"
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
        {sequence.map((step, index) => {
          return (
            <div
              key={index}
              className={`${
                (step - 1) % timeSignature === 0 && step === currentStep
                  ? styles.dotActiveStart
                  : step === currentStep
                  ? styles.dotActive
                  : styles.dotInactive
              }`}></div>
          );
        })}
      </div>
    </>
  );
}
