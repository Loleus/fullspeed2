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

// drawTrack usunięte, bo jest w world.js
