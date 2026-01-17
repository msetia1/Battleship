import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { BoardMesh } from './BoardMesh.js';
import { ShipMeshes } from './ShipMeshes.js';
import { PegMesh } from './PegMesh.js';
import { CameraController } from './CameraController.js';

export class GameRenderer {
  constructor(sceneSetup) {
    this.sceneSetup = sceneSetup;
    this.scene = sceneSetup.scene;

    // Create helpers
    this.shipMeshes = new ShipMeshes();
    this.pegMesh = new PegMesh();

    // Create boards
    this.playerBoard = new BoardMesh(true);
    this.cpuBoard = new BoardMesh(false);

    // Position boards like a laptop
    // Player board (keyboard) - flat, closer to camera
    this.playerBoard.setPosition(0, 0, 6);
    this.playerBoard.setRotation(0, 0, 0);

    // CPU board (screen) - tilted toward player, further from camera
    this.cpuBoard.setPosition(0, 6, -4);
    this.cpuBoard.setRotation(Math.PI / 3, 0, 0); // Tilted toward player

    // Add boards to scene
    this.playerBoard.addToScene(this.scene);
    this.cpuBoard.addToScene(this.scene);

    // Create hinge between boards
    this.createHinge();

    // Camera controller
    this.cameraController = new CameraController(sceneSetup.camera);

    // Track placed objects for cleanup
    this.playerShipMeshes = [];
    this.cpuShipMeshes = [];
    this.playerPegMeshes = [];
    this.cpuPegMeshes = [];
    this.previewMesh = null;

    // Current game state reference
    this.currentState = null;
  }

  createHinge() {
    const hingeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a5a9a,
      roughness: 0.5,
      metalness: 0.2
    });

    // Hinge bar connecting the two boards
    const hingeGeometry = new THREE.BoxGeometry(
      CONFIG.GRID_SIZE + 1,
      0.4,
      0.8
    );
    const hinge = new THREE.Mesh(hingeGeometry, hingeMaterial);
    hinge.position.set(0, 0.2, 0.5);
    hinge.castShadow = true;
    hinge.receiveShadow = true;
    this.scene.add(hinge);
  }

  /**
   * Get all clickable cell meshes
   */
  getAllCellMeshes() {
    return [
      ...this.playerBoard.getCellMeshes(),
      ...this.cpuBoard.getCellMeshes()
    ];
  }

  /**
   * Update the 3D scene based on game state
   */
  updateFromState(state) {
    this.currentState = state;

    // Update camera based on phase
    if (state.phase === 'setup') {
      this.cameraController.setSetupView();
    } else if (state.phase === 'play' || state.phase === 'finished') {
      this.cameraController.setPlayView();
    }

    // Update ships
    this.updateShips(state);

    // Update pegs
    this.updatePegs(state);
  }

  /**
   * Update ship meshes on both boards
   */ 
  updateShips(state) {
    // Clear existing player ships
    this.playerShipMeshes.forEach(mesh => {
    this.playerBoard.group.remove(mesh);
    });
    this.playerShipMeshes = [];

    // Add player ships (always visible on player board)
    for (const ship of state.playerBoard.ships) {
    if (ship.positions.length > 0) {
        const shipMesh = this.shipMeshes.createShip(ship.name, ship.size);
        const startPos = ship.positions[0];
        const endPos = ship.positions[ship.positions.length - 1];

        // Determine orientation
        const orientation = startPos.y === endPos.y ? 'horizontal' : 'vertical';

        this.shipMeshes.positionShip(shipMesh, startPos.x, startPos.y, orientation, this.playerBoard);
        this.playerBoard.group.add(shipMesh);
        this.playerShipMeshes.push(shipMesh);
    }
    }

    // Clear existing CPU ships
    this.cpuShipMeshes.forEach(mesh => {
    this.cpuBoard.group.remove(mesh);
    });
    this.cpuShipMeshes = [];

    // Show CPU ships that are sunk, or all ships when game is finished
    for (const ship of state.cpuBoard.ships) {
    if (ship.positions.length > 0) {
        const shouldShow = state.phase === 'finished' || ship.isSunk();
        
        if (shouldShow) {
        const shipMesh = this.shipMeshes.createShip(ship.name, ship.size);
        const startPos = ship.positions[0];
        const endPos = ship.positions[ship.positions.length - 1];

        const orientation = startPos.y === endPos.y ? 'horizontal' : 'vertical';

        this.shipMeshes.positionShip(shipMesh, startPos.x, startPos.y, orientation, this.cpuBoard);
        this.cpuBoard.group.add(shipMesh);
        this.cpuShipMeshes.push(shipMesh);
        }
    }
    }
  }

  /**
   * Update peg meshes based on board states
   */
  updatePegs(state) {
    // Clear existing pegs
    this.playerPegMeshes.forEach(mesh => {
      this.playerBoard.group.remove(mesh);
    });
    this.playerPegMeshes = [];

    this.cpuPegMeshes.forEach(mesh => {
      this.cpuBoard.group.remove(mesh);
    });
    this.cpuPegMeshes = [];

    // Add pegs for player board
    this.addPegsForBoard(state.playerBoard, this.playerBoard, this.playerPegMeshes);

    // Add pegs for CPU board
    this.addPegsForBoard(state.cpuBoard, this.cpuBoard, this.cpuPegMeshes);
  }

  /**
   * Add pegs to a board based on its grid state
   */
  addPegsForBoard(boardState, boardMesh, pegArray) {
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        const cellState = boardState.grid[y][x];
        let pegType = null;

        if (cellState === CONFIG.CELL_STATE.MISS) {
          pegType = 'miss';
        } else if (cellState === CONFIG.CELL_STATE.HIT) {
          pegType = 'hit';
        } else if (cellState === CONFIG.CELL_STATE.SUNK) {
          pegType = 'sunk';
        }

        if (pegType) {
          const peg = this.pegMesh.createPeg(pegType);
          this.pegMesh.positionPeg(peg, x, y, boardMesh);
          boardMesh.group.add(peg);
          pegArray.push(peg);
        }
      }
    }
  }

  /**
   * Show ship placement preview
   */
  showPreview(ship, gridX, gridY, orientation, isValid) {
    this.clearPreview();

    if (!ship) return;

    this.previewMesh = this.shipMeshes.createShip(ship.name, ship.size, true, isValid);
    this.shipMeshes.positionShip(this.previewMesh, gridX, gridY, orientation, this.playerBoard);
    this.playerBoard.group.add(this.previewMesh);
  }

  /**
   * Clear ship placement preview
   */
  clearPreview() {
    if (this.previewMesh) {
      this.playerBoard.group.remove(this.previewMesh);
      this.previewMesh = null;
    }
  }

  /**
   * Update loop (call in animation frame)
   */
  update() {
    this.cameraController.update();
  }

  /**
   * Render the scene
   */
  render() {
    this.sceneSetup.render();
  }
}