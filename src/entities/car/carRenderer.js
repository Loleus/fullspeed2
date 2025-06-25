// carRenderer.js – logika renderowania auta

export function drawCar(ctx, car, camera, carImg, carImgLoaded) {
  ctx.save();
  ctx.translate(
    car.pos.x - camera.x + ctx.canvas.width / 2, 
    car.pos.y - camera.y + ctx.canvas.height / 2
  );
  ctx.rotate(car.angle);
  
  if (carImgLoaded) {
    ctx.drawImage(carImg, -car.length / 2, -car.width / 2, car.length, car.width);
  } else {
    // Fallback - czerwony prostokąt gdy obrazek nie jest załadowany
    ctx.fillStyle = 'red';
    ctx.fillRect(-car.length / 2, -car.width / 2, car.length, car.width);
  }
  
  ctx.restore();
}

export function createCarImage(src) {
  console.log('Ładowanie obrazu auta z:', src);
  const carImg = new Image();
  carImg.onload = () => {
    console.log('Obraz auta załadowany pomyślnie');
  };
  carImg.onerror = (error) => {
    console.error('Błąd ładowania obrazu auta:', error);
  };
  carImg.src = src;
  return carImg;
}

export function isImageLoaded(img) {
  return img && img.complete && img.naturalWidth > 0;
} 