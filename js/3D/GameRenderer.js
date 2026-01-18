import * as THREE from "three";
import { CONFIG } from "../config.js";
import { BoardMesh } from "./meshes/BoardMesh.js";
import { ShipMeshes } from "./meshes/ShipMeshes.js";
import { PegMesh } from "./meshes/PegMesh.js";
import { CasingMesh } from "./meshes/CasingMesh.js";
import { CameraController } from "./CameraController.js";

export class GameRenderer {
  constructor(sceneSetup) {
    this.sceneSetup = sceneSetup;
    this.scene = sceneSetup.scene;

    // Parent rig (if you later want to move the whole game)
    this.rig = new THREE.Group();
    this.scene.add(this.rig);

    // Helpers
    this.shipMeshes = new ShipMeshes();
    this.pegMesh = new PegMesh();

    // Boards
    this.playerBoard = new BoardMesh(true);
    this.cpuBoard = new BoardMesh(false);

    // Casing (truth)
    this.casing = null;
    this.createCasingAndMountBoards();

    // Camera controller
    this.cameraController = new CameraController(sceneSetup.camera);

    // Track placed objects for cleanup
    this.playerShipMeshes = [];
    this.cpuShipMeshes = [];
    this.playerPegMeshes = [];
    this.cpuPegMeshes = [];
    this.previewMesh = null;

    this.currentState = null;
  }

  createCasingAndMountBoards() {
    // Board footprint (include rims) as the “inner tray” target
    const margin = 0.9;
    const rightSpace = 5.0;

    const boardOuterW =
      this.playerBoard.boardSize + this.playerBoard.rimWidth * 2;
    const boardOuterD =
      this.playerBoard.boardSize + this.playerBoard.rimWidth * 2;

    const innerWidth = boardOuterW + margin * 2;

    // For simplicity both halves same depth for now
    const baseDepth = boardOuterD + margin * 2;
    const lidDepth = boardOuterD + margin * 2;

    const baseThickness = 0.7;
    const lipHeight = 0.65;
    const lipThickness = 0.28;

    // Build casing
    this.casing = new CasingMesh({
      innerWidth,
      baseDepth,
      lidDepth,
      rightSpace,
      baseThickness,
      lipHeight,
      lipThickness,
      compartmentInset: true,

      // tune if cpu doesn't “fit” visually
      lidBackHeight: 7.0,
      lidBackThickness: 0.6,
    });

    // Put casing in rig
    this.rig.add(this.casing.group);

    // ---- Mount boards centered in LEFT trays ----
    // Since each half shifts by rightSpace/2, the left tray center is x=0 in half local space.
    const mountX = -rightSpace / 2;

    // Sit boards slightly above the tray floor (top of base slab)
    const mountY = baseThickness / 2 + 0.22;

    // Centers of each half
    const baseCenterZ = +baseDepth / 2;
    const lidCenterZ = -lidDepth / 2;

    // Player board on base half (flat)
    this.playerBoard.group.position.set(mountX, mountY, baseCenterZ);
    this.playerBoard.group.rotation.set(0, 0, 0);

    // CPU board on lid half (keep board "flat" in lid space; lid rotates)
    this.cpuBoard.group.position.set(mountX, mountY, lidCenterZ);
    this.cpuBoard.group.rotation.set(0, 0, 0);

    // Add boards to casing halves (so they follow casing motion)
    this.casing.baseGroup.add(this.playerBoard.group);
    this.casing.lidGroup.add(this.cpuBoard.group);

    // Match your previous CPU tilt by rotating the lid
    this.casing.setLidAngle(Math.PI / 3);

    // Position the whole rig so it’s nicely centered on screen.
    // (Optional: you can tweak these visually.)
    this.rig.position.set(0, 0, 0);
  }

  getAllCellMeshes() {
    return [
      ...this.playerBoard.getCellMeshes(),
      ...this.cpuBoard.getCellMeshes(),
    ];
  }

  updateFromState(state) {
    this.currentState = state;

    if (state.phase === "setup") this.cameraController.setSetupView();
    else this.cameraController.setPlayView();

    this.updateShips(state);
    this.updatePegs(state);
  }

  updateShips(state) {
    this.playerShipMeshes.forEach((mesh) =>
      this.playerBoard.group.remove(mesh),
    );
    this.playerShipMeshes = [];

    for (const ship of state.playerBoard.ships) {
      if (ship.positions.length > 0) {
        const shipMesh = this.shipMeshes.createShip(ship.name, ship.size);
        const startPos = ship.positions[0];
        const endPos = ship.positions[ship.positions.length - 1];
        const orientation = startPos.y === endPos.y ? "horizontal" : "vertical";

        this.shipMeshes.positionShip(
          shipMesh,
          startPos.x,
          startPos.y,
          orientation,
          this.playerBoard,
        );
        this.playerBoard.group.add(shipMesh);
        this.playerShipMeshes.push(shipMesh);
      }
    }

    this.cpuShipMeshes.forEach((mesh) => this.cpuBoard.group.remove(mesh));
    this.cpuShipMeshes = [];

    for (const ship of state.cpuBoard.ships) {
      if (ship.positions.length > 0) {
        const shouldShow = state.phase === "finished" || ship.isSunk();
        if (shouldShow) {
          const shipMesh = this.shipMeshes.createShip(ship.name, ship.size);
          const startPos = ship.positions[0];
          const endPos = ship.positions[ship.positions.length - 1];
          const orientation =
            startPos.y === endPos.y ? "horizontal" : "vertical";

          this.shipMeshes.positionShip(
            shipMesh,
            startPos.x,
            startPos.y,
            orientation,
            this.cpuBoard,
          );
          this.cpuBoard.group.add(shipMesh);
          this.cpuShipMeshes.push(shipMesh);
        }
      }
    }
  }

  updatePegs(state) {
    this.playerPegMeshes.forEach((mesh) => this.playerBoard.group.remove(mesh));
    this.playerPegMeshes = [];

    this.cpuPegMeshes.forEach((mesh) => this.cpuBoard.group.remove(mesh));
    this.cpuPegMeshes = [];

    this.addPegsForBoard(
      state.playerBoard,
      this.playerBoard,
      this.playerPegMeshes,
    );
    this.addPegsForBoard(state.cpuBoard, this.cpuBoard, this.cpuPegMeshes);
  }

  addPegsForBoard(boardState, boardMesh, pegArray) {
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        const cellState = boardState.grid[y][x];
        let pegType = null;

        if (cellState === CONFIG.CELL_STATE.MISS) pegType = "miss";
        else if (cellState === CONFIG.CELL_STATE.HIT) pegType = "hit";
        else if (cellState === CONFIG.CELL_STATE.SUNK) pegType = "sunk";

        if (pegType) {
          const peg = this.pegMesh.createPeg(pegType);
          this.pegMesh.positionPeg(peg, x, y, boardMesh);
          boardMesh.group.add(peg);
          pegArray.push(peg);
        }
      }
    }
  }

  showPreview(ship, gridX, gridY, orientation, isValid) {
    this.clearPreview();
    if (!ship) return;

    this.previewMesh = this.shipMeshes.createShip(
      ship.name,
      ship.size,
      true,
      isValid,
    );
    this.shipMeshes.positionShip(
      this.previewMesh,
      gridX,
      gridY,
      orientation,
      this.playerBoard,
    );
    this.playerBoard.group.add(this.previewMesh);
  }

  clearPreview() {
    if (this.previewMesh) {
      this.playerBoard.group.remove(this.previewMesh);
      this.previewMesh = null;
    }
  }

  update() {
    this.cameraController.update();
  }

  render() {
    this.sceneSetup.render();
  }
}
