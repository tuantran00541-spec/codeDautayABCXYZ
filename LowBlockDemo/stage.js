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