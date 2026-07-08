// ============================================
// SINH 3 KHỐI MỚI VÀO TRAY (random có trọng số theo độ khó)
// ============================================
// TRƯỚC ĐÂY: ép cứng mỗi lượt phải có đúng 1 dễ + 1 vừa + 1 khó. Với cách chia
// nhóm CŨ (percentile) thì "khó" vẫn còn khá nhẹ nên chấp nhận được, nhưng từ khi
// đổi sang chia theo ngưỡng số ô CỐ ĐỊNH (xem config.js), nhóm HARD chỉ còn đúng
// 2 khối SIÊU TO (chữ thập 5 ô, vuông 3x3 = 9 ô). Nếu vẫn ép cứng 100% mỗi lượt
// phải có 1 khối HARD thì người chơi sẽ liên tục ăn 1 trong 2 khối khổng lồ đó
// MỖI LƯỢT - khó hơn hẳn ý định ban đầu.
//
// GIỜ: mỗi slot trong tray tự "bốc thăm" độc lập theo trọng số (không bắt buộc
// đủ 3 mức mỗi lượt), giúp thi thoảng có lượt "dễ thở" toàn khối dễ/vừa, thay vì
// lượt nào cũng phải cõng ít nhất 1 khối khó như trước:
//   - EASY   35%  (giảm nhẹ so với random đều 33%, ưu tiên trải nghiệm dễ chịu)
//   - MEDIUM 50%  (nhóm đông đảo nhất trong bộ SHAPES, giữ thử thách vừa phải)
//   - HARD   15%  (khối siêu to, không để xuất hiện dồn dập)
//
// Đồng thời có 2 lớp "tối ưu" so với random có trọng số thuần tuý:
// 1) GIỚI HẠN TỐI ĐA 1 khối HARD / lượt: nếu slot sau cũng bốc trúng HARD thì
//    tự động hạ xuống MEDIUM, tránh trường hợp hiếm nhưng cực khó chịu là dính
//    2-3 khối siêu to cùng lúc.
// 2) THÍCH ỨNG THEO ĐỘ ĐẦY BÀN CỜ: bàn càng đầy thì càng giảm xác suất HARD
//    (và tăng bù cho EASY), vì khối to càng về cuối ván càng khó tìm chỗ đặt,
//    giảm rủi ro bị dồn vào thế thua oan chỉ vì bốc nhằm lúc bàn chật.
const HARD_CHANCE_NORMAL = 0.15;
const HARD_CHANCE_WHEN_BOARD_FULL = 0.05; // áp dụng khi bàn cờ đã lấp > ngưỡng bên dưới
const BOARD_FULL_RATIO_THRESHOLD = 0.65;

function getDifficultyWeights() {
  const filledCells = boardState.filter(cell => cell).length;
  const fillRatio = filledCells / (GRID_SIZE * GRID_SIZE);

  const hardChance = fillRatio > BOARD_FULL_RATIO_THRESHOLD
    ? HARD_CHANCE_WHEN_BOARD_FULL
    : HARD_CHANCE_NORMAL;

  // Phần chênh lệch do giảm HARD được cộng bù thẳng vào EASY (ưu tiên dễ thở
  // hơn là dồn vào MEDIUM, vốn đã là nhóm đông nhất rồi).
  const easyChance = 0.35 + (HARD_CHANCE_NORMAL - hardChance);
  const mediumChance = 1 - easyChance - hardChance;

  return { easy: easyChance, medium: mediumChance, hard: hardChance };
}

// Bốc thăm 1 nhóm độ khó (trả về mảng pool tương ứng) dựa theo trọng số.
function rollDifficultyTier(weights) {
  const r = Math.random();
  if (r < weights.easy) return EASY_SHAPES;
  if (r < weights.easy + weights.medium) return MEDIUM_SHAPES;
  return HARD_SHAPES;
}

// Trong mỗi nhóm, ưu tiên chọn ngẫu nhiên trong số các khối CÒN ĐẶT ĐƯỢC vào
// bàn cờ hiện tại (dùng canShapeBePlacedOnBoard) - tránh tình huống vô tình
// bốc phải khối chắc chắn không đặt được ở đâu, dồn người chơi vào thua oan
// dù bàn cờ vẫn còn đủ chỗ cho những hình khác.
//
// LƯU Ý QUAN TRỌNG: nếu cả nhóm (pool) không còn khối nào đặt được, KHÔNG được
// fallback về random tự do trong CHÍNH pool đó - vì nếu pool đó vốn chỉ có 1-2
// khối và tất cả đều không đặt được, ta sẽ chắc chắn trả về 1 khối không đặt
// được (thua oan ngay lượt sau). Thay vào đó, rơi xuống nhóm DỄ HƠN kế tiếp
// (HARD -> MEDIUM -> EASY) để tìm 1 khối còn đặt được; chỉ khi cả EASY cũng bó
// tay (bàn gần như đã đầy kín) mới thực sự random tự do trong EASY như phương
// án cuối cùng (khi đó thua là hợp lý, không còn cách nào khác).
function pickShapeFromPool(pool) {
  const placeable = pool.filter(shape => canShapeBePlacedOnBoard(shape));
  if (placeable.length > 0) {
    return placeable[Math.floor(Math.random() * placeable.length)];
  }

  // Không có khối nào trong pool hiện tại đặt được -> thử rơi xuống nhóm dễ hơn.
  const fallbackOrder = [HARD_SHAPES, MEDIUM_SHAPES, EASY_SHAPES];
  const currentTierIndex = fallbackOrder.indexOf(pool);
  for (let i = currentTierIndex + 1; i < fallbackOrder.length; i++) {
    const easierPool = fallbackOrder[i];
    const easierPlaceable = easierPool.filter(shape => canShapeBePlacedOnBoard(shape));
    if (easierPlaceable.length > 0) {
      return easierPlaceable[Math.floor(Math.random() * easierPlaceable.length)];
    }
  }

  // Không nhóm nào (kể cả EASY) còn đặt được -> bàn gần như đã đầy kín, thua là
  // hợp lý. Random tự do trong EASY (nhóm ít "tốn diện tích" nhất) như phương
  // án cuối cùng để vẫn trả về được 1 khối hợp lệ cho tray.
  return EASY_SHAPES[Math.floor(Math.random() * EASY_SHAPES.length)];
}

function generateNewTray() {
  const weights = getDifficultyWeights();
  let hardAlreadyPicked = false;

  trayBlocks = [0, 1, 2].map(() => {
    let tier = rollDifficultyTier(weights);

    if (tier === HARD_SHAPES) {
      if (hardAlreadyPicked) {
        // Đã có 1 khối HARD trong lượt này rồi -> hạ xuống MEDIUM thay vì
        // để tối đa 2-3 khối siêu to xuất hiện cùng lúc.
        tier = MEDIUM_SHAPES;
      } else {
        hardAlreadyPicked = true;
      }
    }

    return pickShapeFromPool(tier);
  });

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
// CHỌN KHỐI TRONG TRAY (bấm để chọn, không kéo thả)
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
// ĐẶT KHỐI VÀO LƯỚI (dùng chung cho cả CLICK và KÉO-THẢ)
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