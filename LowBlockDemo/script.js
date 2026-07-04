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
// BƯỚC 3: ĐẶT KHỐI VÀO LƯỚI (dùng chung cho cả CLICK và KÉO-THẢ)
// ============================================
// Hàm này chứa nguyên logic đặt khối cũ, chỉ tách ra để tái sử dụng được
// từ 2 nguồn sự kiện khác nhau (click vào ô, hoặc thả khối lên ô khi kéo).
// Trả về true nếu đặt thành công, false nếu không đặt được.
function tryPlaceBlock(slotIndex, cellIndex) {
  const shape = trayBlocks[slotIndex];
  if (!shape) return false;

  const { row: clickRow, col: clickCol } = indexToRowCol(cellIndex);

  // BUG CŨ: luôn coi ô bấm là ô (0,0) lý thuyết của shape (sau khi trừ minRow/minCol),
  // nên nếu người chơi bấm vào 1 ô KHÁC của khối (không phải ô góc trên-trái),
  // vị trí đặt sẽ bị lệch -> báo không đặt được dù nhìn có vẻ vừa khít.
  //
  // SỬA: thử coi ô bấm/thả là từng ô một trong shape (không chỉ ô đầu tiên),
  // hễ có cách nào khớp và hợp lệ thì dùng cách đó luôn.
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

    // Ưu tiên cách neo mà ô được bấm/thả chính là 1 ô thuộc khối và hợp lệ
    if (isValid) {
      targetCells = candidateCells;
      break;
    }
  }

  if (!targetCells) {
    // Không có cách neo nào hợp lệ -> thực sự không đặt được ở đây
    return false;
  }

  // Đặt khối: đánh dấu các ô liên quan là true trong boardState
  targetCells.forEach(({ row, col }) => {
    boardState[rowColToIndex(row, col)] = true;
  });

  // Xoá khối này khỏi tray (đánh dấu slot đã dùng)
  trayBlocks[slotIndex] = null;
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
  return true;
}

// Click vào ô lưới: vẫn giữ lại cách chọn-rồi-bấm như cũ (không bắt buộc phải kéo thả)
cells.forEach((cellEl, cellIndex) => {
  cellEl.addEventListener('click', () => {
    if (selectedSlot === null) return;
    tryPlaceBlock(selectedSlot, cellIndex);
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
// KÉO-THẢ (DRAG & DROP) KHỐI TỪ TRAY VÀO LƯỚI
// ============================================
// Dùng Pointer Events vì nó gộp chung được cả chuột lẫn cảm ứng (touch),
// không cần xử lý riêng mousedown/touchstart như kiểu cũ.
// Toàn bộ logic đặt khối vẫn dùng lại tryPlaceBlock() ở trên, không đổi gì cả.

let dragState = null; // { slotIndex, shape, ghostEl, pointerId, startX, startY, dragging }

const DRAG_THRESHOLD = 6; // px di chuyển tối thiểu trước khi coi là "đang kéo" thật sự

function getGridRect() {
  return document.querySelector('.grid').getBoundingClientRect();
}

// Từ toạ độ con trỏ (clientX/clientY), tìm xem đang ở trên ô nào trong lưới.
// Trả về index của ô (0-35), hoặc null nếu con trỏ đang ở ngoài lưới.
function getCellIndexFromPoint(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;
  const cellEl = el.closest('.cell');
  if (!cellEl) return null;
  return Array.from(cells).indexOf(cellEl);
}

// Tô sáng trước (preview) các ô mà khối SẼ chiếm nếu thả ngay tại đây,
// dùng đúng thuật toán tìm điểm neo giống hệt tryPlaceBlock (không tách trùng
// logic đặt khối thật, chỉ tính toán để hiển thị, không ghi vào boardState).
function previewPlacement(shape, cellIndex) {
  clearPreview();
  if (cellIndex === null) return;

  const { row: hoverRow, col: hoverCol } = indexToRowCol(cellIndex);

  for (const [anchorDr, anchorDc] of shape) {
    const baseRow = hoverRow - anchorDr;
    const baseCol = hoverCol - anchorDc;

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
      candidateCells.forEach(({ row, col }) => {
        cells[rowColToIndex(row, col)].classList.add('preview');
      });
      return;
    }
  }

  // Không có vị trí hợp lệ nào quanh ô đang hover -> báo đỏ ngay ô đó cho biết "không đặt được"
  cells[cellIndex].classList.add('preview-invalid');
}

function clearPreview() {
  cells.forEach(c => c.classList.remove('preview', 'preview-invalid'));
}

function createGhost(slotEl, x, y) {
  const ghostEl = slotEl.querySelector('.mini-grid')?.cloneNode(true);
  if (!ghostEl) return null;
  ghostEl.style.position = 'fixed';
  ghostEl.style.pointerEvents = 'none';
  ghostEl.style.opacity = '0.75';
  ghostEl.style.zIndex = '1000';
  ghostEl.style.left = `${x}px`;
  ghostEl.style.top = `${y}px`;
  ghostEl.style.transform = 'translate(-50%, -50%) scale(1.1)';
  document.body.appendChild(ghostEl);
  return ghostEl;
}

slots.forEach((slotEl, slotIndex) => {
  slotEl.addEventListener('pointerdown', (e) => {
    if (!trayBlocks[slotIndex]) return;

    // Chọn slot này luôn (đồng bộ với cơ chế click cũ, để nút xoay vẫn hoạt động đúng)
    slots.forEach(s => s.classList.remove('selected'));
    selectedSlot = slotIndex;
    slotEl.classList.add('selected');

    // CHƯA setPointerCapture và CHƯA tạo ghost ngay ở đây.
    // Chỉ ghi nhận điểm bắt đầu; việc này để một cú bấm ngắn (chọn slot rồi
    // bấm nút xoay) không bị "khoá" pointer vào slot, gây ra không bấm được nút xoay.
    dragState = {
      slotIndex,
      shape: trayBlocks[slotIndex],
      ghostEl: null,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false
    };
  });

  slotEl.addEventListener('pointermove', (e) => handlePointerMove(e, slotEl));
  slotEl.addEventListener('pointerup', (e) => handlePointerUp(e, slotEl));
  slotEl.addEventListener('pointercancel', () => cancelDrag(slotEl));
});

function handlePointerMove(e, slotEl) {
  if (!dragState || dragState.pointerId !== e.pointerId) return;

  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;

  // Chỉ khi di chuyển đủ xa mới coi là bắt đầu kéo thật sự.
  // Trước ngưỡng này, đây vẫn chỉ là 1 cú "bấm chọn" bình thường,
  // nên nút xoay bấm ngay sau đó vẫn hoạt động không bị pointer capture chặn.
  if (!dragState.dragging) {
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    dragState.dragging = true;
    slotEl.setPointerCapture(e.pointerId);
    dragState.ghostEl = createGhost(slotEl, e.clientX, e.clientY);
  }

  if (dragState.ghostEl) {
    dragState.ghostEl.style.left = `${e.clientX}px`;
    dragState.ghostEl.style.top = `${e.clientY}px`;
  }

  const cellIndex = getCellIndexFromPoint(e.clientX, e.clientY);
  previewPlacement(dragState.shape, cellIndex);
}

function handlePointerUp(e, slotEl) {
  if (!dragState || dragState.pointerId !== e.pointerId) return;

  const { slotIndex, ghostEl, dragging } = dragState;

  if (dragging) {
    // Chỉ thực sự thử đặt khối nếu người dùng ĐÃ kéo đi (vượt threshold).
    // Một cú bấm ngắn không kéo sẽ không đặt khối nào cả, giữ đúng như hành vi chọn slot cũ.
    const cellIndex = getCellIndexFromPoint(e.clientX, e.clientY);
    clearPreview();
    if (ghostEl) ghostEl.remove();
    if (slotEl.hasPointerCapture(e.pointerId)) {
      slotEl.releasePointerCapture(e.pointerId);
    }
    if (cellIndex !== null) {
      tryPlaceBlock(slotIndex, cellIndex);
    }
  }

  dragState = null;
}

function cancelDrag(slotEl) {
  if (!dragState) return;
  clearPreview();
  if (dragState.ghostEl) dragState.ghostEl.remove();
  if (dragState.dragging && dragState.pointerId != null && slotEl.hasPointerCapture?.(dragState.pointerId)) {
    slotEl.releasePointerCapture(dragState.pointerId);
  }
  dragState = null;
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