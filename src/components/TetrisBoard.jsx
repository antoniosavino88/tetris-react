import React, { useState, useEffect, useMemo } from "react";
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

export default function TetrisBoard() {
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState(() => getRandomTetromino());
  const [position, setPosition] = useState(() => ({
    row: 0,
    col: Math.floor(COLS / 2) - Math.floor(currentPiece.matrix[0].length / 2),
  }));

  // Tick automatico
  useEffect(() => {
    const interval = setInterval(() => {
      movePiece({ row: 1, col: 0 });
    }, TICK_INTERVAL);
    return () => clearInterval(interval);
  }, [grid, currentPiece, position]);

  // Event listener tastiera
  useEffect(() => {
    const handleKey = (e) => {
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowDown":
        case "ArrowUp":
          e.preventDefault(); // evita lo scroll della pagina
          break;
        default:
          break;
      }
      switch (e.key) {
        case "ArrowLeft":
          movePiece({ row: 0, col: -1 });
          break;
        case "ArrowRight":
          movePiece({ row: 0, col: 1 });
          break;
        case "ArrowDown":
          movePiece({ row: 1, col: 0 });
          break;
        case "ArrowUp":
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
      // collisione verso il basso → fissiamo pezzo e spawn nuovo
      setGrid((prev) => overlayPiece(prev, currentPiece, position));
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
    if (!isCollision(grid, rotated, position)) {
      setCurrentPiece(rotated);
    }
  };

  const displayGrid = useMemo(
    () => overlayPiece(grid, currentPiece, position),
    [grid, currentPiece, position]
  );

  return (
    <div className="flex justify-center items-center min-h-screen p-0">
      <div
        className="grid p-1"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 24px)`,
          gridTemplateRows: `repeat(${ROWS}, 24px)`,
          gap: "1px",
        }}
      >
        {displayGrid.flat().map((cell, idx) => {
          const className = cell ? TETROMINOES[cell].cssClass : "bg-gray-800";
          return (
            <div
              key={idx}
              className={`w-full h-full ${className} border border-gray-700`}
            />
          );
        })}
      </div>
    </div>
  );
}
