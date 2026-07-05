Low Block – Feature Summary (Today's Update)
This update builds on yesterday's drag‑and‑drop and placement‑fix work, introducing a richer gameplay experience, smoother animations, and a polished start flow.

🎮 Gameplay Enhancements
Row/Column Clear Animation – Filled rows/columns now trigger a “pop” effect: cells float upward, scale briefly, and fade back to the empty‑cell colour – no more instant disappearance.

Wave‑Style Clear Effect – Cells in a cleared line animate with staggered delays, creating a sweeping ripple that travels across the row/column.

Floating Score Popup – Each cleared line spawns a +N text popup at the centre of the cleared area, which rises and fades out before being removed.

Line‑Count Multiplier – Clearing multiple lines in one move now boosts your score:

1 line → base score

N lines → base score × N × N

Combo Streak Multiplier – Clearing 2+ lines on consecutive moves increases the combo multiplier by 1 each time. Clearing only 1 line (or nothing) resets the combo to 0.

Expanded Shape Pool – The tray now contains 27 pieces (up from 9), including:

4‑cell bars

All 4 rotations of L, J, T, S, and Z

3×3 solid square

Plus‑shaped piece

3‑cell diagonal piece

(A U‑shaped piece was added and later removed for being awkward to place.)

Start Screen – The game no longer auto‑starts on page load. A clean start screen with a Start button greets the player; the grid and tray remain hidden until the game begins.

Resume vs. New Game – If a saved game exists in localStorage, pressing Start now prompts the player to either Resume the saved game or start a fresh one (instead of auto‑resuming).

In‑Game “Back to Menu” – A button in the game view lets players return to the start screen at any time. The board, tray, and score stay untouched in memory – only CSS visibility toggles.

How‑to‑Play Removed – The instructions overlay (and its button/event listeners) were added and then removed later the same day to keep the start screen minimal.

🐛 Bug Fixes
Grid background bleeding – The clear animation originally faded cells to opacity: 0, exposing the black .grid background. Fixed by animating the background colour back to the empty‑cell colour instead.

Hidden class overridden – The .game-wrapper stayed visible on load because a later display: flex rule outranked .hidden. Fixed by moving .hidden to the end of the stylesheet with !important to guarantee priority.

Duplicate updateScore() – Two functions with the same name existed (one without max‑score update, one with). The redundant one was removed to avoid future confusion.

Score popup positioning – The .grid element now has position: relative so that absolutely‑positioned .score-popup elements anchor correctly to the grid rather than the page.

🔧 Code Improvements
clearFullLines() is now async‑aware – Instead of clearing boardState and re‑rendering immediately, it now:

Computes affected cells

Updates score/combo

Triggers the popup and wave animation

Returns the total animation duration so the caller can wait before proceeding

tryPlaceBlock() now waits for line‑clear animations – Game‑over checks and new‑tray generation are deferred until any triggered clear animation finishes, ensuring boardState is fully updated before the next check.

New helper functions – playClearAnimation() and showScorePopup() isolate wave‑timing logic and DOM creation/cleanup, keeping clearFullLines() focused on scoring and state logic.

Start‑screen control flow – Added startNewGame() and resumeSavedGame() helpers, plus event listeners for the start screen, resume/new‑game prompt, and back‑to‑menu button – all without touching core placement/scoring logic.

Combo persistence – comboMultiplier is now saved and loaded alongside existing data (with a safe || 0 fallback for older saves).

📁 Files Modified
index.html – Added start screen, resume/new‑game prompt, and back‑to‑menu markup; how‑to‑play overlay added then removed.

style.css – Added clear‑animation keyframes, score‑popup styles, start‑screen/prompt container styles; moved .hidden to the end with !important; fixed .game-wrapper positioning.

script.js – Expanded SHAPES array; reworked clearFullLines() for animation timing, scoring multiplier, and combo tracking; added playClearAnimation(), showScorePopup(), startNewGame(), resumeSavedGame(); added start‑screen event listeners; removed duplicate updateScore(); extended save/load functions to persist combo.
