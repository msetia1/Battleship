import { CONFIG } from './config.js';
import { Game } from './game.js';
import { SceneSetup } from './3D/SceneSetup.js';
import { GameRenderer } from './3D/GameRenderer.js';

// ----- DOM Elements -----
const canvas = document.getElementById('game-canvas');
const statusEl = document.getElementById('status');
const rotateBtn = document.getElementById('rotate-btn');
const randomizeBtn = document.getElementById('randomize-btn');
const startBtn = document.getElementById('start-btn');
const newGameBtn = document.getElementById('new-game-btn');

// ----- Setup Three.js -----
const sceneSetup = new SceneSetup(canvas);
const gameRenderer = new GameRenderer(sceneSetup);

// ----- Status Helper -----
function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

// ----- Create Game -----
const game = new Game({
  onStateChange: (state) => {
    gameRenderer.updateFromState(state);
    updateUI(state);
  },
  onStatus: setStatus
});

// ----- Update UI Buttons -----
function updateUI(state) {
  if (startBtn) {
    startBtn.disabled = !(state.phase === 'setup' && state.setupComplete);
  }

  if (rotateBtn) {
    rotateBtn.disabled = state.phase !== 'setup';
  }

  if (randomizeBtn) {
    randomizeBtn.disabled = state.phase !== 'setup';
  }
}

// ----- Button Handlers -----
rotateBtn?.addEventListener('click', () => {
  game.toggleOrientation();
});

randomizeBtn?.addEventListener('click', () => {
  const state = game.getState();
  if (state.phase === 'setup') {
    game.randomizePlayerShips();
  }
});

startBtn?.addEventListener('click', () => {
  const res = game.startGame();
  if (!res.ok) setStatus(res.message);
});

newGameBtn?.addEventListener('click', () => {
  game.reset();
});

// ----- Mouse Interaction -----
let hoveredCell = null;

function onMouseMove(event) {
  sceneSetup.setMousePosition(event.clientX, event.clientY);

  const intersects = sceneSetup.raycast(gameRenderer.getAllCellMeshes());

  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    const { gridX, gridY, isPlayerBoard, isCell } = intersected.userData;

    if (isCell) {
      const state = game.getState();

      // Setup phase: show preview on player board
      if (state.phase === 'setup' && isPlayerBoard && state.currentShip) {
        const isValid = state.playerBoard.canPlaceShip(
          state.currentShip,
          gridX,
          gridY,
          state.orientation
        );
        gameRenderer.showPreview(state.currentShip, gridX, gridY, state.orientation, isValid);
        hoveredCell = { gridX, gridY, isPlayerBoard };
      } else {
        gameRenderer.clearPreview();
        hoveredCell = { gridX, gridY, isPlayerBoard };
      }
    }
  } else {
    gameRenderer.clearPreview();
    hoveredCell = null;
  }
}

function onMouseClick(event) {
  sceneSetup.setMousePosition(event.clientX, event.clientY);

  const intersects = sceneSetup.raycast(gameRenderer.getAllCellMeshes());

  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    const { gridX, gridY, isPlayerBoard, isCell } = intersected.userData;

    if (isCell) {
      const state = game.getState();

      // Setup phase: place ship on player board
      if (state.phase === 'setup' && isPlayerBoard) {
        const res = game.tryPlacePlayerShip(gridX, gridY);
        if (!res.ok) setStatus(res.message);
        gameRenderer.clearPreview();
      }

      // Play phase: attack CPU board
      if (state.phase === 'play' && !isPlayerBoard) {
        const res = game.playerAttack(gridX, gridY);
        if (!res.ok) setStatus(res.message);
      }
    }
  }
}

canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('click', onMouseClick);

// ----- Animation Loop -----
function animate() {
  requestAnimationFrame(animate);

  gameRenderer.update();
  gameRenderer.render();
}

// ----- Start -----
animate();

// Initial render
gameRenderer.updateFromState(game.getState());