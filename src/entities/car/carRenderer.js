// carRenderer.js – logika renderowania auta

// UWAGA: Tryb FVP obsługiwany jest w renderFrame przez odpowiednie przekształcenie kontekstu.
// drawCar zawsze rysuje auto względem przekazanej pozycji i kąta.

export function drawCar(ctx, car, camera, carImg, carImgLoaded) {
  ctx.save();
  if (camera === null) {
    // Tryb FVP: auto na środku ekranu
    ctx.translate(0, 0);
    ctx.rotate(car.angle);
  } else {
  ctx.translate(
    car.pos.x - camera.x + ctx.canvas.width / 2, 
    car.pos.y - camera.y + ctx.canvas.height / 2
  );
  ctx.rotate(car.angle);
  }
  
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