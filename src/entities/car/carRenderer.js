// carRenderer.js – renderowanie auta
// Wydzielone z car.js dla lepszej organizacji kodu

// UWAGA: Tryb FVP obsługiwany jest w renderFrame przez odpowiednie przekształcenie kontekstu.
// drawCar zawsze rysuje auto względem przekazanej pozycji i kąta.

export function createCarImage(src) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (e) => {
      console.error('Błąd ładowania obrazu auta:', e);
      resolve(null);
    };
    img.src = src;
  });
}

export function drawCar(ctx, car, camera, carImg, carImgLoaded) {
  ctx.save();
  
  // Przesuń do pozycji auta względem kamery (auto powinno być na środku ekranu)
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  ctx.translate(car.pos.x - (camera ? camera.x : 0) + canvasWidth * 0.5, car.pos.y - (camera ? camera.y : 0) + canvasHeight * 0.5);
  
  // Obróć o kąt auta
  ctx.rotate(car.angle);
  
  if (carImg && carImgLoaded) {
    // Narysuj auto skalowane do rzeczywistych rozmiarów (180x80)
    const halfWidth = car.length / 2; // 90 (długość jako szerokość)
    const halfHeight = car.width / 2; // 40 (szerokość jako wysokość)
    ctx.drawImage(carImg, -halfWidth, -halfHeight, car.length, car.width);
  } else {
    // Fallback - czerwony prostokąt gdy obrazek nie jest załadowany
    ctx.fillStyle = 'red';
    ctx.fillRect(-car.length/2, -car.width/2, car.length, car.width);
  }
  
  ctx.restore();
} 