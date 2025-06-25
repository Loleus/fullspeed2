// world.js – logika świata, kolizje, wektory
import { loadSVGWorld } from './svgWorldLoader.js';
import { clamp } from '../core/utils.js';

export let worldCanvas = null;
export let collisionCanvas = null;
export let getSurfaceTypeAt = null;
export let startPos = null;
export let obstaclePolys = [];
export let tiles = null;
export let tileSize = 500;

export async function initWorldFromSVG(svgUrl, collisionMapSize = 1000, worldSize = 4000) {
  const result = await loadSVGWorld(svgUrl, collisionMapSize, worldSize);
  worldCanvas = result.worldCanvas;
  collisionCanvas = result.collisionCanvas;
  getSurfaceTypeAt = result.getSurfaceTypeAt;
  startPos = result.startPos;
  obstaclePolys = result.obstaclePolys || [];
  tiles = result.tiles;
  tileSize = result.tileSize || 500;
}

export function updateCamera(car, camera, canvas, WORLD) {
  const targetX = clamp(car.pos.x, canvas.width / 2, WORLD.width - canvas.width / 2);
  const targetY = clamp(car.pos.y, canvas.height / 2, WORLD.height - canvas.height / 2);
  camera.x += (targetX - camera.x) * 0.12;
  camera.y += (targetY - camera.y) * 0.12;
}

export function getSurfaceParams(type) {
  switch (type) {
    case 'asphalt':
      return { gripMul: 2.0, accelMul: 1.0, reverseMul: 1.0, brakeMul: 1.5 };
    case 'grass':
      return { gripMul: 1, accelMul: 0.7, reverseMul: 0.7, brakeMul: 1 };
    case 'obstacle':
      return { gripMul: 0, accelMul: 0, reverseMul: 0, brakeMul: 0, isObstacle: true };
    default:
      return { gripMul: 0.25, accelMul: 0.3, reverseMul: 0.3, brakeMul: 0.4 };
  }
}
