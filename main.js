// main.js – entry point gry (ES6 modules)
// Inicjalizacja gry, pętla główna, obsługa canvas, importy modułów
// Konfiguracja silnika znajduje się w osobnym pliku config.js

import { CONFIG } from './config.js';
import { updateCar, createCarWithPosition, createCarImg } from './car.js';
import { getInputFromKeys, keys } from './input.js';
import { drawHUD } from './hud.js';
import { renderFrame } from './render.js';
import { initWorldFromSVG, getSurfaceTypeAt, updateCamera, getSurfaceParams, startPos, tiles } from './world.js';
import { handleObstacleCollisionWithPolygon } from './obstacles.js';

// ───────── ŚWIAT I CANVAS ─────────
const WORLD = CONFIG.WORLD;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ───────── AUTO ─────────
let car = null;
let carImg = null;
const camera = { x: 0, y: 0 };

// ───────── INICJALIZACJA ─────────
async function startGame() {
  await initWorldFromSVG('SCENE_1.svg', 1000, 4000);
  const pos = (startPos && startPos.x !== undefined && startPos.y !== undefined) ? startPos : { x: 50, y: 50 };
  car = createCarWithPosition(pos);
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
  let dt = (now - lastTime) / 16.666;
  dt = Math.min(dt, 1.5); // clamp dt, by ograniczyć duże przeskoki
  lastTime = now;
  frameCount++;
  if (now - lastFpsUpdate > 500) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    lastFpsUpdate = now;
    frameCount = 0;
  }
  
  const input = getInputFromKeys();
  
  // Aktualizuj typ powierzchni
  const newSurfaceType = getSurfaceTypeAt(car.pos.x, car.pos.y);
  if (car.surfaceType !== newSurfaceType) {
    car.surfaceType = newSurfaceType;
    car.surf = getSurfaceParams(newSurfaceType);
  }

  // Kolizja z przeszkodą: wypychanie i ślizganie
  handleObstacleCollisionWithPolygon(car, CONFIG);

  updateCar(car, dt, car.surf, input, CONFIG);
  updateCamera(car, camera, canvas, WORLD);
  
  // Renderowanie
  renderFrame(ctx, tiles, camera, car, carImg, fps, keys, CONFIG);
  drawHUD(ctx, fps, car, CONFIG, keys);
  
  requestAnimationFrame(loop);
}
