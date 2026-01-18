// js/meshes/CasingMesh.js
import * as THREE from "three";

export class CasingMesh {
  constructor({
    innerWidth,
    baseDepth,
    lidDepth,
    rightSpace = 5.0,

    baseThickness = 0.7,
    lipHeight = 0.65,
    lipThickness = 0.28,

    lidBackHeight = 7.0,
    lidBackThickness = 0.6,

    color = 0xb6b7b9,
    roughness = 0.35,
    metalness = 0.12,

    compartmentInset = true,
  } = {}) {
    if (
      typeof innerWidth !== "number" ||
      typeof baseDepth !== "number" ||
      typeof lidDepth !== "number"
    ) {
      throw new Error(
        "CasingMesh requires { innerWidth, baseDepth, lidDepth } numbers.",
      );
    }

    this.group = new THREE.Group();
    this.baseGroup = new THREE.Group();
    this.lidGroup = new THREE.Group();

    this.group.add(this.baseGroup);
    this.group.add(this.lidGroup);

    this.innerWidth = innerWidth;
    this.baseDepth = baseDepth;
    this.lidDepth = lidDepth;
    this.rightSpace = rightSpace;

    this.baseThickness = baseThickness;
    this.lipHeight = lipHeight;
    this.lipThickness = lipThickness;

    this.lidBackHeight = lidBackHeight;
    this.lidBackThickness = lidBackThickness;

    this.material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
    });

    this._buildHalf(this.baseGroup, {
      depth: this.baseDepth,
      zFromHinge: +1,
      compartmentInset,
      isLid: false,
    });

    this._buildHalf(this.lidGroup, {
      depth: this.lidDepth,
      zFromHinge: -1,
      compartmentInset,
      isLid: true,
    });
  }

  _buildHalf(targetGroup, { depth, zFromHinge, compartmentInset, isLid }) {
    const innerW = this.innerWidth;
    const outerW = innerW + this.rightSpace;
    const outerD = depth;

    const halfCenterZ = zFromHinge * (depth / 2);

    // Base floor
    const baseGeo = new THREE.BoxGeometry(outerW, this.baseThickness, outerD);
    const base = new THREE.Mesh(baseGeo, this.material);
    base.castShadow = true;
    base.receiveShadow = true;
    base.position.set(0, 0, halfCenterZ);
    targetGroup.add(base);

    const wallY = this.baseThickness / 2 + this.lipHeight / 2;

    const makeWall = (w, h, d, x, y, z) => {
      const debugMat = new THREE.MeshStandardMaterial({ color: 0x1e90ff });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), debugMat);
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      targetGroup.add(wall);
      return wall;
    };

    const zFront = halfCenterZ + outerD / 2 - this.lipThickness / 2;
    const zBack = halfCenterZ - outerD / 2 + this.lipThickness / 2;

    // ✅ EXPLICITLY skip hinge-edge lip wall (prevents the lid "roof" overhang)
    // base half hinge edge is z=0 => that's the "back" edge (zBack)
    // lid half  hinge edge is z=0 => that's the "front" edge (zFront)
    const skipFrontWall = isLid; // lid: skip zFront
    const skipBackWall = !isLid; // base: skip zBack

    if (!skipFrontWall)
      makeWall(outerW, this.lipHeight, this.lipThickness, 0, wallY, zFront);
    if (!skipBackWall)
      makeWall(outerW, this.lipHeight, this.lipThickness, 0, wallY, zBack);

    // Side walls
    makeWall(
      this.lipThickness,
      this.lipHeight,
      outerD,
      -outerW / 2 + this.lipThickness / 2,
      wallY,
      halfCenterZ,
    );
    makeWall(
      this.lipThickness,
      this.lipHeight,
      outerD,
      +outerW / 2 - this.lipThickness / 2,
      wallY,
      halfCenterZ,
    );

    // Divider between main tray and compartment
    const dividerX = -outerW / 2 + innerW + this.lipThickness / 2;
    makeWall(
      this.lipThickness,
      this.lipHeight * 0.95,
      outerD - this.lipThickness * 2,
      dividerX,
      wallY,
      halfCenterZ,
    );

    // Optional inset floor in compartment
    if (compartmentInset && this.rightSpace > this.lipThickness * 2 + 0.2) {
      const compW = this.rightSpace - this.lipThickness * 2;
      const compD = outerD - this.lipThickness * 2;

      const compFloorGeo = new THREE.BoxGeometry(
        compW,
        this.baseThickness * 0.35,
        compD,
      );
      const compFloor = new THREE.Mesh(compFloorGeo, this.material);
      compFloor.receiveShadow = true;

      compFloor.position.set(
        +outerW / 2 - this.rightSpace / 2 - this.lipThickness,
        -this.baseThickness * 0.15,
        halfCenterZ,
      );
      targetGroup.add(compFloor);
    }

    // Shift so main tray center is at x=0 and extra bay extends +X
    targetGroup.position.x += this.rightSpace / 2;
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  setRotation(x, y, z) {
    this.group.rotation.set(x, y, z);
  }

  setLidAngle(rad) {
    this.lidGroup.rotation.x = rad;
  }
}
