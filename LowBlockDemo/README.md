Low Block - Feature Summary (Today's Update)

Summary of changes made today to the Low Block puzzle game (block-placement game on a 6x6 grid, similar to Block Blast).

🎮 Gameplay Features


Drag & drop placement: blocks can now be dragged directly from the tray and dropped onto the grid, using Pointer Events so it works with both mouse and touch input
Click-to-place still supported: the original select-a-slot-then-click-a-cell flow remains fully functional alongside drag & drop — players can use either method interchangeably
Live placement preview while dragging: as a block is dragged over the grid, the cells it would occupy are highlighted (green) if the position is valid, or the hovered cell is flagged red if it isn't
Drag threshold to distinguish tap vs. drag: pointer movement must exceed a small threshold (6px) before a drag is registered; short taps are treated as simple slot selection, preventing accidental placement and keeping other controls responsive
Rotate feature removed: the rotate button, its animation, and the rotateShape logic have been fully removed to simplify the tray interaction now that drag & drop is the primary placement method


🐛 Bugs Fixed


Placement anchor bug (multi-cell shapes): previously, a block could only be placed correctly if the player clicked what the code assumed was its "first" cell. Clicking any other cell of the shape (e.g. the foot of an L-piece) could miscalculate the target position, causing valid, snug placements to be incorrectly rejected. Fixed by trying every cell of the shape as a potential anchor for the clicked/dropped cell, and accepting the first anchor that produces a valid, in-bounds, non-overlapping placement
Rotate button unresponsive after selecting a tray block: pointer capture was being applied on pointerdown, which locked all subsequent pointer events to the tray slot — including short taps meant only to select a block — preventing the (now removed) rotate button from receiving its click. Fixed by only initiating pointer capture and drag behavior once the drag threshold is exceeded, leaving simple taps unaffected


🔧 Code Structure


Refactored placement logic into tryPlaceBlock(slotIndex, cellIndex): the placement algorithm (anchor resolution, bounds/overlap checking, board update, line clearing, tray refresh, game-over check, state saving) is now a single reusable function called by both the click handler and the drag-and-drop drop handler, avoiding duplicated logic between the two input methods


📁 Files


index.html — game markup (grid, tray, game-over overlay); rotate button removed
style.css — layout, grid styling, shadows, overlay/modal styling, and new preview-highlight styles for drag & drop; rotate button and rotation animation styles removed
script.js — game logic: board state, shape generation, placement validation (tryPlaceBlock), line clearing, scoring, drag-and-drop handling via Pointer Events, localStorage persistence; rotation logic removed
