import * as THREE from 'three';

export class ShipMeshes {
  constructor() {
    this.shipMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.5,
      metalness: 0.3
    });

    this.previewMaterial = new THREE.MeshStandardMaterial({
      color: 0x80c080,
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.5
    });

    this.previewInvalidMaterial = new THREE.MeshStandardMaterial({
      color: 0xc08080,
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.5
    });
  }

  /**
   * Create a ship mesh based on name and size
   */
  createShip(name, size, isPreview = false, isValid = true) {
    let material;
    if (isPreview) {
      material = isValid ? this.previewMaterial : this.previewInvalidMaterial;
    } else {
      material = this.shipMaterial;
    }

    switch (name) {
      case 'Carrier':
        return this.createCarrier(material);
      case 'Battleship':
        return this.createBattleship(material);
      case 'Cruiser':
        return this.createCruiser(material);
      case 'Submarine':
        return this.createSubmarine(material);
      case 'Destroyer':
        return this.createDestroyer(material);
      default:
        return this.createGenericShip(size, material);
    }
  }

  /**
   * Carrier - 5 cells, large flat deck
   */
  createCarrier(material) {
    const group = new THREE.Group();
    const length = 5;
    const width = 0.7;
    const height = 0.3;

    // Main hull
    const hullGeometry = new THREE.BoxGeometry(length, height, width);
    const hull = new THREE.Mesh(hullGeometry, material);
    hull.position.y = height / 2;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // Deck (flat top)
    const deckGeometry = new THREE.BoxGeometry(length * 0.95, 0.05, width * 1.1);
    const deck = new THREE.Mesh(deckGeometry, material);
    deck.position.y = height + 0.025;
    deck.castShadow = true;
    group.add(deck);

    // Control tower
    const towerGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.3);
    const tower = new THREE.Mesh(towerGeometry, material);
    tower.position.set(1.2, height + 0.2, 0);
    tower.castShadow = true;
    group.add(tower);

    group.userData.shipLength = length;
    return group;
  }

  /**
   * Battleship - 4 cells, gun turrets
   */
  createBattleship(material) {
    const group = new THREE.Group();
    const length = 4;
    const width = 0.6;
    const height = 0.35;

    // Main hull - tapered at ends
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-length / 2, -width / 2);
    hullShape.lineTo(-length / 2 + 0.3, -width / 2);
    hullShape.lineTo(length / 2 - 0.2, -width / 2 * 0.7);
    hullShape.lineTo(length / 2, 0);
    hullShape.lineTo(length / 2 - 0.2, width / 2 * 0.7);
    hullShape.lineTo(-length / 2 + 0.3, width / 2);
    hullShape.lineTo(-length / 2, width / 2);
    hullShape.closePath();

    const extrudeSettings = { depth: height, bevelEnabled: false };
    const hullGeometry = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    const hull = new THREE.Mesh(hullGeometry, material);
    hull.rotation.x = -Math.PI / 2;
    hull.position.y = 0;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // Gun turrets
    const turretGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.15, 8);
    const turretPositions = [-1.2, 0, 1.0];

    turretPositions.forEach(xPos => {
      const turret = new THREE.Mesh(turretGeometry, material);
      turret.position.set(xPos, height + 0.075, 0);
      turret.castShadow = true;
      group.add(turret);

      // Gun barrel
      const barrelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
      const barrel = new THREE.Mesh(barrelGeometry, material);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(xPos + 0.25, height + 0.1, 0);
      barrel.castShadow = true;
      group.add(barrel);
    });

    // Bridge
    const bridgeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.25);
    const bridge = new THREE.Mesh(bridgeGeometry, material);
    bridge.position.set(-0.5, height + 0.15, 0);
    bridge.castShadow = true;
    group.add(bridge);

    group.userData.shipLength = length;
    return group;
  }

  /**
   * Cruiser - 3 cells, sleek design
   */
  createCruiser(material) {
    const group = new THREE.Group();
    const length = 3;
    const width = 0.5;
    const height = 0.3;

    // Tapered hull
    const hullGeometry = new THREE.BoxGeometry(length, height, width);
    const hull = new THREE.Mesh(hullGeometry, material);
    hull.position.y = height / 2;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // Bow (pointed front)
    const bowGeometry = new THREE.ConeGeometry(width / 2, 0.4, 4);
    const bow = new THREE.Mesh(bowGeometry, material);
    bow.rotation.z = -Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(length / 2 + 0.15, height / 2, 0);
    bow.castShadow = true;
    group.add(bow);

    // Bridge
    const bridgeGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.3);
    const bridge = new THREE.Mesh(bridgeGeometry, material);
    bridge.position.set(-0.3, height + 0.125, 0);
    bridge.castShadow = true;
    group.add(bridge);

    // Gun turret
    const turretGeometry = new THREE.CylinderGeometry(0.12, 0.14, 0.1, 8);
    const turret = new THREE.Mesh(turretGeometry, material);
    turret.position.set(0.6, height + 0.05, 0);
    turret.castShadow = true;
    group.add(turret);

    group.userData.shipLength = length;
    return group;
  }

  /**
   * Submarine - 3 cells, cylindrical body
   */
  createSubmarine(material) {
    const group = new THREE.Group();
    const length = 3;
    const radius = 0.22;

    // Main cylindrical hull
    const hullGeometry = new THREE.CapsuleGeometry(radius, length - radius * 2, 8, 16);
    const hull = new THREE.Mesh(hullGeometry, material);
    hull.rotation.z = Math.PI / 2;
    hull.position.y = radius + 0.05;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // Conning tower
    const towerGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.25, 8);
    const tower = new THREE.Mesh(towerGeometry, material);
    tower.position.set(-0.2, radius * 2 + 0.1, 0);
    tower.castShadow = true;
    group.add(tower);

    // Periscope
    const periscopeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6);
    const periscope = new THREE.Mesh(periscopeGeometry, material);
    periscope.position.set(-0.2, radius * 2 + 0.3, 0);
    periscope.castShadow = true;
    group.add(periscope);

    // Tail fin
    const finGeometry = new THREE.BoxGeometry(0.3, 0.25, 0.05);
    const finV = new THREE.Mesh(finGeometry, material);
    finV.position.set(-length / 2 + 0.2, radius + 0.1, 0);
    finV.castShadow = true;
    group.add(finV);

    const finH = new THREE.Mesh(finGeometry, material);
    finH.rotation.x = Math.PI / 2;
    finH.position.set(-length / 2 + 0.2, radius, 0);
    finH.castShadow = true;
    group.add(finH);

    group.userData.shipLength = length;
    return group;
  }

  /**
   * Destroyer - 2 cells, small and fast
   */
  createDestroyer(material) {
    const group = new THREE.Group();
    const length = 2;
    const width = 0.4;
    const height = 0.25;

    // Sleek hull
    const hullGeometry = new THREE.BoxGeometry(length, height, width);
    const hull = new THREE.Mesh(hullGeometry, material);
    hull.position.y = height / 2;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // Pointed bow
    const bowGeometry = new THREE.ConeGeometry(width / 2, 0.35, 4);
    const bow = new THREE.Mesh(bowGeometry, material);
    bow.rotation.z = -Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(length / 2 + 0.12, height / 2, 0);
    bow.castShadow = true;
    group.add(bow);

    // Small bridge
    const bridgeGeometry = new THREE.BoxGeometry(0.25, 0.2, 0.25);
    const bridge = new THREE.Mesh(bridgeGeometry, material);
    bridge.position.set(-0.2, height + 0.1, 0);
    bridge.castShadow = true;
    group.add(bridge);

    // Gun
    const gunGeometry = new THREE.CylinderGeometry(0.05, 0.07, 0.08, 6);
    const gun = new THREE.Mesh(gunGeometry, material);
    gun.position.set(0.4, height + 0.04, 0);
    gun.castShadow = true;
    group.add(gun);

    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6);
    const barrel = new THREE.Mesh(barrelGeometry, material);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.55, height + 0.06, 0);
    barrel.castShadow = true;
    group.add(barrel);

    group.userData.shipLength = length;
    return group;
  }

  /**
   * Generic ship fallback
   */
  createGenericShip(size, material) {
    const group = new THREE.Group();
    const length = size;
    const width = 0.5;
    const height = 0.3;

    const hullGeometry = new THREE.BoxGeometry(length, height, width);
    const hull = new THREE.Mesh(hullGeometry, material);
    hull.position.y = height / 2;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    group.userData.shipLength = length;
    return group;
  }

  /**
   * Position a ship on the board
   * @param {THREE.Group} shipMesh - The ship mesh
   * @param {number} startX - Grid X coordinate
   * @param {number} startY - Grid Y coordinate
   * @param {string} orientation - 'horizontal' or 'vertical'
   * @param {BoardMesh} boardMesh - The board to position on
   */
  positionShip(shipMesh, startX, startY, orientation, boardMesh) {
    const shipLength = shipMesh.userData.shipLength;

    // Calculate center position of the ship
    let centerX, centerY;
    if (orientation === 'horizontal') {
      centerX = startX + (shipLength - 1) / 2;
      centerY = startY;
      shipMesh.rotation.y = 0;
    } else {
      centerX = startX;
      centerY = startY + (shipLength - 1) / 2;
      shipMesh.rotation.y = Math.PI / 2;
    }

    const worldPos = boardMesh.getCellPosition(centerX, centerY);
    shipMesh.position.copy(worldPos);
    shipMesh.position.y = 0.05;
  }
}