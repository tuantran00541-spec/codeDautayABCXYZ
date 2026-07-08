Low Block
Low Block is a shape-stacking puzzle game where you drag and drop polyomino pieces onto an 8×8 grid to form complete rows or columns and clear them. The game features adaptive difficulty, a fully responsive interface, and comprehensive accessibility support.

🎮 Key Features
8×8 Board – the best trade‑off between challenge and comfortable touch targets on mobile.

Fixed Cell‑Count Difficulty Tiers – Easy (≤2 cells), Medium (3–4 cells), Hard (≥5 cells).

Weighted Random Tray Generation – each slot is rolled independently (35% Easy, 50% Medium, 15% Hard).

Hard‑Piece Cap & Adaptive Weighting – at most one Hard piece per tray, and the Hard chance drops from 15% to 5% when the board is >65% full.

Fully Responsive Interface – adapts to any screen size using vmin, clamp(), and breakpoints.

Dark Mode – automatically switches according to system preference.

Accessibility – supports prefers-reduced-motion and prefers-contrast: high.

Audio System – synth‑based sound effects (Web Audio) and looping background music (HTML <audio>) with context‑aware track switching and a mute toggle.

🆕 What's New
⚙️ Gameplay Enhancements
Board Size Increased (6×6 → 8×8)
Empirical simulations showed that 8×8 raises the average survival time from ~17–41 moves to ~80 moves, while still providing comfortable touch targets.

Difficulty Tiers Redefined by Fixed Thresholds
Replaced the unbalanced percentile‑based split with fixed cell‑count thresholds: Easy ≤2, Medium 3–4, Hard ≥5. Hard now contains only the plus‑shape (5 cells) and the 3×3 square (9 cells).

Weighted Random Tray Generation
Each of the three tray slots is rolled independently, so some trays are all Easy/Medium while others still offer a real challenge.

Hard‑Piece Cap and Adaptive Weighting
A tray can contain at most one Hard piece; a second Hard roll is downgraded to Medium. When the board is >65% full, the Hard chance drops from 15% to 5% to avoid unwinnable late‑game situations.

Fixed Unplaceable‑Piece Fallback
The shape‑selection logic now cascades from the requested tier to easier tiers if no placeable shape exists, rather than randomly picking within an unplaceable tier. This single fix roughly doubled average survival time in simulations.

🎨 UI/UX Improvements
Responsive Design – uses vmin, clamp(), and breakpoints for perfect scaling across devices; optimised for landscape mode on short mobile screens.

Layout Enhancements – replaced absolute positioning with CSS Grid place-items: center; added min-height: 100dvh to avoid mobile nav‑bar overlap.

Theming & Colour System – all colours, shadows, fonts, and z‑indices are managed via CSS custom properties; automatic Dark Mode; separated cell background from panel backgrounds.

Accessibility – supports prefers-reduced-motion and prefers-contrast: high; added user-select: none, -webkit-tap-highlight-color: transparent, and touch-action: manipulation for better mobile interaction.

Visual Polish – glass‑morphism effect on game‑over overlay; smooth hover/active transitions; glow effect on selected tray slots; tray container uses flex-wrap: wrap to prevent overflow.

🔊 Audio Implementation
A complete audio system has been added, consisting of sound effects (SFX) for gameplay actions and background music that switches intelligently between menu and game states.

Sound Effects (Web Audio API, synth‑based)

Block placement – a subtle "tick" (square wave, 320 Hz, ~70 ms) plays on every successful placement.

Line clear – an ascending arpeggio (triangle wave) plays when rows/columns clear. The number of notes and spacing scale with the clear's score multiplier, so big combos sound more satisfying.

Mute toggle feedback – a single confirmation tone plays when sound is turned back on, giving audible confirmation.

Background Music (HTML <audio>, real .mp3 files)
Three tracks are stored in the audio/ folder:

leaving_home.mp3 – menu track 1

abandoned.mp3 – menu track 2

secret_base.mp3 – in‑game track

Behaviour:

On page load (or when the menu is displayed), one of the two menu tracks is chosen randomly and looped.

When the player starts or resumes a game, playback switches to secret_base.mp3, looped for the duration of play.

When the player returns to the menu from a game, the in‑game track is not cut off immediately – it is allowed to finish its current playthrough before switching to a new random menu track. If the player re‑enters a game before that happens, the in‑game track simply continues.

Manual loop handling (via the ended event) enables this "finish then switch" behaviour; native loop is not used.

Autoplay blocking is handled gracefully: the first track attempt on page load silently fails, and playback only starts after the user's first click (e.g., on the "Start" button).

Mute Button

A mute button (🔊/🔇) is placed in the top bar, controlling both SFX and music together.

Mute state is persisted in localStorage (soundMuted) across page reloads.

🐛 Bug Fixes
Fixed dark grid background during clear animation – the grid background is now consistently light in dark mode.

Fixed panel background bleed – split --bg-cell-empty (grid cells) from --bg-panel (dialogs, tray, menu‑button hover, game‑over box).

Fixed script filename typos – index.html now correctly references stage.js and drapdrop.js (not state.js and dragdrop.js).

🛠️ Code Improvements
Simulation Harness – a standalone Node.js script was built to run hundreds of games empirically, validating difficulty configurations and identifying the plus‑shaped piece as the biggest difficulty contributor.

Cascading Fallback in pickShapeFromPool() – reworked to try easier tiers when the requested tier has no placeable shapes.

Constants Re‑synced – CELL_SIZE and all CSS grid calculations updated to match the 8×8 board.

📁 Files Overview
File	Responsibility
config.js	Grid size, shape lists per tier
stage.js	Global state (boardState, trayBlocks, cells, slots, etc.)
board.js	Board logic, row/column clearing, scoring
tray.js	Tray generation, weighted selection, Hard‑piece cap
drapdrop.js	Drag‑and‑drop handling (mouse + touch)
storage-ui.js	Save/load state and UI rendering
sound.js	Full audio system (SFX + background music)
index.html	Main HTML structure and script references
style.css	All styles, theming, and responsive rules
audio/	Three .mp3 background music tracks

⚠️ Known Issue
Background music fails to load when opening index.html directly from disk (file:///...)

The browser reports:

text
net::ERR_FILE_NOT_FOUND
Symptoms:

Sound effects (SFX) work perfectly – they are generated at runtime via the Web Audio API and do not depend on external files.

Background music does not play when running the game via file://.

Root Cause:
The browser resolves the relative path (audio/...) against the on‑disk file location. The exact root cause (case sensitivity, a leftover space in a filename, an unexpected extension, or folder placement) has not yet been confirmed. All filenames in sound.js are specified as:

audio/leaving_home.mp3

audio/abandoned.mp3

audio/secret_base.mp3

(all lowercase, underscores, no spaces).

Workaround / Recommended Solution:
Serve the project through a local server instead of opening the HTML file directly. This sidesteps file:// protocol quirks entirely and is the recommended way to run the game going forward.

Options include:

VS Code Live Server extension – right‑click index.html and select "Open with Live Server".

Python's built‑in HTTP server – run python -m http.server in the project directory, then open http://localhost:8000 in your browser.

Any other local static server of your choice.

Next Steps to Fix (for contributors):

Confirm the exact on‑disk filenames via "Copy Path" in the file explorer/VS Code and diff them character‑by‑character against what sound.js expects.

Once confirmed, the filenames or the sound.js references can be corrected.

📖 How to Play
Drag and drop a piece from the tray (at the bottom) onto the 8×8 board.

Arrange pieces to completely fill a horizontal row or a vertical column.

When a row or column is filled, it clears and you earn points – the more lines you clear at once, the higher the multiplier.

The game ends when you can no longer place any piece from the current tray.

Aim for the highest score by clearing multiple lines at once and using pieces strategically.


🤝 Contributing
If you find any bugs or have suggestions for improvements, please open an issue or submit a pull request. All contributions are welcome!

