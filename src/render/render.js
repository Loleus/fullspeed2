// render.js – rysowanie auta, toru, świata
import { drawCar } from '../entities/car/carRenderer.js';
import { tiles, tileSize } from '../world/world.js';
import { cameraMode } from '../input/input.js';
import { updateFvpCameraAndScreen, fvpCamera } from './cameraFvp.js';

// Bufor renderowania świata dla FVP
let fvpWorldCache = null;
let fvpWorldCacheCtx = null;
let fvpWorldCacheSize = 0;
let fvpWorldCacheCenter = { x: 0, y: 0 };

// Ustaw duże kafelki dla FVP
const FVP_TILE_SIZE = 500;

// Globalna kolejka kafelków do dorysowania między klatkami
let tileDrawQueue = [];
let lastCenterX = null;
let lastCenterY = null;
let lastAngle = null;

function getTileShift(tileSize) {
  if ((tileSize & (tileSize - 1)) !== 0) {
    throw new Error('tileSize musi być potęgą dwójki!');
  }
  return Math.log2(tileSize);
}

function updateFvpWorldCache(cx, cy, tileSize, tiles) {
  // Rozmiar bufora: 1.5x szerokości ekranu (z zapasem na obrót)
  const cacheSize = Math.max(window.innerWidth, window.innerHeight) * 1.5;
  if (!fvpWorldCache || fvpWorldCacheSize !== cacheSize) {
    fvpWorldCache = document.createElement('canvas');
    fvpWorldCache.width = cacheSize;
    fvpWorldCache.height = cacheSize;
    fvpWorldCacheCtx = fvpWorldCache.getContext('2d');
    fvpWorldCacheSize = cacheSize;
  }
  // Bufor aktualizuje się tylko, gdy kamera przesunie się o więcej niż 60% szerokości bufora
  if (
    Math.abs(cx - fvpWorldCacheCenter.x) > cacheSize * 0.6 ||
    Math.abs(cy - fvpWorldCacheCenter.y) > cacheSize * 0.6
  ) {
    fvpWorldCacheCenter.x = cx;
    fvpWorldCacheCenter.y = cy;
    fvpWorldCacheCtx.clearRect(0, 0, cacheSize, cacheSize);
    // Automatyczne przesunięcie bitowe zależne od tileSize
    const shift = getTileShift(tileSize);
    const left = ((cx - cacheSize / 2) >> shift);
    const right = ((cx + cacheSize / 2) >> shift);
    const top = ((cy - cacheSize / 2) >> shift);
    const bottom = ((cy + cacheSize / 2) >> shift);
    for (const tile of tiles) {
      if (
        tile.x >= left && tile.x < right &&
        tile.y >= top && tile.y < bottom
      ) {
        fvpWorldCacheCtx.drawImage(
          tile.canvas,
          tile.x * tileSize - (cx - cacheSize / 2),
          tile.y * tileSize - (cy - cacheSize / 2)
        );
      }
    }
  }
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

  let cx, cy, angle;
  if (cameraMode === 'fvp' && car && fvpScreen) {
    ctx.translate(fvpScreen.screenX, fvpScreen.screenY);
    ctx.rotate(-fvpCamera.angle);
    ctx.translate(-car.pos.x, -car.pos.y);
    const diag = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
    const radius = diag / 2 + tileSize * 2;
    const cxCar = car.pos.x;
    const cyCar = car.pos.y;
    for (const tile of tiles) {
      const x0 = tile.x * tileSize;
      const y0 = tile.y * tileSize;
      const x1 = x0 + tileSize;
      const y1 = y0 + tileSize;
      // Sprawdź, czy środek LUB dowolny róg kafelka wpada w okrąg renderowania
      const points = [
        {x: x0, y: y0},
        {x: x1, y: y0},
        {x: x0, y: y1},
        {x: x1, y: y1},
        {x: x0 + tileSize/2, y: y0 + tileSize/2} // środek
      ];
      let visible = false;
      for (const p of points) {
        const dx = p.x - cxCar;
        const dy = p.y - cyCar;
        if (dx * dx + dy * dy < radius * radius) {
          visible = true;
          break;
        }
      }
      if (visible) {
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
    const shift = getTileShift(tileSize);
    const left = ((camera.x - canvasWidth / 2) >> shift) - margin;
    const right = ((camera.x + canvasWidth / 2) >> shift) + margin;
    const top = ((camera.y - canvasHeight / 2) >> shift) - margin;
    const bottom = ((camera.y + canvasHeight / 2) >> shift) + margin;
    ctx.translate(-camera.x + canvasWidth / 2, -camera.y + canvasHeight / 2);
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
  }
  ctx.restore();
}

// Główna funkcja renderowania - cała logika renderowania w jednym miejscu
export function renderFrame(ctx, camera, car, carImg, fps, keys, config) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  let fvpScreen = null;
  if (cameraMode === 'fvp') {
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
