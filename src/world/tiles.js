// tiles.js – zarządzanie kafelkami świata

let tiles = [];
let tileSize = 256;

export function initTiles(worldCanvas, newTileSize, worldSize) {
  tileSize = newTileSize;
  tiles = [];
  const numTilesX = Math.ceil(worldSize / tileSize);
  const numTilesY = Math.ceil(worldSize / tileSize);
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
      tiles.push({ x: tx, y: ty, canvas: tileCanvas });
    }
  }
}

export function getTiles() {
  return tiles;
}

export function getTileSize() {
  return tileSize;
} 