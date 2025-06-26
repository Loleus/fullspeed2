// render.js – rysowanie auta, toru, świata
import { drawCar } from '../entities/car/carRenderer.js';
import { tileSize } from '../world/world.js';
import { cameraMode } from '../input/input.js';
import { CONFIG } from '../config/gameConfig.js';

// Zmienna globalna na pozycję i kąt kamery FVP
let fvpCamera = { x: 0, y: 0, angle: 0 };
let fvpSpeedLerp = 0; // płynnie lerpowana prędkość do pionowego przesuwania auta

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return a + diff * t;
}

function updateFvpCameraAndScreen(car, canvas, worldW, worldH) {
  // Kamera FVP zawsze podąża za autem bez clampowania
  fvpCamera.x = car.pos.x;
  fvpCamera.y = car.pos.y;
  
  // Lerp kąta kamery do kąta auta + Math.PI/2
  const targetAngle = car.angle + Math.PI / 2;
  fvpCamera.angle = lerpAngle(fvpCamera.angle, targetAngle, 0.04);

  // Poziom: auto zawsze na środku ekranu w trybie FVP
  const centerX = canvas.width / 2;
  let screenX = centerX; // Auto zawsze na środku w poziomie

  // Pion: płynne przesuwanie na podstawie lerpowanej prędkości
  const startY = canvas.height * 0.8;
  const minScreenY = canvas.height * 0.5; // max do przodu
  const maxScreenY = canvas.height * 0.9; // max do tyłu
  // Lerp speed z martwą strefą
  let maxSpeed = 36.0; // auto osiąga środek ekranu dopiero przy ok. 220 km/h
  const deadZone = 0.2; // 20% maxSpeed
  let speedNorm = Math.abs(car.speed / maxSpeed);
  if (speedNorm < deadZone) speedNorm = 0;
  else speedNorm = (speedNorm - deadZone) / (1 - deadZone); // normalizacja do 0..1 powyżej deadZone
  if (car.speed < 0) speedNorm = -speedNorm; // zachowaj kierunek
  speedNorm = Math.max(-1, Math.min(1, speedNorm)); // clamp
  fvpSpeedLerp = lerp(fvpSpeedLerp, speedNorm, 0.08); // płynne podążanie
  let screenY;
  if (fvpSpeedLerp >= 0) {
    // Przód: od startY do minScreenY
    screenY = startY - (startY - minScreenY) * fvpSpeedLerp;
  } else {
    // Tył: od startY do maxScreenY
    screenY = startY - (startY - maxScreenY) * (-fvpSpeedLerp);
  }
  return { screenX, screenY };
}

// Funkcja drawWorld powinna korzystać tylko z worldCanvas (SVG), nie rysować przeszkód ręcznie
export function drawWorld(ctx, worldC, camera) {
  ctx.save();
  ctx.translate(-camera.x + ctx.canvas.width / 2, -camera.y + ctx.canvas.height / 2);
  ctx.drawImage(worldC, 0, 0);
  ctx.restore();
}

// drawWorldTiled: rysuje tylko widoczne kafelki świata (tileSize przekazuj z world.js)
export function drawWorldTiled(ctx, tiles, camera, canvasWidth, canvasHeight, tileSize, car = null, fvpScreen = null) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (cameraMode === 'fvp' && car && fvpScreen) {
    ctx.translate(fvpScreen.screenX, fvpScreen.screenY);
    ctx.rotate(-fvpCamera.angle);
    ctx.translate(-car.pos.x, -car.pos.y);
  } else {
    ctx.translate(-camera.x + canvasWidth / 2, -camera.y + canvasHeight / 2);
  }
  const cx = (cameraMode === 'fvp' && car) ? fvpCamera.x : camera.x;
  const cy = (cameraMode === 'fvp' && car) ? fvpCamera.y : camera.y;
  // Dodaj margines kafelków
  const margin = 2;
  const left = Math.floor((cx - canvasWidth / 2) / tileSize) - margin;
  const right = Math.ceil((cx + canvasWidth / 2) / tileSize) + margin;
  const top = Math.floor((cy - canvasHeight / 2) / tileSize) - margin;
  const bottom = Math.ceil((cy + canvasHeight / 2) / tileSize) + margin;
  for (const tile of tiles) {
    if (
      tile.x >= left && tile.x < right &&
      tile.y >= top && tile.y < bottom
    ) {
      ctx.drawImage(
        tile.canvas,
        tile.x * tileSize,
        tile.y * tileSize
      );
    }
  }
  ctx.restore();
}

// Główna funkcja renderowania - cała logika renderowania w jednym miejscu
export function renderFrame(ctx, tiles, camera, car, carImg, fps, keys, config) {
  // Najpierw tło w kolorze grass
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#4e9a06'; // kolor grass
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  let fvpScreen = null;
  if (cameraMode === 'fvp') {
    // Aktualizuj płynnie pozycję i kąt kamery FVP
    const worldW = config.WORLD.width;
    const worldH = config.WORLD.height;
    if (fvpCamera.x === 0 && fvpCamera.y === 0) {
      fvpCamera.x = car.pos.x;
      fvpCamera.y = car.pos.y;
      fvpCamera.angle = car.angle + Math.PI / 2;
    }
    fvpScreen = updateFvpCameraAndScreen(car, ctx.canvas, worldW, worldH);
  }
  // Rysuj świat
  if (tiles) {
    drawWorldTiled(ctx, tiles, camera, ctx.canvas.width, ctx.canvas.height, tileSize, cameraMode === 'fvp' ? car : null, fvpScreen);
  }
  // Rysuj auto
  const imgReady = carImg && carImg.complete && carImg.naturalWidth > 0;
  if (cameraMode === 'fvp') {
    ctx.save();
    ctx.translate(fvpScreen ? fvpScreen.screenX : ctx.canvas.width / 2, fvpScreen ? fvpScreen.screenY : ctx.canvas.height / 2);
    ctx.rotate(-(fvpCamera.angle - (car.angle + Math.PI/2)));
    drawCar(ctx, { ...car, pos: { x: 0, y: 0 }, angle: -Math.PI/2 }, null, carImg, imgReady);
    ctx.restore();
  } else {
    drawCar(ctx, car, camera, carImg, imgReady);
  }
}
