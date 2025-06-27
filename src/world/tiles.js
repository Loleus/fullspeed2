// tiles.js – zarządzanie kafelkami świata
let tiles = [];
let tileSize = 256;
let numTilesX = 0;
let numTilesY = 0;

export function initTiles(worldCanvas, newTileSize, worldSize) {
  tileSize = newTileSize;
  numTilesX = Math.ceil(worldSize / tileSize);
  numTilesY = Math.ceil(worldSize / tileSize);
  tiles = Array.from({ length: numTilesY }, () => Array(numTilesX));
  for (let ty = 0; ty < numTilesY; ++ty) {
    for (let tx = 0; tx < numTilesX; ++tx) {
      const tileCanvas = document.createElement('canvas');
      tileCanvas.width = tileSize;
      tileCanvas.height = tileSize;
      const tileCtx = tileCanvas.getContext('2d');
      tileCtx.drawImage(
        worldCanvas,
        tx * tileSize, ty * tileSize, tileSize, tileSize,
        0, 0, tileSize, tileSize
      );
      tiles[ty][tx] = { x: tx, y: ty, canvas: tileCanvas };
    }
  }
}

export function getTiles() {
  return tiles;
}

export function getTileSize() {
  return tileSize;
}

export function getNumTilesX() {
  return numTilesX;
}

export function getNumTilesY() {
  return numTilesY;
} 