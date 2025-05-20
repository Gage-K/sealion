interface SequencerProps {
  children: React.ReactNode;
}

export default function Sequencer({ children }: SequencerProps) {
  return (
    <>
      <h1 className="text-5xl font-bold">Sequencer</h1>
      {children}
    </>
  );
}
