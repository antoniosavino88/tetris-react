export const TETROMINOES = {
  I: {
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    cssClass: "tetromino-I",
  },
  O: {
    matrix: [
      [1, 1],
      [1, 1],
    ],
    cssClass: "tetromino-O",
  },
  T: {
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    cssClass: "tetromino-T",
  },
  L: {
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    cssClass: "tetromino-L",
  },
  J: {
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    cssClass: "tetromino-J",
  },
  S: {
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    cssClass: "tetromino-S",
  },
  Z: {
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    cssClass: "tetromino-Z",
  },
};

export function getRandomTetromino() {
  const keys = Object.keys(TETROMINOES);
  const type = keys[Math.floor(Math.random() * keys.length)];
  const { matrix, cssClass } = TETROMINOES[type];
  return { type, matrix, cssClass };
}
