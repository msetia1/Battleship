import { CONFIG } from "./config.js";
import { Ship } from "./ship.js";

export class Board {
  constructor(gridSize = CONFIG.GRID_SIZE) {
    this.gridSize = gridSize;
    this.ships = [];
    this.grid = this.createGrid();
  }

  createGrid() {
    const grid = [];
    for (let y = 0; y < this.gridSize; y++) {
      const row = [];
      for (let x = 0; x < this.gridSize; x++) {
        row.push(CONFIG.CELL_STATE.EMPTY);
      }
      grid.push(row);
    }
    return grid;
  }

  canPlaceShip(ship, x, y, orientation) {
    const positions = this.getShipPositions(ship, x, y, orientation);

    if (!positions) {
      return false;
    }

    for (const pos of positions) {
      if (this.grid[pos.y][pos.x] !== CONFIG.CELL_STATE.EMPTY) {
        return false;
      }
    }

    return true;
  }

  getShipPositions(ship, x, y, orientation) {
    const positions = [];

    for (let i = 0; i < ship.size; i++) {
      const posX = orientation === "horizontal" ? x + i : x;
      const posY = orientation === "vertical" ? y + i : y;

      if (
        posX < 0 ||
        posX >= this.gridSize ||
        posY < 0 ||
        posY >= this.gridSize
      ) {
        return null;
      }

      positions.push({ x: posX, y: posY });
    }

    return positions;
  }

  placeShip(ship, x, y, orientation) {
    if (!this.canPlaceShip(ship, x, y, orientation)) {
      return false;
    }

    const positions = this.getShipPositions(ship, x, y, orientation);

    for (const pos of positions) {
      this.grid[pos.y][pos.x] = CONFIG.CELL_STATE.SHIP;
    }

    ship.setPositions(positions);
    this.ships.push(ship);

    return true;
  }

  receiveAttack(x, y) {
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
      return "invalid";
    }

    const cell = this.grid[y][x];

    if (cell === CONFIG.CELL_STATE.HIT || cell === CONFIG.CELL_STATE.MISS || cell === CONFIG.CELL_STATE.SUNK) {
      return "invalid";
    }

    if (cell === CONFIG.CELL_STATE.SHIP) {
      this.grid[y][x] = CONFIG.CELL_STATE.HIT;
      const ship = this.getShipAt(x, y);
      ship.hit();

      if (ship.isSunk()) {
        this.markShipSunk(ship);
        return "sunk";
      }
      return "hit";
    }

    this.grid[y][x] = CONFIG.CELL_STATE.MISS;
    return "miss";
  }

  markShipSunk(ship) {
    for (const pos of ship.positions) {
      this.grid[pos.y][pos.x] = CONFIG.CELL_STATE.SUNK;
    }
  }

  getShipAt(x, y) {
    for (const ship of this.ships) {
      for (const pos of ship.positions) {
        if (pos.x === x && pos.y === y) {
          return ship;
        }
      }
    }
    return null;
  }

  allShipsSunk() {
    return this.ships.length > 0 && this.ships.every((ship) => ship.isSunk());
  }

  randomizeShips(shipConfigs) {
    this.reset();
    
    for (const config of shipConfigs) {
      const ship = new Ship(config.name, config.size);
      let placed = false;
  
      while (!placed) {
        const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const x = Math.floor(Math.random() * this.gridSize);
        const y = Math.floor(Math.random() * this.gridSize);
  
        placed = this.placeShip(ship, x, y, orientation);
      }
    }
  }

  reset() {
    this.grid = this.createGrid();
    this.ships = [];
  }
}