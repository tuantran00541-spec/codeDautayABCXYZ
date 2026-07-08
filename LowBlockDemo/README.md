Low Block
Low Block is a shape-stacking puzzle game where you drag and drop polyomino pieces onto an 8×8 grid to form complete rows or columns and clear them. The game features adaptive difficulty, a fully responsive interface, and comprehensive accessibility support.

🎮 Key Features
8×8 Board – strikes the best balance between challenge and comfortable touch targets on mobile devices.

Fixed Cell‑Count Difficulty Tiers – Easy (≤2 cells), Medium (3–4 cells), Hard (≥5 cells), replacing the previous percentile‑based split.

Weighted Random Tray Generation – each slot is rolled independently with odds: 35% Easy, 50% Medium, 15% Hard.

Hard‑Piece Cap – at most one Hard piece per tray; if the board is >65% full, the Hard chance drops from 15% to 5%.

Fully Responsive Interface – automatically adapts cell sizes, spacing, and typography to any screen (phones, tablets, desktops).

Dark Mode – automatically switches according to system preference.

Accessibility – supports prefers-reduced-motion and prefers-contrast: high for users with special needs.

🆕 What's New (Latest Update)
⚙️ Gameplay Enhancements
Board Size Increased (6×6 → 8×8)
Based on simulations running hundreds of automated games, the 8×8 board raises the average survival time from ~17–41 moves to ~80 moves, while still keeping cells large enough for comfortable touch interaction.

Difficulty Tiers Redefined by Fixed Thresholds
The old percentile‑based split was unbalanced (15 out of 27 shapes had exactly 4 cells). Now tiers are defined by cell count: Easy ≤2, Medium 3–4, Hard ≥5. Hard now contains only the plus‑shaped piece (5 cells) and the 3×3 square (9 cells).

Weighted Random Tray Generation
No longer forces one piece from each tier per tray. Each of the three slots is rolled independently, so some trays can be all Easy/Medium while others still offer real challenge.

Hard‑Piece Cap and Adaptive Weighting
A tray can contain at most one Hard piece; a second Hard roll is downgraded to Medium. Also, when the board is more than 65% full, the Hard chance drops from 15% to 5% to avoid unwinnable late‑game situations.

Fixed Unplaceable‑Piece Fallback
The shape‑selection logic now cascades from the requested tier to easier tiers if no placeable shape exists in the original tier, rather than picking randomly within an unplaceable tier. This single fix roughly doubled average survival time in simulations.

Fixed Dark Grid Background During Clear Animation
The grid background (visible through gaps and when cells lift during clears) is now consistently light in dark mode, eliminating the black flashing patch.

Fixed Panel Background Bleed
Split --bg-cell-empty (grid cells only) from --bg-panel (dialogs, tray slots, menu‑button hover, game‑over box) so changing cell colour no longer recolours unrelated UI.

Fixed Script Filename Typos
index.html now correctly references stage.js and drapdrop.js (formerly misnamed as state.js and dragdrop.js), allowing the game to load properly.

🎨 UI/UX Improvements
Responsive Design

Uses vmin and clamp() to make cell sizes, gaps, and typography fluid across all screens.

Breakpoints for small screens (≤360px) and tablets (≥768px).

Optimised for landscape mode on mobile devices with low height (≤500px).

Layout Enhancements

Replaced position: absolute + transform centering with CSS Grid place-items: center, avoiding containing‑block issues that affected position: fixed descendants.

Added min-height: 100dvh to prevent overlap by mobile browser navigation bars.

Theming & Colour System

All colours, shadows, fonts, z‑indices, and animation timings are managed via CSS custom properties (Design Tokens).

Automatic Dark Mode via prefers-color-scheme: dark.

Separated grid cell background from panel backgrounds for independent theming.

Accessibility

prefers-reduced-motion support: disables or minimises all animations.

prefers-contrast: high support: increases contrast and border visibility.

user-select: none and -webkit-tap-highlight-color: transparent for smoother touch interaction.

touch-action: manipulation to prevent double‑tap zoom on mobile.

Visual Polish

backdrop-filter: blur(4px) on the game‑over overlay for a glass‑morphism effect.

Smooth transitions on interactive elements (buttons, slots) with hover/active states.

Glow shadow effect on selected tray slots.

Tray container uses flex-wrap: wrap to prevent overflow on narrow screens.

8×8 Grid Resizing

Updated --cell-size, grid-template-columns/rows, and top‑bar max-width to match the new 8‑column layout.

Adjusted responsive breakpoints to keep touch targets comfortable on mobile.

🛠️ Code Improvements
Simulation Harness for Difficulty Validation
A standalone Node.js script was built to simulate hundreds of games using the real shape/placement/clear/tray logic. It empirically compared configurations (board size, shape pool, weighting) – for example, it identified the plus‑shaped piece as the single biggest difficulty contributor among Hard shapes.

Cascading Fallback in pickShapeFromPool()
Reworked to try progressively easier tiers when the requested tier has no placeable shapes, rather than falling back only within the original (possibly unplaceable) tier.

Constants Re‑synced with New Board Size
CELL_SIZE in board.js (used for floating score popup positioning) updated from 50 to 38 to match the new --cell-size; all CSS grid and top‑bar calculations updated accordingly.

🛠️ Technology Stack
HTML5 – structure.

CSS3 – custom properties, Grid, Flexbox, Media Queries, dark mode, accessibility features.

JavaScript (ES6+) – modularised into:

config.js – global configuration (grid size, shape lists per tier).

stage.js – global state (boardState, trayBlocks, cells, slots, ...).

board.js – board logic, row/column clearing, scoring.

tray.js – tray generation, weighted shape selection, Hard‑piece cap.

drapdrop.js – drag‑and‑drop handling (mouse + touch).

storage-ui.js – save/load state and UI rendering.

🚀 How to Run
Download the entire source code.

Open index.html in a modern web browser (Chrome, Firefox, Edge, Safari).

The game will start automatically. No additional setup required.

📖 How to Play
Drag and drop a piece from the tray (at the bottom) onto the 8×8 board.

Arrange pieces to completely fill a horizontal row or a vertical column.

When a row or column is filled, it clears and you earn points.

The game ends when you can no longer place any piece from the current tray.

Aim for the highest score by clearing multiple lines at once and using pieces strategically.

🤝 Contributing
If you find any bugs or have suggestions for improvements, please open an issue or submit a pull request. All contributions are welcome!

