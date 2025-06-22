// main.js – entry point gry (ES6 modules)
// Inicjalizacja gry, pętla główna, obsługa canvas, importy modułów
// Konfiguracja silnika znajduje się w osobnym pliku config.js

import { CONFIG } from './config.js'; // podstawowa konfiguracja silnika
import { updateCar } from './car.js';
import { getInputFromKeys, keys } from './input.js';
import { drawHUD, getCarSpeedKmh, getCarGear, getCarRpm } from './hud.js';
import { drawCar, drawWorld } from './render.js';
import { drawTrack, buildWorld, clamp, updateCamera, getSurfaceTypeAt, getSurfaceParams, worldPixelData, SURFACE_TYPES } from './world.js';
import { createCar, createCarImg, trackXY } from './car.js';

// ───────── ŚWIAT I CANVAS ─────────
// Inicjalizacja świata gry i buforów rysowania
const WORLD = CONFIG.WORLD;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const worldC = document.createElement('canvas');
const worldCtx = worldC.getContext('2d');

// ───────── AUTO ─────────
// Tworzenie instancji samochodu gracza (w przyszłości: klasy Car dla wielu aut)
const T_START = -Math.PI / 4;
const car = createCar((t) => trackXY(t, WORLD, CONFIG), T_START);
const { carImg } = createCarImg('car_X.png');
const camera = { x: 0, y: 0 };
let selectedRoad = SURFACE_TYPES.ASPHALT;

// ───────── PĘTLA GŁÓWNA ─────────
// Główna pętla gry: aktualizacja stanu, rysowanie świata, auta i HUD
let fps = 0, lastFpsUpdate = 0, frameCount = 0;
let lastTime = performance.now();
function loop(now) {
  const dt = (now - lastTime) / 16.666; // dt ~1 dla 60 FPS
  lastTime = now;
  frameCount++;
  if (now - lastFpsUpdate > 500) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    lastFpsUpdate = now;
    frameCount = 0;
  }
  // Pobierz wejście gracza
  const input = getInputFromKeys();
  // Detekcja nawierzchni pod autem
  const surfaceType = getSurfaceTypeAt(car.pos.x, car.pos.y, worldPixelData, WORLD);
  const surf = getSurfaceParams(surfaceType);
  // Aktualizacja fizyki auta
  updateCar(car, dt, surf, input, CONFIG);
  // Aktualizacja kamery
  updateCamera(car, camera, canvas, WORLD);
  // Rysowanie świata i auta
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWorld(ctx, worldC, camera);
  const imgReady = carImg.complete && carImg.naturalWidth > 0;
  if (imgReady) {
    drawCar(ctx, car, camera, carImg, imgReady);
  } else {
    // fallback: rysuj prostokąt jeśli brak obrazka auta
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.translate(
      Math.round(canvas.width / 2),
      Math.round(canvas.height / 2)
    );
    ctx.fillRect(-40, -20, 80, 40);
    ctx.restore();
  }
  // Rysowanie HUD (liczniki, prędkość, bieg)
  drawHUD(ctx, fps, car, CONFIG, keys);
  requestAnimationFrame(loop);
}

// ───────── INICJALIZACJA ─────────
// Ustawienie rozmiaru canvas i start gry
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  updateCamera(car, camera, canvas, WORLD);
}
window.addEventListener('resize', resize);
buildWorld(worldC, worldCtx, WORLD, CONFIG);
resize();

// Start gry po załadowaniu obrazka auta
if (carImg.complete && carImg.naturalWidth > 0) {
  requestAnimationFrame(loop);
} else if (carImg instanceof HTMLImageElement) {
  carImg.onload = () => {
    requestAnimationFrame(loop);
  };
} else {
  setTimeout(() => requestAnimationFrame(loop), 100);
}
