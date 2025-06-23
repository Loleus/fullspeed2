// world.js – logika świata, kolizje, wektory
import { loadSVGWorld } from './svgWorldLoader.js';

export let worldCanvas = null;
export let collisionCanvas = null;
export let getSurfaceTypeAt = null;
export let startPos = null;
export let obstaclePolys = [];

export async function initWorldFromSVG(svgUrl, collisionMapSize = 1000, worldSize = 4000) {
  const result = await loadSVGWorld(svgUrl, collisionMapSize, worldSize);
  worldCanvas = result.worldCanvas;
  collisionCanvas = result.collisionCanvas;
  getSurfaceTypeAt = result.getSurfaceTypeAt;
  startPos = result.startPos;
  obstaclePolys = result.obstaclePolys || [];
}

export function fwd(a) { return { x: Math.cos(a), y: Math.sin(a) }; }
export function rgt(a) { return { x: Math.cos(a + Math.PI / 2), y: Math.sin(a + Math.PI / 2) }; }
export function dot(a, b) { return a.x * b.x + a.y * b.y; }

export function getWorldBoundCollision(pos, vel, length, width, config) {
  const R = Math.hypot(length, width) * 0.5;
  let collided = false;
  let newPos = { ...pos };
  let newVel = { ...vel };
  if (pos.x - R < 0) {
    newPos.x = R;
    newVel.x = Math.abs(vel.x) * config.WALL_BOUNCE;
    collided = true;
  } else if (pos.x + R > config.WORLD.width) {
    newPos.x = config.WORLD.width - R;
    newVel.x = -Math.abs(vel.x) * config.WALL_BOUNCE;
    collided = true;
  }
  if (pos.y - R < 0) {
    newPos.y = R;
    newVel.y = Math.abs(vel.y) * config.WALL_BOUNCE;
    collided = true;
  } else if (pos.y + R > config.WORLD.height) {
    newPos.y = config.WORLD.height - R;
    newVel.y = -Math.abs(vel.y) * config.WALL_BOUNCE;
    collided = true;
  }
  return { collided, newPos, newVel };
}

// Sprawdza kolizję z przeszkodą (obstacle) na podstawie collision mapy SVG
// Działa analogicznie do getWorldBoundCollision: nie pozwala wejść nawet na 1px, odbija na zewnątrz
// Lepsza wersja: wypycha auto aż cały obwód jest poza przeszkodą
export function getObstacleCollision(pos, vel, radius, getSurfaceTypeAt, config) {
  const step = 1; // px
  let collided = false;
  let newPos = { ...pos };
  let newVel = { ...vel };
  // Funkcja pomocnicza: czy jakikolwiek punkt obwodu jest w przeszkodzie
  function isAnyPointInObstacle(cx, cy, r) {
    for (let a = 0; a < 360; a += 10) {
      const px = cx + Math.cos(a * Math.PI / 180) * r;
      const py = cy + Math.sin(a * Math.PI / 180) * r;
      if (getSurfaceTypeAt(Math.round(px), Math.round(py)) === 'obstacle') return true;
    }
    return getSurfaceTypeAt(Math.round(cx), Math.round(cy)) === 'obstacle';
  }
  if (isAnyPointInObstacle(pos.x, pos.y, radius)) {
    // Szukaj najbliższego kierunku wyjścia (co 10 stopni)
    let bestDir = null;
    let bestDist = 9999;
    for (let a = 0; a < 360; a += 10) {
      const dir = { x: Math.cos(a * Math.PI / 180), y: Math.sin(a * Math.PI / 180) };
      // Szukaj do 2*radius px na zewnątrz
      for (let d = 1; d <= radius * 2; d += step) {
        const tx = pos.x + dir.x * d;
        const ty = pos.y + dir.y * d;
        if (!isAnyPointInObstacle(tx, ty, radius)) {
          if (d < bestDist) {
            bestDist = d;
            bestDir = dir;
          }
          break;
        }
      }
    }
    if (bestDir) {
      // Przesuwaj auto aż cały obwód będzie poza przeszkodą
      let safeX = pos.x, safeY = pos.y, tries = 0;
      while (isAnyPointInObstacle(safeX, safeY, radius) && tries < radius * 3) {
        safeX += bestDir.x * step;
        safeY += bestDir.y * step;
        tries++;
      }
      newPos = { x: safeX, y: safeY };
      // Odbij prędkość na zewnątrz
      const normal = bestDir;
      const dotProd = vel.x * normal.x + vel.y * normal.y;
      newVel.x = (vel.x - 2 * dotProd * normal.x) * config.WALL_BOUNCE;
      newVel.y = (vel.y - 2 * dotProd * normal.y) * config.WALL_BOUNCE;
      collided = true;
    }
  }
  return { collided, newPos, newVel };
}

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
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
      return { gripMul: 0.25, accelMul: 0.3, reverseMul: 0.3, brakeMul: 0.4 };
    case 'obstacle':
      return { gripMul: 0, accelMul: 0, reverseMul: 0, brakeMul: 0, isObstacle: true };
    default:
      return { gripMul: 0.25, accelMul: 0.3, reverseMul: 0.3, brakeMul: 0.4 };
  }
}
