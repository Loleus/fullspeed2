// tiles.js – zarządzanie kafelkami świata
let tiles = [];
let tileSize = 256;
let tileSizeInv = 1 / 256; // prekalkulowana odwrotność dla wydajności
let numTilesX = 0;
let numTilesY = 0;

export function initTiles(worldCanvas, newTileSize, worldSize) {
  tileSize = newTileSize;
  tileSizeInv = 1 / newTileSize; // aktualizuj odwrotność
  numTilesX = Math.ceil(worldSize * tileSizeInv); // zoptymalizowane: mnożenie zamiast dzielenia
  numTilesY = Math.ceil(worldSize * tileSizeInv); // zoptymalizowane: mnożenie zamiast dzielenia
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

export function getTileSizeInv() {
  return tileSizeInv;
}

export function getNumTilesX() {
  return numTilesX;
}

export function getNumTilesY() {
  return numTilesY;
}

// Dodana funkcja getTileShift dla wydajności (używana w render.js)
export function getTileShift() {
  if ((tileSize & (tileSize - 1)) !== 0) {
    throw new Error('tileSize musi być potęgą dwójki!');
  }
  return Math.log2(tileSize);
} 