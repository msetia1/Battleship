import { CONFIG } from './config.js';

export class AI {
  constructor() {
    this.attackedCells = new Set();
    this.currentHits = [];
    this.queue = [];
  }

  getAttack() {
    if (this.queue.length > 0) {
      return this.queue.shift();
    }
    return this.getRandomAttack();
  }

  getRandomAttack() {
    let x, y;
    do {
      x = Math.floor(Math.random() * CONFIG.GRID_SIZE);
      y = Math.floor(Math.random() * CONFIG.GRID_SIZE);
    } while (this.attackedCells.has(`${x},${y}`));
    return { x, y };
  }

  recordAttackResult(x, y, result) {
    this.attackedCells.add(`${x},${y}`);

    if (result === 'miss') {
      return;
    }

    if (result === 'sunk') {
      this.currentHits = [];
      this.queue = [];
      return;
    }

    if (result === 'hit') {
      this.currentHits.push({ x, y });

      if (this.currentHits.length === 1) {
        this.queueAdjacent(x, y);
      } else {
        this.queue = [];
        this.queueAlongOrientation();
      }
    }
  }

  queueAdjacent(x, y) {
    const directions = [
      { x: x - 1, y: y },
      { x: x + 1, y: y },
      { x: x, y: y - 1 },
      { x: x, y: y + 1 }
    ];

    for (const cell of directions) {
      if (this.isValidTarget(cell.x, cell.y)) {
        this.queue.push(cell);
      }
    }
  }

  queueAlongOrientation() {
    const xs = this.currentHits.map(hit => hit.x);
    const ys = this.currentHits.map(hit => hit.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    if (minY === maxY) {
      if (this.isValidTarget(minX - 1, minY)) {
        this.queue.push({ x: minX - 1, y: minY });
      }
      if (this.isValidTarget(maxX + 1, maxY)) {
        this.queue.push({ x: maxX + 1, y: maxY });
      }
    } else {
      if (this.isValidTarget(minX, minY - 1)) {
        this.queue.push({ x: minX, y: minY - 1 });
      }
      if (this.isValidTarget(maxX, maxY + 1)) {
        this.queue.push({ x: maxX, y: maxY + 1 });
      }
    }
  }

  isValidTarget(x, y) {
    if (x < 0 || x >= CONFIG.GRID_SIZE || y < 0 || y >= CONFIG.GRID_SIZE) {
      return false;
    }
    if (this.attackedCells.has(`${x},${y}`)) {
      return false;
    }
    return true;
  }

  reset() {
    this.attackedCells = new Set();
    this.currentHits = [];
    this.queue = [];
  }
}