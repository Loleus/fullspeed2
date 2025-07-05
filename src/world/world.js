// world.js – logika świata, kolizje, wektory
import { loadSVGWorld } from "./svgWorldLoader.js";

export let worldCanvas = null;
export let collisionCanvas = null;
export let collisionTypeMap = null;
export let getSurfaceTypeAt = null;
export let startPos = null;
export let obstaclePolys = [];
export let tiles = null;
export let tileSize = 256;

export async function initWorldFromSVG(
  svgUrl,
  collisionMapSize,
  worldSizeParam
) {
  const result = await loadSVGWorld(svgUrl, collisionMapSize, worldSizeParam);
  worldCanvas = result.worldCanvas;
  collisionCanvas = result.collisionCanvas;
  collisionTypeMap = result.collisionTypeMap;
  getSurfaceTypeAt = result.getSurfaceTypeAt;
  startPos = result.startPos;
  obstaclePolys = result.obstaclePolys || [];
  tiles = result.tiles;
  tileSize = result.tileSize || 256;
}

export function getSurfaceParams(type) {
  switch (type) {
    case "asphalt":
      return { gripMul: 2.0, accelMul: 1.0, reverseMul: 1.0, brakeMul: 1.5 };
    case "cobblestone":
      return { gripMul: 1.5, accelMul: 0.9, reverseMul: 0.9, brakeMul: 1.4 };
    case "gravel":
      return { gripMul: 1.3, accelMul: 0.8, reverseMul: 0.8, brakeMul: 1.2 };
    case "grass":
      return { gripMul: 1.0, accelMul: 0.7, reverseMul: 0.7, brakeMul: 1.0 };
    case "dirt":
      return { gripMul: 0.8, accelMul: 0.6, reverseMul: 0.6, brakeMul: 0.9 };
    case "mud":
      return { gripMul: 0.4, accelMul: 0.3, reverseMul: 0.3, brakeMul: 0.6 };
    case "sand":
      return { gripMul: 0.6, accelMul: 0.4, reverseMul: 0.4, brakeMul: 0.7 };
    case "snow":
      return { gripMul: 0.3, accelMul: 0.4, reverseMul: 0.4, brakeMul: 0.5 };
    case "ice":
      return { gripMul: 0.2, accelMul: 0.5, reverseMul: 0.5, brakeMul: 0.3 };
    case "obstacle":
      return {
        gripMul: 0,
        accelMul: 0,
        reverseMul: 0,
        brakeMul: 0,
        isObstacle: true,
      };
    default:
      return { gripMul: 1, accelMul: 0.7, reverseMul: 0.7, brakeMul: 1 };
  }
}

// Funkcja do obsługi kolizji w trybie FVP z przesunięciem świata
export function getSurfaceTypeAtFvp(x, y) {
  // W trybie FVP świat nie ma dodatkowego przesunięcia
  // Używamy normalnej funkcji kolizji
  return getSurfaceTypeAt(x, y);
}
