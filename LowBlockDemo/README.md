# Low Block — Update Log: Audio Implementation

This entry documents the audio system added to Low Block in this session:
sound effects (SFX) for gameplay actions and a looping background music
system with context-aware track switching.

## 🔊 What Was Added

### Sound Effects (Web Audio API, synth-based)
No external audio files are used for SFX — all tones are generated at
runtime with oscillators, matching the game's retro pixel-art aesthetic.

- **Block placement** — a short, low-key "tick" (square wave, 320 Hz,
  ~70ms) plays every time a piece is successfully placed on the board.
  Kept deliberately subtle since this is the most frequent action in the
  game.
- **Line clear** — a short ascending arpeggio (triangle wave) plays when
  one or more rows/columns clear. The number of notes and their spacing
  scale with the clear's score multiplier, so higher combos sound
  noticeably "bigger" and more satisfying than a single-line clear.
- **Mute toggle feedback** — a single confirmation tone plays when sound
  is turned back on, so the player gets audible confirmation the toggle
  worked.

### Background Music (HTML `<audio>`, real mp3 files)
Three tracks are used, stored in `audio/`:

| File | Role |
|---|---|
| `audio/leaving_home.mp3` | Menu track (candidate 1) |
| `audio/abandoned.mp3` | Menu track (candidate 2) |
| `audio/secret_base.mp3` | In-game track |

**Behavior:**
- On page load / whenever the start menu is showing, one of the two menu
  tracks is chosen at random and looped.
- When the player starts or resumes a game, playback switches to
  `secret_base.mp3`, looped for the duration of play.
- When the player presses the back-to-menu button (↩) *during* a game,
  the in-game track is **not** cut off immediately. It's allowed to
  finish its current playthrough naturally; only then does the game pick
  a new random menu track. If the player jumps back into a game before
  that happens, the in-game track simply continues uninterrupted.
- Looping is handled manually in JS (`ended` event) rather than via the
  native `audio.loop` attribute, specifically so this "let it finish,
  then switch" behavior is possible — `loop = true` would prevent the
  `ended` event from ever firing.
- Because browsers block audio autoplay before any user interaction, the
  first menu track attempt on page load will silently fail and only
  actually start playing right after the player's first click (the
  "Start" button), which counts as a valid interaction.

### Mute Button
- A single 🔊/🔇 button was added to the top bar (next to the existing
  menu/back button).
- It controls **both** SFX and background music together — there is no
  separate volume control for each.
- Mute state is persisted in `localStorage` (`soundMuted`), so it's
  remembered across page reloads.

## 📁 Files Changed

- `sound.js` — added the full background-music module (track selection,
  play/pause logic, menu ⇄ in-game switching) alongside the existing SFX
  functions; mute toggle now also calls `applyMuteToMusic()`.
- `tray.js` — calls `playPlaceSound()` right after a piece is committed
  to `boardState`.
- `board.js` — calls `playClearSound(finalMultiplier)` inside
  `clearFullLines()`, right after the score/multiplier for the clear is
  computed.
- `storage-ui.js` — wires music calls into the existing screen-transition
  points: `playMenuMusic()` on initial load, `playInGameMusic()` on
  Start/Continue/New Game, `requestReturnToMenuMusic()` on the ↩ button.
- `index.html` — added the mute button markup and the `sound.js`
  `<script>` tag (loaded before the other gameplay scripts, since they
  call into it).
- `audio/` — new folder holding the three `.mp3` tracks.

## ⚠️ Known Issue (Not Yet Fixed)

Background music currently fails to load when running the game by
opening `index.html` directly from disk (`file:///...`), reporting:

------------------------
net::ERR_FILE_NOT_FOUND
------------------------

This was traced to the browser resolving the relative path (`audio/...`)
against the actual on-disk file location — the exact root cause (case
sensitivity, a leftover space in a filename, an unexpected extension, or
folder placement) has not been confirmed yet. Sound effects (which don't
depend on external files) work fine; only the background music `<audio>`
tracks are affected.

**Next steps to try:**
1. Confirm the exact on-disk filename via "Copy Path" in the file
   explorer/VS Code and diff it character-by-character against what
   `sound.js` expects (`audio/leaving_home.mp3`, `audio/abandoned.mp3`,
   `audio/secret_base.mp3` — all lowercase, underscores, no spaces).
2. Alternatively, serve the project through a local server (e.g. VS
   Code's "Live Server" extension, or `python -m http.server`) instead of
   opening the HTML file directly — this sidesteps `file://` protocol
   quirks entirely and is the recommended way to run the game going
   forward regardless of this bug.
