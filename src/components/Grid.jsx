const Grid = ({ rows = 20, cols = 10 }) => {
  const createGrid = () => {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null)
    );
  };

  const grid = createGrid();

  return (
    <div className="grid grid-rows-20 grid-cols-10 gap-0 border border-gray-700 w-[200px] h-[400px]">
      {grid.flat().map((_, i) => (
        <div
          key={i}
          className="border border-gray-800 w-full h-full bg-gray-900"
        ></div>
      ))}
    </div>
  );
};

export default Grid;
