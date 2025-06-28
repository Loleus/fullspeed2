// render.js – rysowanie auta, toru, świata
import { drawCar } from '../entities/car/carRenderer.js';
import { getTiles, getTileSize, getNumTilesX, getNumTilesY, getTileShift } from '../world/tiles.js';
import { getCameraMode } from '../input/gameInput.js';
import { updateFvpCameraAndScreen, fvpCamera } from './cameraFvp.js';

// Prekalkulowane stałe dla wydajności
const HALF_PI = Math.PI * 0.5; // zamiast Math.PI / 2

// Funkcja drawWorld powinna korzystać tylko z worldCanvas (SVG), nie rysować przeszkód ręcznie
export function drawWorld(ctx, worldC, camera) {
  ctx.save();
  // Zoptymalizowane: mnożenie zamiast dzielenia przez 2
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  ctx.translate(-camera.x + canvasWidth * 0.5, -camera.y + canvasHeight * 0.5);
  ctx.drawImage(worldC, 0, 0);
  ctx.restore();
}

// drawWorldTiled: rysuje tylko widoczne kafelki świata (optymalizacja pod FVP)
export function drawWorldTiled(ctx, camera, canvasWidth, canvasHeight, car = null, fvpScreen = null) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Prekalkulowane wartości dla wydajności
  const tileSize = getTileSize();
  const numTilesX = getNumTilesX();
  const numTilesY = getNumTilesY();
  const shift = getTileShift(); // używamy funkcji z tiles.js
  const tiles = getTiles();

  if (getCameraMode() === 'fvp' && car && fvpScreen) {
    ctx.translate(fvpScreen.screenX, fvpScreen.screenY);
    ctx.rotate(-fvpCamera.angle);
    ctx.translate(-car.pos.x, -car.pos.y);
    const diag = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
    const radius = diag * 0.5; // zamiast diag / 2
    const minX = Math.max(0, ((car.pos.x - radius) >> shift));
    const maxX = Math.min(numTilesX, ((car.pos.x + radius) >> shift) + 1);
    const minY = Math.max(0, ((car.pos.y - radius) >> shift));
    const maxY = Math.min(numTilesY, ((car.pos.y + radius) >> shift) + 1);
    
    for (let ty = minY; ty < maxY; ++ty) {
      for (let tx = minX; tx < maxX; ++tx) {
        const tile = tiles[ty][tx];
        ctx.drawImage(
          tile.canvas,
          tile.x * tileSize,
          tile.y * tileSize
        );
      }
    }
  } else {
    // --- Zwykła kamera: prostokątny zakres kafelków z marginesem ---
    const margin = 2;
    // Zoptymalizowane: mnożenie zamiast dzielenia przez 2
    const canvasWidthHalf = canvasWidth * 0.5;
    const canvasHeightHalf = canvasHeight * 0.5;
    const left = ((camera.x - canvasWidthHalf) >> shift) - margin;
    const right = ((camera.x + canvasWidthHalf) >> shift) + margin;
    const top = ((camera.y - canvasHeightHalf) >> shift) - margin;
    const bottom = ((camera.y + canvasHeightHalf) >> shift) + margin;
    ctx.translate(-camera.x + canvasWidthHalf, -camera.y + canvasHeightHalf);
    
    for (let ty = top; ty < bottom; ++ty) {
      if (ty < 0 || ty >= numTilesY) continue;
      for (let tx = left; tx < right; ++tx) {
        if (tx < 0 || tx >= numTilesX) continue;
        const tile = tiles[ty][tx];
        ctx.drawImage(
          tile.canvas,
          tile.x * tileSize,
          tile.y * tileSize
        );
      }
    }
  }
  ctx.restore();
}

// Główna funkcja renderowania - cała logika renderowania w jednym miejscu
export function renderFrame(ctx, camera, car, carImg, fps, keys, config) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Prekalkulowane wartości canvas
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const canvasWidthHalf = canvasWidth * 0.5;
  const canvasHeightHalf = canvasHeight * 0.5;
  
  let fvpScreen = null;
  if (getCameraMode() === 'fvp') {
    // Inicjalizacja kamery FVP przy pierwszym uruchomieniu
    if (fvpCamera.x === 0 && fvpCamera.y === 0) {
      fvpCamera.x = car.pos.x;
      fvpCamera.y = car.pos.y;
      fvpCamera.angle = car.angle + HALF_PI; // zamiast Math.PI / 2
    }
    fvpScreen = updateFvpCameraAndScreen(car, ctx.canvas);
    // Rysuj świat FVP
    drawWorldTiled(ctx, camera, canvasWidth, canvasHeight, car, fvpScreen);
  } else {
    // Rysuj świat classic
    drawWorldTiled(ctx, camera, canvasWidth, canvasHeight);
  }
  
  // Rysuj auto
  const imgReady = carImg && carImg.complete && carImg.naturalWidth > 0;
  if (getCameraMode() === 'fvp') {
    ctx.save();
    ctx.translate(fvpScreen ? fvpScreen.screenX : canvasWidthHalf, fvpScreen ? fvpScreen.screenY : canvasHeightHalf);
    ctx.rotate(-(fvpCamera.angle - (car.angle + HALF_PI))); // zamiast Math.PI/2
    drawCar(ctx, { ...car, pos: { x: 0, y: 0 }, angle: -HALF_PI }, null, carImg, imgReady);
    ctx.restore();
  } else {
    drawCar(ctx, car, camera, carImg, imgReady);
  }
}
