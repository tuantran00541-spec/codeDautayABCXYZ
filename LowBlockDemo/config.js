// ============================================
// CẤU HÌNH CHUNG
// ============================================
const GRID_SIZE = 8; // lưới 8x8 = 64 ô

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
// Dùng ngưỡng số ô CỐ ĐỊNH thay vì chia percentile như trước:
//   - EASY:   <= 2 ô  (khối đơn, khối đôi)
//   - MEDIUM: 3-4 ô   (đa số khối trong bộ SHAPES, xoay 4 hướng L/T/S/Z...)
//   - HARD:   >= 5 ô  (chữ thập 5 ô, vuông 3x3 = 9 ô)
//
// LƯU Ý: với ngưỡng này, nhóm HARD chỉ còn đúng 2 khối (chữ thập + vuông 3x3).
// Vì vậy tray.js KHÔNG còn ép cứng mỗi lượt phải có 1 khối HARD nữa (nếu ép thì
// người chơi sẽ luôn ăn 1 trong 2 khối siêu to đó MỖI LƯỢT - còn khó hơn cả bản
// cũ). Thay vào đó tray.js dùng random có trọng số theo độ khó cho từng slot,
// với xác suất HARD thấp và tự giảm thêm khi bàn cờ đã đầy (xem generateNewTray
// và getDifficultyWeights bên tray.js).
const EASY_SHAPES = SHAPES.filter(shape => shape.length <= 2);
const MEDIUM_SHAPES = SHAPES.filter(shape => shape.length >= 3 && shape.length <= 4);
const HARD_SHAPES = SHAPES.filter(shape => shape.length >= 5);