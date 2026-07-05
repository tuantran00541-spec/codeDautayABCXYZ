Low Block - Feature Summary (Today's Update)
Summary of changes made today to the Low Block puzzle game, building on yesterday's drag-and-drop and placement-fix work.
🎮 Gameplay Features

Row/column clear animation: when a row or column is completely filled, the affected cells now play a "pop" animation — floating upward, scaling briefly, then fading back to the empty-cell color — instead of disappearing instantly
Wave-style clear effect: cells within a cleared row/column animate with a staggered delay based on their position, creating a ripple/wave effect that sweeps across the line instead of all cells clearing simultaneously
Floating score popup: clearing a line now spawns a "+N" text popup at the center of the cleared area, which rises upward and fades out before being removed from the DOM
Line-count multiplier: clearing multiple rows/columns in a single move now multiplies the score (clearing 1 line = base score; clearing N lines at once = base score × N × N)
Combo streak multiplier: clearing 2+ lines on consecutive moves builds a combo — the multiplier increases by 1 each consecutive move that clears 2+ lines. Clearing only 1 line, or clearing nothing, resets the combo back to 0
Expanded shape set: the tray shape pool was expanded from 9 to 27 pieces, adding 4-cell bars, all four rotations of L, J, T, S and Z pieces, a 3x3 solid square, a plus-shaped piece, and a diagonal 3-cell piece (a U-shaped piece was added and later removed for being awkward to place)
Start screen: the game no longer auto-starts on page load. A start screen now greets the player with a "Start" button; the game grid/tray stay hidden until the player begins
Resume vs. New game prompt: if a saved game exists in localStorage when "Start" is pressed, the player is asked to either resume the saved game or start a fresh one, instead of resuming automatically
In-game "back to menu" button: a button in the game view lets the player return to the start screen at any time without pausing or resetting — the board, tray, and score remain untouched in memory and are simply hidden/shown via CSS
How-to-play screen removed: an instructions overlay was added and then removed later the same day, along with its button and related event listeners, to keep the start screen minimal

🐛 Bugs Fixed

Grid background bleeding through during clear animation: the row/column clear animation originally faded cells to opacity: 0, which exposed the black .grid background underneath. Fixed by animating the cell's background color back to the empty-cell color instead of using opacity
.hidden class silently overridden by later CSS rule: the .game-wrapper element stayed visible on page load despite having the hidden class, because a .game-wrapper { display: flex } rule was declared after .hidden { display: none } in the stylesheet — with equal specificity, the later rule wins. Fixed by moving .hidden to the end of the stylesheet with !important, so it always takes precedence regardless of declaration order
Duplicate updateScore() function declaration: two functions with the same name existed in the file (one without the max-score update, one with it); due to hoisting, the second silently overrode the first. Not a functional bug, but the redundant declaration was removed to avoid confusion in future edits
Missing position context for score popups: .grid needed position: relative added so that dynamically created .score-popup elements (positioned absolute) anchor correctly to the grid instead of the page

🔧 Code Structure

clearFullLines() reworked to be asynchronous-aware: instead of clearing boardState and re-rendering immediately, the function now computes affected cells, updates the score/combo, triggers the popup and wave animation, and returns the total animation duration so the caller can wait before proceeding
tryPlaceBlock() updated to await line-clear animations: game-over checks and new-tray generation are now deferred via setTimeout until any triggered clear animation finishes, ensuring boardState fully reflects cleared lines before the next check runs
New playClearAnimation() and showScorePopup() helpers: isolate the wave-animation timing logic and the score-popup DOM creation/cleanup, keeping clearFullLines() focused on scoring/state logic
New start-screen control flow: added startNewGame() and resumeSavedGame() helper functions, plus event listeners wiring the start screen, resume/new-game prompt, and back-to-menu button to the existing render/save/load functions — no changes were needed to the core placement or scoring logic
comboMultiplier persisted alongside existing save data: added to saveGameState()/loadGameState() with a safe fallback (|| 0) for saves created before this field existed

📁 Files

index.html — added start screen, resume/new-game prompt, and back-to-menu button markup; how-to-play button/overlay added and then removed
style.css — added clear-animation keyframes, score-popup styles, start-screen/prompt container styles, .hidden utility class (moved to end of file with !important); fixed .game-wrapper positioning
script.js — expanded SHAPES array; reworked clearFullLines() for animation timing, scoring multiplier, and combo tracking; added playClearAnimation(), showScorePopup(), startNewGame(), resumeSavedGame(); added start-screen event listeners; removed duplicate updateScore(); extended saveGameState()/loadGameState() for combo persistence
