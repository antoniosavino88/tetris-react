import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TETROMINOES, getRandomTetromino } from "../tetrominoes";

const ROWS = 20;
const COLS = 10;
const TICK_INTERVAL = 500;

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
  const [nextPiece, setNextPiece] = useState(getRandomTetromino());
  const [position, setPosition] = useState({
    row: 0,
    col: Math.floor(COLS / 2) - Math.floor(currentPiece.matrix[0].length / 2),
  });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [rowsToClear, setRowsToClear] = useState([]);

  // Caduta automatica
  useEffect(() => {
    const interval = setInterval(
      () => movePiece({ row: 1, col: 0 }),
      Math.max(TICK_INTERVAL - (level - 1) * 50, 100)
    );
    return () => clearInterval(interval);
  }, [grid, currentPiece, position, level]);

  // Gestione tastiera
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

          setScore((prev) => prev + fullRows.length * 100);
          setLinesCleared((prev) => {
            const newTotal = prev + fullRows.length;
            if (newTotal >= level * 10) {
              setLevel((l) => l + 1);
            }
            return newTotal;
          });

          setRowsToClear([]);
        }, 300);
      } else {
        setGrid(merged);
      }

      const next = nextPiece;
      setCurrentPiece(next);
      setNextPiece(getRandomTetromino());
      setPosition({
        row: 0,
        col: Math.floor(COLS / 2) - Math.floor(next.matrix[0].length / 2),
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
    <div className="flex flex-col h-screen p-4">
      {/* HEADER */}
      <div className="flex flex-col items-center text-white text-xl">
        <h2 className="m-0">Score: {score}</h2>
        <h3 className="m-0">Level: {level}</h3>
      </div>

      {/* CONTENUTO PRINCIPALE - Layout orizzontale con dimensioni fisse */}
      <div className="flex-1 flex items-center justify-center">
        {/* NEXT tetramino - Dimensione fissa a sinistra */}
        <div className="flex flex-col items-center text-white">
          <h3 className="text-lg">Next</h3>
          <div
            className="flex items-center justify-center bg-gray-900 rounded-lg p-4"
            style={{ width: "120px", height: "120px" }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${nextPiece.matrix[0].length}, 18px)`,
                gridTemplateRows: `repeat(${nextPiece.matrix.length}, 18px)`,
                gap: "1px",
              }}
            >
              {nextPiece.matrix.flat().map((cell, idx) => (
                <div
                  key={idx}
                  className={`${
                    cell ? TETROMINOES[nextPiece.type].cssClass : ""
                  }`}
                  style={{ width: "18px", height: "18px" }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* GRIGLIA principale - Centrata */}
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
            const flashAboveCount = rowsToClear.filter(
              (r) => r < rowIdx
            ).length;
            let className = cell ? TETROMINOES[cell].cssClass : "bg-gray-800";

            return (
              <motion.div
                key={idx}
                className={`w-full h-full ${className} border border-gray-700`}
                initial={{ y: 0, opacity: 1 }}
                animate={{
                  y: flashAboveCount * 24,
                  opacity: rowsToClear.includes(rowIdx) ? [1, 0, 1] : 1,
                }}
                transition={{
                  y: { type: "tween", duration: 0.2 },
                  opacity: { times: [0, 0.5, 1], duration: 0.3 },
                }}
              />
            );
          })}
        </div>

        {/* SPAZIO vuoto a destra per bilanciare */}
        <div style={{ width: "120px" }}></div>
      </div>
    </div>
  );
}
