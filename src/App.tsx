// import * as Tone from "tone";
import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";

// lib
import { type Sequence } from "./types/types";
import { getTrackOfNote, getTracksByScale } from "./utils/utils";
import { dotStyles } from "./lib/seqStyles";

// components
import Metronome from "./components/Metronome";

const CURRENT_MODE: "synth" | "drum" = "drum";

const cPentatonic: Sequence = getTracksByScale("C", 4, "pentatonic");

type DrumKit = [
  kick: Tone.MembraneSynth,
  snare: Tone.NoiseSynth,
  hihat: Tone.MetalSynth
];

// const drumKit: DrumKit = [kick, snare, hihat];

const kitSequence: Sequence = [
  getTrackOfNote("C", 1, "kick"),
  getTrackOfNote("C", 4, "snare"),
  getTrackOfNote("C", 1, "hihat"),
];

const DEFAULT_TRACK_SET: Sequence =
  CURRENT_MODE === "synth" ? cPentatonic : kitSequence;

// const createSynths = () => {
//   return DEFAULT_TRACK_SET.map(() => new Tone.Synth().toDestination());
// };

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBPM] = useState<number>(120);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [sequence, setSequence] = useState(DEFAULT_TRACK_SET);

  const beatRef = useRef(0);
  const sequenceRef = useRef(sequence);
  const synthsRef = useRef<
    (Tone.Synth | Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth)[]
  >([]);

  // sequence.forEach((track) => console.table(track));
  Tone.getTransport().bpm.value = bpm;

  const wsRef = useRef<WebSocket | null>(null);

  const localClientId = useRef(crypto.randomUUID());

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080"); // adjust port as needed
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WebSocket] Connected");
    };

    ws.onerror = (err) => {
      console.error("[WebSocket] Error:", err);
    };

    ws.onmessage = (event) => {
      try {
        const { trackIndex, stepIndex, clientId } = JSON.parse(event.data);
        console.log(localClientId.current === clientId);
        if (clientId === localClientId.current) return;
        console.log("Received message:", event.data);
        updateSequence(trackIndex, stepIndex);
      } catch (err) {
        console.error("[WebSocket] JSON.parse failed:", err);
      }
      // When we receive an incoming message
      // updateSequence with the instructions for how to change state
    };

    ws.onclose = () => {
      console.warn("[WebSocket] Connection closed");
      wsRef.current = null;
    };

    return () => {
      // ws.close();
    };
  }, []);

  useEffect(() => {
    if (CURRENT_MODE === "drum") {
      const kick = new Tone.MembraneSynth({
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.05 },
      }).toDestination();
      const hihat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      }).toDestination();

      const snare = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.05 },
      }).toDestination();

      synthsRef.current = [kick, snare, hihat];
      console.log("[Audio Init] Drum synths created...");
      return () => {
        console.log("[Audio Init] Drum synth unmounted...");
        synthsRef.current.forEach((synth) => synth.dispose());
        synthsRef.current = [];
      };
    } else {
      const synths = DEFAULT_TRACK_SET.map(() =>
        new Tone.Synth().toDestination()
      );
      synthsRef.current = synths;
      console.log("[Audio Init] Drum synths created...");

      return () => {
        console.log("[Audio Init] Drum synth unmounted...");
        synthsRef.current = [];
        synths.forEach((synth) => synth.dispose());
      };
    }
  }, []);

  // Handles logic for triggerign sounds on each repeat or tick of the clock
  // TODO: fix memory leak :(
  let repeatCount = 0;
  const repeat = useCallback((time: number) => {
    repeatCount++;
    console.log(`repeat call #${repeatCount}`);

    console.log("[Audio] Repeat started");
    setCurrentStep(beatRef.current);

    sequenceRef.current.forEach((track, index) => {
      const synth = synthsRef.current[index];
      const note = track.steps[beatRef.current];

      if (note.active) {
        if (CURRENT_MODE === "drum") {
          if (synth instanceof Tone.NoiseSynth) {
            synth.triggerAttackRelease("16n", time);
          } else if (synth instanceof Tone.MembraneSynth) {
            synth.triggerAttackRelease("C1", "16n", time);
          } else if (synth instanceof Tone.MetalSynth) {
            synth.triggerAttackRelease("C4", "16n", time);
          }
        } else {
          (synth as Tone.Synth).triggerAttackRelease(note.note, "16n", time);
        }
      }
    });

    beatRef.current = (beatRef.current + 1) % 16;
  }, []);
  const scheduled = useRef(false);

  // Creates clock on mount and cleans it up on unmount to avoid memory leak
  useEffect(() => {
    if (scheduled.current) return;
    scheduled.current = true;

    const id = Tone.getTransport().scheduleRepeat(repeat, "16n");

    return () => {
      Tone.getTransport().clear(id);
      scheduled.current = false;

      console.log("[Audio] Clearing transport");
    };
  }, [repeat]);

  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  // Updates playing state & current step position; Starts/stops audio
  const togglePlay = async () => {
    if (isPlaying) {
      Tone.getTransport().stop();
      Tone.getTransport().position = 0;
      setIsPlaying(false);
    } else {
      beatRef.current = 0;
      setCurrentStep(0);
      await Tone.start();
      Tone.getTransport().start();
      setIsPlaying(true);
    }
  };

  // TODO: add more checking to prevent numbers that break the BPM
  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newBPM = parseInt(e.target.value);
      setBPM(newBPM);
    } else {
      setBPM(30);
    }
  };

  // Updates whether status of step of a track is active/inactive
  const updateSequence = (trackIndex: number, stepIndex: number) => {
    setSequence((prevSequence) => {
      const currentTrack = prevSequence[trackIndex];

      const updatedSteps = currentTrack.steps.map((step, index) => {
        if (index === stepIndex) {
          return { ...step, active: !step.active };
        }
        return step;
      });

      const updatedSequence = prevSequence.map((prevTrack, index) =>
        index === trackIndex ? { ...prevTrack, steps: updatedSteps } : prevTrack
      );
      return updatedSequence;
    });
  };

  const handleSequenceChange = (trackIndex: number, stepIndex: number) => {
    updateSequence(trackIndex, stepIndex);

    const updateData = {
      trackIndex,
      stepIndex,
      clientId: localClientId.current,
    };
    wsRef.current?.send(JSON.stringify(updateData));
  };

  return (
    <>
      <div className="px-16 grid place-items-center gap-4 mt-30">
        <button onClick={togglePlay}>{isPlaying ? "Stop" : "Start"}</button>
        {/* <button onClick={sendWSMessage}>Send a WS Message</button> */}
        <form className="flex gap-4 items-center">
          <label htmlFor="tempo" className={dotStyles.label}>
            BPM
          </label>
          <input
            id="tempo"
            className={dotStyles.input}
            type="number"
            min="30"
            max="240"
            value={bpm}
            onChange={(e) => handleBPMChange(e)}
          />
        </form>

        <div className="flex gap-2 flex-col">
          <Metronome step={currentStep} />
          {sequence.map((track, trackIndex) => (
            <div className="grid grid-cols-17 gap-2" key={trackIndex}>
              {track.steps.map((step, stepIndex) => (
                <button
                  key={stepIndex}
                  onClick={() => handleSequenceChange(trackIndex, stepIndex)}
                  aria-label={`Step ${step.active ? "active" : "inactive"}`}
                  className={`w-8 h-8 rounded-sm cursor-pointer ${
                    step.active && stepIndex === currentStep
                      ? "bg-blue-400/50"
                      : step.active
                      ? "bg-blue-400"
                      : stepIndex === currentStep
                      ? "bg-neutral-400"
                      : "bg-neutral-300"
                  }`}></button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
