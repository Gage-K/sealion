import RangeControl, { formatVolume, formatPan, formatPercent } from "../core/RangeControl";

export default function GlobalControls({
  vol,
  pan,
  bpm,
  swing,
  onChangeVol,
  onChangePan,
  onChangeBpm,
  onChangeSwing,
}: {
  vol: number;
  pan: number;
  bpm: number;
  swing: number;
  onChangeVol: (v: number) => void;
  onChangePan: (v: number) => void;
  onChangeBpm: (v: number) => void;
  onChangeSwing: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr] gap-y-2">
      <span className="text-zinc-500 text-xs">global</span>
      <RangeControl label="vol" value={vol} formatValue={formatVolume} onChange={onChangeVol} min={-12} max={8} />
      <RangeControl label="pan" value={pan} min={-50} max={50} onChange={onChangePan} formatValue={formatPan} />
      <RangeControl label="bpm" value={bpm} onChange={onChangeBpm} min={60} max={240} />
      <RangeControl
        label="swg"
        value={Math.round(swing * 100)}
        onChange={(v) => onChangeSwing(v / 100)}
        min={0}
        max={100}
        formatValue={formatPercent}
      />
    </div>
  );
}
