interface Props {
  step: number | null;
}

const metronomeStyles = `w-2 h-2 m-auto rounded-3xl`;
export default function Metronome({ step }: Props) {
  const test = Array.from({ length: 16 }).fill((_: null, i: number) => i);
  return (
    <>
      <div className="grid grid-cols-17 gap-2">
        {test.map((item, index) => (
          <div
            className={
              index === step && step % 4 === 0
                ? `bg-orange-400 ${metronomeStyles}`
                : index === step
                ? `bg-green-400 ${metronomeStyles}`
                : `bg-neutral-300 ${metronomeStyles}`
            }
            key={index}></div>
        ))}
      </div>
    </>
  );
}

/*
// interface Clock {
//   tempo: number; // i.e., bpm
//   beats: number; // num of beats each measure
//   totalSteps: number;
//   swing: number; // off-beat skew metric (percentage 0–100)
// }

// const ticker = new Tone.MembraneSynth().toDestination();
// const dotStyle =
//   "w-4 h-4 rounded-sm border-b inset-shadow-sm ease-in-out duration-100";

// const styles = {
//   dotInactive: `${dotStyle} bg-neutral-200 border-b-neutral-100`,
//   dotActive: `${dotStyle} bg-cyan-200 border-b-cyan-100 shadow-cyan-200/50`,
//   dotActiveStart: `${dotStyle} bg-orange-400 border-b-orange-300 shadow-orange-400/50`,
//   input: "bg-neutral-100 px-2 py-1 rounded-sm",
//   label: "font-medium",
//   roundButton:
//     "bg-neutral-200 p-4 rounded-3xl hover:bg-neutral-300 hover:cursor-pointer hover:shadow-sm active:bg-neutral-100",
// };

// interface Props {
//   tempo: number;
//   setTempo: (tempo: number) => void;
//   timeSignature: number;
//   setTimeSignature: (timeSignature: number) => void;
//   sequenceLength: number;
//   isPlaying: boolean;
//   currentNote: number | null;
//   togglePlay: () => void;
// }

// export default function Metronome({
//   tempo,
//   setTempo,
//   timeSignature,
//   setTimeSignature,
//   sequenceLength,
//   isPlaying,
//   currentNote,
//   togglePlay,
// }: Props) {
//   useEffect(() => {
//     console.log(performance.now());
//     if (isPlaying && currentNote !== null) {
//       if (currentNote % 4 === 0) {
//         ticker.triggerAttackRelease("C3", "32n");
//       } else if (currentNote % 4 === 2) {
//         ticker.triggerAttackRelease("C1", "32n");
//       }
//     }
//   }, [currentNote]);

//   const sequence = useRef([...Array(sequenceLength).keys()]);

//   const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newTempo = parseInt(e.target.value);
//     setTempo(newTempo);
//   };

//   const handleTimeSignatureChange = (
//     e: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const newTimeSignature = parseInt(e.target.value);
//     setTimeSignature(newTimeSignature);
//   };

//   return (
//     <>
//       <form className="flex gap-4 items-center">
//         <label htmlFor="tempo" className={styles.label}>
//           Tempo
//         </label>
//         <input
//           id="tempo"
//           className={styles.input}
//           type="number"
//           min="30"
//           max="240"
//           value={tempo}
//           onChange={handleTempoChange}
//         />

//         <label htmlFor="time-signature" className={styles.label}>
//           Beats
//         </label>
//         <input
//           id="time-signature"
//           className={styles.input}
//           type="number"
//           min="1"
//           max="8"
//           value={timeSignature}
//           onChange={handleTimeSignatureChange}
//         />
//       </form>

//       <button
//         className={styles.roundButton}
//         aria-label={`${isPlaying ? "Pause" : "Play"} Audio`}
//         onClick={togglePlay}>
//         {isPlaying ? <Pause size={16} /> : <Play size={16} />}
//       </button>

//       <div className="flex gap-2">
//         {sequence.current.map((step, index) => {
//           return (
//             <div
//               key={index}
//               className={`${
//                 step % timeSignature === 0 && step === currentNote
//                   ? styles.dotActiveStart
//                   : step === currentNote
//                   ? styles.dotActive
//                   : styles.dotInactive
//               }`}></div>
//           );
//         })}
//       </div>
//     </>
//   );
// }
*/
