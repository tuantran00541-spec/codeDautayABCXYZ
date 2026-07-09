let boardState = new Array(GRID_SIZE * GRID_SIZE).fill(null);

let trayBlocks = [null, null, null];

let trayColors = [null, null, null];

let selectedSlot = null;

let score = 0;

let comboMultiplier = 0;

const cells = document.querySelectorAll('.cell');
const slots = document.querySelectorAll('.block-slot');
const scoreEl = document.querySelector('#score');

function indexToRowCol(index) {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  return { row, col };
}

function rowColToIndex(row, col) {
  return row * GRID_SIZE + col;
}

function canShapeBePlacedOnBoard(shape) {
  if (!shape) return false;

  for (let index = 0; index < GRID_SIZE * GRID_SIZE; index++) {
    const { row: baseRow, col: baseCol } = indexToRowCol(index);
    const targetCells = shape.map(([dr, dc]) => ({
      row: baseRow + dr,
      col: baseCol + dc
    }));

    const canPlace = targetCells.every(({ row, col }) => {
      const inBounds = row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
      if (!inBounds) return false;
      return !boardState[rowColToIndex(row, col)];
    });

    if (canPlace) return true;
  }
  return false;
}