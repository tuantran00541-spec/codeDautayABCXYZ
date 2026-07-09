function renderBoard() {
  cells.forEach((cellEl, index) => {
    const color = boardState[index];
    cellEl.classList.toggle('filled', !!color);
    if (color) {
      cellEl.style.setProperty('--block-color', color);
    } else {
      cellEl.style.removeProperty('--block-color');
    }
  });
}

function clearFullLines() {
  const fullRows = [];
  const fullCols = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    let isFull = true;
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!boardState[rowColToIndex(row, col)]) {
        isFull = false;
        break;
      }
    }
    if (isFull) fullRows.push(row);
  }

  for (let col = 0; col < GRID_SIZE; col++) {
    let isFull = true;
    for (let row = 0; row < GRID_SIZE; row++) {
      if (!boardState[rowColToIndex(row, col)]) {
        isFull = false;
        break;
      }
    }
    if (isFull) fullCols.push(col);
  }

  if (fullRows.length === 0 && fullCols.length === 0) {
    comboMultiplier = 0;
    return 0;
  }

  const cellsToClear = new Set();
  fullRows.forEach(row => {
    for (let col = 0; col < GRID_SIZE; col++) {
      cellsToClear.add(rowColToIndex(row, col));
    }
  });
  fullCols.forEach(col => {
    for (let row = 0; row < GRID_SIZE; row++) {
      cellsToClear.add(rowColToIndex(row, col));
    }
  });

  const linesCleared = fullRows.length + fullCols.length;
  const lineMultiplier = linesCleared;

  if (linesCleared >= 2) {
    if (comboMultiplier === 0) {
      comboMultiplier = lineMultiplier;
    } else {
      comboMultiplier += 1;
    }
  } else {
    comboMultiplier = 0;
  }

  const finalMultiplier = comboMultiplier > 0 ? comboMultiplier : lineMultiplier;
  const gainedScore = linesCleared * 10 * finalMultiplier;
  score += gainedScore;
  updateScore();

  playClearSound(finalMultiplier);
  showScorePopup(cellsToClear, gainedScore, finalMultiplier);

  return playClearAnimation(cellsToClear, fullRows, fullCols);
}

const SCORE_POPUP_DURATION = 900;
const CELL_SIZE = 38;
const CELL_GAP = 1;

function showScorePopup(cellsToClear, gainedScore, multiplier) {
  const gridEl = document.querySelector('.grid');

  let sumX = 0;
  let sumY = 0;
  cellsToClear.forEach(index => {
    const { row, col } = indexToRowCol(index);
    sumX += col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
    sumY += row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
  });
  const centerX = sumX / cellsToClear.size;
  const centerY = sumY / cellsToClear.size;

  const popupEl = document.createElement('div');
  popupEl.classList.add('score-popup');
  popupEl.style.left = `${centerX}px`;
  popupEl.style.top = `${centerY}px`;
  popupEl.textContent = `+${gainedScore}`;

  gridEl.appendChild(popupEl);

  setTimeout(() => {
    popupEl.remove();
  }, SCORE_POPUP_DURATION);
}

const CLEAR_ANIM_DURATION = 450;
const CLEAR_ANIM_STEP_DELAY = 35;

function playClearAnimation(cellsToClear, fullRows, fullCols) {
  let maxDelay = 0;

  cellsToClear.forEach(index => {
    const { row, col } = indexToRowCol(index);
    let delay = Infinity;

    if (fullRows.includes(row)) {
      delay = Math.min(delay, col * CLEAR_ANIM_STEP_DELAY);
    }
    if (fullCols.includes(col)) {
      delay = Math.min(delay, row * CLEAR_ANIM_STEP_DELAY);
    }
    if (delay === Infinity) delay = 0;

    maxDelay = Math.max(maxDelay, delay);

    const cellEl = cells[index];
    cellEl.style.animationDelay = `${delay}ms`;
    cellEl.classList.add('clearing');
  });

  const totalWait = maxDelay + CLEAR_ANIM_DURATION;

  setTimeout(() => {
    cellsToClear.forEach(index => {
      boardState[index] = null;
      const cellEl = cells[index];
      cellEl.classList.remove('clearing');
      cellEl.style.animationDelay = '';
    });
    renderBoard();
  }, totalWait);

  return totalWait;
}

const maxScoreEl = document.querySelector('#maxScore');
let maxScore = Number(localStorage.getItem('maxScore')) || 0;

function updateMaxScore() {
  if (score > maxScore) {
    maxScore = score;
    localStorage.setItem('maxScore', maxScore);
  }
  maxScoreEl.innerHTML = `<span class="trophy-icon">🏆</span><span>${maxScore}</span>`;
}

function updateScore() {
  scoreEl.textContent = `${score}`;
  updateMaxScore();
}

function checkGameOver() {
  const canAnyBlockBePlaced = trayBlocks.some(shape => canShapeBePlacedOnBoard(shape));

  if (!canAnyBlockBePlaced) {
    setTimeout(() => {
      document.querySelector('#finalScore').textContent = `Point: ${score} | MaxPoint: ${maxScore}`;
      document.querySelector('#gameOverOverlay').classList.add('show');
      clearGameState();
    }, 100);
  }
}