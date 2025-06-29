// render.js – główny moduł renderowania

import { getCameraMode } from '../input/gameInput.js';
import { getTiles, getTileSize, getNumTilesX, getNumTilesY, getTileShift } from '../world/tiles.js';
import { drawCar } from '../entities/car/carRenderer.js';
import { fvpCamera, fvpScreen, updateFvpCameraAndScreen } from './cameraFvp.js';

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
    // W trybie FVP: prosty widok z obrotem względem pozycji samochodu
    
    ctx.translate(canvasWidth * 0.5, canvasHeight * 0.5);
    
    // Przesuń świat w dół, aby punkt startu był pod samochodem
    ctx.translate(0, canvasHeight * 0.3); // Przesuń świat w dół o 30% wysokości
    
    ctx.rotate(-fvpCamera.angle); // Obróć świat przeciwnie do kamery
    ctx.translate(-car.pos.x, -car.pos.y); // Przesuń świat względem pozycji samochodu
    
    const diag = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
    const radius = diag * 0.6; // zamiast diag / 2
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
  
  let currentFvpScreen = null;
  if (getCameraMode() === 'fvp') {
    updateFvpCameraAndScreen(car, ctx.canvas);
    currentFvpScreen = fvpScreen;
    // Rysuj świat FVP
    drawWorldTiled(ctx, camera, canvasWidth, canvasHeight, car, currentFvpScreen);
  } else {
    // Rysuj świat classic
    drawWorldTiled(ctx, camera, canvasWidth, canvasHeight);
  }
  
  // Rysuj auto
  const imgReady = carImg && carImg.complete && carImg.naturalWidth > 0;
  
  if (getCameraMode() === 'fvp') {
    ctx.save();
    // Samochód w FVP używa pozycji z fvpScreen (z poruszaniem w osi Y)
    ctx.translate(currentFvpScreen ? currentFvpScreen.screenX : canvasWidthHalf, currentFvpScreen ? currentFvpScreen.screenY : canvasHeight * 0.8);
    
    // Obróć samochód względem różnicy między kątem samochodu a kątem kamery
    // Samochód ma być zawsze skierowany "do góry" na ekranie
    const carAngleDiff = car.angle - fvpCamera.angle;
    ctx.rotate(carAngleDiff);
    
    // Narysuj samochód wycentrowany
    if (imgReady) {
      const halfWidth = car.length / 2; // 90 (długość jako szerokość)
      const halfHeight = car.width / 2; // 40 (szerokość jako wysokość)
      ctx.drawImage(carImg, -halfWidth, -halfHeight, car.length, car.width);
    } else {
      ctx.fillStyle = 'red';
      ctx.fillRect(-car.length/2, -car.width/2, car.length, car.width);
    }
    ctx.restore();
  } else {
    drawCar(ctx, car, camera, carImg, imgReady);
  }
}
