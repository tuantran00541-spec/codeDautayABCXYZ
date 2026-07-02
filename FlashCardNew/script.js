const seasonThemes = {
  xuan: 'linear-gradient(135deg, #ffe0ec 0%, #d5f5e3 50%, #fff9c4 100%)', // Xuân: hồng phấn - xanh non - vàng nhạt
  ha:   'linear-gradient(135deg, #cdeffd 0%, #fff3b0 50%, #ffd6a5 100%)', // Hạ: xanh trời - vàng nắng - cam nhạt
  thu:  'linear-gradient(135deg, #ffe5b4 0%, #ffcba4 50%, #e8c39e 100%)', // Thu: cam đất - nâu nhạt
  dong: 'linear-gradient(135deg, #e0f0ff 0%, #f0f4ff 50%, #dceeff 100%)'  // Đông: trắng lạnh - xanh băng nhạt
};

function applyRandomSeason() {
  const keys = Object.keys(seasonThemes);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  document.body.style.background = seasonThemes[randomKey];
  document.body.style.minHeight = '100vh';
}

const deckPresets = {
  mau: [
    { front: 'Đỏ', back: 'Red' },
    { front: 'Xanh', back: 'Blue' },
    { front: 'Vàng', back: 'Yellow' },
    { front: 'Tím', back: 'Purple' },
    { front: 'Cam', back: 'Orange' }
  ],
  dongvat: [
    { front: 'Chó', back: 'Dog' },
    { front: 'Mèo', back: 'Cat' },
    { front: 'Gà', back: 'Chicken' },
    { front: 'Voi', back: 'Elephant' },
    { front: 'Hổ', back: 'Tiger' }
  ]
};

const defaultCards = [
  { front: 'Blue', back: 'Yellow' },
  { front: 'Khô', back: 'gà' },
  { front: 'bã', back: 'mía' },
  { front: 'Đè', back: 'Tem' }
];


document.querySelector('.container').addEventListener('click', function (e) {
  // Delete Card
  if (e.target.classList.contains('del-card')) {
    const wrapper = e.target.closest('.card-wrapper');
    if (wrapper) {
      if (wrapper._timeoutId) {
        clearTimeout(wrapper._timeoutId);
        delete wrapper._timeoutId;
      }
      wrapper.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      wrapper.style.opacity = '0';
      wrapper.style.transform = 'scale(0.8)';
      setTimeout(() => {
            wrapper.remove();
            saveCards();
          }, 300);
    }
    return;
  }

  const card = e.target.closest('.flashcard');
  if (card) {
    const wrapper = card.closest('.card-wrapper');

    card.classList.toggle('flipped');

   
    wrapper.classList.add('hide-del');

    if (wrapper._timeoutId) {
      clearTimeout(wrapper._timeoutId);
      delete wrapper._timeoutId;
    }

    
    wrapper._timeoutId = setTimeout(() => {
      wrapper.classList.remove('hide-del');
      delete wrapper._timeoutId;
    }, 600);
  }
});

//Newcard
document.querySelector('#add-btn').addEventListener('click', function () {
  const frontInput = document.querySelector('input[placeholder="Mặt Trước"]');
  const backInput = document.querySelector('input[placeholder="Mặt Sau"]');

  const frontValue = frontInput.value.trim();
  const backValue = backInput.value.trim();

  if (!frontValue || !backValue) {
    alert('Vui lòng nhập đủ 2 mặt');
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.classList.add('card-wrapper');
  wrapper.innerHTML = `
    <button class="del-card">✕</button>
    <div class="flashcard">
      <div class="card-front">${frontValue}</div>
      <div class="card-back">${backValue}</div>
    </div>
  `;

  document.querySelector('.container').appendChild(wrapper);
  saveCards();

  frontInput.value = '';
  backInput.value = '';
});


document.querySelector('#tron-btn').addEventListener('click', function () {
  const container = document.querySelector('.container');
  const wrappers = Array.from(container.querySelectorAll('.card-wrapper'));

  wrappers.forEach((w) => {
    const card = w.querySelector('.flashcard');
    if (card) card.classList.add('shuffling');
  });

  setTimeout(() => {
    for (let i = wrappers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wrappers[i], wrappers[j]] = [wrappers[j], wrappers[i]];
    }

    wrappers.forEach((w) => {
      const card = w.querySelector('.flashcard');
      if (card) card.classList.remove('shuffling');
      container.appendChild(w);
    });
    saveCards();
  }, 400);
});


function saveCards() {
  const cards = Array.from(document.querySelectorAll('.card-wrapper')).map(wrapper => ({
    front: wrapper.querySelector('.card-front').innerHTML,
    back: wrapper.querySelector('.card-back').innerHTML
  }));
  localStorage.setItem('flashcards', JSON.stringify(cards));
  updateCardCount();
}

function updateCardCount() {
  const count = document.querySelectorAll('.card-wrapper').length;
  document.querySelector('#card-count').textContent = `Số thẻ: ${count}`;
}


function createCardWrapper(front, back) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('card-wrapper');
  wrapper.innerHTML = `
    <button class="del-card">✕</button>
    <div class="flashcard">
      <div class="card-front">${front}</div>
      <div class="card-back">${back}</div>
    </div>
  `;
  return wrapper;
}


function loadCards() {
  const raw = localStorage.getItem('flashcards');

 
  if (raw === null) return;

  const saved = JSON.parse(raw);
  const container = document.querySelector('.container');
  container.innerHTML = '';
  saved.forEach(({ front, back }) => {
    container.appendChild(createCardWrapper(front, back));
  });
}
// ---------- Bộ thẻ tùy chỉnh (do người dùng tạo) ----------
function loadCustomDecks() {
  const raw = localStorage.getItem('customDecks');
  return raw ? JSON.parse(raw) : {};
}

function saveCustomDecks(decks) {
  localStorage.setItem('customDecks', JSON.stringify(decks));
}

// Render các bộ thẻ tùy chỉnh vào select, chèn ngay trước mục "+ Tạo Thẻ Mới"
function renderCustomDeckOptions() {
  const select = document.querySelector('#deck-select');
  const themOption = document.querySelector('#them-option');

  // Xóa các option custom cũ (đánh dấu bằng data-custom="true") để tránh trùng lặp
  select.querySelectorAll('option[data-custom="true"]').forEach(opt => opt.remove());

  const customDecks = loadCustomDecks();
  Object.keys(customDecks).forEach(deckName => {
    const opt = document.createElement('option');
    opt.value = `custom:${deckName}`;
    opt.textContent = deckName;
    opt.dataset.custom = 'true';
    select.insertBefore(opt, themOption);
  });
}

const deleteDeckBtn = document.querySelector('#delete-deck-btn');
let currentCustomDeckName = null; // tên bộ thẻ tùy chỉnh đang được chọn (nếu có)

document.querySelector('#deck-select').addEventListener('change', function () {
  const deckKey = this.value;
  const container = document.querySelector('.container');

  if (!deckKey) return;

  // Mở modal tạo bộ thẻ mới
  if (deckKey === 'Them') {
    openCreateDeckModal();
    this.value = '';
    return;
  }

  // Bộ thẻ tùy chỉnh do người dùng lưu trước đó
  if (deckKey.startsWith('custom:')) {
    const deckName = deckKey.slice('custom:'.length);
    const customDecks = loadCustomDecks();
    const cards = customDecks[deckName];
    if (!cards) return;

    container.innerHTML = '';
    cards.forEach(({ front, back }) => {
      container.appendChild(createCardWrapper(front, back));
    });
    saveCards();

    // Bộ thẻ tùy chỉnh -> hiện nút xóa
    currentCustomDeckName = deckName;
    deleteDeckBtn.classList.remove('hidden');

    this.value = '';
    return;
  }

  // Bộ thẻ có sẵn (mau, dongvat, ...) -> ẩn nút xóa
  if (deckPresets[deckKey]) {
    container.innerHTML = '';
    deckPresets[deckKey].forEach(({ front, back }) => {
      container.appendChild(createCardWrapper(front, back));
    });
    saveCards();

    currentCustomDeckName = null;
    deleteDeckBtn.classList.add('hidden');

    this.value = '';
  }
});

deleteDeckBtn.addEventListener('click', () => {
  if (!currentCustomDeckName) return;

  const confirmDelete = confirm(`Xóa bộ thẻ "${currentCustomDeckName}"? Hành động này không thể hoàn tác.`);
  if (!confirmDelete) return;

  const customDecks = loadCustomDecks();
  delete customDecks[currentCustomDeckName];
  saveCustomDecks(customDecks);
  renderCustomDeckOptions();

  currentCustomDeckName = null;
  deleteDeckBtn.classList.add('hidden');
});

// ---------- Modal Tạo Bộ Thẻ Mới ----------
const createDeckModal = document.querySelector('#create-deck-modal');
const newDeckCardsWrap = document.querySelector('#new-deck-cards');
const newDeckNameInput = document.querySelector('#new-deck-name');

function createDeckRow(front = '', back = '') {
  const row = document.createElement('div');
  row.classList.add('new-deck-row');
  row.innerHTML = `
    <input type="text" class="new-deck-front" placeholder="Mặt Trước" value="${front}">
    <input type="text" class="new-deck-back" placeholder="Mặt Sau" value="${back}">
    <button type="button" class="remove-row-btn" title="Xóa dòng">✕</button>
  `;
  row.querySelector('.remove-row-btn').addEventListener('click', () => {
    // Luôn giữ lại ít nhất 1 dòng
    if (newDeckCardsWrap.children.length > 1) {
      row.remove();
    } else {
      row.querySelector('.new-deck-front').value = '';
      row.querySelector('.new-deck-back').value = '';
    }
  });
  return row;
}

function openCreateDeckModal() {
  newDeckNameInput.value = '';
  newDeckCardsWrap.innerHTML = '';
  // Bắt đầu với 3 dòng trống cho tiện nhập
  for (let i = 0; i < 3; i++) {
    newDeckCardsWrap.appendChild(createDeckRow());
  }
  createDeckModal.classList.remove('hidden');
  newDeckNameInput.focus();
}

function closeCreateDeckModal() {
  createDeckModal.classList.add('hidden');
  document.querySelector('#deck-select').value = '';
}

document.querySelector('#add-deck-card-row').addEventListener('click', () => {
  newDeckCardsWrap.appendChild(createDeckRow());
});

document.querySelector('#cancel-deck-btn').addEventListener('click', closeCreateDeckModal);

// Bấm ra ngoài modal để hủy
createDeckModal.addEventListener('click', (e) => {
  if (e.target === createDeckModal) closeCreateDeckModal();
});

document.querySelector('#save-deck-btn').addEventListener('click', () => {
  const deckName = newDeckNameInput.value.trim();
  if (!deckName) {
    alert('Vui lòng đặt tên cho bộ thẻ');
    newDeckNameInput.focus();
    return;
  }

  const rows = Array.from(newDeckCardsWrap.querySelectorAll('.new-deck-row'));
  const cards = rows
    .map(row => ({
      front: row.querySelector('.new-deck-front').value.trim(),
      back: row.querySelector('.new-deck-back').value.trim()
    }))
    .filter(({ front, back }) => front && back);

  if (cards.length === 0) {
    alert('Vui lòng nhập ít nhất 1 thẻ đầy đủ (cả 2 mặt)');
    return;
  }

  const customDecks = loadCustomDecks();
  const isUpdate = Object.prototype.hasOwnProperty.call(customDecks, deckName);
  customDecks[deckName] = cards;
  saveCustomDecks(customDecks);
  renderCustomDeckOptions();

  createDeckModal.classList.add('hidden');

  const container = document.querySelector('.container');
  container.innerHTML = '';
  cards.forEach(({ front, back }) => {
    container.appendChild(createCardWrapper(front, back));
  });
  saveCards();

  document.querySelector('#deck-select').value = '';
  alert(`Đã ${isUpdate ? 'cập nhật' : 'lưu'} bộ thẻ "${deckName}"!`);
});


document.querySelector('#reset-btn').addEventListener('click', function () {
  const container = document.querySelector('.container');
  container.innerHTML = '';

  defaultCards.forEach(({ front, back }) => {
    container.appendChild(createCardWrapper(front, back));
  });

  saveCards(); 
});

loadCards();
updateCardCount();
applyRandomSeason();
renderCustomDeckOptions();
