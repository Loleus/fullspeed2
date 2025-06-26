// render.js – rysowanie auta, toru, świata
import { drawCar } from '../entities/car/carRenderer.js';
import { getTiles, getTileSize } from '../world/tiles.js';
import { getCameraMode } from '../input/gameInput.js';
import { updateFvpCameraAndScreen, fvpCamera } from './cameraFvp.js';
import { loadSVGWorld } from '../world/svgWorldLoader.js';

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
  if (getCameraMode() === 'fvp' && car && fvpScreen) {
    ctx.translate(fvpScreen.screenX, fvpScreen.screenY);
    ctx.rotate(-fvpCamera.angle);
    ctx.translate(-car.pos.x, -car.pos.y);
    const diag = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
    const radius = diag / 2 + getTileSize() * 2;
    const cxCar = car.pos.x;
    const cyCar = car.pos.y;
    for (const tile of getTiles()) {
      const x0 = tile.x * getTileSize();
      const y0 = tile.y * getTileSize();
      const x1 = x0 + getTileSize();
      const y1 = y0 + getTileSize();
      // Sprawdź, czy środek LUB dowolny róg kafelka wpada w okrąg renderowania
      const points = [
        {x: x0, y: y0},
        {x: x1, y: y0},
        {x: x0, y: y1},
        {x: x1, y: y1},
        {x: x0 + getTileSize()/2, y: y0 + getTileSize()/2} // środek
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
    for (const tile of getTiles()) {
      if (
        tile.x >= left && tile.x < right &&
        tile.y >= top && tile.y < bottom
      ) {
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
