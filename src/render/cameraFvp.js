// cameraFvp.js – kamera widoku z pierwszej osoby (FVP)

import { lerp, lerpAngle } from '../core/utils.js';

// Kamera FVP
export const fvpCamera = {
  x: 0,
  y: 0,
  angle: 0,
  speedLerp: 0,
  currentOffsetX: 0
};

// Ekran FVP
export const fvpScreen = {
  screenX: 0,
  screenY: 0
};

// Prekalkulowane stałe dla wydajności
const SPEED_FACTOR_INV = 1 / 50.0;
const MAX_SPEED_INV = 1 / 50.0;
const DEAD_ZONE = 0.15;
const DEAD_ZONE_INV = 1 / (1 - DEAD_ZONE);
const ANGLE_LERP_SPEED = 0.03;
const HORIZONTAL_LERP_BASE = 0.05;
const VERTICAL_LERP_SPEED = 0.06;

export function updateCamera(car, camera, canvas, worldSize) {
  // Kamera FVP zawsze śledzi auto
  camera.x = car.pos.x;
  camera.y = car.pos.y;
  camera.angle = car.angle;
}

export function updateFvpCameraAndScreen(car, canvas) {
  // Prekalkulowane wartości canvas
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const centerX = canvasWidth * 0.5;
  const maxAutoOffset = canvasWidth * 0.15;
  const startY = canvasHeight * 0.85; // Startowa pozycja 20% od dołu
  const minScreenY = canvasHeight * 0.90; // Min 10% od dołu przy cofaniu
  const maxScreenY = canvasHeight * 0.70; // Max 45% od dołu przy maksymalnej prędkości
  
  // Kamera FVP podąża za autem z opóźnieniem zależnym od siły odśrodkowej
  const slideLerpSpeed = Math.max(0.005, HORIZONTAL_LERP_BASE - car.slideForce * 10);
  fvpCamera.x = lerp(fvpCamera.x, car.pos.x, slideLerpSpeed);
  fvpCamera.y = lerp(fvpCamera.y, car.pos.y, slideLerpSpeed);
  
  // Lerp kąta kamery do kąta auta + Math.PI/2 (90 stopni)
  const targetAngle = car.angle + Math.PI * 0.5;
  fvpCamera.angle = lerpAngle(fvpCamera.angle, targetAngle, ANGLE_LERP_SPEED);
  
  // Poziom: swoboda 40% ekranu (20% od środka)
  const speedFactor = Math.min(Math.abs(car.speed) * SPEED_FACTOR_INV, 1.0);
  const targetOffsetX = car.vel.x * speedFactor * 3.0;
  
  // Lerp pozycji auta z opóźnieniem
  const horizontalLerpSpeed = Math.max(0.01, HORIZONTAL_LERP_BASE - car.slideForce * 10);
  if (Math.abs(targetOffsetX) > 0.1) {
    fvpCamera.currentOffsetX = lerp(fvpCamera.currentOffsetX, targetOffsetX, horizontalLerpSpeed);
  }
  
  // Ogranicz pozycję auta do 20% od środka
  fvpScreen.screenX = centerX + Math.max(-maxAutoOffset, Math.min(maxAutoOffset, fvpCamera.currentOffsetX));

  // Pion: płynne przesuwanie na podstawie lerpowanej prędkości
  let speedNorm = Math.abs(car.speed * MAX_SPEED_INV);
  if (speedNorm < DEAD_ZONE) {
    speedNorm = 0;
  } else {
    speedNorm = (speedNorm - DEAD_ZONE) * DEAD_ZONE_INV;
  }
  
  // Użyj biegów do określenia kierunku jazdy
  if (car.gear === 'D') speedNorm = -speedNorm;
  speedNorm = Math.max(-1, Math.min(1, speedNorm));
  
  fvpCamera.speedLerp = lerp(fvpCamera.speedLerp, speedNorm, VERTICAL_LERP_SPEED);
  
  if (fvpCamera.speedLerp >= 0) {
    fvpScreen.screenY = startY - (startY - minScreenY) * fvpCamera.speedLerp;
  } else {
    fvpScreen.screenY = startY - (startY - maxScreenY) * (-fvpCamera.speedLerp);
  }
} 