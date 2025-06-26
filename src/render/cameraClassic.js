// cameraClassic.js – logika kamery top-down (statycznej)
import { clamp } from '../core/utils.js';

export function updateCamera(car, camera, canvas, WORLD) {
  const targetX = clamp(car.pos.x, canvas.width / 2, WORLD.width - canvas.width / 2);
  const targetY = clamp(car.pos.y, canvas.height / 2, WORLD.height - canvas.height / 2);
  camera.x += (targetX - camera.x) * 0.12;
  camera.y += (targetY - camera.y) * 0.12;
} 