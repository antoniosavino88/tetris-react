import Grid from "./components/Grid";
import TetrisBoard from "./components/TetrisBoard.jsx";
import { TETROMINOES } from "./tetrominoes.js";

function App() {
  console.log("Tetramini disponibili:", TETROMINOES);
  return (
    <div className="flex justify-center items-center h-screen bg-black overflow-hidden">
      <TetrisBoard />
    </div>
  );
}

export default App;
