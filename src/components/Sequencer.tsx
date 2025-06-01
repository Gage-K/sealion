import * as Tone from "tone";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Pause, Play } from "phosphor-react";

interface SequencerProps {
  children: React.ReactNode;
}

interface Clock {
  tempo: number; // i.e., bpm
  beats: number; // num of beats each measure
  totalSteps: number;
  swing: number; // off-beat skew metric (percentage 0–100)
}

interface Step {
  stepNum: number; // position in sequence
  status: boolean; // active/inactive
  // velocity
}

interface Track {
  name: string;
  instrument: string;
  steps: Step[];
  // volume
}

type Sequence = Track[];
const defaultSequence: Sequence = Array.from({ length: 8 }).map(
  (track, index) => {
    const newTrack: Track = {
      name: (index + 1).toString(),
      instrument: (index + 1).toString(),
      steps: Array.from({ length: 16 }, (_, i) => ({
        stepNum: i + 1,
        status: false,
      })),
    };
    return newTrack;
  }
);

Tone.start();

const synth = new Tone.MembraneSynth().toDestination();
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
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [tempo, setTempo] = useState<number>(120);
  const [timeSignature, setTimeSignature] = useState<number>(4);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [sequence, setSequence] = useState<Sequence>(defaultSequence);

  const sequenceLength = timeSignature * 4;

  const clockWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Create the worker ONCE on mount
    clockWorkerRef.current = new Worker("../../build/workers/clock.js");
    const clockWorker = clockWorkerRef.current;

    return () => {
      clockWorker?.terminate();
    };
  }, [isPlaying, tempo]);

  useEffect(() => {
    const clockWorker = clockWorkerRef.current;
    if (!clockWorker) return;

    const clockData: Clock = {
      tempo: tempo,
      beats: timeSignature,
      totalSteps: sequenceLength,
      swing: 50,
    };

    function handleMessage(e: MessageEvent) {
      setCurrentStep(e.data.step);
    }

    if (isPlaying) {
      clockWorker.postMessage(clockData);
      clockWorker.addEventListener("message", handleMessage);
    } else {
      clockWorker.removeEventListener("message", handleMessage);
      setCurrentStep(1);
    }

    return () => {
      clockWorker.removeEventListener("message", handleMessage);
    };
  }, [isPlaying, tempo, timeSignature, sequenceLength]);

  function getTrackStatus(trackIndex: number) {
    const track = sequence[trackIndex];
    if (track) {
      return track.steps[currentStep - 1].status;
    }
    return false;
  }

  useCallback(() => {
    sequence.map((track) => {
      // const trackName: string = track[0];
      if (isPlaying === false) return;
      // if (getTrackStatus(trackName)) {
      //   switch (true) {
      //     case trackName === "track1":
      //       synth.triggerAttackRelease("C0", "8n");
      //       break;
      //     case trackName === "track2":
      //       synth.triggerAttackRelease("E0", "8n");
      //       break;
      //     case trackName === "track3":
      //       synth.triggerAttackRelease("F0", "8n");
      //       break;
      //     case trackName === "track4":
      //       synth.triggerAttackRelease("A0", "8n");
      //       break;
      //     case trackName === "track5":
      //       synth.triggerAttackRelease("B0", "8n");
      //       break;
      //   }
      // }
    });
  }, [currentStep, isPlaying]);

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

  const handleStepClick = (trackIndex: number, stepIndex: number) => {
    setSequence((prevSequence) => {
      // Get the current track
      const currentTrack = prevSequence[trackIndex];

      // Map over steps and toggle the status at stepIndex
      const updatedSteps = currentTrack.steps.map((step, index) => {
        if (index === stepIndex - 1) {
          return { ...step, status: !step.status };
        }
        return step;
      });

      const updatedTrack = { ...currentTrack, steps: updatedSteps };

      const updatedSequence = sequence.map((prevTrack, index) =>
        index === trackIndex ? updatedTrack : prevTrack
      );

      return updatedSequence;
    });
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

      <div className="flex gap-2 flex-col">
        {sequence.map((track, index) => {
          const trackName = track.name;
          const trackTitle = track.instrument;
          const trackSteps = track.steps;

          return (
            <div className="grid grid-cols-17 gap-2" key={index}>
              <h3>{trackTitle}</h3>
              {trackSteps.map((step: Step) => (
                <button
                  onClick={() => handleStepClick(index, step.stepNum)}
                  key={step.stepNum}
                  aria-label={`Step ${step.stepNum} ${
                    step.status ? "active" : "inactive"
                  }`}
                  className={`w-8 h-8 rounded-sm cursor-pointer ${
                    step.status === true && step.stepNum === currentStep
                      ? "bg-blue-400/50"
                      : step.status === true
                      ? "bg-blue-400"
                      : step.stepNum === currentStep
                      ? "bg-neutral-400"
                      : "bg-neutral-300"
                  }`}></button>
              ))}
            </div>
          );
        })}
      </div>
      {children}
    </>
  );
}
