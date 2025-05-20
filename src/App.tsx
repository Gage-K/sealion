import SeqNode from "./components/SeqNode";
import Sequencer from "./components/Sequencer";

function App() {
  return (
    <>
      <Sequencer>
        <SeqNode />
        <SeqNode />
        <SeqNode />
        <SeqNode />
      </Sequencer>
    </>
  );
}

export default App;
