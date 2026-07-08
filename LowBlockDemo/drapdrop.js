// ============================================
// KÉO-THẢ (DRAG & DROP) KHỐI TỪ TRAY VÀO LƯỚI
// ============================================
// Dùng Pointer Events vì nó gộp chung được cả chuột lẫn cảm ứng (touch),
// không cần xử lý riêng mousedown/touchstart như kiểu cũ.
// Toàn bộ logic đặt khối vẫn dùng lại tryPlaceBlock() (định nghĩa ở tray.js), không đổi gì cả.

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