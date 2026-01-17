export const CONFIG = {
    GRID_SIZE: 10,
    
    SHIPS: [
      { name: 'Carrier', size: 5 },
      { name: 'Battleship', size: 4 },
      { name: 'Cruiser', size: 3 },
      { name: 'Submarine', size: 3 },
      { name: 'Destroyer', size: 2 }
    ],
  
    CELL_STATE: {
      EMPTY: 'empty',
      SHIP: 'ship',
      HIT: 'hit',
      MISS: 'miss',
      SUNK: 'sunk'
    }
  };