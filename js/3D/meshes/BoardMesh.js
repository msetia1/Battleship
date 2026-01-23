import * as THREE from "three";
import { CONFIG } from "../../config.js";

export class BoardMesh {
  constructor(isPlayerBoard = true) {
    this.isPlayerBoard = isPlayerBoard;
    this.gridSize = CONFIG.GRID_SIZE;
    this.cellSize = 1;
    this.boardSize = this.gridSize * this.cellSize;
    this.holeRadius = 0.25;
    this.holeDepth = 0.25;
    this.boardThickness = 0.5;
    this.rimHeight = 0.3;
    this.rimWidth = 0.4;

    // Container for all board parts
    this.group = new THREE.Group();

    // Store cell meshes for raycasting
    this.cellMeshes = [];

    this.createBoard();
    this.createLabels();
  }

  createBoard() {
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e90ff,
      roughness: 0.4,
      metalness: 0.1,
    });

    // Create board surface with holes using Shape
    const shape = new THREE.Shape();
    const halfSize = this.boardSize / 2;

    // Outer rectangle
    shape.moveTo(-halfSize, -halfSize);
    shape.lineTo(halfSize, -halfSize);
    shape.lineTo(halfSize, halfSize);
    shape.lineTo(-halfSize, halfSize);
    shape.lineTo(-halfSize, -halfSize);

    // Cut holes (as holes in the shape)
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const posX = (x - this.gridSize / 2 + 0.5) * this.cellSize;
        const posZ = (y - this.gridSize / 2 + 0.5) * this.cellSize;

        const holePath = new THREE.Path();
        holePath.absarc(posX, posZ, this.holeRadius, 0, Math.PI * 2, false);
        shape.holes.push(holePath);
      }
    }

    // Extrude the shape to give it thickness
    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: false,
    };
    const surfaceGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const surfaceMesh = new THREE.Mesh(surfaceGeometry, boardMaterial);
    surfaceMesh.rotation.x = -Math.PI / 2;
    surfaceMesh.position.y = 0.1;
    surfaceMesh.receiveShadow = true;
    surfaceMesh.castShadow = true;
    this.group.add(surfaceMesh);

    // Bottom of the board (solid base underneath)
    const baseGeometry = new THREE.BoxGeometry(
      this.boardSize,
      0.1,
      this.boardSize,
    );
    const baseMesh = new THREE.Mesh(baseGeometry, boardMaterial);
    baseMesh.position.y = -this.holeDepth - 0.05;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // Create rim around the board
    this.createRim(boardMaterial);

    // Create cell holes and invisible click targets
    this.createCells();
  }

  createRim(material) {
    const rimGeometry = new THREE.BoxGeometry(
      this.boardSize + this.rimWidth * 2,
      this.rimHeight,
      this.rimWidth,
    );

    // Front rim
    const frontRim = new THREE.Mesh(rimGeometry, material);
    frontRim.position.set(
      0,
      this.rimHeight / 2,
      this.boardSize / 2 + this.rimWidth / 2,
    );
    frontRim.receiveShadow = true;
    frontRim.castShadow = true;
    this.group.add(frontRim);

    // Back rim
    const backRim = new THREE.Mesh(rimGeometry, material);
    backRim.position.set(
      0,
      this.rimHeight / 2,
      -this.boardSize / 2 - this.rimWidth / 2,
    );
    backRim.receiveShadow = true;
    backRim.castShadow = true;
    this.group.add(backRim);

    // Side rims
    const sideRimGeometry = new THREE.BoxGeometry(
      this.rimWidth,
      this.rimHeight,
      this.boardSize,
    );

    const leftRim = new THREE.Mesh(sideRimGeometry, material);
    leftRim.position.set(
      -this.boardSize / 2 - this.rimWidth / 2,
      this.rimHeight / 2,
      0,
    );
    leftRim.receiveShadow = true;
    leftRim.castShadow = true;
    this.group.add(leftRim);

    const rightRim = new THREE.Mesh(sideRimGeometry, material);
    rightRim.position.set(
      this.boardSize / 2 + this.rimWidth / 2,
      this.rimHeight / 2,
      0,
    );
    rightRim.receiveShadow = true;
    rightRim.castShadow = true;
    this.group.add(rightRim);
  }

  createCells() {
    // Material for the hole walls
    const holeWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a4a7a,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    // Material for the hole bottom
    const holeBottomMaterial = new THREE.MeshStandardMaterial({
      color: 0x042030,
      roughness: 0.9,
      metalness: 0.0,
    });

    // Invisible material for click targets
    const clickTargetMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        // Calculate position (centered on board)
        const posX = (x - this.gridSize / 2 + 0.5) * this.cellSize;
        const posZ = (y - this.gridSize / 2 + 0.5) * this.cellSize;

        // Create cylinder walls going down into the hole
        const tubeGeometry = new THREE.CylinderGeometry(
          this.holeRadius,
          this.holeRadius,
          this.holeDepth,
          24,
          1,
          true,
        );
        const tube = new THREE.Mesh(tubeGeometry, holeWallMaterial);
        tube.position.set(posX, -this.holeDepth / 2, posZ);
        tube.receiveShadow = true;
        this.group.add(tube);

        // Create bottom of hole
        const bottomGeometry = new THREE.CircleGeometry(this.holeRadius, 24);
        const bottom = new THREE.Mesh(bottomGeometry, holeBottomMaterial);
        bottom.rotation.x = -Math.PI / 2;
        bottom.position.set(posX, -this.holeDepth + 0.01, posZ);
        bottom.receiveShadow = true;
        this.group.add(bottom);

        // Create invisible click target
        const clickTargetGeometry = new THREE.PlaneGeometry(
          this.cellSize * 0.9,
          this.cellSize * 0.9,
        );
        const clickTarget = new THREE.Mesh(
          clickTargetGeometry,
          clickTargetMaterial,
        );
        clickTarget.rotation.x = -Math.PI / 2;
        clickTarget.position.set(posX, 0.15, posZ);

        // Store grid coordinates on the mesh for later reference
        clickTarget.userData = {
          gridX: x,
          gridY: y,
          isCell: true,
          isPlayerBoard: this.isPlayerBoard,
        };

        this.cellMeshes.push(clickTarget);
        this.group.add(clickTarget);
      }
    }
  }

  createLabels() {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

    // Row labels (letters on the left)
    for (let y = 0; y < this.gridSize; y++) {
      const label = this.createTextSprite(letters[y]);
      const posZ = (y - this.gridSize / 2 + 0.5) * this.cellSize;
      label.position.set(-this.boardSize / 2 - this.rimWidth - 0.3, 0.2, posZ);
      this.group.add(label);
    }

    // Column labels (numbers)
    // Player board: keep numbers on the front edge (+Z)
    // CPU board: move numbers to the back edge (-Z) so they appear on "top"
    const numberZ = this.isPlayerBoard
      ? this.boardSize / 2 + this.rimWidth + 0.3 // front edge
      : -this.boardSize / 2 - this.rimWidth - 0.3; // back edge (top for CPU)

    for (let x = 0; x < this.gridSize; x++) {
      const label = this.createTextSprite(numbers[x]);
      const posX = (x - this.gridSize / 2 + 0.5) * this.cellSize;
      label.position.set(posX, 0.2, numberZ);
      this.group.add(label);
    }
  }

  createTextSprite(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");

    context.fillStyle = "white";
    context.font = "bold 48px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.5, 0.5, 0.5);

    return sprite;
  }

  getCellPosition(gridX, gridY) {
    const posX = (gridX - this.gridSize / 2 + 0.5) * this.cellSize;
    const posZ = (gridY - this.gridSize / 2 + 0.5) * this.cellSize;
    return new THREE.Vector3(posX, 0, posZ);
  }

  getCellMeshes() {
    return this.cellMeshes;
  }

  addToScene(scene) {
    scene.add(this.group);
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  setRotation(x, y, z) {
    this.group.rotation.set(x, y, z);
  }
}
