function saveGameState() {
  const gameState = {
    boardState: boardState,
    trayBlocks: trayBlocks,
    trayColors: trayColors,
    score: score,
    comboMultiplier: comboMultiplier
  };
  localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGameState() {
  const saved = localStorage.getItem('gameState');
  if (!saved) return false;

  try {
    const gameState = JSON.parse(saved);
    boardState = gameState.boardState;
    trayBlocks = gameState.trayBlocks;
    trayColors = gameState.trayColors || trayBlocks.map(b => b ? randomBlockColor() : null);
    boardState = boardState.map(cell => cell === true ? BLOCK_COLORS[0] : (cell === false ? null : cell));
    score = gameState.score;
    comboMultiplier = gameState.comboMultiplier || 0;
    return true;
  } catch (e) {
    return false;
  }
}

function clearGameState() {
  localStorage.removeItem('gameState');
}

const resetBtn = document.querySelector('#reset');

resetBtn.addEventListener('click', () => {
  boardState = new Array(GRID_SIZE * GRID_SIZE).fill(null);
  score = 0;
  comboMultiplier = 0;
  selectedSlot = null;

  updateScore();
  renderBoard();
  generateNewTray();

  document.querySelector('#gameOverOverlay').classList.remove('show');
});

const logInLoadEl = document.querySelector('.log-in-load');
const resumeChoiceEl = document.querySelector('#resumeChoice');
const gameWrapperEl = document.querySelector('.game-wrapper');

const starGameBtn = document.querySelector('#starGame');
const againGameBtn = document.querySelector('#againGame');
const newGameBtn = document.querySelector('#newGame');
const menuBtnBack = document.querySelector('#menuBtnBack');

playMenuMusic();

function startNewGame() {
  clearGameState();
  boardState = new Array(GRID_SIZE * GRID_SIZE).fill(null);
  score = 0;
  comboMultiplier = 0;
  selectedSlot = null;

  updateScore();
  renderBoard();
  generateNewTray();

  document.querySelector('#gameOverOverlay').classList.remove('show');
}

function resumeSavedGame() {
  renderBoard();
  renderTray();
  updateScore();
}

starGameBtn.addEventListener('click', () => {
  tryPlayMusic();

  const hasSavedGame = loadGameState();

  if (hasSavedGame) {
    logInLoadEl.classList.add('hidden');
    resumeChoiceEl.classList.remove('hidden');
  } else {
    logInLoadEl.classList.add('hidden');
    gameWrapperEl.classList.remove('hidden');
    playInGameMusic();
    startNewGame();
  }
});

againGameBtn.addEventListener('click', () => {
  resumeChoiceEl.classList.add('hidden');
  gameWrapperEl.classList.remove('hidden');
  playInGameMusic();
  resumeSavedGame();
});

newGameBtn.addEventListener('click', () => {
  resumeChoiceEl.classList.add('hidden');
  gameWrapperEl.classList.remove('hidden');
  playInGameMusic();
  startNewGame();
});

menuBtnBack.addEventListener('click', () => {
  gameWrapperEl.classList.add('hidden');
  logInLoadEl.classList.remove('hidden');
  requestReturnToMenuMusic();
});