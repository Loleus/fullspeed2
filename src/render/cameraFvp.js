// cameraFvp.js – logika kamery First Person View

import { lerp, lerpAngle } from '../core/utils.js';

let fvpCamera = { x: 0, y: 0, angle: 0 };
let fvpSpeedLerp = 0;
let currentOffsetX = 0;

// Prekalkulowane stałe dla wydajności
const SPEED_FACTOR_INV = 1 / 50.0; // zamiast dzielenia przez 50.0
const MAX_SPEED_INV = 1 / 50.0; // zamiast dzielenia przez maxSpeed
const DEAD_ZONE = 0.15;
const DEAD_ZONE_INV = 1 / (1 - DEAD_ZONE); // zamiast dzielenia przez (1 - deadZone)
const BASE_LERP_SPEED = 0.02;
const ANGLE_LERP_SPEED = 0.03;
const HORIZONTAL_LERP_BASE = 0.05;
const VERTICAL_LERP_SPEED = 0.06;

export function updateFvpCameraAndScreen(car, canvas) {
  // Prekalkulowane wartości canvas
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const centerX = canvasWidth * 0.5;
  const maxAutoOffset = canvasWidth * 0.2;
  const startY = canvasHeight * 0.85;
  const minScreenY = canvasHeight * 0.65;
  const maxScreenY = canvasHeight * 0.95;

  // Kamera FVP podąża za autem z opóźnieniem zależnym od siły odśrodkowej
  const slideLerpSpeed = Math.max(0.005, BASE_LERP_SPEED - car.slideForce * 15);
  fvpCamera.x = lerp(fvpCamera.x, car.pos.x, slideLerpSpeed);
  fvpCamera.y = lerp(fvpCamera.y, car.pos.y, slideLerpSpeed);
  
  // Lerp kąta kamery do kąta auta + Math.PI/2
  const targetAngle = car.angle + Math.PI * 0.5; // Math.PI/2 = Math.PI * 0.5
  fvpCamera.angle = lerpAngle(fvpCamera.angle, targetAngle, ANGLE_LERP_SPEED);

  // Poziom: swoboda 40% ekranu (20% od środka)
  // Zoptymalizowane: mnożenie zamiast dzielenia
  const speedFactor = Math.min(Math.abs(car.speed) * SPEED_FACTOR_INV, 1.0);
  const targetOffsetX = car.vel.x * speedFactor * 3.0;
  
  // Lerp pozycji auta z opóźnieniem
  const horizontalLerpSpeed = Math.max(0.01, HORIZONTAL_LERP_BASE - car.slideForce * 10);
  if (Math.abs(targetOffsetX) > 0.1) {
    currentOffsetX = lerp(currentOffsetX, targetOffsetX, horizontalLerpSpeed);
  }
  
  // Ogranicz pozycję auta do 20% od środka
  let screenX = centerX + Math.max(-maxAutoOffset, Math.min(maxAutoOffset, currentOffsetX));

  // Pion: płynne przesuwanie na podstawie lerpowanej prędkości
  // Zoptymalizowane: mnożenie zamiast dzielenia
  let speedNorm = Math.abs(car.speed * MAX_SPEED_INV);
  if (speedNorm < DEAD_ZONE) {
    speedNorm = 0;
  } else {
    speedNorm = (speedNorm - DEAD_ZONE) * DEAD_ZONE_INV;
  }
  
  if (car.speed < 0) speedNorm = -speedNorm;
  speedNorm = Math.max(-1, Math.min(1, speedNorm));
  
  fvpSpeedLerp = lerp(fvpSpeedLerp, speedNorm, VERTICAL_LERP_SPEED);
  
  let screenY;
  if (fvpSpeedLerp >= 0) {
    screenY = startY - (startY - minScreenY) * fvpSpeedLerp;
  } else {
    screenY = startY - (startY - maxScreenY) * (-fvpSpeedLerp);
  }
  
  return { screenX, screenY };
}

export { fvpCamera }; 