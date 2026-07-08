// ============================================
// ÂM THANH (Web Audio API - synth thuần, không dùng file)
// ============================================
// Dùng oscillator để tạo tiếng "bíp" kiểu retro 8-bit, hợp với font pixel
// đang dùng trong game. Không cần tải file mp3/wav nào cả.
//
// AudioContext chỉ được tạo/resume khi có tương tác người dùng đầu tiên
// (do trình duyệt chặn autoplay âm thanh), nên ta tạo "lazy" - chỉ khởi tạo
// khi thực sự cần phát âm thanh lần đầu.

let audioCtx = null;
let soundMuted = localStorage.getItem('soundMuted') === 'true';

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Một số trình duyệt tự "suspend" context nếu tạo trước tương tác người dùng.
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Phát 1 nốt đơn giản: tần số, thời lượng, loại sóng, âm lượng đỉnh.
// Dùng envelope (gain tăng nhanh rồi giảm dần) để tránh tiếng "click" khô khốc
// lúc bắt đầu/kết thúc nốt.
function playTone({ freq, duration = 0.12, type = 'square', volume = 0.15, delay = 0 }) {
  if (soundMuted) return;

  const ctx = getAudioContext();
  const startTime = ctx.currentTime + delay;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, startTime);

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

// ---- Tiếng đặt khối xuống lưới ----
// Tiếng "tick" ngắn, gọn, tần số vừa phải - không gây chú ý quá mức vì
// đây là hành động lặp lại liên tục nhất trong game.
function playPlaceSound() {
  playTone({ freq: 320, duration: 0.07, type: 'square', volume: 0.12 });
}

// ---- Tiếng nổ hàng/cột ----
// Nổ càng nhiều dòng / combo càng cao thì âm thanh càng "dày" và cao hơn,
// tạo cảm giác thoả mãn tăng dần theo hiệu suất người chơi.
// Dùng 1 chuỗi nốt ngắn bay lên (arpeggio) thay vì 1 nốt đơn, giống hiệu ứng
// "ting" quen thuộc trong các game xếp hình.
function playClearSound(multiplier = 1) {
  const baseFreq = 440; // nốt La
  const noteCount = Math.min(2 + multiplier, 6); // càng nhiều multiplier càng nhiều nốt, tối đa 6
  const stepUp = 1.12; // mỗi nốt cao hơn nốt trước 1 chút (thang ngũ cung giả lập)

  for (let i = 0; i < noteCount; i++) {
    playTone({
      freq: baseFreq * Math.pow(stepUp, i),
      duration: 0.15,
      type: 'triangle',
      volume: 0.14,
      delay: i * 0.045
    });
  }
}

// ---- Bật/tắt âm thanh + lưu lựa chọn ----
function toggleMute() {
  soundMuted = !soundMuted;
  localStorage.setItem('soundMuted', soundMuted);
  updateMuteButton();
  applyMuteToMusic(); // đồng bộ luôn trạng thái mute sang nhạc nền (phần nhạc nền ở cuối file này)
  return soundMuted;
}

function updateMuteButton() {
  const btn = document.querySelector('#muteBtn');
  if (!btn) return;
  btn.textContent = soundMuted ? '🔇' : '🔊';
  btn.setAttribute('aria-label', soundMuted ? 'Bật âm thanh' : 'Tắt âm thanh');
}

document.addEventListener('DOMContentLoaded', () => {
  const muteBtn = document.querySelector('#muteBtn');
  if (!muteBtn) return;
  updateMuteButton();
  muteBtn.addEventListener('click', () => {
    toggleMute();
    // Phát 1 tiếng nhỏ ngay khi bật lại, để người chơi biết đã bật thành công
    // (chỉ phát nếu vừa BẬT, không phát khi vừa tắt).
    if (!soundMuted) {
      playTone({ freq: 500, duration: 0.08, type: 'square', volume: 0.12 });
    }
  });
});

// ============================================
// NHẠC NỀN (thẻ <audio> - phát file mp3 thật, không phải synth)
// ============================================
// Dùng <audio> thay vì Web Audio API cho nhạc nền vì đây là file dài, cần
// loop, và <audio> tự lo buffering/decode cho ta, không cần tự quản lý
// AudioBufferSourceNode.
//
// 2 bài "menu" (leaving_home / abandoned): random chọn 1 bài mỗi khi vào màn chờ.
// 1 bài "in-game" (secret_base): luôn phát bài này khi đang chơi.
//
// LOOP TỰ QUẢN LÝ (không dùng thuộc tính audio.loop có sẵn):
// vì ta cần 1 trạng thái "đang chờ hết bài rồi mới chuyển ngữ cảnh" khi người
// chơi bấm nút quay lại menu (↩). Nếu dùng audio.loop = true, sự kiện 'ended'
// sẽ không bao giờ bắn (trình duyệt tự lặp nội bộ), nên không có chỗ để "chen"
// hành động chuyển bài vào đúng lúc bài kết thúc. Do đó ta để loop = false và
// tự phát lại từ đầu trong listener 'ended', trừ khi đang có yêu cầu chuyển
// ngữ cảnh - lúc đó mới thực sự đổi sang bài menu mới.

const MENU_TRACKS = ['audio/leavinghome.mp3', 'audio/abandoned.mp3'];
const INGAME_TRACK = 'audio/secretbase.mp3';

const bgMusic = new Audio();
bgMusic.loop = false; // tự xử lý loop thủ công, xem giải thích ở trên
bgMusic.volume = 0.35; // nhạc nền nên nhỏ hơn SFX, tránh át tiếng "tick"/"ting"

let musicContext = null; // 'menu' | 'ingame' | null (chưa bắt đầu)
let pendingMenuSwitch = false; // đang đợi bài in-game hiện tại chạy hết trước khi về menu

function pickRandomMenuTrack() {
  return MENU_TRACKS[Math.floor(Math.random() * MENU_TRACKS.length)];
}

function applyMuteToMusic() {
  bgMusic.muted = soundMuted;
}

function tryPlayMusic() {
  applyMuteToMusic();
  bgMusic.play().catch(() => {
    // Bị trình duyệt chặn autoplay (chưa có tương tác người dùng) -> im lặng
    // bỏ qua, nhạc sẽ tự phát ngay sau cú bấm Start (browser coi đó là tương
    // tác hợp lệ để "mở khoá" audio).
  });
}

// Gọi khi vào màn chờ (load trang lần đầu, hoặc khi bài in-game vừa chạy hết
// sau khi người chơi đã bấm ↩ quay lại menu).
function playMenuMusic() {
  pendingMenuSwitch = false;
  musicContext = 'menu';

  bgMusic.src = pickRandomMenuTrack();
  tryPlayMusic();
}

// Gọi khi vào chơi thật sự (Start / Continue / New Game).
function playInGameMusic() {
  pendingMenuSwitch = false;
  musicContext = 'ingame';

  bgMusic.src = INGAME_TRACK;
  tryPlayMusic();
}

// Gọi khi bấm nút ↩ quay lại menu TỪ TRONG GAME.
// Không cắt nhạc ngay - chỉ đánh dấu "đang chờ", để nghe hết bài in-game
// hiện tại (đến khi tự nhiên kết thúc) rồi mới đổi sang nhạc menu.
function requestReturnToMenuMusic() {
  if (musicContext !== 'ingame') {
    // Không có nhạc in-game nào đang chạy (ví dụ bị chặn autoplay từ đầu,
    // hoặc audio đã dừng vì lý do khác) -> chuyển thẳng sang menu luôn,
    // không có gì để "chờ hết bài" cả.
    playMenuMusic();
    return;
  }
  pendingMenuSwitch = true;
  // Giữ nguyên musicContext = 'ingame' cho đến khi bài thật sự hết, để nếu
  // người chơi bấm Start quay lại game trước đó, playInGameMusic() vẫn nhận
  // ra đang đúng bài đang phát và không cần restart.
}

// Khi 1 bài kết thúc tự nhiên:
// - Nếu đang chờ chuyển sang menu (pendingMenuSwitch) -> chuyển ngay bây giờ.
// - Ngược lại (đang ở menu hoặc vẫn đang chơi bình thường) -> phát lại đúng
//   ngữ cảnh hiện tại, coi như hành vi loop bình thường.
bgMusic.addEventListener('ended', () => {
  if (pendingMenuSwitch) {
    playMenuMusic();
    return;
  }
  if (musicContext === 'menu') {
    playMenuMusic(); // đổi bài menu random mỗi vòng lặp mới cho đỡ nhàm
  } else if (musicContext === 'ingame') {
    bgMusic.currentTime = 0;
    tryPlayMusic();
  }
});