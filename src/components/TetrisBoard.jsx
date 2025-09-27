import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TETROMINOES, getRandomTetromino } from "../tetrominoes";

const ROWS = 20;
const COLS = 10;

function createEmptyGrid() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  );
}

function overlayPiece(grid, piece, position) {
  const copy = grid.map((row) => row.slice());
  const { matrix, type } = piece;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        const x = position.row + r;
        const y = position.col + c;
        if (x >= 0 && x < ROWS && y >= 0 && y < COLS) {
          copy[x][y] = type;
        }
      }
    }
  }
  return copy;
}

function isCollision(grid, piece, position) {
  const { matrix } = piece;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        const x = position.row + r;
        const y = position.col + c;
        if (
          x < 0 ||
          x >= ROWS ||
          y < 0 ||
          y >= COLS ||
          (grid[x] && grid[x][y])
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function rotateMatrix(matrix) {
  return matrix[0].map((_, i) => matrix.map((row) => row[i]).reverse());
}

function checkFullRows(grid) {
  const fullRows = [];
  grid.forEach((row, idx) => {
    if (row.every((cell) => cell !== null)) fullRows.push(idx);
  });
  return fullRows;
}

export default function TetrisBoard() {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState(getRandomTetromino());
  const [position, setPosition] = useState({
    row: 0,
    col: Math.floor(COLS / 2) - Math.floor(currentPiece.matrix[0].length / 2),
  });

  const [score, setScore] = useState(0);
  const [rowsToClear, setRowsToClear] = useState([]);

  // 🔹 nuovo state per livelli e righe
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);

  // 🔹 calcola velocità in base al livello
  const getInterval = () => Math.max(100, 500 - (level - 1) * 50);

  // caduta automatica
  useEffect(() => {
    const interval = setInterval(
      () => movePiece({ row: 1, col: 0 }),
      getInterval()
    );
    return () => clearInterval(interval);
  }, [grid, currentPiece, position, level]);

  // gestione tastiera
  useEffect(() => {
    const handleKey = (e) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          movePiece({ row: 0, col: -1 });
          break;
        case "ArrowRight":
          e.preventDefault();
          movePiece({ row: 0, col: 1 });
          break;
        case "ArrowDown":
          e.preventDefault();
          movePiece({ row: 1, col: 0 });
          break;
        case "ArrowUp":
          e.preventDefault();
          rotatePiece();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKey, { passive: false });
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentPiece, position, grid]);

  const movePiece = ({ row: dr, col: dc }) => {
    const newPos = { row: position.row + dr, col: position.col + dc };
    if (!isCollision(grid, currentPiece, newPos)) {
      setPosition(newPos);
    } else if (dr === 1 && dc === 0) {
      const merged = overlayPiece(grid, currentPiece, position);
      const fullRows = checkFullRows(merged);

      if (fullRows.length > 0) {
        setRowsToClear(fullRows);

        setTimeout(() => {
          let newGrid = merged.filter((_, idx) => !fullRows.includes(idx));
          const emptyRows = Array.from({ length: fullRows.length }, () =>
            Array(COLS).fill(null)
          );
          newGrid = [...emptyRows, ...newGrid];
          setGrid(newGrid);

          // aggiorna punteggio e righe eliminate
          setScore((prev) => prev + fullRows.length * 100);
          setLinesCleared((prev) => {
            const total = prev + fullRows.length;
            if (total >= level * 10) {
              setLevel((prevLevel) => prevLevel + 1);
            }
            return total;
          });

          setRowsToClear([]);
        }, 300);
      } else {
        setGrid(merged);
      }

      const nextPiece = getRandomTetromino();
      setCurrentPiece(nextPiece);
      setPosition({
        row: 0,
        col: Math.floor(COLS / 2) - Math.floor(nextPiece.matrix[0].length / 2),
      });
    }
  };

  const rotatePiece = () => {
    const rotated = {
      ...currentPiece,
      matrix: rotateMatrix(currentPiece.matrix),
    };
    if (!isCollision(grid, rotated, position)) setCurrentPiece(rotated);
  };

  const displayGrid = useMemo(
    () => overlayPiece(grid, currentPiece, position),
    [grid, currentPiece, position]
  );

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <h1 className="text-white text-xl mb-1">Score: {score}</h1>
      <h2 className="text-white text-lg mb-4">Level: {level}</h2>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 24px)`,
          gridTemplateRows: `repeat(${ROWS}, 24px)`,
          gap: "1px",
        }}
      >
        {displayGrid.flat().map((cell, idx) => {
          const rowIdx = Math.floor(idx / COLS);
          let className = cell ? TETROMINOES[cell].cssClass : "bg-gray-800";

          return (
            <motion.div
              key={idx}
              className={`w-full h-full ${className} border border-gray-700`}
              initial={{ opacity: 1 }}
              animate={{
                opacity: rowsToClear.includes(rowIdx) ? [1, 0, 1] : 1,
              }}
              transition={{
                opacity: { times: [0, 0.5, 1], duration: 0.3 },
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
