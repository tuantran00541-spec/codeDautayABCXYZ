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

Random Block Colours – Each of the 3 tray pieces is now assigned a random colour from a fixed palette (green, blue, orange, pink, purple, cyan, yellow, red) when generated. The colour sticks with the piece through drag, placement, and storage, instead of every block always being the same green.

Bevelled 3D Block Look – Placed cells (and tray previews) now render with an inset box‑shadow – a lighter highlight on the top‑left and a darker shade on the bottom‑right – giving each block a raised, chunky look instead of a flat colour fill. The line‑clear "pop" animation was updated to flash the block's own colour instead of always flashing green.

Difficulty‑Balanced Shape Draw – Instead of drawing all 3 tray pieces from the full shape pool at random (which could hand the player three hard pieces, or three trivial ones, back‑to‑back), the 27 shapes are now split into three difficulty tiers by cell count (Easy / Medium / Hard, ~9 shapes each via percentile split). Every new tray guarantees exactly one Easy, one Medium, and one Hard piece.

Board‑Aware Piece Selection – Within each difficulty tier, the picker first checks which shapes can actually still fit somewhere on the current board (reusing the same fit‑check as the game‑over detector) and randomises only among those. If a tier has no placeable shape left (board too full for that difficulty), it falls back to a free random pick within that tier so a tray can always be generated.

🐛 Bug Fixes
Grid background bleeding – The clear animation originally faded cells to opacity: 0, exposing the black .grid background. Fixed by animating the background colour back to the empty‑cell colour instead.

Hidden class overridden – The .game-wrapper stayed visible on load because a later display: flex rule outranked .hidden. Fixed by moving .hidden to the end of the stylesheet with !important to guarantee priority.

Duplicate updateScore() – Two functions with the same name existed (one without max‑score update, one with). The redundant one was removed to avoid future confusion.

Score popup positioning – The .grid element now has position: relative so that absolutely‑positioned .score-popup elements anchor correctly to the grid rather than the page.

Game‑Over Overlay Not Covering the Screen – #gameOverOverlay used position: fixed but was nested inside .game-wrapper, which has a transform for centring. A transformed ancestor turns fixed into "fixed relative to that ancestor" per the CSS spec, so the overlay only covered the wrapper's box instead of the full viewport. Fixed by moving the overlay markup out of .game-wrapper so it sits directly under <body>.

Trophy/Score Misalignment – The 🏆 max‑score line looked vertically off from its digits. Root cause was twofold: (1) the emoji and number were written as a single text node, so display:flex; align-items:center on the parent had nothing to centre against; and (2) the pixel font (Press Start 2P) has no glyph for the trophy emoji, so the browser substituted a system font with a different baseline. Fixed by rendering the emoji and number as two separate <span> elements (via innerHTML) and giving the emoji its own .trophy-icon class with a matched font-size/line-height.

Back Button Not Aligned With Trophy Score – .menu-btn used position: absolute with hard‑coded coordinates, so it lived outside the normal layout flow and couldn't stay in sync with #maxScore next to it. Fixed by wrapping both elements in a new .top-bar flex container (align-items: center, gap: 16px) and removing the absolute positioning from .menu-btn.

Stuck Drag Ghost Element – The semi‑transparent "ghost" clone shown while dragging a piece (appended to document.body with position: fixed) could be left behind permanently if the pointerup/pointercancel event failed to reach the exact .block-slot element that was tracking the drag (e.g. pointer released outside the slot, tab switch mid‑drag, multi‑touch edge cases). Fixed by adding window‑level pointerup/pointercancel listeners as a safety net that always clean up the ghost and reset drag state, regardless of which element the browser delivers the event to.

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

boardState Now Stores Colour, Not Just Boolean – Each cell in boardState changed from true/false to either null (empty) or a colour string, so every placed block remembers its own colour through re‑renders, line‑clear animations, and save/load, instead of just tracking "filled or not."

Colour Persistence in Save/Load – saveGameState()/loadGameState() were extended to persist trayColors alongside the existing fields, with a migration path that converts any legacy true/false boardState values into a safe default colour on load.

Extracted canShapeBePlacedOnBoard() – The "can this shape fit anywhere on the board" scan, previously inlined inside checkGameOver(), was pulled out into its own reusable function so both the game‑over check and the new difficulty‑aware tray generator share one source of truth instead of duplicating the scan logic.

Percentile‑Based Difficulty Split – Rather than filtering shapes by a fixed cell‑count threshold (which skewed heavily toward the medium tier given how many 4‑cell shapes exist in the pool), shapes are sorted by cell count and sliced into three equal‑sized groups, keeping the Easy/Medium/Hard pools balanced regardless of how the underlying shape pool is distributed.

📁 Files Modified
index.html – Added start screen, resume/new‑game prompt, and back‑to‑menu markup; how‑to‑play overlay added then removed; game‑over overlay moved outside .game-wrapper to fix full‑screen coverage; menu button and max‑score wrapped in a new .top-bar container.

style.css – Added clear‑animation keyframes, score‑popup styles, start‑screen/prompt container styles; moved .hidden to the end with !important; fixed .game-wrapper positioning; added bevelled inset box‑shadow styling for filled cells and tray previews via a shared --block-color variable; added .top-bar flex layout and .trophy-icon font styling; switched the base font to "Press Start 2P" via Google Fonts.

script.js – Expanded SHAPES array; reworked clearFullLines() for animation timing, scoring multiplier, and combo tracking; added playClearAnimation(), showScorePopup(), startNewGame(), resumeSavedGame(); added start‑screen event listeners; removed duplicate updateScore(); extended save/load functions to persist combo; converted boardState from boolean to colour‑based storage with a BLOCK_COLORS palette and randomBlockColor(); added window‑level pointer listeners to prevent stuck drag ghosts; extracted canShapeBePlacedOnBoard() and added EASY_SHAPES/MEDIUM_SHAPES/HARD_SHAPES tiers plus pickShapeFromPool() for board‑aware, difficulty‑balanced tray generation.
