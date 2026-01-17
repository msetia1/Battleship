export class Ship {
    constructor(name, size) {
      this.name = name;
      this.size = size;
      this.hits = 0;
      this.positions = [];
    }
  
    setPositions(coordinatesArray) {
      this.positions = coordinatesArray;
    }
  
    hit() {
      this.hits++;
    }
  
    isSunk() {
      return this.hits >= this.size;
    }
  }