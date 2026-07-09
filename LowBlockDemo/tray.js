const HARD_CHANCE_NORMAL = 0.15;
const HARD_CHANCE_WHEN_BOARD_FULL = 0.05;
const BOARD_FULL_RATIO_THRESHOLD = 0.65;

function getDifficultyWeights() {
  const filledCells = boardState.filter(cell => cell).length;
  const fillRatio = filledCells / (GRID_SIZE * GRID_SIZE);

  const hardChance = fillRatio > BOARD_FULL_RATIO_THRESHOLD
    ? HARD_CHANCE_WHEN_BOARD_FULL
    : HARD_CHANCE_NORMAL;

  const easyChance = 0.35 + (HARD_CHANCE_NORMAL - hardChance);
  const mediumChance = 1 - easyChance - hardChance;

  return { easy: easyChance, medium: mediumChance, hard: hardChance };
}

function rollDifficultyTier(weights) {
  const r = Math.random();
  if (r < weights.easy) return EASY_SHAPES;
  if (r < weights.easy + weights.medium) return MEDIUM_SHAPES;
  return HARD_SHAPES;
}

function pickShapeFromPool(pool) {
  const placeable = pool.filter(shape => canShapeBePlacedOnBoard(shape));
  if (placeable.length > 0) {
    return placeable[Math.floor(Math.random() * placeable.length)];
  }

  const fallbackOrder = [HARD_SHAPES, MEDIUM_SHAPES, EASY_SHAPES];
  const currentTierIndex = fallbackOrder.indexOf(pool);
  for (let i = currentTierIndex + 1; i < fallbackOrder.length; i++) {
    const easierPool = fallbackOrder[i];
    const easierPlaceable = easierPool.filter(shape => canShapeBePlacedOnBoard(shape));
    if (easierPlaceable.length > 0) {
      return easierPlaceable[Math.floor(Math.random() * easierPlaceable.length)];
    }
  }

  return EASY_SHAPES[Math.floor(Math.random() * EASY_SHAPES.length)];
}

function generateNewTray() {
  const weights = getDifficultyWeights();
  let hardAlreadyPicked = false;

  trayBlocks = [0, 1, 2].map(() => {
    let tier = rollDifficultyTier(weights);

    if (tier === HARD_SHAPES) {
      if (hardAlreadyPicked) {
        tier = MEDIUM_SHAPES;
      } else {
        hardAlreadyPicked = true;
      }
    }

    return pickShapeFromPool(tier);
  });

  trayColors = trayColors.map(() => randomBlockColor());
  renderTray();
  checkGameOver();
  saveGameState();
}

function renderTray() {
  trayBlocks.forEach((shape, slotIndex) => {
    const slotEl = slots[slotIndex];
    slotEl.innerHTML = '';

    if (!shape) return;

    const color = trayColors[slotIndex] || randomBlockColor();

    const maxRow = Math.max(...shape.map(([r]) => r)) + 1;
    const maxCol = Math.max(...shape.map(([, c]) => c)) + 1;

    const miniGrid = document.createElement('div');
    miniGrid.classList.add('mini-grid');
    miniGrid.style.gridTemplateColumns = `repeat(${maxCol}, 20px)`;
    miniGrid.style.gridTemplateRows = `repeat(${maxRow}, 20px)`;

    for (let r = 0; r < maxRow; r++) {
      for (let c = 0; c < maxCol; c++) {
        const miniCell = document.createElement('div');
        const isPartOfShape = shape.some(([sr, sc]) => sr === r && sc === c);
        miniCell.style.width = '20px';
        miniCell.style.height = '20px';
        miniCell.style.borderRadius = '3px';
        if (isPartOfShape) {
          miniCell.classList.add('mini-cell-block');
          miniCell.style.setProperty('--block-color', color);
        } else {
          miniCell.style.background = 'transparent';
        }
        miniGrid.appendChild(miniCell);
      }
    }

    slotEl.appendChild(miniGrid);
  });
}

slots.forEach((slotEl, slotIndex) => {
  slotEl.addEventListener('click', () => {
    if (!trayBlocks[slotIndex]) return;

    slots.forEach(s => s.classList.remove('selected'));

    if (selectedSlot === slotIndex) {
      selectedSlot = null;
      return;
    }

    selectedSlot = slotIndex;
    slotEl.classList.add('selected');
  });
});

function tryPlaceBlock(slotIndex, cellIndex) {
  const shape = trayBlocks[slotIndex];
  if (!shape) return false;

  const { row: clickRow, col: clickCol } = indexToRowCol(cellIndex);

  let targetCells = null;

  for (const [anchorDr, anchorDc] of shape) {
    const baseRow = clickRow - anchorDr;
    const baseCol = clickCol - anchorDc;

    const candidateCells = shape.map(([dr, dc]) => ({
      row: baseRow + dr,
      col: baseCol + dc
    }));

    const isValid = candidateCells.every(({ row, col }) => {
      const inBounds = row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
      if (!inBounds) return false;
      return !boardState[rowColToIndex(row, col)];
    });

    if (isValid) {
      targetCells = candidateCells;
      break;
    }
  }

  if (!targetCells) {
    return false;
  }

  const placedColor = trayColors[slotIndex] || randomBlockColor();
  targetCells.forEach(({ row, col }) => {
    boardState[rowColToIndex(row, col)] = placedColor;
  });

  playPlaceSound();

  trayBlocks[slotIndex] = null;
  trayColors[slotIndex] = null;
  selectedSlot = null;

  renderBoard();
  renderTray();

  const hadFullLines = clearFullLines();

  const proceed = () => {
    if (trayBlocks.every(b => b === null)) {
      generateNewTray();
    } else {
      checkGameOver();
    }
    saveGameState();
  };

  if (hadFullLines) {
    setTimeout(proceed, hadFullLines);
  } else {
    proceed();
  }

  return true;
}

cells.forEach((cellEl, cellIndex) => {
  cellEl.addEventListener('click', () => {
    if (selectedSlot === null) return;
    tryPlaceBlock(selectedSlot, cellIndex);
  });
});