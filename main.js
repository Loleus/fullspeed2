// main.js – entry point gry (ES6 modules)
// Inicjalizacja gry, pętla główna, obsługa canvas, importy modułów
// Konfiguracja silnika znajduje się w osobnym pliku config.js

import { CONFIG } from './config.js';
import { updateCar } from './car.js';
import { getInputFromKeys, keys } from './input.js';
import { drawHUD } from './hud.js';
import { drawCar, drawWorld } from './render.js';
import { initWorldFromSVG, getSurfaceTypeAt, worldCanvas, updateCamera, getSurfaceParams, startPos, obstaclePolys } from './world.js';
import { createCarImg } from './car.js';
import { checkCarObstacleCollision } from './obstacles.js';

// ───────── ŚWIAT I CANVAS ─────────
const WORLD = CONFIG.WORLD;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ───────── AUTO ─────────
let car = null;
let carImg = null;
const camera = { x: 0, y: 0 };
let surfaceType = 'grass';
let surf = null;

// ───────── INICJALIZACJA ─────────
async function startGame() {
  await initWorldFromSVG('SCENE_1.svg', 1000, 4000);
  const pos = (startPos && startPos.x !== undefined && startPos.y !== undefined) ? startPos : { x: 50, y: 50 };
  car = {
    pos: { ...pos },
    vel: { x: 0, y: 0 },
    angle: Math.PI / 4,
    steering: 0,
    length: 180,
    width: 80,
    throttle: 0
  };
  carImg = createCarImg('car_X.png').carImg;
  resize();
  requestAnimationFrame(loop);
}

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  if (car) updateCamera(car, camera, canvas, WORLD);
}
window.addEventListener('resize', resize);

startGame();

// ───────── PĘTLA GŁÓWNA ─────────
let fps = 0, lastFpsUpdate = 0, frameCount = 0;
let lastTime = performance.now();
function loop(now) {
  const dt = (now - lastTime) / 16.666;
  lastTime = now;
  frameCount++;
  if (now - lastFpsUpdate > 500) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    lastFpsUpdate = now;
    frameCount = 0;
  }
  const input = getInputFromKeys();
  surfaceType = getSurfaceTypeAt(car.pos.x, car.pos.y);
  surf = getSurfaceParams(surfaceType);

  // Kolizja z przeszkodą: wypychanie i ślizganie
  const obstacleResult = checkCarObstacleCollision(car);
  if (obstacleResult.collided) {
    const poly = obstacleResult.index !== undefined ? obstaclePolys[obstacleResult.index] : null;
    if (poly) {
      let minDist = Infinity, closest = null;
      for (let i = 0; i < poly.length; ++i) {
        const p = poly[i];
        const dx = car.pos.x - p.x, dy = car.pos.y - p.y;
        const dist = dx*dx + dy*dy;
        if (dist < minDist) { minDist = dist; closest = p; }
      }
      let normal = { x: car.pos.x - closest.x, y: car.pos.y - closest.y };
      let len = Math.hypot(normal.x, normal.y);
      if (len > 0) { normal.x /= len; normal.y /= len; }
      let pushSteps = 0;
      while (checkCarObstacleCollision(car, [poly]).collided && pushSteps < 10) {
        car.pos.x += normal.x;
        car.pos.y += normal.y;
        pushSteps++;
      }
      const vDotN = car.vel.x * normal.x + car.vel.y * normal.y;
      const tangent = { x: car.vel.x - vDotN * normal.x, y: car.vel.y - vDotN * normal.y };
      const vNormal = { x: -vDotN * normal.x * CONFIG.WALL_BOUNCE, y: -vDotN * normal.y * CONFIG.WALL_BOUNCE };
      car.vel.x = tangent.x + vNormal.x;
      car.vel.y = tangent.y + vNormal.y;
    } else {
      car.vel.x = 0;
      car.vel.y = 0;
    }
    surfaceType = 'obstacle';
    surf = getSurfaceParams(surfaceType);
  }

  updateCar(car, dt, surf, input, CONFIG);
  updateCamera(car, camera, canvas, WORLD);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (worldCanvas) ctx.drawImage(worldCanvas, -camera.x + canvas.width/2, -camera.y + canvas.height/2);
  const imgReady = carImg && carImg.complete && carImg.naturalWidth > 0;
  if (imgReady) {
    drawCar(ctx, car, camera, carImg, imgReady);
  } else {
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.translate(
      Math.round(canvas.width / 2),
      Math.round(canvas.height / 2)
    );
    ctx.fillRect(-40, -20, 80, 40);
    ctx.restore();
  }
  drawHUD(ctx, fps, car, CONFIG, keys);
  requestAnimationFrame(loop);
}
