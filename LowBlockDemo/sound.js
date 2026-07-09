let audioCtx = null;
let soundMuted = localStorage.getItem('soundMuted') === 'true';

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

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

function playPlaceSound() {
  playTone({ freq: 320, duration: 0.07, type: 'square', volume: 0.12 });
}

function playClearSound(multiplier = 1) {
  const baseFreq = 440;
  const noteCount = Math.min(2 + multiplier, 6);
  const stepUp = 1.12;

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

function toggleMute() {
  soundMuted = !soundMuted;
  localStorage.setItem('soundMuted', soundMuted);
  updateMuteButton();
  applyMuteToMusic();
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
    if (!soundMuted) {
      playTone({ freq: 500, duration: 0.08, type: 'square', volume: 0.12 });
    }
  });
});

const MENU_TRACKS = ['audio/leavinghome.mp3', 'audio/abandoned.mp3'];
const INGAME_TRACK = 'audio/secretbase.mp3';

const bgMusic = new Audio();
bgMusic.loop = false;
bgMusic.volume = 0.35;

let musicContext = null;
let pendingMenuSwitch = false;

function pickRandomMenuTrack() {
  return MENU_TRACKS[Math.floor(Math.random() * MENU_TRACKS.length)];
}

function applyMuteToMusic() {
  bgMusic.muted = soundMuted;
}

function tryPlayMusic() {
  applyMuteToMusic();
  bgMusic.play().catch(() => {
  });
}

function playMenuMusic() {
  pendingMenuSwitch = false;
  musicContext = 'menu';

  bgMusic.src = pickRandomMenuTrack();
  tryPlayMusic();
}

function playInGameMusic() {
  pendingMenuSwitch = false;
  musicContext = 'ingame';

  bgMusic.src = INGAME_TRACK;
  tryPlayMusic();
}

function requestReturnToMenuMusic() {
  if (musicContext !== 'ingame') {
    playMenuMusic();
    return;
  }
  pendingMenuSwitch = true;
}

bgMusic.addEventListener('ended', () => {
  if (pendingMenuSwitch) {
    playMenuMusic();
    return;
  }
  if (musicContext === 'menu') {
    playMenuMusic();
  } else if (musicContext === 'ingame') {
    bgMusic.currentTime = 0;
    tryPlayMusic();
  }
});