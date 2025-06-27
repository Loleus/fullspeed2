// camera/index.js – zunifikowany system kamer
import { clamp } from '../../core/utils.js';
import { lerp, lerpAngle } from '../../core/utils.js';

// Classic camera
const classicCamera = {
  x: 0, y: 0,
  update(car, canvas, worldSize) {
    const targetX = clamp(car.pos.x, canvas.width / 2, worldSize - canvas.width / 2);
    const targetY = clamp(car.pos.y, canvas.height / 2, worldSize - canvas.height / 2);
    this.x += (targetX - this.x) * 0.12;
    this.y += (targetY - this.y) * 0.12;
  },
  getScreenTransform() {
    return { x: this.x, y: this.y, angle: 0 };
  }
};

// FVP camera
const fvpCamera = {
  x: 0, y: 0, angle: 0, speedLerp: 0, currentOffsetX: 0,
  update(car, canvas, worldSize) {
    // Pozycja
    const baseLerpSpeed = 0.02;
    const slideLerpSpeed = Math.max(0.005, baseLerpSpeed - car.slideForce * 15);
    this.x = lerp(this.x, car.pos.x, slideLerpSpeed);
    this.y = lerp(this.y, car.pos.y, slideLerpSpeed);
    // Kąt
    const targetAngle = car.angle + Math.PI / 2;
    this.angle = lerpAngle(this.angle, targetAngle, 0.03);
    // Offset X
    const centerX = canvas.width / 2;
    const maxAutoOffset = canvas.width * 0.2;
    const speedFactor = Math.min(Math.abs(car.speed) / 50.0, 1.0);
    const targetOffsetX = car.vel.x * speedFactor * 3.0;
    const horizontalLerpSpeed = Math.max(0.01, 0.05 - car.slideForce * 10);
    if (Math.abs(targetOffsetX) > 0.1) {
      this.currentOffsetX = lerp(this.currentOffsetX, targetOffsetX, horizontalLerpSpeed);
    }
    // Pion
    const startY = canvas.height * 0.85;
    const minScreenY = canvas.height * 0.45;
    const maxScreenY = canvas.height * 0.95;
    let maxSpeed = 50.0;
    const deadZone = 0.15;
    let speedNorm = Math.abs(car.speed / maxSpeed);
    if (speedNorm < deadZone) speedNorm = 0;
    else speedNorm = (speedNorm - deadZone) / (1 - deadZone);
    if (car.speed < 0) speedNorm = -speedNorm;
    speedNorm = Math.max(-1, Math.min(1, speedNorm));
    this.speedLerp = lerp(this.speedLerp, speedNorm, 0.06);
    if (this.speedLerp >= 0) {
      this.screenY = startY - (startY - minScreenY) * this.speedLerp;
    } else {
      this.screenY = startY - (startY - maxScreenY) * (-this.speedLerp);
    }
    this.screenX = centerX + Math.max(-maxAutoOffset, Math.min(maxAutoOffset, this.currentOffsetX));
  },
  getScreenTransform() {
    return { x: this.x, y: this.y, angle: this.angle, screenX: this.screenX, screenY: this.screenY };
  }
};

const cameras = {
  classic: classicCamera,
  fvp: fvpCamera
};

let currentMode = 'classic';

export const CameraManager = {
  setMode(mode) {
    if (cameras[mode]) currentMode = mode;
  },
  getMode() {
    return currentMode;
  },
  update(car, canvas, worldSize) {
    cameras[currentMode].update(car, canvas, worldSize);
  },
  getScreenTransform() {
    return cameras[currentMode].getScreenTransform();
  }
};

export function updateCamera(car, camera, canvas, worldSize) {
  const targetX = clamp(car.pos.x, canvas.width / 2, worldSize - canvas.width / 2);
  const targetY = clamp(car.pos.y, canvas.height / 2, worldSize - canvas.height / 2);
  camera.x += (targetX - camera.x) * 0.12;
  camera.y += (targetY - camera.y) * 0.12;
} 