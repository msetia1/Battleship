// js/main.js
import { Board } from "./board.js";
import { CONFIG } from "./config.js";

const playerBoardEl = document.getElementById("player-board");
const targetBoardEl = document.getElementById("target-board");

const playerBoard = new Board();
const targetBoard = new Board();

function buildGrid(container) {
  container.innerHTML = "";

  for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
    for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = x;
      cell.dataset.y = y;
      container.appendChild(cell);
    }
  }
}

function renderBoard(container, board, revealShips) {
  const cells = container.querySelectorAll(".cell");

  cells.forEach((cell) => {
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const state = board.grid[y][x];

    cell.className = "cell";
    if (state === CONFIG.CELL_STATE.SHIP && revealShips)
      cell.classList.add("ship");
    if (state === CONFIG.CELL_STATE.HIT) cell.classList.add("hit");
    if (state === CONFIG.CELL_STATE.MISS) cell.classList.add("miss");
  });
}

buildGrid(playerBoardEl);
buildGrid(targetBoardEl);

// TEMP: place a test ship so you can see something
playerBoard.grid[2][3] = CONFIG.CELL_STATE.SHIP;
playerBoard.grid[2][4] = CONFIG.CELL_STATE.SHIP;
playerBoard.grid[2][5] = CONFIG.CELL_STATE.SHIP;

renderBoard(playerBoardEl, playerBoard, true);
renderBoard(targetBoardEl, targetBoard, false);
