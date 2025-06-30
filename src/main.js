// main.js – entry point gry (ES6 modules)
// Inicjalizacja gry, pętla główna, obsługa canvas, importy modułów
// Konfiguracja silnika znajduje się w osobnym pliku config.js

import { CONFIG } from './config/gameConfig.js';
import { updateCar, createCarWithPosition, setCarGear } from './entities/car/car.js';
import { getInputFromKeys, getCameraMode } from './input/gameInput.js';
import { drawHUD } from './render/hud.js';
import { renderFrame } from './render/render.js';
import { initWorldFromSVG, getSurfaceTypeAt, getSurfaceTypeAtFvp, getSurfaceParams, startPos, tiles } from './world/world.js';
import { updateCamera } from './render/cameraClassic.js';
import { handleObstacleCollisionWithPolygon } from './entities/obstacles/obstacles.js';
import { GameLoop } from './core/gameLoop.js';
import { createCarImage } from './entities/car/carRenderer.js';
import { fvpCamera } from './render/cameraFvp.js';

// ───────── ŚWIAT I CANVAS ─────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const worldSize = CONFIG.WORLD.width;
// ───────── AUTO ─────────
let car = null;
let carImg = null;
const camera = { x: 0, y: 0 };
let lastUpPressed = false;
let lastDownPressed = false;

// ───────── PĘTLA GRY ─────────
const gameLoop = new GameLoop();

// ───────── INICJALIZACJA ─────────
async function startGame() {
  try {
    await initWorldFromSVG('./assets/scenes/SCENE_1.svg', 1024, worldSize);
    const pos = (startPos && startPos.x !== undefined && startPos.y !== undefined) ? startPos : { x: 50, y: 50 };
    
    car = createCarWithPosition(pos);
    car.surfaceType = getSurfaceTypeAt(car.pos.x, car.pos.y);
    car.surf = getSurfaceParams(car.surfaceType);
    carImg = await createCarImage('./assets/images/car_X.png');
    
    // Inicjalizuj kamerę na pozycji auta
    camera.x = car.pos.x;
    camera.y = car.pos.y;
    
    // Inicjalizacja kamery FVP
    fvpCamera.x = car.pos.x;
    fvpCamera.y = car.pos.y;
    fvpCamera.angle = car.angle + Math.PI * 0.5; // Inicjalizuj z kątem samochodu + 90°
    
    resize();
    requestAnimationFrame(loop);
  } catch (error) {
    console.error('Błąd podczas inicjalizacji gry:', error);
    // Wyświetl błąd na ekranie
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.font = '20px Arial';
    ctx.fillText('Błąd ładowania: ' + error.message, 10, 50);
  }
}

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  if (car) updateCamera(car, camera, canvas, worldSize);
}
window.addEventListener('resize', resize);

startGame();

// ───────── PĘTLA GŁÓWNA ─────────
function loop(now) {
  const dt = gameLoop.getDeltaTime(now);
  gameLoop.updateFPS(now);
  
  const input = getInputFromKeys();
  
  // Aktualizuj typ powierzchni
  const surfaceTypeFunction = getCameraMode() === 'fvp' ? getSurfaceTypeAtFvp : getSurfaceTypeAt;
  const newSurfaceType = surfaceTypeFunction(car.pos.x, car.pos.y);
  if (car.surfaceType !== newSurfaceType) {
    car.surfaceType = newSurfaceType;
    car.surf = getSurfaceParams(newSurfaceType);
  }

  // Edge detection przy zmianie biegu
  const speed = Math.hypot(car.vel.x, car.vel.y);
  const speedKmh = speed * 4.0; // konwersja jak w HUD
  if (speedKmh < 10) {
    if (input.up && !input.down) setCarGear(car, 'D');
    else if (input.down && !input.up) setCarGear(car, 'R');
    else if (!input.up && !input.down) setCarGear(car, 0);
  }
  lastUpPressed = input.up;
  lastDownPressed = input.down;

  // Kolizja z przeszkodą: wypychanie i ślizganie
  handleObstacleCollisionWithPolygon(car, CONFIG);

  updateCar(car, dt, car.surf, input, CONFIG, worldSize);
  // Aktualizuj prędkość auta do FVP
  car.speed = Math.hypot(car.vel.x, car.vel.y);
  updateCamera(car, camera, canvas, worldSize);
  
  // Renderowanie
  renderFrame(ctx, camera, car, carImg, gameLoop.getFPS(), input, CONFIG);
  drawHUD(ctx, gameLoop.getFPS(), car, CONFIG, input);
  
  requestAnimationFrame(loop);
}
