// cameraClassic.js – klasyczna kamera śledząca auto
import { clamp } from '../core/utils.js';

export function updateCamera(car, camera, canvas, worldSize) {
  const targetX = clamp(car.pos.x, canvas.width / 2, worldSize - canvas.width / 2);
  const targetY = clamp(car.pos.y, canvas.height / 2, worldSize - canvas.height / 2);
  
  camera.x = targetX;
  camera.y = targetY;
} 