import * as THREE from 'three';

export class CameraController {
  constructor(camera) {
    this.camera = camera;

    // Camera positions for different phases
    // Setup: directly above player board, looking straight down
    this.setupPosition = new THREE.Vector3(0, 18, 6);
    this.setupLookAt = new THREE.Vector3(0, 0, 6);

    // Play: pulled back and higher to see both boards
    this.playPosition = new THREE.Vector3(0, 28, 20);
    this.playLookAt = new THREE.Vector3(0, 3, 0);

    // Animation state
    this.isAnimating = false;
    this.animationDuration = 1000; // milliseconds
    this.animationStart = 0;
    this.startPosition = new THREE.Vector3();
    this.startLookAt = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    // Set initial position
    this.setSetupView(false);
  }

  /**
   * Set camera to setup view (looking straight down at player board)
   * @param {boolean} animate - Whether to animate the transition
   */
  setSetupView(animate = true) {
    if (animate) {
      this.animateTo(this.setupPosition, this.setupLookAt);
    } else {
      this.camera.position.copy(this.setupPosition);
      this.currentLookAt.copy(this.setupLookAt);
      this.camera.lookAt(this.currentLookAt);
    }
  }

  /**
   * Set camera to play view (angled to see both boards)
   * @param {boolean} animate - Whether to animate the transition
   */
  setPlayView(animate = true) {
    if (animate) {
      this.animateTo(this.playPosition, this.playLookAt);
    } else {
      this.camera.position.copy(this.playPosition);
      this.currentLookAt.copy(this.playLookAt);
      this.camera.lookAt(this.currentLookAt);
    }
  }

  /**
   * Start an animated transition to a new camera position
   */
  animateTo(targetPosition, targetLookAt) {
    this.isAnimating = true;
    this.animationStart = performance.now();

    this.startPosition.copy(this.camera.position);
    this.startLookAt.copy(this.currentLookAt);

    this.targetPosition.copy(targetPosition);
    this.targetLookAt.copy(targetLookAt);
  }

  /**
   * Easing function for smooth animation
   */
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Update camera animation (call in render loop)
   */
  update() {
    if (!this.isAnimating) return;

    const elapsed = performance.now() - this.animationStart;
    const progress = Math.min(elapsed / this.animationDuration, 1);
    const easedProgress = this.easeInOutCubic(progress);

    // Interpolate position
    this.camera.position.lerpVectors(
      this.startPosition,
      this.targetPosition,
      easedProgress
    );

    // Interpolate lookAt
    this.currentLookAt.lerpVectors(
      this.startLookAt,
      this.targetLookAt,
      easedProgress
    );
    this.camera.lookAt(this.currentLookAt);

    if (progress >= 1) {
      this.isAnimating = false;
    }
  }
}