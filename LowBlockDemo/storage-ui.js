// ============================================
// LƯU & KHÔI PHỤC TRẠNG THÁI GAME (localStorage)
// ============================================
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
  if (!saved) return false; // chưa có gì lưu trước đó

  try {
    const gameState = JSON.parse(saved);
    boardState = gameState.boardState;
    trayBlocks = gameState.trayBlocks;
    // An toàn cho save cũ chưa có field này, hoặc save cũ dùng true/false thay vì màu:
    // trayColors thiếu thì random bù; boardState còn giá trị true (kiểu cũ) thì đổi
    // thành 1 màu mặc định để không bị lỗi hiển thị.
    trayColors = gameState.trayColors || trayBlocks.map(b => b ? randomBlockColor() : null);
    boardState = boardState.map(cell => cell === true ? BLOCK_COLORS[0] : (cell === false ? null : cell));
    score = gameState.score;
    comboMultiplier = gameState.comboMultiplier || 0;
    return true;
  } catch (e) {
    return false; // dữ liệu lỗi, bỏ qua
  }
}

function clearGameState() {
  localStorage.removeItem('gameState');
}

// ============================================
// XỬ LÝ NÚT RESET (chỉ hiện khi thua)
// ============================================
const resetBtn = document.querySelector('#reset');

resetBtn.addEventListener('click', () => {
  boardState = new Array(GRID_SIZE * GRID_SIZE).fill(null);
  score = 0;
  comboMultiplier = 0;
  selectedSlot = null;

  updateScore();
  renderBoard();
  generateNewTray(); // hàm này đã tự saveGameState() rồi

  // Ẩn bảng Game Over đi
  document.querySelector('#gameOverOverlay').classList.remove('show');
});

// ============================================
// MÀN CHỜ (START SCREEN) & CÁC OVERLAY LIÊN QUAN
// ============================================
// Game KHÔNG tự khởi động ngay khi tải trang nữa.
// Người chơi phải bấm "Bắt Đầu" ở màn chờ, game mới thực sự chạy.
// Việc ẩn/hiện các màn chỉ đơn giản là thêm/xoá class "hidden" (định nghĩa trong CSS),
// không cần pause/resume state gì phức tạp vì game này không có action tự chạy theo thời gian.

const logInLoadEl = document.querySelector('.log-in-load');
const resumeChoiceEl = document.querySelector('#resumeChoice');
const gameWrapperEl = document.querySelector('.game-wrapper');

const starGameBtn = document.querySelector('#starGame');
const againGameBtn = document.querySelector('#againGame');
const newGameBtn = document.querySelector('#newGame');
const menuBtnBack = document.querySelector('#menuBtnBack');

// Bắt đầu 1 ván hoàn toàn mới: xoá save cũ, reset toàn bộ state, ra khối mới.
function startNewGame() {
  clearGameState();
  boardState = new Array(GRID_SIZE * GRID_SIZE).fill(null);
  score = 0;
  comboMultiplier = 0;
  selectedSlot = null;

  updateScore();
  renderBoard();
  generateNewTray(); // hàm này tự saveGameState() luôn

  document.querySelector('#gameOverOverlay').classList.remove('show');
}

// Tiếp tục ván đã lưu trong localStorage (giả định loadGameState() đã load thành công trước đó).
function resumeSavedGame() {
  renderBoard();
  renderTray();
  updateScore();
}

// Nút "Bắt Đầu" ở màn chờ: nếu có save sẵn thì hỏi Tiếp tục/Chơi mới,
// không có save thì vào thẳng ván mới.
starGameBtn.addEventListener('click', () => {
  const hasSavedGame = loadGameState();

  if (hasSavedGame) {
    // Có ván cũ -> hiện hộp hỏi Tiếp tục / Chơi mới, chưa vào game ngay
    logInLoadEl.classList.add('hidden');
    resumeChoiceEl.classList.remove('hidden');
  } else {
    // Chưa có ván nào -> vào thẳng game mới
    logInLoadEl.classList.add('hidden');
    gameWrapperEl.classList.remove('hidden');
    startNewGame();
  }
});

// Trong hộp hỏi: chọn "Tiếp tục"
againGameBtn.addEventListener('click', () => {
  resumeChoiceEl.classList.add('hidden');
  gameWrapperEl.classList.remove('hidden');
  resumeSavedGame();
});

// Trong hộp hỏi: chọn "Chơi lại" (bắt đầu ván mới, bỏ save cũ)
newGameBtn.addEventListener('click', () => {
  resumeChoiceEl.classList.add('hidden');
  gameWrapperEl.classList.remove('hidden');
  startNewGame();
});

// Nút quay lại menu (↩) trong lúc đang chơi: chỉ ẩn game-wrapper, hiện lại màn chờ.
// Không cần pause gì cả vì boardState/trayBlocks/score vẫn giữ nguyên trong biến JS,
// bấm "Bắt Đầu" -> "Tiếp tục" lại từ màn chờ sẽ khôi phục đúng y trạng thái (đọc lại từ localStorage,
// vốn cũng đã được saveGameState() cập nhật liên tục trong lúc chơi).
menuBtnBack.addEventListener('click', () => {
  gameWrapperEl.classList.add('hidden');
  logInLoadEl.classList.remove('hidden');
});