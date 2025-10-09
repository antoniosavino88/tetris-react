import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TETROMINOES, getRandomTetromino } from "../tetrominoes";

const ROWS = 20;
const COLS = 10;
const TICK_INTERVAL = 500;

function createEmptyGrid() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  );
}

function overlayPiece(grid, piece, position, isGhost = false) {
  const copy = grid.map((row) => row.slice());
  const { matrix, type } = piece;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        const x = position.row + r;
        const y = position.col + c;
        if (x >= 0 && x < ROWS && y >= 0 && y < COLS) {
          copy[x][y] = isGhost ? `${type}-ghost` : type;
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
  const [showGhost, setShowGhost] = useState(true);
  const [softDrop, setSoftDrop] = useState(false);

  // --- 🔥 Stati per combo e feedback ---
  const [comboCount, setComboCount] = useState(0);
  const [lastClearTime, setLastClearTime] = useState(0);
  // comboMessage is an object { id:number, text:string } or null
  const [comboMessage, setComboMessage] = useState(null);

  // Refs to keep freshest values in timeouts/closures
  const comboRef = useRef(comboCount);
  const lastClearRef = useRef(lastClearTime);

  // keep refs in sync with state
  useEffect(() => {
    comboRef.current = comboCount;
  }, [comboCount]);
  useEffect(() => {
    lastClearRef.current = lastClearTime;
  }, [lastClearTime]);

  // Calcola la posizione del ghost
  const getGhostPosition = () => {
    let ghostRow = position.row;
    while (
      !isCollision(grid, currentPiece, { row: ghostRow + 1, col: position.col })
    ) {
      ghostRow++;
      if (ghostRow > ROWS) break;
    }
    return { row: ghostRow, col: position.col };
  };

  // --- 🧠 Logica punteggio avanzata + combo (calculate base points only) ---
  const basePointsFor = (lines) => {
    switch (lines) {
      case 1:
        return 100;
      case 2:
        return 300;
      case 3:
        return 500;
      case 4:
        return 800;
      default:
        return Math.max(0, 100 * lines);
    }
  };

  // Blocca pezzo e processa righe/punteggio
  const lockPieceAt = (lockPos) => {
    const merged = overlayPiece(grid, currentPiece, lockPos);
    const fullRows = checkFullRows(merged);

    if (fullRows.length > 0) {
      setRowsToClear(fullRows);

      // Manteniamo la logica di animazione righe -> poi aggiornamento griglia e punteggio
      setTimeout(() => {
        let newGrid = merged.filter((_, idx) => !fullRows.includes(idx));
        const emptyRows = Array.from({ length: fullRows.length }, () =>
          Array(COLS).fill(null)
        );
        newGrid = [...emptyRows, ...newGrid];
        setGrid(newGrid);

        // --- CALCOLO PUNTI E COMBO USANDO REF PER EVITARE CLOSURE STALE ---
        const now = Date.now();
        const prevLast = lastClearRef.current || 0;
        const withinComboWindow = now - prevLast < 3000; // 3s window
        const prevCombo = comboRef.current || 0;
        const newCombo = withinComboWindow ? prevCombo + 1 : 1;

        // base points
        let points = basePointsFor(fullRows.length);

        // combo bonus: +50 per step of combo (only if combo >1)
        const comboBonus = newCombo > 1 ? newCombo * 50 : 0;

        // perfect clear? check newGrid (dopo rimozione)
        const isPerfectClear = newGrid.flat().every((cell) => cell === null);
        if (isPerfectClear) {
          points += 1200; // extra perfect clear bonus
        }

        const totalPoints = Math.floor(points + comboBonus);

        // aggiorna score
        setScore((prev) => prev + totalPoints);

        // aggiorna combo state + refs
        setComboCount(newCombo);
        comboRef.current = newCombo;

        setLastClearTime(now);
        lastClearRef.current = now;

        // setta messaggio unico per forzare montaggio AnimatePresence
        let messageText = null;
        if (isPerfectClear) {
          messageText = "✨ Perfect Clear! ✨";
        } else if (fullRows.length === 4) {
          messageText = `TETRIS! +${totalPoints}`;
        } else if (newCombo > 1 || fullRows.length > 1) {
          messageText = `Combo x${newCombo} (+${totalPoints})`;
        }

        if (messageText) {
          setComboMessage({ id: now, text: messageText });
        }

        // lines/level
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
      // no lines -> reset combo
      setComboCount(0);
      comboRef.current = 0;
      setGrid(merged);
    }

    const next = nextPiece;
    setCurrentPiece(next);
    setNextPiece(getRandomTetromino());
    setPosition({
      row: 0,
      col: Math.floor(COLS / 2) - Math.floor(next.matrix[0].length / 2),
    });
  };

  const hardDrop = () => {
    const ghostPos = getGhostPosition();
    lockPieceAt(ghostPos);
  };

  // Tick di gioco
  useEffect(() => {
    const baseInterval = Math.max(TICK_INTERVAL - (level - 1) * 50, 100);
    const intervalTime = softDrop ? 50 : baseInterval;
    const interval = setInterval(
      () => movePiece({ row: 1, col: 0 }),
      intervalTime
    );
    return () => clearInterval(interval);
  }, [grid, currentPiece, position, level, softDrop]);

  // Tastiera
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
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
          setSoftDrop(true);
          movePiece({ row: 1, col: 0 });
          break;
        case "ArrowUp":
          e.preventDefault();
          rotatePiece();
          break;
        case "Space":
        case "Spacebar":
        case " ":
          e.preventDefault();
          hardDrop();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "ArrowDown") setSoftDrop(false);
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [currentPiece, position, grid, softDrop, nextPiece]);

  // Movimento
  const movePiece = ({ row: dr, col: dc }) => {
    const newPos = { row: position.row + dr, col: position.col + dc };
    if (!isCollision(grid, currentPiece, newPos)) {
      setPosition(newPos);
    } else if (dr === 1 && dc === 0) {
      lockPieceAt(position);
    }
  };

  // Rotazione
  const rotatePiece = () => {
    const rotatedMatrix = rotateMatrix(currentPiece.matrix);
    const rotated = { ...currentPiece, matrix: rotatedMatrix };
    if (!isCollision(grid, rotated, position)) {
      setCurrentPiece(rotated);
      return;
    }
    const kicks = [-1, 1, -2, 2];
    for (let k of kicks) {
      const tryPos = { row: position.row, col: position.col + k };
      if (!isCollision(grid, rotated, tryPos)) {
        setPosition(tryPos);
        setCurrentPiece(rotated);
        return;
      }
    }
  };

  // Display grid con ghost
  const displayGrid = useMemo(() => {
    let tempGrid = grid.map((r) => [...r]);
    if (showGhost) {
      const ghostPos = getGhostPosition();
      tempGrid = overlayPiece(tempGrid, currentPiece, ghostPos, true);
    }
    return overlayPiece(tempGrid, currentPiece, position);
  }, [grid, currentPiece, position, showGhost]);

  // Rimuovi messaggio combo dopo poco (comboMessage is an object)
  useEffect(() => {
    if (comboMessage) {
      const t = setTimeout(() => setComboMessage(null), 1500);
      return () => clearTimeout(t);
    }
  }, [comboMessage]);

  return (
    <div className="flex flex-col h-screen p-4 relative">
      {/* HEADER */}
      <div className="flex flex-col items-center text-white text-xl">
        <h2 className="m-0">Score: {score}</h2>
        <h3 className="m-0">Level: {level}</h3>
        <button
          onClick={() => setShowGhost((prev) => !prev)}
          className="mt-2 px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          Ghost: {showGhost ? "ON" : "OFF"}
        </button>
      </div>

      {/* 🎇 Combo Visual (sempre visibile sopra tutto) */}
      <AnimatePresence>
        {comboMessage && (
          <motion.div
            key={comboMessage.id}
            initial={{ opacity: 0, scale: 0.5, y: -30, rotate: -5 }}
            animate={{
              opacity: 1,
              scale: [1.2, 1],
              y: 0,
              rotate: [0, 5, 0],
              transition: {
                duration: 0.6,
                ease: "easeOut",
                type: "spring",
                stiffness: 120,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              y: 40,
              transition: { duration: 0.4, ease: "easeIn" },
            }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                 text-6xl font-extrabold text-yellow-400 pointer-events-none select-none 
                 z-[9999]"
            style={{
              textShadow:
                "0 0 10px rgba(255,255,100,0.8), 0 0 20px rgba(255,255,0,0.5), 0 0 40px rgba(255,200,0,0.3)",
            }}
          >
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1.5, 1], opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {comboMessage.text}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENUTO PRINCIPALE */}
      <div className="flex flex-col items-center justify-center">
        {/* NEXT */}
        <div className="flex flex-col items-center text-white">
          <h3 className="text-lg mb-2">Next</h3>

          <div
            className="flex items-center justify-center bg-gray-900 rounded-lg p-4"
            style={{ width: "80px", height: "80px" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={nextPiece.type}
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="grid w-full h-full"
                style={{
                  gridTemplateColumns: `repeat(4, 1fr)`,
                  gridTemplateRows: `repeat(4, 1fr)`,
                  gap: "4px",
                  padding: "2px",
                  boxSizing: "border-box",
                }}
              >
                {Array.from({ length: 4 })
                  .map((_, r) =>
                    Array.from({ length: 4 }).map((_, c) => {
                      const offsetRow = Math.floor(
                        (4 - nextPiece.matrix.length) / 2
                      );
                      const offsetCol = Math.floor(
                        (4 - nextPiece.matrix[0].length) / 2
                      );
                      const pieceRow = r - offsetRow;
                      const pieceCol = c - offsetCol;
                      const cellValue =
                        pieceRow >= 0 &&
                        pieceRow < nextPiece.matrix.length &&
                        pieceCol >= 0 &&
                        pieceCol < nextPiece.matrix[0].length
                          ? nextPiece.matrix[pieceRow][pieceCol]
                          : null;
                      const cellClass = cellValue
                        ? TETROMINOES[nextPiece.type].cssClass
                        : "bg-gray-900";

                      return (
                        <div
                          key={`${r}-${c}`}
                          className={`${cellClass}`}
                          style={{ width: "100%", height: "100%" }}
                        />
                      );
                    })
                  )
                  .flat()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* GRIGLIA principale */}
        <div
          className="grid mx-8"
          style={{
            gridTemplateColumns: `repeat(${COLS}, 24px)`,
            gridTemplateRows: `repeat(${ROWS}, 24px)`,
            gap: "1px",
          }}
        >
          {displayGrid.flat().map((cell, idx) => {
            const rowIdx = Math.floor(idx / COLS);
            let className = "bg-gray-800";
            if (cell) {
              if (typeof cell === "string" && cell.endsWith("-ghost")) {
                const baseType = cell.replace("-ghost", "");
                className = `${TETROMINOES[baseType].cssClass} opacity-30`;
              } else {
                className = TETROMINOES[cell].cssClass;
              }
            }
            const flash = rowsToClear.includes(rowIdx);
            return (
              <div
                key={idx}
                className={`w-full h-full ${className} border border-gray-700 ${
                  flash ? "flash-cell" : ""
                }`}
              />
            );
          })}
        </div>

        <div style={{ width: "120px" }}></div>
      </div>
    </div>
  );
}
