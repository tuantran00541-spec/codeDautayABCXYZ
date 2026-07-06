// ============================================
// CẤU HÌNH CHUNG
// ============================================
const GRID_SIZE = 6; // lưới 6x6 = 36 ô

// Danh sách các hình khối có thể ra.
// Mỗi shape là 1 mảng toạ độ [hàng, cột] TÍNH TỪ Ô GỐC (0,0) của khối đó.
// Ví dụ: [[0,0]] là khối chỉ có 1 ô.
// [[0,0],[0,1]] là khối 2 ô nằm ngang.
const SHAPES = [
  // --- Khối cơ bản (giữ nguyên) ---
  [[0, 0]],                                   // 1 ô đơn
  [[0, 0], [0, 1]],                           // 2 ô ngang
  [[0, 0], [1, 0]],                           // 2 ô dọc
  [[0, 0], [0, 1], [0, 2]],                   // 3 ô ngang (thẳng hàng)
  [[0, 0], [1, 0], [2, 0]],                   // 3 ô dọc
  [[0, 0], [0, 1], [1, 0], [1, 1]],           // Vuông 2x2

  // --- Thanh dài 4 ô ---
  [[0, 0], [0, 1], [0, 2], [0, 3]],           // 4 ô ngang
  [[0, 0], [1, 0], [2, 0], [3, 0]],           // 4 ô dọc

  // --- Hình L nhỏ (4 hướng xoay) ---
  [[0, 0], [1, 0], [1, 1]],                   // L nhỏ (góc dưới-trái)
  [[0, 0], [0, 1], [1, 1]],                   // L nhỏ xoay (góc dưới-phải)
  [[0, 1], [1, 0], [1, 1]],                   // L nhỏ xoay (góc trên-phải)
  [[0, 0], [0, 1], [1, 0]],                   // L nhỏ xoay (góc trên-trái)

  // --- Hình L to (4 hướng xoay) ---
  [[0, 0], [0, 1], [0, 2], [1, 0]],           // L to
  [[0, 0], [0, 1], [0, 2], [1, 2]],           // L to xoay
  [[1, 0], [1, 1], [1, 2], [0, 2]],           // L to xoay
  [[0, 0], [1, 0], [1, 1], [1, 2]],           // L to xoay

  // --- Hình T (4 hướng xoay) ---
  [[0, 0], [0, 1], [0, 2], [1, 1]],           // T quay xuống
  [[0, 1], [1, 0], [1, 1], [2, 1]],           // T quay trái
  [[1, 0], [1, 1], [1, 2], [0, 1]],           // T quay lên
  [[0, 0], [1, 0], [2, 0], [1, 1]],           // T quay phải

  // --- Hình S/Z (4 hướng xoay) ---
  [[0, 0], [0, 1], [1, 1], [1, 2]],           // S ngang
  [[0, 1], [0, 2], [1, 0], [1, 1]],           // Z ngang
  [[0, 0], [1, 0], [1, 1], [2, 1]],           // S dọc
  [[0, 1], [1, 0], [1, 1], [2, 0]],           // Z dọc

  // --- Hình vuông lớn 3x3 ---
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], // vuông 3x3

  // --- Chữ thập nhỏ (dấu +) ---
  [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],   // chữ thập

  // --- Đường chéo bậc thang nhỏ ---
  [[0, 0], [1, 1], [2, 2]]                    // chéo xuống 3 ô
];

// Bảng màu cơ bản để random cho mỗi khối. Giữ màu "bình thường", dễ phân biệt,
// tránh màu quá chói hoặc quá nhạt khó nhìn trên nền xám của ô.
const BLOCK_COLORS = [
  '#4caf50', // xanh lá
  '#2196f3', // xanh dương
  '#ff9800', // cam
  '#e91e63', // hồng đậm
  '#9c27b0', // tím
  '#00bcd4', // xanh ngọc
  '#ffc107', // vàng
  '#f44336'  // đỏ
];

function randomBlockColor() {
  return BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
}

// ============================================
// PHÂN LOẠI ĐỘ KHÓ CỦA KHỐI (dựa trên số ô: càng nhiều ô càng khó tìm chỗ đặt vừa)
// ============================================
// Không dùng ngưỡng số ô cố định (ví dụ "<=2 là dễ") vì bộ SHAPES hiện có phân bố
// lệch hẳn về phía 3-4 ô (15/27 khối có đúng 4 ô), nên ngưỡng cố định sẽ làm nhóm
// HARD chỉ còn 1-2 khối, không đủ để tạo cảm giác "ngẫu nhiên trong cùng độ khó".
//
// Thay vào đó, sắp xếp toàn bộ SHAPES theo số ô tăng dần rồi chia đều thành 3 phần
// bằng nhau theo percentile (1/3 dễ nhất - 1/3 giữa - 1/3 khó nhất). Cách này luôn
// đảm bảo mỗi nhóm có đủ số lượng khối để random, bất kể bộ SHAPES gốc phân bố ra sao.
const SHAPES_BY_SIZE = [...SHAPES].sort((a, b) => a.length - b.length);
const EASY_CUTOFF = Math.ceil(SHAPES_BY_SIZE.length / 3);
const MEDIUM_CUTOFF = Math.ceil((SHAPES_BY_SIZE.length * 2) / 3);
const EASY_SHAPES = SHAPES_BY_SIZE.slice(0, EASY_CUTOFF);
const MEDIUM_SHAPES = SHAPES_BY_SIZE.slice(EASY_CUTOFF, MEDIUM_CUTOFF);
const HARD_SHAPES = SHAPES_BY_SIZE.slice(MEDIUM_CUTOFF);

// ============================================
// BIẾN TRẠNG THÁI (STATE) CỦA GAME
// ============================================
// boardState là mảng 36 phần tử: null = ô trống, hoặc 1 mã màu (string) nếu ô đã có khối.
// Trước đây chỉ lưu true/false, giờ lưu luôn màu để mỗi khối giữ đúng màu của nó
// kể cả sau khi đã đặt xuống lưới.
let boardState = new Array(GRID_SIZE * GRID_SIZE).fill(null);

// trayBlocks lưu 3 khối đang chờ trong tray.
// null nghĩa là slot đó đã được đặt vào lưới rồi (trống chỗ đó).
let trayBlocks = [null, null, null];

// Màu của từng khối trong tray, khớp theo index với trayBlocks.
// Được random mới mỗi khi generateNewTray() sinh khối mới.
let trayColors = [null, null, null];

// Slot nào trong tray đang được người chơi CHỌN (bấm vào) để chuẩn bị đặt.
// null nghĩa là chưa chọn gì.
let selectedSlot = null;

let score = 0;

// Combo chuỗi: chỉ tính khi 1 lượt đặt khối làm nổ từ 2 dòng (hàng/cột) trở lên.
// - Lượt đầu tiên nổ >=2 dòng: comboMultiplier = số dòng nổ (ví dụ nổ 2 dòng -> x2).
// - Lượt tiếp theo (liên tiếp) cũng nổ >=2 dòng: comboMultiplier += 1 (không tính lại theo số dòng).
// - Lượt nào nổ 1 dòng hoặc không nổ gì -> reset comboMultiplier về 0 (không có combo).
let comboMultiplier = 0;

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

// Kiểm tra 1 shape có ít nhất 1 vị trí nào đặt được vào boardState hiện tại không.
// Tách riêng hàm này (trước đây code này nằm thẳng trong checkGameOver) để dùng
// lại được cho cả việc kiểm tra thua CŨNG NHƯ cho thuật toán chọn độ khó khối mới.
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

// ============================================
// BƯỚC 1: SINH 3 KHỐI MỚI VÀO TRAY (1 dễ + 1 trung bình + 1 khó)
// ============================================
// Trước đây random hoàn toàn trong toàn bộ SHAPES, có thể vô tình ra 3 khối
// đều khó (hoặc đều dễ) cùng lúc, làm độ khó ván chơi không ổn định.
// Giờ chia SHAPES thành 3 nhóm độ khó theo số ô (EASY/MEDIUM/HARD ở trên) và
// LUÔN đảm bảo tray có đủ 3 mức: 1 dễ, 1 trung bình, 1 khó mỗi lượt sinh mới.
//
// Trong mỗi nhóm, ưu tiên chọn ngẫu nhiên trong số các khối CÒN ĐẶT ĐƯỢC vào
// bàn cờ hiện tại (dùng canShapeBePlacedOnBoard) - tránh tình huống vô tình
// bốc phải khối chắc chắn không đặt được ở đâu, dồn người chơi vào thua oan
// dù bàn cờ vẫn còn đủ chỗ cho những hình khác. Nếu cả nhóm đó không còn khối
// nào đặt được (bàn cờ đã quá chật với mức độ khó này), fallback random tự do
// trong nhóm đó như cũ, để không bị "kẹt" không sinh được khối nào.
function pickShapeFromPool(pool) {
  const placeable = pool.filter(shape => canShapeBePlacedOnBoard(shape));
  const source = placeable.length > 0 ? placeable : pool;
  return source[Math.floor(Math.random() * source.length)];
}

function generateNewTray() {
  trayBlocks = [
    pickShapeFromPool(EASY_SHAPES),
    pickShapeFromPool(MEDIUM_SHAPES),
    pickShapeFromPool(HARD_SHAPES)
  ];
  trayColors = trayColors.map(() => randomBlockColor());
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

    const color = trayColors[slotIndex] || randomBlockColor();

    // Tính xem hình khối này rộng/cao bao nhiêu ô để tạo mini-grid vừa khít
    const maxRow = Math.max(...shape.map(([r]) => r)) + 1;
    const maxCol = Math.max(...shape.map(([, c]) => c)) + 1;

    const miniGrid = document.createElement('div');
    miniGrid.classList.add('mini-grid');
    miniGrid.style.gridTemplateColumns = `repeat(${maxCol}, 20px)`;
    miniGrid.style.gridTemplateRows = `repeat(${maxRow}, 20px)`;

    // Tạo đủ maxRow * maxCol ô nhỏ, ô nào thuộc shape thì tô màu (kèm hiệu ứng
    // lồi 3D giống ô thật trên lưới), còn lại để trong suốt
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

  // Đặt khối: ghi mã màu của khối vào các ô liên quan trong boardState
  // (trước đây chỉ ghi true/false, giờ ghi màu để mỗi khối giữ đúng màu riêng).
  const placedColor = trayColors[slotIndex] || randomBlockColor();
  targetCells.forEach(({ row, col }) => {
    boardState[rowColToIndex(row, col)] = placedColor;
  });

  // Xoá khối này khỏi tray (đánh dấu slot đã dùng)
  trayBlocks[slotIndex] = null;
  trayColors[slotIndex] = null;
  selectedSlot = null;

  renderBoard();  // vẽ lại lưới theo boardState mới
  renderTray();   // vẽ lại tray (slot vừa dùng sẽ trống)

  // clearFullLines có thể kích hoạt animation nổ hàng/cột (bất đồng bộ).
  // Các bước sau (ra khối mới / kiểm tra thua) phải đợi animation xong,
  // vì lúc đó boardState mới thực sự phản ánh các ô đã bị xoá.
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
    const color = boardState[index];
    cellEl.classList.toggle('filled', !!color);
    if (color) {
      cellEl.style.setProperty('--block-color', color);
    } else {
      cellEl.style.removeProperty('--block-color');
    }
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

  if (fullRows.length === 0 && fullCols.length === 0) {
    comboMultiplier = 0; // lượt này không nổ dòng nào -> đứt combo
    return 0;
  }

  // Gom tất cả ô sẽ bị xoá (không trùng lặp nếu 1 ô vừa thuộc hàng vừa thuộc cột đầy)
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

  // Hệ số nhân của LƯỢT NÀY (dựa trên số dòng nổ cùng lúc, giống trước đây).
  const linesCleared = fullRows.length + fullCols.length;
  const lineMultiplier = linesCleared;

  // Cập nhật combo chuỗi: chỉ tính combo khi lượt này nổ từ 2 dòng trở lên.
  if (linesCleared >= 2) {
    if (comboMultiplier === 0) {
      // Bắt đầu combo mới, mức khởi điểm = số dòng nổ ở lượt này
      comboMultiplier = lineMultiplier;
    } else {
      // Đang có combo từ lượt trước và lượt này tiếp tục nổ >=2 dòng -> cộng thêm 1
      comboMultiplier += 1;
    }
  } else {
    // Nổ đúng 1 dòng -> không tính combo, và làm đứt combo đang có (nếu có)
    comboMultiplier = 0;
  }

  // Điểm cuối cùng = điểm cơ bản theo số dòng * hệ số áp dụng.
  // Nếu đang có combo (>=2 dòng liên tiếp) thì dùng comboMultiplier, ngược lại dùng lineMultiplier như cũ.
  const finalMultiplier = comboMultiplier > 0 ? comboMultiplier : lineMultiplier;
  const gainedScore = linesCleared * 10 * finalMultiplier;
  score += gainedScore;
  updateScore();

  showScorePopup(cellsToClear, gainedScore, finalMultiplier);

  return playClearAnimation(cellsToClear, fullRows, fullCols);
}

// ============================================
// HIỆU ỨNG ĐIỂM BAY LÊN KHI NỔ HÀNG/CỘT
// ============================================
// Tạo 1 phần tử .score-popup ở vị trí trung tâm của khu vực vừa nổ (trung bình
// toạ độ các ô bị xoá), hiển thị số điểm vừa cộng (+ hệ số nhân nếu > 1),
// rồi tự xoá phần tử này khỏi DOM sau khi animation CSS chạy xong.
const SCORE_POPUP_DURATION = 900; // phải khớp với thời gian animation scorePopup trong CSS (0.9s)
const CELL_SIZE = 50;
const CELL_GAP = 1;

function showScorePopup(cellsToClear, gainedScore, multiplier) {
  const gridEl = document.querySelector('.grid');

  // Tính toạ độ trung tâm (x, y) của khu vực vừa nổ, dựa trên vị trí trung bình
  // của các ô bị xoá, để đặt popup ngay giữa vùng đó.
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

  // Dọn phần tử popup sau khi animation xong, tránh tích tụ DOM node lâu dài.
  setTimeout(() => {
    popupEl.remove();
  }, SCORE_POPUP_DURATION);
}

// ============================================
// HIỆU ỨNG NỔ HÀNG/CỘT: gợn sóng nổi lên rồi mờ dần
// ============================================
// Ý tưởng: thêm class .clearing (định nghĩa animation trong CSS) cho từng ô,
// nhưng đặt animation-delay tăng dần theo thứ tự ô trong hàng/cột để tạo
// cảm giác "sóng" lan từ đầu đến cuối, thay vì tất cả nổ cùng lúc.
// boardState CHƯA bị xoá ngay, để tránh checkGameOver/tray mới chạy trước khi
// người chơi nhìn thấy hiệu ứng. Sau khi animation xong mới xoá thật + renderBoard.
const CLEAR_ANIM_DURATION = 450;  // phải khớp với thời gian animation trong CSS (0.45s)
const CLEAR_ANIM_STEP_DELAY = 35; // độ trễ (ms) giữa mỗi ô liên tiếp trong hàng/cột -> tạo hiệu ứng gợn sóng

function playClearAnimation(cellsToClear, fullRows, fullCols) {
  let maxDelay = 0;

  // Tính delay cho từng ô dựa theo vị trí của nó trong hàng/cột đang bị xoá.
  // Nếu 1 ô thuộc cả hàng đầy và cột đầy, lấy delay nhỏ nhất (nổ sớm nhất) cho đẹp mắt.
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

  // Chờ cho ô có delay lớn nhất chạy xong animation, rồi mới xoá boardState thật
  // và dọn lại style/class để không ảnh hưởng tới lần "nổ" tiếp theo.
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

function updateScore() {
  scoreEl.textContent = `${score}`;
}

// ============================================
// BƯỚC 6: KIỂM TRA THUA (không còn khối nào đặt được vào đâu cả)
// ============================================
function checkGameOver() {
  // Với mỗi khối còn lại trong tray, kiểm tra có ít nhất 1 chỗ đặt được không.
  const canAnyBlockBePlaced = trayBlocks.some(shape => canShapeBePlacedOnBoard(shape));

  if (!canAnyBlockBePlaced) {
  setTimeout(() => {
    document.querySelector('#finalScore').textContent = `Point: ${score} | MaxPoint: ${maxScore}`;
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
  // Tách emoji và số ra 2 span riêng (thay vì gộp chung 1 chuỗi text):
  // flexbox chỉ canh giữa được các PHẦN TỬ CON, không "nhìn thấy" gì để canh
  // nếu emoji + số chỉ là 1 text node duy nhất. Bọc span cũng cho phép set
  // font-size riêng cho emoji, tránh emoji bị font pixel (Press Start 2P)
  // đẩy lên baseline khác với số.
  maxScoreEl.innerHTML = `<span class="trophy-icon">🏆</span><span>${maxScore}</span>`;
}
function updateScore() {
  scoreEl.textContent = `${score}`;
  updateMaxScore();
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
  if (dragState.dragging && dragState.pointerId != null && slotEl?.hasPointerCapture?.(dragState.pointerId)) {
    slotEl.releasePointerCapture(dragState.pointerId);
  }
  dragState = null;
}

// LƯỚI AN TOÀN: sự kiện pointerup/pointercancel đôi khi không bắn tới đúng slotEl
// (ví dụ pointer bị hệ thống huỷ giữa chừng, đổi tab, cảm ứng đa điểm...).
// Khi đó handlePointerUp/cancelDrag phía trên không chạy, ghost bị bỏ lại mãi mãi
// trong document.body -> đây chính là lỗi "khối mờ dính lại" đã gặp.
// Gắn thêm listener toàn cục trên window để LUÔN dọn dẹp ghost, dù sự kiện gốc
// có "lạc" đi đâu, không phụ thuộc vào việc nó có tới đúng slotEl hay không.
window.addEventListener('pointerup', (e) => {
  if (!dragState || dragState.pointerId !== e.pointerId) return;
  cancelDrag(slots[dragState.slotIndex]);
});
window.addEventListener('pointercancel', (e) => {
  if (!dragState || dragState.pointerId !== e.pointerId) return;
  cancelDrag(slots[dragState.slotIndex]);
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
