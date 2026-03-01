const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

const BLACK_KEY_INDICES = new Set([1, 3, 6, 8, 10]);

export default function Keyboard({
  octaves = 2,
  baseOctave = 3,
  onNoteDown,
  onNoteUp,
}: {
  octaves?: number;
  baseOctave?: number;
  onNoteDown?: (note: string) => void;
  onNoteUp?: (note: string) => void;
}) {
  const whiteKeys: { note: string; index: number }[] = [];
  const blackKeys: { note: string; position: number }[] = [];

  for (let oct = 0; oct < octaves; oct++) {
    let whiteIndex = -1;
    for (let i = 0; i < 12; i++) {
      const note = `${NOTE_NAMES[i]}${oct + baseOctave}`;
      if (BLACK_KEY_INDICES.has(i)) {
        blackKeys.push({
          note,
          position: oct * 7 + whiteIndex,
        });
      } else {
        whiteKeys.push({ note, index: oct * 7 + whiteIndex });
        whiteIndex++;
      }
    }
  }

  const totalWhite = whiteKeys.length;

  return (
    <div
      className="col-span-16 relative h-full select-none"
      role="group"
      aria-label="Piano keyboard"
    >
      <div className="flex h-full">
        {whiteKeys.map(({ note }) => (
          <button
            key={note}
            className="flex-1 border border-zinc-600 bg-zinc-900 cursor-pointer active:bg-zinc-500 hover:bg-zinc-800"
            onPointerDown={() => onNoteDown?.(note)}
            onPointerUp={() => onNoteUp?.(note)}
            onPointerLeave={() => onNoteUp?.(note)}
            aria-label={note}
          />
        ))}
      </div>
      {blackKeys.map(({ note, position }) => (
        <button
          key={note}
          className="absolute top-0 w-[5%] h-[60%] bg-zinc-600 border border-zinc-600 cursor-pointer active:bg-zinc-500 hover:bg-zinc-800 z-10"
          style={{
            left: `${((position + 1) / totalWhite) * 100 - 2.5}%`,
          }}
          onPointerDown={() => onNoteDown?.(note)}
          onPointerUp={() => onNoteUp?.(note)}
          onPointerLeave={() => onNoteUp?.(note)}
          aria-label={note}
        />
      ))}
    </div>
  );
}
