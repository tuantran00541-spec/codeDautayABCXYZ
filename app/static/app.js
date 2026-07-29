let currentChapterId = null;
let currentManifest = null;

document.getElementById("load-btn").addEventListener("click", loadChapter);

async function loadChapter() {
  const url = document.getElementById("chapter-url").value.trim();
  if (!url) return;

  const resp = await fetch("/api/chapter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  currentManifest = await resp.json();
  currentChapterId = currentManifest.chapter_id;
  renderPreview();
}

function pageLabel(pages, pageIndex) {
  const page = pages[pageIndex];
  const total = pages.filter((p) => p.source_page === page.source_page).length;
  if (total <= 1) return "Trang " + (page.source_page + 1);
  return "Trang " + (page.source_page + 1) + " - Lát " + (page.slice_index + 1) + "/" + total;
}

function renderPreview() {
  const container = document.getElementById("page-view");
  container.innerHTML = "";

  const toolbar = document.createElement("div");
  toolbar.id = "preview-toolbar";

  const processBtn = document.createElement("button");
  processBtn.textContent = "Xử lý các trang đã chọn (bỏ qua trang đã đánh dấu)";
  processBtn.addEventListener("click", processSelectedPages);
  toolbar.appendChild(processBtn);

  container.appendChild(toolbar);

  currentManifest.pages.forEach((page, pageIndex) => {
    const card = document.createElement("div");
    card.className = "preview-card";
    card.dataset.pageIndex = pageIndex;

    const img = document.createElement("img");
    img.src = page.original;
    card.appendChild(img);

    const label = document.createElement("div");
    label.className = "preview-label";
    label.textContent = pageLabel(currentManifest.pages, pageIndex);
    card.appendChild(label);

    const skipBtn = document.createElement("button");
    skipBtn.className = "skip-btn";
    skipBtn.textContent = page.skipped ? "Đã bỏ qua (bấm để hủy)" : "Bỏ qua trang này";
    if (page.skipped) card.classList.add("skipped");
    skipBtn.addEventListener("click", () => toggleSkip(pageIndex, card, skipBtn));
    card.appendChild(skipBtn);

    container.appendChild(card);
  });
}

async function toggleSkip(pageIndex, card, btn) {
  const page = currentManifest.pages[pageIndex];
  const newSkipped = !page.skipped;

  await fetch("/api/skip_pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chapter_id: currentChapterId,
      page_indices: [pageIndex],
      skipped: newSkipped,
    }),
  });

  page.skipped = newSkipped;
  card.classList.toggle("skipped", newSkipped);
  btn.textContent = newSkipped ? "Đã bỏ qua (bấm để hủy)" : "Bỏ qua trang này";
}

async function processSelectedPages() {
  const indices = currentManifest.pages
    .map((p, i) => (p.skipped ? null : i))
    .filter((i) => i !== null);

  if (indices.length === 0) {
    alert("Không có trang nào để xử lý.");
    return;
  }

  const btn = document.querySelector("#preview-toolbar button");
  btn.disabled = true;
  btn.textContent = "Đang xử lý, vui lòng đợi...";

  const resp = await fetch("/api/process_pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chapter_id: currentChapterId,
      page_indices: indices,
    }),
  });
  currentManifest = await resp.json();
  renderReview();
}

function renderReview() {
  const container = document.getElementById("page-view");
  container.innerHTML = "";

  const toolbar = document.createElement("div");
  toolbar.id = "preview-toolbar";

  const hint = document.createElement("span");
  hint.className = "review-hint";
  hint.innerHTML = "Bấm \"Tô lỗi\" rồi <b>double-click vào giữa vùng lỗi</b> (bong bóng/nền) để tự động chọn trọn vùng đồng màu đó — không cần tô tay chính xác. Nếu vùng lỗi không đồng màu (dính nhiều chi tiết), tô tay bằng cách kéo chuột, nhưng nhớ <b>phủ kín toàn bộ</b> phần lỗi trong 1 lần, tô sót thì phần còn lại vẫn hiện nguyên.";
  toolbar.appendChild(hint);

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Ổn rồi, vào dịch";
  nextBtn.addEventListener("click", renderEditor);
  toolbar.appendChild(nextBtn);

  container.appendChild(toolbar);

  currentManifest.pages.forEach((page, pageIndex) => {
    if (page.skipped) return;

    const card = document.createElement("div");
    card.className = "review-card";
    card.dataset.pageIndex = pageIndex;

    const label = document.createElement("div");
    label.className = "page-block-label";
    label.textContent = pageLabel(currentManifest.pages, pageIndex);
    card.appendChild(label);

    const wrap = document.createElement("div");
    wrap.className = "review-image-wrap";

    const img = document.createElement("img");
    img.src = page.clean;
    wrap.appendChild(img);

    const canvas = document.createElement("canvas");
    canvas.className = "brush-canvas";
    wrap.appendChild(canvas);

    card.appendChild(wrap);

    const controls = document.createElement("div");
    controls.className = "review-controls";

    const brushBtn = document.createElement("button");
    brushBtn.className = "brush-toggle-btn";
    brushBtn.textContent = "Tô lỗi";
    controls.appendChild(brushBtn);

    const clearBtn = document.createElement("button");
    clearBtn.className = "clear-brush-btn";
    clearBtn.textContent = "Xóa nét vẽ";
    controls.appendChild(clearBtn);

    const submitBtn = document.createElement("button");
    submitBtn.className = "repaint-btn";
    submitBtn.textContent = "Xử lý lại vùng đã tô";
    controls.appendChild(submitBtn);

    card.appendChild(controls);
    container.appendChild(card);

    img.onload = () => setupBrush(pageIndex, img, canvas, wrap, brushBtn, clearBtn, submitBtn);
  });
}

function setupBrush(pageIndex, img, canvas, wrap, brushBtn, clearBtn, submitBtn) {
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.style.width = img.clientWidth + "px";
  canvas.style.height = img.clientHeight + "px";
  const ctx = canvas.getContext("2d");
  const BRUSH_RADIUS = Math.max(22, Math.round(img.naturalWidth * 0.035));

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = img.naturalWidth;
  srcCanvas.height = img.naturalHeight;
  const srcCtx = srcCanvas.getContext("2d");
  srcCtx.drawImage(img, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

  let brushOn = false;
  let painting = false;
  let lastDblClick = 0;

  brushBtn.addEventListener("click", () => {
    brushOn = !brushOn;
    wrap.classList.toggle("brush-mode", brushOn);
    brushBtn.textContent = brushOn ? "Đang tô (bấm để tắt)" : "Tô lỗi";
  });

  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  function pointFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  }

  function paintAt(pt) {
    ctx.fillStyle = "rgba(232, 67, 44, 0.85)";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  function floodFillAt(pt) {
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    const data = srcData.data;
    const startX = Math.min(Math.max(pt.x, 0), w - 1);
    const startY = Math.min(Math.max(pt.y, 0), h - 1);
    const idx0 = (startY * w + startX) * 4;
    const startLum = (data[idx0] + data[idx0 + 1] + data[idx0 + 2]) / 3;
    const tolerance = 28;
    const safetyCap = Math.min(Math.round(w * h * 0.15), 260000);

    const visited = new Uint8Array(w * h);
    const maskImg = ctx.createImageData(w, h);
    const stack = [startX, startY];
    let filled = 0;
    let aborted = false;

    while (stack.length) {
      const cy = stack.pop();
      const cx = stack.pop();
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
      const vIdx = cy * w + cx;
      if (visited[vIdx]) continue;

      const pIdx = vIdx * 4;
      const lum = (data[pIdx] + data[pIdx + 1] + data[pIdx + 2]) / 3;
      if (Math.abs(lum - startLum) > tolerance) continue;

      visited[vIdx] = 1;
      filled++;
      maskImg.data[pIdx] = 232;
      maskImg.data[pIdx + 1] = 67;
      maskImg.data[pIdx + 2] = 44;
      maskImg.data[pIdx + 3] = 217;

      stack.push(cx + 1, cy);
      stack.push(cx - 1, cy);
      stack.push(cx, cy + 1);
      stack.push(cx, cy - 1);

      if (filled > safetyCap) {
        aborted = true;
        break;
      }
    }

    if (aborted) {
      alert("Vùng này không đủ đồng màu để tự động chọn (có thể do gradient/chuyển màu mượt). Hãy tô tay bằng cách kéo chuột thay vì double-click.");
      return;
    }

    if (filled > 4) {
      const tmp = document.createElement("canvas");
      tmp.width = w;
      tmp.height = h;
      tmp.getContext("2d").putImageData(maskImg, 0, 0);
      ctx.drawImage(tmp, 0, 0);
    }
  }

  canvas.addEventListener("dblclick", (e) => {
    if (!brushOn) return;
    e.preventDefault();
    lastDblClick = Date.now();
    floodFillAt(pointFromEvent(e));
  });

  canvas.addEventListener("mousedown", (e) => {
    if (!brushOn) return;
    // Suppress single-stroke when part of a dblclick sequence (within 300 ms)
    if (Date.now() - lastDblClick < 300) return;
    painting = true;
    paintAt(pointFromEvent(e));
  });
  canvas.addEventListener("mousemove", (e) => {
    if (!brushOn || !painting) return;
    paintAt(pointFromEvent(e));
  });

  // Use an AbortController so the listener is removed when the card is re-rendered
  const ac = new AbortController();
  window.addEventListener("mouseup", () => { painting = false; }, { signal: ac.signal });
  // Clean up when the canvas element is removed from DOM
  new MutationObserver((_, obs) => {
    if (!document.contains(canvas)) { ac.abort(); obs.disconnect(); }
  }).observe(document.body, { childList: true, subtree: true });

  submitBtn.addEventListener("click", () => submitRepaint(pageIndex, img, canvas, ctx, submitBtn));
}

async function submitRepaint(pageIndex, img, canvas, ctx, submitBtn) {
  const blank = document.createElement("canvas");
  blank.width = canvas.width;
  blank.height = canvas.height;
  const isBlank = blank.toDataURL() === canvas.toDataURL();
  if (isBlank) {
    alert("Chưa tô vùng nào cả.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Đang xử lý lại...";

  try {
    const maskBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const formData = new FormData();
    formData.append("chapter_id", currentChapterId);
    formData.append("page_index", pageIndex);
    formData.append("mask", maskBlob, "mask.png");

    const resp = await fetch("/api/repaint_mask", { method: "POST", body: formData });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Server trả về ${resp.status}: ${txt}`);
    }
    const manifest = await resp.json();
    currentManifest.pages[pageIndex] = manifest.pages[pageIndex];

    img.src = manifest.pages[pageIndex].clean + "?t=" + Date.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } catch (err) {
    alert("Xử lý lại thất bại: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Xử lý lại vùng đã tô";
  }
}

function renderEditor() {
  const container = document.getElementById("page-view");
  container.innerHTML = "";

  currentManifest.pages.forEach((page, pageIndex) => {
    if (page.skipped) return;

    const wrapper = document.createElement("div");
    wrapper.className = "page-block-wrapper";

    const label = document.createElement("div");
    label.className = "page-block-label";
    label.textContent = pageLabel(currentManifest.pages, pageIndex);
    wrapper.appendChild(label);

    const block = document.createElement("div");
    block.className = "page-block";
    block.dataset.pageIndex = pageIndex;
    wrapper.appendChild(block);

    const imgWrap = document.createElement("div");
    imgWrap.className = "page-image-wrap";

    const img = document.createElement("img");
    img.src = page.clean;
    imgWrap.appendChild(img);

    const panel = document.createElement("div");
    panel.className = "box-panel";

    img.onload = () => {
      const scaleX = img.clientWidth / img.naturalWidth;
      const scaleY = img.clientHeight / img.naturalHeight;

      page.boxes.forEach((box, boxIndex) => {
        if (box.removed) return;

        const overlay = document.createElement("div");
        overlay.className = "box-overlay";
        overlay.dataset.pageIndex = pageIndex;
        overlay.dataset.boxIndex = boxIndex;
        overlay.style.left = box.x1 * scaleX + "px";
        overlay.style.top = box.y1 * scaleY + "px";
        overlay.style.width = (box.x2 - box.x1) * scaleX + "px";
        overlay.style.height = (box.y2 - box.y1) * scaleY + "px";
        imgWrap.appendChild(overlay);

        const item = createBoxItem(pageIndex, boxIndex);
        panel.appendChild(item);
      });
    };

    const addBoxBtn = document.createElement("button");
    addBoxBtn.className = "add-box-btn";
    addBoxBtn.textContent = "Thêm vùng thoại bị bỏ sót";
    addBoxBtn.addEventListener("click", () => {
      imgWrap.classList.toggle("draw-mode");
      addBoxBtn.textContent = imgWrap.classList.contains("draw-mode")
        ? "Kéo chuột trên ảnh để khoanh vùng..."
        : "Thêm vùng thoại bị bỏ sót";
    });
    panel.appendChild(addBoxBtn);

    enableManualDraw(imgWrap, img, pageIndex, addBoxBtn);

    const renderBtn = document.createElement("button");
    renderBtn.className = "render-btn";
    renderBtn.textContent = "Chèn chữ vào ảnh";
    renderBtn.addEventListener("click", () => renderTranslations(pageIndex));
    panel.appendChild(renderBtn);

    block.appendChild(imgWrap);
    block.appendChild(panel);
    container.appendChild(wrapper);
  });
}

function enableManualDraw(imgWrap, img, pageIndex, addBoxBtn) {
  let dragging = false;
  let start = null;
  let drawBox = null;

  imgWrap.addEventListener("mousedown", (e) => {
    if (!imgWrap.classList.contains("draw-mode")) return;
    const rect = imgWrap.getBoundingClientRect();
    dragging = true;
    start = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    drawBox = document.createElement("div");
    drawBox.className = "box-overlay drawing";
    imgWrap.appendChild(drawBox);
  });

  imgWrap.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const rect = imgWrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawBox.style.left = Math.min(start.x, x) + "px";
    drawBox.style.top = Math.min(start.y, y) + "px";
    drawBox.style.width = Math.abs(x - start.x) + "px";
    drawBox.style.height = Math.abs(y - start.y) + "px";
  });

  imgWrap.addEventListener("mouseup", async () => {
    if (!dragging) return;
    dragging = false;
    imgWrap.classList.remove("draw-mode");
    addBoxBtn.textContent = "Thêm vùng thoại bị bỏ sót";

    const left = parseFloat(drawBox.style.left) || 0;
    const top = parseFloat(drawBox.style.top) || 0;
    const w = parseFloat(drawBox.style.width) || 0;
    const h = parseFloat(drawBox.style.height) || 0;
    drawBox.remove();
    if (w < 6 || h < 6) return;

    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    await submitManualBox(
      pageIndex,
      Math.round(left * scaleX),
      Math.round(top * scaleY),
      Math.round((left + w) * scaleX),
      Math.round((top + h) * scaleY)
    );
  });
}

async function submitManualBox(pageIndex, x1, y1, x2, y2) {
  const resp = await fetch("/api/add_box", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chapter_id: currentChapterId, page_index: pageIndex, x1, y1, x2, y2 }),
  });
  const manifest = await resp.json();
  const newPage = manifest.pages[pageIndex];
  currentManifest.pages[pageIndex] = newPage;
  refreshPageAfterAddBox(pageIndex, newPage);
}

function refreshPageAfterAddBox(pageIndex, newPage) {
  const block = document.querySelector(`.page-block[data-page-index="${pageIndex}"]`);
  if (!block) return;
  const imgWrap = block.querySelector(".page-image-wrap");
  const img = imgWrap.querySelector("img");
  const panel = block.querySelector(".box-panel");
  const renderBtn = panel.querySelector(".render-btn");

  img.src = newPage.clean + "?t=" + Date.now();

  const boxIndex = newPage.boxes.length - 1;
  const box = newPage.boxes[boxIndex];

  img.onload = () => {
    const scaleX = img.clientWidth / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;
    const overlay = document.createElement("div");
    overlay.className = "box-overlay";
    overlay.dataset.pageIndex = pageIndex;
    overlay.dataset.boxIndex = boxIndex;
    overlay.style.left = box.x1 * scaleX + "px";
    overlay.style.top = box.y1 * scaleY + "px";
    overlay.style.width = (box.x2 - box.x1) * scaleX + "px";
    overlay.style.height = (box.y2 - box.y1) * scaleY + "px";
    imgWrap.appendChild(overlay);
  };

  const item = createBoxItem(pageIndex, boxIndex);
  panel.insertBefore(item, renderBtn);
}

async function removeBoxAndRepaint(pageIndex, boxIndex, item) {
  item.remove();
  const overlay = document.querySelector(
    `.box-overlay[data-page-index="${pageIndex}"][data-box-index="${boxIndex}"]`
  );
  if (overlay) overlay.remove();

  const resp = await fetch("/api/remove_box", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chapter_id: currentChapterId, page_index: pageIndex, box_index: boxIndex }),
  });
  const manifest = await resp.json();
  currentManifest.pages[pageIndex] = manifest.pages[pageIndex];

  const block = document.querySelector(`.page-block[data-page-index="${pageIndex}"]`);
  if (!block) return;
  const img = block.querySelector(".page-image-wrap img");
  img.src = manifest.pages[pageIndex].clean + "?t=" + Date.now();
}

function createBoxItem(pageIndex, boxIndex) {
  const item = document.createElement("div");
  item.className = "box-item";

  const header = document.createElement("div");
  header.className = "box-header";

  const original = document.createElement("div");
  original.className = "original";
  original.textContent = "Đang OCR...";
  header.appendChild(original);

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-box-btn";
  removeBtn.textContent = "Xóa";
  removeBtn.addEventListener("click", () => removeBoxAndRepaint(pageIndex, boxIndex, item));
  header.appendChild(removeBtn);

  item.appendChild(header);

  const colorToolbar = document.createElement("div");
  colorToolbar.className = "color-toolbar";

  const colorLabel = document.createElement("span");
  colorLabel.className = "color-label";
  colorLabel.textContent = "Màu chữ:";
  colorToolbar.appendChild(colorLabel);

  const colors = [
    { name: "Tự động tương phản", value: "auto", bg: "linear-gradient(135deg, #000 50%, #fff 50%)" },
    { name: "Trắng", value: "#ffffff", bg: "#ffffff" },
    { name: "Đen", value: "#000000", bg: "#000000" },
    { name: "Đỏ", value: "#e8432c", bg: "#e8432c" },
    { name: "Vàng", value: "#f1c40f", bg: "#f1c40f" },
  ];

  const textarea = document.createElement("textarea");
  textarea.rows = 2;
  textarea.dataset.pageIndex = pageIndex;
  textarea.dataset.boxIndex = boxIndex;
  textarea.dataset.color = "auto";

  const customPicker = document.createElement("input");
  customPicker.type = "color";
  customPicker.className = "box-color-picker";
  customPicker.value = "#ffffff";
  customPicker.title = "Chọn màu tùy chỉnh";

  colors.forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-btn" + (c.value === "auto" ? " selected" : "");
    btn.title = c.name;
    btn.style.background = c.bg;
    btn.addEventListener("click", () => {
      colorToolbar.querySelectorAll(".color-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      textarea.dataset.color = c.value;
    });
    colorToolbar.appendChild(btn);
  });

  customPicker.addEventListener("input", (e) => {
    colorToolbar.querySelectorAll(".color-btn").forEach((b) => b.classList.remove("selected"));
    textarea.dataset.color = e.target.value;
  });
  colorToolbar.appendChild(customPicker);

  item.appendChild(colorToolbar);
  item.appendChild(textarea);

  fetchOcr(pageIndex, boxIndex, original);

  return item;
}

async function fetchOcr(pageIndex, boxIndex, originalEl) {
  const lang = document.getElementById("lang-select").value;
  const resp = await fetch("/api/ocr_box", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chapter_id: currentChapterId,
      page_index: pageIndex,
      box_index: boxIndex,
      lang,
    }),
  });
  const data = await resp.json();
  originalEl.textContent = data.text || "(không đọc được)";
}

async function renderTranslations(pageIndex) {
  const textareas = document.querySelectorAll(
    `textarea[data-page-index="${pageIndex}"]`
  );
  const translations = {};
  const colors = {};
  textareas.forEach((ta) => {
    if (ta.value.trim()) {
      translations[ta.dataset.boxIndex] = ta.value.trim();
      colors[ta.dataset.boxIndex] = ta.dataset.color || "auto";
    }
  });

  const btn = document.querySelector(
    `.page-block[data-page-index="${pageIndex}"] .render-btn`
  );
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Đang chèn chữ...";
  }

  const resp = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chapter_id: currentChapterId,
      page_index: pageIndex,
      translations,
      colors,
    }),
  });
  const data = await resp.json();

  if (btn) {
    btn.disabled = false;
    btn.textContent = "Chèn chữ vào ảnh";
  }

  showRenderResult(pageIndex, data.output);
}

function showRenderResult(pageIndex, outputPath) {
  const panel = document.querySelector(
    `.page-block[data-page-index="${pageIndex}"] .box-panel`
  );
  if (!panel) return;

  let resultBox = panel.querySelector(".render-result");
  if (!resultBox) {
    resultBox = document.createElement("div");
    resultBox.className = "render-result";
    panel.appendChild(resultBox);
  }

  const cacheBust = "?t=" + Date.now();
  resultBox.innerHTML = "";

  const label = document.createElement("div");
  label.className = "render-result-label";
  label.textContent = "Kết quả:";
  resultBox.appendChild(label);

  const img = document.createElement("img");
  img.src = outputPath + cacheBust;
  resultBox.appendChild(img);

  const link = document.createElement("a");
  link.href = outputPath + cacheBust;
  link.download = outputPath.split("/").pop();
  link.className = "download-link";
  link.textContent = "Tải ảnh này về";
  resultBox.appendChild(link);
}
