import { useEffect, useRef, useState } from "react";

export function useClock() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // Is the clock currently counting?
  const [currentNote, setCurrentNote] = useState<number | null>(null); // What is the note/step (0–16 | null)?

  const audioContextRef = useRef<AudioContext | null>(null); // Initializes an audio context preserved between renders
  const unlockedRef = useRef(false); // Unlocks audio context for mobile specific environments
  const current16thNoteRef = useRef<number>(0); // Tracks the next 16th note that will be scheduled
  const nextNoteTimeRef = useRef<number>(0); // AudioContext-specific time for when the next note is scheduled to play
  const notesInQueueRef = useRef<{ note: number; time: number }[]>([]); // List representing a queue of scheduled notes to play
  const clockWorkerRef = useRef<Worker | null>(null); // ClockWorker Web Worker ref preserved between renders

  // TODO: Make tempo, lookahead, and noteResolution states taken in as props to the hook.
  const tempo = 80; // In beats per minute
  const lookahead = 25; // In ms; frequencey to call scheduling function
  const scheduleAheadTime = 0.1; // In seconds
  const noteLength = 0.05; // In seconds
  const noteResolution: 0 | 1 | 2 = 0; // 0: 16th, 1: 8th, 2: quarter

  useEffect(() => {
    // Fires on first mount
    // Creates a web worker preserved between renders with a Ref
    // Awaits "tick" message from worker
    // When received, a note is scheduled to the Web Audio API
    // Posts message to worker about the look ahead time
    // Cleans up worker on unmount

    const clockWorker = new Worker("../../build/workers/clockWorker.js");
    clockWorker.onmessage = (e) => {
      if (e.data === "tick") {
        scheduler();
      }
    };
    clockWorker.postMessage({ interval: lookahead });
    clockWorkerRef.current = clockWorker;

    return () => {
      clockWorker.terminate();
    };
  }, []);

  function nextNote() {
    // Given the current tempo, calculate how much time a beat ought to take
    // Advance the note index
    console.log("next note");
    const secondsPerBeat = 60 / tempo;
    nextNoteTimeRef.current += 0.25 * secondsPerBeat;
    current16thNoteRef.current = (current16thNoteRef.current + 1) % 16;
  }

  function scheduleNote(beatNumber: number, time: number) {
    // Adds note to queue
    // Skips scheduling note to play if the resolution calls to skip them (e.g., play only quarter notes, eighth, etc.)
    // Early return if audio context does not exist

    notesInQueueRef.current.push({ note: beatNumber, time: time });

    if (
      (noteResolution === 1 && beatNumber % 2) ||
      (noteResolution === 2 && beatNumber % 4)
    )
      return;
    const context = audioContextRef.current;
    if (!context) return;

    console.log("tick");
    // Here add connection to Tone.js to play sounds.

    const osc = context.createOscillator();
    osc.connect(context.destination);

    if (beatNumber % 16 === 0) osc.frequency.value = 880.0;
    else if (beatNumber % 4 === 0) osc.frequency.value = 440.0;
    else osc.frequency.value = 220.0;

    osc.start(time);
    osc.stop(time + noteLength);
  }

  function scheduler() {
    // Fires on each 'tick' from worker
    // First ensures that audio context exists from Web Audio API
    // If we are currently within the lookahead window, continuously schedule notes to play
    // If we are currently outside the lookahead window, update the note queue

    const context = audioContextRef.current;
    if (!context) return;

    while (nextNoteTimeRef.current < context.currentTime + scheduleAheadTime) {
      scheduleNote(current16thNoteRef.current, nextNoteTimeRef.current);
      nextNote();
    }

    const currentTime = context.currentTime;

    while (
      notesInQueueRef.current.length &&
      notesInQueueRef.current[0].time < currentTime
    ) {
      setCurrentNote(notesInQueueRef.current[0].note);
      notesInQueueRef.current.shift();
    }
  }

  function togglePlay() {
    console.log("toggling");
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (!unlockedRef.current) {
      const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
      const node = audioContextRef.current.createBufferSource();
      node.buffer = buffer;
      node.start(0);
      unlockedRef.current = true;
    }

    if (!isPlaying) {
      current16thNoteRef.current = 0;
      nextNoteTimeRef.current = audioContextRef.current.currentTime;
      clockWorkerRef.current?.postMessage("start");
    } else {
      clockWorkerRef.current?.postMessage("stop");
    }

    setIsPlaying(!isPlaying);
  }

  return { isPlaying, togglePlay, currentNote };
}
