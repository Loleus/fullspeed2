// carRenderer.js – logika renderowania auta

// UWAGA: Tryb FVP obsługiwany jest w renderFrame przez odpowiednie przekształcenie kontekstu.
// drawCar zawsze rysuje auto względem przekazanej pozycji i kąta.

export function drawCar(ctx, car, camera, carImg, carImgLoaded) {
  ctx.save();
  
  // Prekalkulowane wartości dla wydajności
  const carLengthHalf = car.length * 0.5; // zamiast car.length / 2
  const carWidthHalf = car.width * 0.5;   // zamiast car.width / 2
  
  if (camera === null) {
    // Tryb FVP: auto na środku ekranu
    ctx.translate(0, 0);
    ctx.rotate(car.angle);
  } else {
    // Zoptymalizowane: mnożenie zamiast dzielenia przez 2
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    ctx.translate(
      car.pos.x - camera.x + canvasWidth * 0.5, 
      car.pos.y - camera.y + canvasHeight * 0.5
    );
    ctx.rotate(car.angle);
  }
  
  if (carImgLoaded) {
    ctx.drawImage(carImg, -carLengthHalf, -carWidthHalf, car.length, car.width);
  } else {
    // Fallback - czerwony prostokąt gdy obrazek nie jest załadowany
    ctx.fillStyle = 'red';
    ctx.fillRect(-carLengthHalf, -carWidthHalf, car.length, car.width);
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