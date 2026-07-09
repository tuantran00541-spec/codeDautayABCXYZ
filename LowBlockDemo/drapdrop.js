let dragState = null;

const DRAG_THRESHOLD = 6;

function getGridRect() {
  return document.querySelector('.grid').getBoundingClientRect();
}

function getCellIndexFromPoint(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;
  const cellEl = el.closest('.cell');
  if (!cellEl) return null;
  return Array.from(cells).indexOf(cellEl);
}

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

    slots.forEach(s => s.classList.remove('selected'));
    selectedSlot = slotIndex;
    slotEl.classList.add('selected');

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

window.addEventListener('pointerup', (e) => {
  if (!dragState || dragState.pointerId !== e.pointerId) return;
  cancelDrag(slots[dragState.slotIndex]);
});
window.addEventListener('pointercancel', (e) => {
  if (!dragState || dragState.pointerId !== e.pointerId) return;
  cancelDrag(slots[dragState.slotIndex]);
});