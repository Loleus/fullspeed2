// cameraClassic.js – klasyczna kamera śledząca auto
import { clamp } from '../core/utils.js';

export function updateCamera(car, camera, canvas, worldSize) {
  // Prekalkulowane wartości dla wydajności
  const canvasWidthHalf = canvas.width * 0.5; // zamiast canvas.width / 2
  const canvasHeightHalf = canvas.height * 0.5; // zamiast canvas.height / 2
  
  // Zoptymalizowane: prekalkulowane granice dla clamp
  const minX = canvasWidthHalf;
  const maxX = worldSize - canvasWidthHalf;
  const minY = canvasHeightHalf;
  const maxY = worldSize - canvasHeightHalf;
  
  camera.x = clamp(car.pos.x, minX, maxX);
  camera.y = clamp(car.pos.y, minY, maxY);
} 