// render.js – rysowanie auta, toru, świata
import { drawCar } from '../entities/car/carRenderer.js';

// Funkcja drawWorld powinna korzystać tylko z worldCanvas (SVG), nie rysować przeszkód ręcznie
export function drawWorld(ctx, worldC, camera) {
  ctx.save();
  ctx.translate(-camera.x + ctx.canvas.width / 2, -camera.y + ctx.canvas.height / 2);
  ctx.drawImage(worldC, 0, 0);
  ctx.restore();
}

// drawWorldTiled: rysuje tylko widoczne kafelki świata (tileSize przekazuj z world.js)
export function drawWorldTiled(ctx, tiles, camera, canvasWidth, canvasHeight, tileSize) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Oblicz zakres widocznych kafelków
  const left = Math.floor((camera.x - canvasWidth / 2) / tileSize);
  const right = Math.ceil((camera.x + canvasWidth / 2) / tileSize);
  const top = Math.floor((camera.y - canvasHeight / 2) / tileSize);
  const bottom = Math.ceil((camera.y + canvasHeight / 2) / tileSize);
  for (const tile of tiles) {
    if (
      tile.x >= left && tile.x < right &&
      tile.y >= top && tile.y < bottom
    ) {
      ctx.drawImage(
        tile.canvas,
        tile.x * tileSize - camera.x + canvasWidth / 2,
        tile.y * tileSize - camera.y + canvasHeight / 2
      );
    }
  }
  ctx.restore();
}

// Główna funkcja renderowania - cała logika renderowania w jednym miejscu
export function renderFrame(ctx, tiles, camera, car, carImg, fps, keys, config) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Rysuj świat
  if (tiles) {
    drawWorldTiled(ctx, tiles, camera, ctx.canvas.width, ctx.canvas.height, 500); // tileSize = 500
  }
  
  // Rysuj auto
  const imgReady = carImg && carImg.complete && carImg.naturalWidth > 0;
  drawCar(ctx, car, camera, carImg, imgReady);
}
