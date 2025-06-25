// main.js – entry point gry (ES6 modules)
// Inicjalizacja gry, pętla główna, obsługa canvas, importy modułów
// Konfiguracja silnika znajduje się w osobnym pliku config.js

import { CONFIG } from './config/gameConfig.js';
import { updateCar, createCarWithPosition } from './entities/car/car.js';
import { getInputFromKeys, keys } from './input/input.js';
import { drawHUD } from './render/hud.js';
import { renderFrame } from './render/render.js';
import { initWorldFromSVG, getSurfaceTypeAt, updateCamera, getSurfaceParams, startPos, tiles } from './world/world.js';
import { handleObstacleCollisionWithPolygon } from './entities/obstacles/obstacles.js';
import { GameLoop } from './core/gameLoop.js';
import { createCarImage } from './entities/car/carRenderer.js';

// ───────── ŚWIAT I CANVAS ─────────
const WORLD = CONFIG.WORLD;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ───────── AUTO ─────────
let car = null;
let carImg = null;
const camera = { x: 0, y: 0 };

// ───────── PĘTLA GRY ─────────
const gameLoop = new GameLoop();

// ───────── INICJALIZACJA ─────────
async function startGame() {
  await initWorldFromSVG('../assets/scenes/SCENE_1.svg', 1000, 4000);
  const pos = (startPos && startPos.x !== undefined && startPos.y !== undefined) ? startPos : { x: 50, y: 50 };
  car = createCarWithPosition(pos);
  carImg = createCarImage('../assets/images/car_X.png');
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
function loop(now) {
  const dt = gameLoop.getDeltaTime(now);
  gameLoop.updateFPS(now);
  
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
  renderFrame(ctx, tiles, camera, car, carImg, gameLoop.getFPS(), keys, CONFIG);
  drawHUD(ctx, gameLoop.getFPS(), car, CONFIG, keys);
  
  requestAnimationFrame(loop);
}
