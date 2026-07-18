interface Props {
  aria: string;
  action: () => void;
  name: string;
}

export default function Pad({ aria, action, name }: Props) {
  return (
    <button
      className="w-8 h-8 rounded-sm bg-indigo-200 border border-indigo-50/0 hover:border-indigo-50/100 active:bg-indigo-50 transition duration-75 m-1"
      aria-label={aria}
      onClick={action}>
      <span className="text-xs grid">{name}</span>
    </button>
  );
}
