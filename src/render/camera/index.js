// camera/index.js – zunifikowany system kamer
import { clamp } from '../../core/utils.js';
import { lerp, lerpAngle } from '../../core/utils.js';

// Prekalkulowane stałe dla wydajności
const HALF_PI = Math.PI * 0.5; // zamiast Math.PI / 2
const SPEED_FACTOR_INV = 1 / 50.0; // zamiast dzielenia przez 50.0
const MAX_SPEED_INV = 1 / 50.0; // zamiast dzielenia przez maxSpeed
const DEAD_ZONE = 0.15;
const DEAD_ZONE_INV = 1 / (1 - DEAD_ZONE); // zamiast dzielenia przez (1 - deadZone)

// Classic camera
const classicCamera = {
  x: 0, y: 0,
  update(car, canvas, worldSize) {
    // Prekalkulowane wartości dla wydajności
    const canvasWidthHalf = canvas.width * 0.5; // zamiast canvas.width / 2
    const canvasHeightHalf = canvas.height * 0.5; // zamiast canvas.height / 2
    
    const targetX = clamp(car.pos.x, canvasWidthHalf, worldSize - canvasWidthHalf);
    const targetY = clamp(car.pos.y, canvasHeightHalf, worldSize - canvasHeightHalf);
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
    // Prekalkulowane wartości canvas
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const canvasWidthHalf = canvasWidth * 0.5;
    // const canvasHeightHalf = canvasHeight * 0.5;
    
    // Pozycja
    const baseLerpSpeed = 0.02;
    const slideLerpSpeed = Math.max(0.005, baseLerpSpeed - car.slideForce * 15);
    this.x = lerp(this.x, car.pos.x, slideLerpSpeed);
    this.y = lerp(this.y, car.pos.y, slideLerpSpeed);
    
    // Kąt
    const targetAngle = car.angle + HALF_PI; // zamiast Math.PI / 2
    this.angle = lerpAngle(this.angle, targetAngle, 0.03);
    
    // Offset X
    const centerX = canvasWidthHalf; // zamiast canvas.width / 2
    const maxAutoOffset = canvasWidth * 0.2;
    // Zoptymalizowane: mnożenie zamiast dzielenia
    const speedFactor = Math.min(Math.abs(car.speed) * SPEED_FACTOR_INV, 1.0);
    const targetOffsetX = car.vel.x * speedFactor * 3.0;
    const horizontalLerpSpeed = Math.max(0.01, 0.05 - car.slideForce * 10);
    if (Math.abs(targetOffsetX) > 0.1) {
      this.currentOffsetX = lerp(this.currentOffsetX, targetOffsetX, horizontalLerpSpeed);
    }
    
    // Pion
    const startY = canvasHeight * 0.85;
    const minScreenY = canvasHeight * 0.45;
    const maxScreenY = canvasHeight * 0.95;
    // Zoptymalizowane: mnożenie zamiast dzielenia
    let speedNorm = Math.abs(car.speed * MAX_SPEED_INV);
    if (speedNorm < DEAD_ZONE) {
      speedNorm = 0;
    } else {
      speedNorm = (speedNorm - DEAD_ZONE) * DEAD_ZONE_INV;
    }
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
  // Prekalkulowane wartości dla wydajności
  const canvasWidthHalf = canvas.width * 0.5; // zamiast canvas.width / 2
  const canvasHeightHalf = canvas.height * 0.5; // zamiast canvas.height / 2
  
  const targetX = clamp(car.pos.x, canvasWidthHalf, worldSize - canvasWidthHalf);
  const targetY = clamp(car.pos.y, canvasHeightHalf, worldSize - canvasHeightHalf);
  camera.x += (targetX - camera.x) * 0.12;
  camera.y += (targetY - camera.y) * 0.12;
} 