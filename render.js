// render.js – rysowanie auta, toru, świata
export function drawCar(ctx, car, camera, carImg, carImgLoaded) {
  ctx.save();
  ctx.translate(car.pos.x - camera.x + ctx.canvas.width / 2, car.pos.y - camera.y + ctx.canvas.height / 2);
  ctx.rotate(car.angle);
  if (carImgLoaded) {
    ctx.drawImage(carImg, -car.length / 2, -car.width / 2, car.length, car.width);
  }
  ctx.restore();
}

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
