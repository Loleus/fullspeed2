// world.js – logika świata, kolizje, wektory
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

export function drawTrack(ctx, WORLD, CONFIG, strokeStyle) {
  const sx = (WORLD.width - CONFIG.ROAD_WIDTH * 2) / 2;
  const sy = (WORLD.height - CONFIG.ROAD_WIDTH * 2) / 2;
  ctx.save();
  ctx.translate(WORLD.width / 2, WORLD.height / 2);
  ctx.lineWidth = CONFIG.ROAD_WIDTH;
  ctx.lineCap = 'round';
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  for (let t = -Math.PI; t <= Math.PI; t += 0.01)
    ctx.lineTo(sx * Math.sin(t), sy * Math.sin(t) * Math.cos(t));
  ctx.stroke();
  ctx.restore();
}

export let worldPixelData = null;
export function drawTrackToWorldBuffer(worldC, worldCtx, WORLD, CONFIG) {
  worldC.width = WORLD.width;
  worldC.height = WORLD.height;
  drawTrack(worldCtx, WORLD, CONFIG, '#606060');
}
export function buildWorld(worldC, worldCtx, WORLD, CONFIG) {
  drawTrackToWorldBuffer(worldC, worldCtx, WORLD, CONFIG);
  const imgData = worldCtx.getImageData(0, 0, WORLD.width, WORLD.height);
  worldPixelData = new Uint8ClampedArray(imgData.data.buffer);
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

export const SURFACE_TYPES = {
  ASPHALT: 'asphalt',
  GRAVEL: 'gravel',
  GRASS: 'grass',
  WATER: 'water',
  WET_ASPHALT: 'wet_asphalt',
  WET_GRAVEL: 'wet_gravel',
  WET_GRASS: 'wet_grass',
};
export const SURFACE_COLOR_MAP = [
  { color: [149, 94, 55], type: SURFACE_TYPES.GRAVEL },
  { color: [61, 74, 28], type: SURFACE_TYPES.GRASS },
  { color: [60, 60, 60], type: SURFACE_TYPES.ASPHALT },
  { color: [0, 120, 255], type: SURFACE_TYPES.WATER },
  { color: [100, 100, 100], type: SURFACE_TYPES.WET_ASPHALT },
  { color: [120, 120, 80], type: SURFACE_TYPES.WET_GRAVEL },
  { color: [80, 120, 80], type: SURFACE_TYPES.WET_GRASS },
];
export const SURFACE_PARAMS = {
  [SURFACE_TYPES.ASPHALT]:     { gripMul: 2.0, accelMul: 1.0, reverseMul: 1.0, brakeMul: 1.5 },
  [SURFACE_TYPES.GRAVEL]:      { gripMul: 0.7, accelMul: 0.8, reverseMul: 0.8, brakeMul: 0.7 },
  [SURFACE_TYPES.GRASS]:       { gripMul: 0.25, accelMul: 0.3, reverseMul: 0.3, brakeMul: 0.4 },
  [SURFACE_TYPES.WATER]:       { gripMul: 0.12, accelMul: 0.3, reverseMul: 0.3, brakeMul: 0.2 },
  [SURFACE_TYPES.WET_ASPHALT]: { gripMul: 0.7, accelMul: 0.8, reverseMul: 0.8, brakeMul: 0.7 },
  [SURFACE_TYPES.WET_GRAVEL]:  { gripMul: 0.5, accelMul: 0.6, reverseMul: 0.6, brakeMul: 0.5 },
  [SURFACE_TYPES.WET_GRASS]:   { gripMul: 0.18, accelMul: 0.3, reverseMul: 0.3, brakeMul: 0.2 },
};
export function colorDist(a, b) {
  return Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs(a[2]-b[2]);
}
export function getSurfaceTypeAt(x, y, worldPixelData, WORLD) {
  const ix = Math.round(x), iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= WORLD.width || iy >= WORLD.height || !worldPixelData) return SURFACE_TYPES.GRASS;
  const idx = (iy * WORLD.width + ix) * 4;
  const rgb = [worldPixelData[idx], worldPixelData[idx+1], worldPixelData[idx+2]];
  let minDist = 999, found = SURFACE_TYPES.GRASS;
  for (const entry of SURFACE_COLOR_MAP) {
    const d = colorDist(rgb, entry.color);
    if (d < minDist) {
      minDist = d;
      found = entry.type;
    }
  }
  return found;
}
export function getSurfaceParams(type) {
  return SURFACE_PARAMS[type] || SURFACE_PARAMS[SURFACE_TYPES.GRASS];
}
