// cameraFvp.js – logika kamery First Person View

import { lerp, lerpAngle } from '../core/utils.js';

let fvpCamera = { x: 0, y: 0, angle: 0 };
let fvpSpeedLerp = 0;
let currentOffsetX = 0;

export function updateFvpCameraAndScreen(car, canvas) {
  // Kamera FVP podąża za autem z opóźnieniem zależnym od siły odśrodkowej
  const baseLerpSpeed = 0.02;
  const slideLerpSpeed = Math.max(0.005, baseLerpSpeed - car.slideForce * 15);
  fvpCamera.x = lerp(fvpCamera.x, car.pos.x, slideLerpSpeed);
  fvpCamera.y = lerp(fvpCamera.y, car.pos.y, slideLerpSpeed);
  // Lerp kąta kamery do kąta auta + Math.PI/2
  const targetAngle = car.angle + Math.PI / 2;
  fvpCamera.angle = lerpAngle(fvpCamera.angle, targetAngle, 0.03);

  // Poziom: swoboda 40% ekranu (20% od środka)
  const centerX = canvas.width / 2;
  const maxAutoOffset = canvas.width * 0.2;
  // Oblicz offset auta na podstawie prędkości bocznej
  const speedFactor = Math.min(Math.abs(car.speed) / 50.0, 1.0);
  const targetOffsetX = car.vel.x * speedFactor * 3.0;
  // Lerp pozycji auta z opóźnieniem
  const horizontalLerpSpeed = Math.max(0.01, 0.05 - car.slideForce * 10);
  if (Math.abs(targetOffsetX) > 0.1) {
    currentOffsetX = lerp(currentOffsetX, targetOffsetX, horizontalLerpSpeed);
  }
  // Ogranicz pozycję auta do 20% od środka
  let screenX = centerX + Math.max(-maxAutoOffset, Math.min(maxAutoOffset, currentOffsetX));

  // Pion: płynne przesuwanie na podstawie lerpowanej prędkości
  const startY = canvas.height * 0.85; // 15% od dołu ekranu
  const minScreenY = canvas.height * 0.45; // więcej drogi przed autem
  const maxScreenY = canvas.height * 0.95; // nieco bliżej dołu przy cofaniu
  let maxSpeed = 50.0;
  const deadZone = 0.15;
  let speedNorm = Math.abs(car.speed / maxSpeed);
  if (speedNorm < deadZone) speedNorm = 0;
  else speedNorm = (speedNorm - deadZone) / (1 - deadZone);
  if (car.speed < 0) speedNorm = -speedNorm;
  speedNorm = Math.max(-1, Math.min(1, speedNorm));
  fvpSpeedLerp = lerp(fvpSpeedLerp, speedNorm, 0.06);
  let screenY;
  if (fvpSpeedLerp >= 0) {
    screenY = startY - (startY - minScreenY) * fvpSpeedLerp;
  } else {
    screenY = startY - (startY - maxScreenY) * (-fvpSpeedLerp);
  }
  return { screenX, screenY };
}

export { fvpCamera }; 