// world.js – logika świata, kolizje, wektory
import { loadSVGWorld } from './svgWorldLoader.js';
import { clamp } from '../core/utils.js';
import { getTiles, getTileSize } from './tiles.js';

export let worldCanvas = null;
export let collisionCanvas = null;
export let getSurfaceTypeAt = null;
export let startPos = null;
export let obstaclePolys = [];
export let tiles = null;
export let tileSize = 256;

export async function initWorldFromSVG(svgUrl, collisionMapSize = 1000, worldSize = 4000) {
  const result = await loadSVGWorld(svgUrl, collisionMapSize, worldSize);
  worldCanvas = result.worldCanvas;
  collisionCanvas = result.collisionCanvas;
  getSurfaceTypeAt = result.getSurfaceTypeAt;
  startPos = result.startPos;
  obstaclePolys = result.obstaclePolys || [];
  tiles = result.tiles;
  tileSize = result.tileSize || 256;
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
      return { gripMul: 1, accelMul: 0.7, reverseMul: 0.7, brakeMul: 1 };
  }
}

export function getTilesGetter() {
  return getTiles();
}

export function getTileSizeGetter() {
  return getTileSize();
}

export function getWorldCanvas() {
  return worldCanvas;
}

export function getCollisionCanvas() {
  return collisionCanvas;
}

export function getSurfaceTypeAtGetter() {
  return getSurfaceTypeAt;
}

export function getStartPos() {
  return startPos;
}

export function getObstaclePolys() {
  return obstaclePolys;
}
