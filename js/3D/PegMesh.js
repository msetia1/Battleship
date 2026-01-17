import * as THREE from 'three';

export class PegMesh {
  constructor() {
    this.whiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1
    });

    this.redMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc2222,
      roughness: 0.3,
      metalness: 0.1
    });

    this.darkRedMaterial = new THREE.MeshStandardMaterial({
      color: 0x881111,
      roughness: 0.3,
      metalness: 0.1
    });

    // Peg dimensions
    this.pegRadius = 0.15;
    this.pegHeight = 0.4;
    this.pinRadius = 0.08;
    this.pinHeight = 0.25;
  }

  /**
   * Create a peg mesh
   * @param {string} type - 'miss', 'hit', or 'sunk'
   */
  createPeg(type) {
    const group = new THREE.Group();

    let material;
    switch (type) {
      case 'miss':
        material = this.whiteMaterial;
        break;
      case 'hit':
        material = this.redMaterial;
        break;
      case 'sunk':
        material = this.darkRedMaterial;
        break;
      default:
        material = this.whiteMaterial;
    }

    // Peg top (visible part)
    const topGeometry = new THREE.CylinderGeometry(
      this.pegRadius,
      this.pegRadius,
      this.pegHeight,
      16
    );
    const top = new THREE.Mesh(topGeometry, material);
    top.position.y = this.pegHeight / 2;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Rounded top cap
    const capGeometry = new THREE.SphereGeometry(this.pegRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap = new THREE.Mesh(capGeometry, material);
    cap.position.y = this.pegHeight;
    cap.castShadow = true;
    group.add(cap);

    // Pin (goes into the hole)
    const pinGeometry = new THREE.CylinderGeometry(
      this.pinRadius,
      this.pinRadius,
      this.pinHeight,
      8
    );
    const pin = new THREE.Mesh(pinGeometry, material);
    pin.position.y = -this.pinHeight / 2;
    group.add(pin);

    return group;
  }

  /**
   * Position a peg on the board
   * @param {THREE.Group} pegMesh - The peg mesh
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @param {BoardMesh} boardMesh - The board to position on
   */
  positionPeg(pegMesh, gridX, gridY, boardMesh) {
    const worldPos = boardMesh.getCellPosition(gridX, gridY);
    pegMesh.position.copy(worldPos);
    pegMesh.position.y = 0;
  }
}