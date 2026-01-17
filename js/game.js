// js/game.js
import { CONFIG } from "./config.js";
import { Board } from "./board.js";
import { Ship } from "./ship.js";
import { AI } from "./ai.js";

export class Game {
  constructor({ onStateChange, onStatus } = {}) {
    this.onStateChange = onStateChange;
    this.onStatus = onStatus;

    this.reset();
  }

  // --------------------
  // Public API (main.js calls these)
  // --------------------

  reset() {
    this.phase = "setup"; // "setup" | "play" | "finished"
    this.turn = "human"; // "human" | "cpu"
    this.orientation = "horizontal"; // for ship placement

    this.playerBoard = new Board(CONFIG.GRID_SIZE);
    this.cpuBoard = new Board(CONFIG.GRID_SIZE);

    // CPU places ships immediately (AI does NOT own a board)
    this.cpuBoard.randomizeShips(CONFIG.SHIPS);

    // Player ships to place manually during setup
    this.playerShips = CONFIG.SHIPS.map((s) => new Ship(s.name, s.size));
    this.shipIndex = 0;

    // AI only chooses attacks + tracks results
    this.ai = new AI();
    this.ai.reset();

    this._status(this._setupPrompt());
    this._emit();
  }

  getState() {
    return {
      phase: this.phase,
      turn: this.turn,
      orientation: this.orientation,
      setupComplete: this.isSetupComplete(),
      currentShip: this.phase === "setup" ? this.getCurrentShipToPlace() : null,
      playerBoard: this.playerBoard,
      cpuBoard: this.cpuBoard,
    };
  }

  toggleOrientation() {
    if (this.phase !== "setup") return;
    this.orientation =
      this.orientation === "horizontal" ? "vertical" : "horizontal";
    this._status(this._setupPrompt());
    this._emit();
  }

  getCurrentShipToPlace() {
    return this.playerShips[this.shipIndex] || null;
  }

  isSetupComplete() {
    return this.shipIndex >= this.playerShips.length;
  }

  tryPlacePlayerShip(x, y) {
    if (this.phase !== "setup") return { ok: false, message: "Not in setup." };

    const ship = this.getCurrentShipToPlace();
    if (!ship) return { ok: false, message: "All ships placed." };

    const placed = this.playerBoard.placeShip(ship, x, y, this.orientation);
    if (!placed) return { ok: false, message: "Can't place ship there." };

    this.shipIndex++;

    if (this.isSetupComplete()) {
      this._status("Setup complete. Click Start Game.");
    } else {
      this._status(this._setupPrompt());
    }

    this._emit();
    return { ok: true, message: "Ship placed." };
  }

  startGame() {
    if (this.phase !== "setup")
      return { ok: false, message: "Game already started." };
    if (!this.isSetupComplete())
      return { ok: false, message: "Place all ships first." };

    this.phase = "play";
    this.turn = "human";
    this._status("Your turn: attack the target board.");
    this._emit();
    return { ok: true, message: "Game started." };
  }

  playerAttack(x, y) {
    if (this.phase !== "play")
      return { ok: false, message: "Not in play phase." };
    if (this.turn !== "human") return { ok: false, message: "Not your turn." };

    const result = this.cpuBoard.receiveAttack(x, y);

    // Board returns 'invalid' for out-of-bounds or already attacked
    if (result === "invalid") {
      return { ok: false, message: "Pick a new square." };
    }

    this._status(
      result === "sunk" ? "You SUNK a ship!" : `You ${result.toUpperCase()}!`,
    );
    this._emit();

    if (this.cpuBoard.allShipsSunk()) {
      this.phase = "finished";
      this._status("You win!");
      this._emit();
      return { ok: true, result, winner: "human" };
    }

    // CPU turn
    this.turn = "cpu";
    this._emit();
    this.cpuMove();

    return { ok: true, result };
  }

  // --------------------
  // Internal helpers
  // --------------------

  cpuMove() {
    if (this.phase !== "play") return;

    let attack, result;

    // AI should already avoid repeats, but this protects against edge cases.
    do {
      attack = this.ai.getAttack();
      result = this.playerBoard.receiveAttack(attack.x, attack.y);

      // AI should learn the result even if it's invalid,
      // but invalid mainly means "already shot", so we can skip learning.
      if (result !== "invalid") {
        this.ai.recordAttackResult(attack.x, attack.y, result);
      }
    } while (result === "invalid");

    this._status(
      result === "sunk"
        ? "CPU SUNK one of your ships!"
        : `CPU ${result.toUpperCase()} at (${attack.x},${attack.y})`,
    );
    this._emit();

    if (this.playerBoard.allShipsSunk()) {
      this.phase = "finished";
      this._status("CPU wins!");
      this._emit();
      return;
    }

    this.turn = "human";
    this._status("Your turn: attack the target board.");
    this._emit();
  }

  _emit() {
    this.onStateChange?.(this.getState());
  }

  _status(text) {
    this.onStatus?.(text);
  }

  _setupPrompt() {
    const ship = this.getCurrentShipToPlace();
    if (!ship) return "Setup complete. Click Start Game.";
    return `Place your ${ship.name} (${ship.size}) — ${this.orientation}`;
  }
}
