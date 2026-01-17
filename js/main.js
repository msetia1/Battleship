// js/main.js
import { CONFIG } from "./config.js";
import { Game } from "./game.js";

const playerBoardEl = document.getElementById("player-board");
const targetBoardEl = document.getElementById("target-board");

const statusEl = document.getElementById("status");
const rotateBtn = document.getElementById("rotate-btn");
const startBtn = document.getElementById("start-btn");

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

/**
 * Build GRID_SIZE x GRID_SIZE DOM cells once.
 * onCellClick(x,y) is called when user clicks a cell.
 */
function buildGrid(container, onCellClick) {
  container.innerHTML = "";

  for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
    for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);

      if (onCellClick) {
        cell.addEventListener("click", () => onCellClick(x, y));
      }

      container.appendChild(cell);
    }
  }
}

/**
 * Render a board into an existing grid container.
 * revealShips=true shows ships; false hides ships (target board).
 */
function renderBoard(container, board, revealShips) {
  const cells = container.querySelectorAll(".cell");

  cells.forEach((cell) => {
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const state = board.grid[y][x];

    cell.className = "cell";

    // Always show shots
    if (state === CONFIG.CELL_STATE.HIT) cell.classList.add("hit");
    if (state === CONFIG.CELL_STATE.MISS) cell.classList.add("miss");
    if (state === CONFIG.CELL_STATE.SUNK) cell.classList.add("sunk");

    // Only show ships when allowed
    if (revealShips && state === CONFIG.CELL_STATE.SHIP) {
      cell.classList.add("ship");
    }

    // Check if this cell is part of a ship
    const isShip = state === CONFIG.CELL_STATE.SHIP || state === CONFIG.CELL_STATE.HIT || state === CONFIG.CELL_STATE.SUNK;

    // Add ship borders (show on player board always, on enemy board only when sunk)
    const showBorders = isShip && (revealShips || state === CONFIG.CELL_STATE.SUNK);
    
    if (showBorders) {
      const currentShip = board.getShipAt(x, y);
      
      if (currentShip) {
        // Check top
        const topShip = y > 0 ? board.getShipAt(x, y - 1) : null;
        if (topShip !== currentShip) {
          cell.classList.add("border-top");
        }

        // Check right
        const rightShip = x < CONFIG.GRID_SIZE - 1 ? board.getShipAt(x + 1, y) : null;
        if (rightShip !== currentShip) {
          cell.classList.add("border-right");
        }

        // Check bottom
        const bottomShip = y < CONFIG.GRID_SIZE - 1 ? board.getShipAt(x, y + 1) : null;
        if (bottomShip !== currentShip) {
          cell.classList.add("border-bottom");
        }

        // Check left
        const leftShip = x > 0 ? board.getShipAt(x - 1, y) : null;
        if (leftShip !== currentShip) {
          cell.classList.add("border-left");
        }
      }
    }
  });
}

// ----- Create game -----
const game = new Game({
  onStateChange: render,
  onStatus: setStatus,
});

// ----- Build grids -----
buildGrid(playerBoardEl, (x, y) => {
  const state = game.getState();

  // Setup: place ships on player board
  if (state.phase === "setup") {
    const res = game.tryPlacePlayerShip(x, y);
    if (!res.ok) setStatus(res.message);
  }
});

buildGrid(targetBoardEl, (x, y) => {
  const state = game.getState();

  // Gameplay: attack CPU board
  if (state.phase === "play") {
    const res = game.playerAttack(x, y);
    if (!res.ok) setStatus(res.message);
  }
});

// ----- Buttons -----
rotateBtn?.addEventListener("click", () => game.toggleOrientation());

startBtn?.addEventListener("click", () => {
  const res = game.startGame();
  if (!res.ok) setStatus(res.message);
});

// ----- Render handler (called by Game) -----
function render(state) {
  renderBoard(playerBoardEl, state.playerBoard, true);
  renderBoard(targetBoardEl, state.cpuBoard, false);

  // Start button enabled only after setup
  if (startBtn) {
    startBtn.disabled = !(state.phase === "setup" && state.setupComplete);
  }

  // Optional visual blocking of target board
  targetBoardEl.classList.toggle("blocked", state.phase !== "play");
}