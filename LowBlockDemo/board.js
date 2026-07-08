// ============================================
// VẼ LẠI LƯỚI DỰA TRÊN boardState
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
// KIỂM TRA HÀNG/CỘT ĐẦY -> XOÁ + CỘNG ĐIỂM
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

  playClearSound(finalMultiplier); // tiếng nổ hàng/cột, càng combo cao càng "dày" (sound.js)
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
// LƯU Ý: giá trị này phải khớp với --cell-size trong style.css để popup điểm hiện
// đúng vị trí trung tâm ô. Khi đổi GRID_SIZE (số cột/hàng) hoặc --cell-size trong
// CSS, phải cập nhật lại con số này theo. Hiện tại board 8x8 dùng --cell-size: 38px.
const CELL_SIZE = 38;
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

// ============================================
// CẬP NHẬT ĐIỂM SỐ (điểm hiện tại + điểm cao nhất)
// ============================================
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

// GHI CHÚ: file gốc từng có 2 hàm updateScore() trùng tên (1 hàm ở gần
// clearFullLines không update max score, và 1 hàm ở dưới cùng có gọi
// updateMaxScore()). Do JS chỉ giữ lại định nghĩa hàm cuối cùng khi trùng tên,
// hàm phía dưới luôn thắng nên hành vi thực tế trước giờ vẫn đúng - nhưng đây
// là code trùng lặp gây rối khi đọc. Gộp lại còn đúng 1 bản duy nhất ở đây,
// hành vi giữ nguyên y hệt như trước (luôn cập nhật điểm + điểm cao nhất).
function updateScore() {
  scoreEl.textContent = `${score}`;
  updateMaxScore();
}

// ============================================
// KIỂM TRA THUA (không còn khối nào đặt được vào đâu cả)
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