// render.js – rysowanie auta, toru, świata
import { drawCar } from '../entities/car/carRenderer.js';
import { getTiles, getTileSize, getNumTilesX, getNumTilesY } from '../world/tiles.js';
import { getCameraMode } from '../input/gameInput.js';
import { updateFvpCameraAndScreen, fvpCamera } from './cameraFvp.js';

function getTileShift(tileSize) {
  if ((tileSize & (tileSize - 1)) !== 0) {
    throw new Error('tileSize musi być potęgą dwójki!');
  }
  return Math.log2(tileSize);
}

// Funkcja drawWorld powinna korzystać tylko z worldCanvas (SVG), nie rysować przeszkód ręcznie
export function drawWorld(ctx, worldC, camera) {
  ctx.save();
  ctx.translate(-camera.x + ctx.canvas.width / 2, -camera.y + ctx.canvas.height / 2);
  ctx.drawImage(worldC, 0, 0);
  ctx.restore();
}

// drawWorldTiled: rysuje tylko widoczne kafelki świata (optymalizacja pod FVP)
export function drawWorldTiled(ctx, camera, canvasWidth, canvasHeight, car = null, fvpScreen = null) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (getCameraMode() === 'fvp' && car && fvpScreen) {
    ctx.translate(fvpScreen.screenX, fvpScreen.screenY);
    ctx.rotate(-fvpCamera.angle);
    ctx.translate(-car.pos.x, -car.pos.y);
    const diag = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
    const radius = diag / 2;
    const shift = getTileShift(getTileSize());
    const minX = Math.max(0, ((car.pos.x - radius) >> shift));
    const maxX = Math.min(getNumTilesX(), ((car.pos.x + radius) >> shift) + 1);
    const minY = Math.max(0, ((car.pos.y - radius) >> shift));
    const maxY = Math.min(getNumTilesY(), ((car.pos.y + radius) >> shift) + 1);
    const tiles = getTiles();
    for (let ty = minY; ty < maxY; ++ty) {
      for (let tx = minX; tx < maxX; ++tx) {
        const tile = tiles[ty][tx];
        ctx.drawImage(
          tile.canvas,
          tile.x * getTileSize(),
          tile.y * getTileSize()
        );
      }
    }
  } else {
    // --- Zwykła kamera: prostokątny zakres kafelków z marginesem ---
    const margin = 2;
    const shift = getTileShift(getTileSize());
    const left = ((camera.x - canvasWidth / 2) >> shift) - margin;
    const right = ((camera.x + canvasWidth / 2) >> shift) + margin;
    const top = ((camera.y - canvasHeight / 2) >> shift) - margin;
    const bottom = ((camera.y + canvasHeight / 2) >> shift) + margin;
    ctx.translate(-camera.x + canvasWidth / 2, -camera.y + canvasHeight / 2);
    const tiles = getTiles();
    for (let ty = top; ty < bottom; ++ty) {
      if (ty < 0 || ty >= getNumTilesY()) continue;
      for (let tx = left; tx < right; ++tx) {
        if (tx < 0 || tx >= getNumTilesX()) continue;
        const tile = tiles[ty][tx];
        ctx.drawImage(
          tile.canvas,
          tile.x * getTileSize(),
          tile.y * getTileSize()
        );
      }
    }
  }
  ctx.restore();
}

// Główna funkcja renderowania - cała logika renderowania w jednym miejscu
export function renderFrame(ctx, camera, car, carImg, fps, keys, config) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  let fvpScreen = null;
  if (getCameraMode() === 'fvp') {
    // Inicjalizacja kamery FVP przy pierwszym uruchomieniu
    if (fvpCamera.x === 0 && fvpCamera.y === 0) {
      fvpCamera.x = car.pos.x;
      fvpCamera.y = car.pos.y;
      fvpCamera.angle = car.angle + Math.PI / 2;
    }
    fvpScreen = updateFvpCameraAndScreen(car, ctx.canvas);
    // Rysuj świat FVP
    drawWorldTiled(ctx, camera, ctx.canvas.width, ctx.canvas.height, car, fvpScreen);
  } else {
    // Rysuj świat classic
    drawWorldTiled(ctx, camera, ctx.canvas.width, ctx.canvas.height);
  }
  
  // Rysuj auto
  const imgReady = carImg && carImg.complete && carImg.naturalWidth > 0;
  if (getCameraMode() === 'fvp') {
    ctx.save();
    ctx.translate(fvpScreen ? fvpScreen.screenX : ctx.canvas.width / 2, fvpScreen ? fvpScreen.screenY : ctx.canvas.height / 2);
    ctx.rotate(-(fvpCamera.angle - (car.angle + Math.PI/2)));
    drawCar(ctx, { ...car, pos: { x: 0, y: 0 }, angle: -Math.PI/2 }, null, carImg, imgReady);
    ctx.restore();
  } else {
    drawCar(ctx, car, camera, carImg, imgReady);
  }
}
