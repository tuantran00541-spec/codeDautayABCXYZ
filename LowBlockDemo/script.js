// ============================================
// CẤU HÌNH CHUNG
// ============================================
const GRID_SIZE = 6; // lưới 6x6 = 36 ô

// Danh sách các hình khối có thể ra.
// Mỗi shape là 1 mảng toạ độ [hàng, cột] TÍNH TỪ Ô GỐC (0,0) của khối đó.
// Ví dụ: [[0,0]] là khối chỉ có 1 ô.
// [[0,0],[0,1]] là khối 2 ô nằm ngang.
const SHAPES = [
  [[0, 0]],                                   // 1 ô đơn
  [[0, 0], [0, 1]],                           // 2 ô ngang
  [[0, 0], [1, 0]],                           // 2 ô dọc
  [[0, 0], [0, 1], [0, 2]],                   // 3 ô ngang (thẳng hàng)
  [[0, 0], [1, 0], [2, 0]],                   // 3 ô dọc
  [[0, 0], [0, 1], [1, 0], [1, 1]],           // Vuông 2x2
  [[0, 0], [1, 0], [1, 1]],                   // hình L nhỏ
  [[0, 0], [0, 1], [0, 2], [1, 0]],           // hình L to
  [[0, 0], [0, 1], [0, 2], [1, 1]]            // hình T
];

// ============================================
// BIẾN TRẠNG THÁI (STATE) CỦA GAME
// ============================================
// boardState là mảng 36 phần tử, true = ô đã có khối, false = ô trống.
// Dùng mảng riêng thay vì đọc trực tiếp class trên DOM để code JS dễ tính toán hơn,
// rồi sau đó mới "vẽ" lại kết quả lên DOM.
let boardState = new Array(GRID_SIZE * GRID_SIZE).fill(false);

// trayBlocks lưu 3 khối đang chờ trong tray.
// null nghĩa là slot đó đã được đặt vào lưới rồi (trống chỗ đó).
let trayBlocks = [null, null, null];

// Slot nào trong tray đang được người chơi CHỌN (bấm vào) để chuẩn bị đặt.
// null nghĩa là chưa chọn gì.
let selectedSlot = null;

let score = 0;

// ============================================
// LẤY CÁC PHẦN TỬ HTML CẦN DÙNG NHIỀU LẦN
// ============================================
const cells = document.querySelectorAll('.cell');       // 36 ô trong lưới
const slots = document.querySelectorAll('.block-slot'); // 3 ô trong tray
const scoreEl = document.querySelector('#score');

// ============================================
// HÀM TIỆN ÍCH: chuyển đổi qua lại giữa index (0-35) và hàng/cột
// ============================================
// Vì boardState là mảng 1 chiều (36 phần tử) nhưng lưới là 2 chiều (6x6),
// ta cần công thức để quy đổi qua lại.

function indexToRowCol(index) {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  return { row, col };
}

function rowColToIndex(row, col) {
  return row * GRID_SIZE + col;
}

// ============================================
// BƯỚC 1: RANDOM 3 KHỐI MỚI VÀO TRAY
// ============================================
function generateNewTray() {
  trayBlocks = trayBlocks.map(() => {
    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    return randomShape;
  });
  renderTray();
  checkGameOver(); // mỗi lần ra khối mới, kiểm tra luôn xem còn đặt được không
  saveGameState();
}

// Vẽ các khối trong trayBlocks ra giao diện (bên trong mỗi .block-slot)
function renderTray() {
  trayBlocks.forEach((shape, slotIndex) => {
    const slotEl = slots[slotIndex];
    slotEl.innerHTML = ''; // xoá hình cũ trước khi vẽ lại

    if (!shape) return; // slot này đã được dùng hết, để trống

    // Tính xem hình khối này rộng/cao bao nhiêu ô để tạo mini-grid vừa khít
    const maxRow = Math.max(...shape.map(([r]) => r)) + 1;
    const maxCol = Math.max(...shape.map(([, c]) => c)) + 1;

    const miniGrid = document.createElement('div');
    miniGrid.classList.add('mini-grid');
    miniGrid.style.gridTemplateColumns = `repeat(${maxCol}, 20px)`;
    miniGrid.style.gridTemplateRows = `repeat(${maxRow}, 20px)`;

    // Tạo đủ maxRow * maxCol ô nhỏ, ô nào thuộc shape thì tô màu, còn lại để trong suốt
    for (let r = 0; r < maxRow; r++) {
      for (let c = 0; c < maxCol; c++) {
        const miniCell = document.createElement('div');
        const isPartOfShape = shape.some(([sr, sc]) => sr === r && sc === c);
        miniCell.style.width = '20px';
        miniCell.style.height = '20px';
        miniCell.style.borderRadius = '3px';
        miniCell.style.background = isPartOfShape ? '#4caf50' : 'transparent';
        miniGrid.appendChild(miniCell);
      }
    }

    slotEl.appendChild(miniGrid);
  });
}

// ============================================
// BƯỚC 2: CHỌN KHỐI TRONG TRAY
// ============================================
slots.forEach((slotEl, slotIndex) => {
  slotEl.addEventListener('click', () => {
    // Nếu slot này trống (đã dùng hết) thì không cho chọn
    if (!trayBlocks[slotIndex]) return;

    // Bỏ class .selected khỏi slot cũ (nếu có)
    slots.forEach(s => s.classList.remove('selected'));

    // Nếu bấm lại đúng slot đang chọn -> bỏ chọn luôn (toggle)
    if (selectedSlot === slotIndex) {
      selectedSlot = null;
      return;
    }

    // Chọn slot mới
    selectedSlot = slotIndex;
    slotEl.classList.add('selected');
  });
});

// ============================================
// BƯỚC 3: ĐẶT KHỐI VÀO LƯỚI KHI BẤM 1 Ô
// ============================================
cells.forEach((cellEl, cellIndex) => {
  cellEl.addEventListener('click', () => {
    if (selectedSlot === null) return;

    const shape = trayBlocks[selectedSlot];
    const { row: clickRow, col: clickCol } = indexToRowCol(cellIndex);

    // Tìm toạ độ nhỏ nhất (góc trên-trái thực sự) của shape để dùng làm điểm neo
    const minRow = Math.min(...shape.map(([r]) => r));
    const minCol = Math.min(...shape.map(([, c]) => c));

    // Ô người chơi bấm sẽ luôn được hiểu là góc trên-trái thực sự của hình
    const baseRow = clickRow - minRow;
    const baseCol = clickCol - minCol;

    const targetCells = shape.map(([dr, dc]) => ({
      row: baseRow + dr,
      col: baseCol + dc
    }));

    // Kiểm tra xem có đặt được không:
    // 1. Không có ô nào vượt ra ngoài lưới (row/col phải từ 0 đến 5)
    // 2. Không có ô nào đè lên ô đã filled sẵn
    const canPlace = targetCells.every(({ row, col }) => {
      const inBounds = row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
      if (!inBounds) return false;
      const index = rowColToIndex(row, col);
      return !boardState[index]; // phải là ô trống (false)
    });

    if (!canPlace) {
      // Có thể thêm hiệu ứng rung lắc báo lỗi ở đây nếu muốn, tạm thời bỏ qua
      return;
    }

    // Đặt khối: đánh dấu các ô liên quan là true trong boardState
    targetCells.forEach(({ row, col }) => {
      boardState[rowColToIndex(row, col)] = true;
    });

    // Xoá khối này khỏi tray (đánh dấu slot đã dùng)
    trayBlocks[selectedSlot] = null;
    selectedSlot = null;

    renderBoard();  // vẽ lại lưới theo boardState mới
    renderTray();   // vẽ lại tray (slot vừa dùng sẽ trống)
    clearFullLines(); // kiểm tra hàng/cột đầy để xoá + cộng điểm

    // Nếu cả 3 slot đều đã dùng hết -> ra bộ khối mới
    if (trayBlocks.every(b => b === null)) {
      generateNewTray();
    } else {
      checkGameOver();
    }

    saveGameState();
  });
});

// ============================================
// BƯỚC 4: VẼ LẠI LƯỚI DỰA TRÊN boardState
// ============================================
function renderBoard() {
  cells.forEach((cellEl, index) => {
    cellEl.classList.toggle('filled', boardState[index]);
  });
}

// ============================================
// BƯỚC 5: KIỂM TRA HÀNG/CỘT ĐẦY -> XOÁ + CỘNG ĐIỂM
// ============================================
function clearFullLines() {
  const fullRows = [];
  const fullCols = [];

  // Kiểm tra từng hàng
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

  // Kiểm tra từng cột
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

  if (fullRows.length === 0 && fullCols.length === 0) return; // không có gì để xoá

  // Xoá các hàng đầy
  fullRows.forEach(row => {
    for (let col = 0; col < GRID_SIZE; col++) {
      boardState[rowColToIndex(row, col)] = false;
    }
  });

  // Xoá các cột đầy
  fullCols.forEach(col => {
    for (let row = 0; row < GRID_SIZE; row++) {
      boardState[rowColToIndex(row, col)] = false;
    }
  });

  // Cộng điểm: mỗi hàng/cột xoá được +10 điểm (tuỳ bạn chỉnh số này)
  const linesCleared = fullRows.length + fullCols.length;
  score += linesCleared * 10;
  updateScore();

  renderBoard(); // vẽ lại lưới sau khi xoá
}

function updateScore() {
  scoreEl.textContent = `Điểm: ${score}`;
}

// ============================================
// BƯỚC 6: KIỂM TRA THUA (không còn khối nào đặt được vào đâu cả)
// ============================================
function checkGameOver() {
  // Với mỗi khối còn lại trong tray, thử tất cả 36 vị trí trên lưới
  // xem có ít nhất 1 chỗ đặt được không.
  const canAnyBlockBePlaced = trayBlocks.some(shape => {
    if (!shape) return false; // slot trống thì bỏ qua

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

      if (canPlace) return true; // tìm thấy ít nhất 1 chỗ đặt được -> chưa thua
    }
    return false; // khối này không có chỗ nào đặt được
  });

  if (!canAnyBlockBePlaced) {
  setTimeout(() => {
    document.querySelector('#finalScore').textContent = `Điểm: ${score} | Kỷ lục: ${maxScore}`;
    document.querySelector('#gameOverOverlay').classList.add('show');
    clearGameState();
  }, 100);
}
}

// ============================================
// HÀM XOAY 1 SHAPE 90 ĐỘ (THEO CHIỀU KIM ĐỒNG HỒ)
// ============================================
function rotateShape(shape) {
  // Công thức xoay 90 độ: (row, col) -> (col, maxRow - row)
  const maxRow = Math.max(...shape.map(([r]) => r));

  const rotated = shape.map(([r, c]) => [c, maxRow - r]);

  // Chuẩn hoá lại để toạ độ luôn bắt đầu từ (0,0) trở đi (tránh số âm)
  const minRow = Math.min(...rotated.map(([r]) => r));
  const minCol = Math.min(...rotated.map(([, c]) => c));

  return rotated.map(([r, c]) => [r - minRow, c - minCol]);
}

// ============================================
// XOAY KHỐI ĐANG ĐƯỢC CHỌN TRONG TRAY
// ============================================
const rotateBtn = document.querySelector('#rotate');

rotateBtn.addEventListener('click', () => {
  if (selectedSlot === null) return;

  const currentShape = trayBlocks[selectedSlot];
  if (!currentShape) return;

  const slotEl = slots[selectedSlot];
  const miniGrid = slotEl.querySelector('.mini-grid');

  if (miniGrid) {
    // Bước 1: cho xoay đi trước (chỉ là hiệu ứng, chưa đổi hình)
    miniGrid.style.transition = 'transform 0.15s ease';
    miniGrid.style.transform = 'rotate(90deg) scale(0.8)';

    // Bước 2: sau khi xoay xong nửa chặng, đổi hình thật + xoay về vị trí gốc
    setTimeout(() => {
      trayBlocks[selectedSlot] = rotateShape(currentShape);
      renderTray();
      slots[selectedSlot].classList.add('selected');

      const newMiniGrid = slots[selectedSlot].querySelector('.mini-grid');
      if (newMiniGrid) {
        newMiniGrid.style.transform = 'rotate(-90deg) scale(0.8)';
        // ép trình duyệt tính lại layout trước khi chuyển tiếp (để transition chạy đúng)
        newMiniGrid.offsetHeight;
        newMiniGrid.style.transform = 'rotate(0deg) scale(1)';
      }

      saveGameState();
    }, 150);
  } else {
    // Trường hợp không tìm thấy miniGrid, vẫn xoay bình thường
    trayBlocks[selectedSlot] = rotateShape(currentShape);
    renderTray();
    slots[selectedSlot].classList.add('selected');
    saveGameState();
  }
});

const maxScoreEl = document.querySelector('#maxScore');
// Lấy điểm cao nhất đã lưu trong trình duyệt (nếu chưa từng lưu thì mặc định 0)
let maxScore = Number(localStorage.getItem('maxScore')) || 0;
function updateMaxScore() {
  if (score > maxScore) {
    maxScore = score;
    localStorage.setItem('maxScore', maxScore);
  }
  maxScoreEl.textContent = `🏆 ${maxScore}`;
}
function updateScore() {
  scoreEl.textContent = `Điểm: ${score}`;
  updateMaxScore();
}

// ============================================
// XỬ LÝ NÚT RESET (chỉ hiện khi thua)
// ============================================
const resetBtn = document.querySelector('#reset');

resetBtn.addEventListener('click', () => {
  boardState = new Array(GRID_SIZE * GRID_SIZE).fill(false);
  score = 0;
  selectedSlot = null;

  updateScore();
  renderBoard();
  generateNewTray(); // hàm này đã tự saveGameState() rồi

  // Ẩn bảng Game Over đi
  document.querySelector('#gameOverOverlay').classList.remove('show');
});
// ============================================
// LƯU & KHÔI PHỤC TRẠNG THÁI GAME (localStorage)
// ============================================
function saveGameState() {
  const gameState = {
    boardState: boardState,
    trayBlocks: trayBlocks,
    score: score
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
    score = gameState.score;
    return true;
  } catch (e) {
    return false; // dữ liệu lỗi, bỏ qua
  }
}

function clearGameState() {
  localStorage.removeItem('gameState');
}

// ============================================
// KHỞI ĐỘNG GAME
// ============================================
const hasSavedGame = loadGameState();

if (hasSavedGame) {
  renderBoard();
  renderTray();
  updateScore();
} else {
  generateNewTray();
  updateScore();
}