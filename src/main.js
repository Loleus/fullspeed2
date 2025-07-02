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

// --- EKRAN STARTOWY ---
let showMenuScreen = true;
let showLoadingScreen = false;
let buttonRect = null;
let isMenuRunning = false;

function drawArrowIcon(ctx, x, y, dir, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (dir === 'up') {
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x, y - 10);
    ctx.moveTo(x - 7, y - 3);
    ctx.lineTo(x, y - 10);
    ctx.lineTo(x + 7, y - 3);
  } else if (dir === 'down') {
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 10);
    ctx.moveTo(x - 7, y + 3);
    ctx.lineTo(x, y + 10);
    ctx.lineTo(x + 7, y + 3);
  } else if (dir === 'left') {
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x - 10, y);
    ctx.moveTo(x - 3, y - 7);
    ctx.lineTo(x - 10, y);
    ctx.lineTo(x - 3, y + 7);
  } else if (dir === 'right') {
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x + 3, y - 7);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x + 3, y + 7);
  }
  ctx.stroke();
  ctx.restore();
}

function drawMenuScreen() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#23272b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e0e0e0';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FULL SPEED 2', canvas.width / 2, canvas.height / 2 - 90);

  // Przycisk START/Loading
  const btnW = 260, btnH = 70;
  const btnX = canvas.width / 2 - btnW / 2;
  const btnY = canvas.height / 2 - btnH / 2;
  buttonRect = { x: btnX, y: btnY, w: btnW, h: btnH };
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#bfc3c7';
  ctx.fillStyle = showLoadingScreen ? '#bfc3c7' : '#23272b';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 18);
  ctx.fill();
  ctx.stroke();
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = showLoadingScreen ? '#23272b' : '#e0e0e0';
  ctx.fillText(showLoadingScreen ? 'Loading...' : 'START', canvas.width / 2, canvas.height / 2);

  // Info o sterowaniu
  ctx.font = '22px Arial';
  ctx.fillStyle = '#bfc3c7';
  const infoY = btnY + btnH + 55;
  ctx.fillText('Sterowanie:', canvas.width / 2, infoY);

  // Strzałki i WSAD w dwóch liniach, idealnie pod sobą
  const centerX = canvas.width / 2;
  const arrowsY = infoY + 45;
  const wsadY = arrowsY + 45;
  const arrowSpacing = 70;
  // Strzałki: lewo, góra, dół, prawo
  drawArrowIcon(ctx, centerX - arrowSpacing, arrowsY, 'left', '#bfc3c7');
  drawArrowIcon(ctx, centerX, arrowsY, 'up', '#bfc3c7');
  drawArrowIcon(ctx, centerX, arrowsY, 'down', '#bfc3c7');
  drawArrowIcon(ctx, centerX + arrowSpacing, arrowsY, 'right', '#bfc3c7');
  // Litery WSAD pod strzałkami
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#e0e0e0';
  ctx.fillText('A', centerX - arrowSpacing, wsadY);
  ctx.fillText('W', centerX, wsadY);
  ctx.fillText('S', centerX, wsadY + 35); // S pod strzałką w dół
  ctx.fillText('D', centerX + arrowSpacing, wsadY);
  ctx.restore();
}

function drawLoadingScreen() {
  drawMenuScreen(); // identyczny ekran, tylko napis w przycisku się zmienia
}

function menuLoop() {
  if (!isMenuRunning) {
    console.log('🛑 Pętla menu zatrzymana - isMenuRunning = false');
    return;
  }
  
  if (showMenuScreen || showLoadingScreen) {
    drawMenuScreen();
    requestAnimationFrame(menuLoop);
  } else {
    console.log('🔄 Zatrzymuję pętlę menu - gra się rozpoczęła');
    isMenuRunning = false;
  }
}

// Handler kliknięcia do menu
function menuClickHandler(e) {
  if (showMenuScreen && buttonRect) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (
      mx >= buttonRect.x && mx <= buttonRect.x + buttonRect.w &&
      my >= buttonRect.y && my <= buttonRect.y + buttonRect.h
    ) {
      console.log('🎮 Kliknięto START - rozpoczynam grę');
      showMenuScreen = false;
      showLoadingScreen = true;
      isMenuRunning = true;
      menuLoop();
      startGame();
    }
  } else if (!showMenuScreen && !showLoadingScreen) {
    console.log('⚠️ Kliknięcie ignorowane - gra już działa');
  }
}

canvas.addEventListener('click', menuClickHandler);

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  if (showMenuScreen) {
    drawMenuScreen();
  } else if (car) {
    updateCamera(car, camera, canvas, worldSize);
  }
}
window.addEventListener('resize', resize);

// ───────── INICJALIZACJA ─────────
async function startGame() {
  try {
    await initWorldFromSVG('./assets/scenes/SCENE_3.svg', 1024, worldSize);
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
    showLoadingScreen = false;
    isMenuRunning = false; // Zatrzymaj pętlę menu
    console.log('✅ Gra załadowana - pętla menu zatrzymana, rozpoczynam pętlę gry');
    canvas.removeEventListener('click', menuClickHandler);
    console.log('🧹 Listener na kliknięcie menu został usunięty');
    requestAnimationFrame(loop);
  } catch (error) {
    console.error('Błąd podczas inicjalizacji gry:', error);
    // Wyświetl błąd na ekranie
    ctx.fillStyle = 'red';
    ctx.font = '20px Arial';
    ctx.fillText('Błąd ładowania: ' + error.message, 10, 50);
  }
}

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

// --- Zamiast startGame() na starcie ---
resize();
drawMenuScreen();
isMenuRunning = true;
console.log('🏠 Ekran menu uruchomiony - pętla menu aktywna');
menuLoop();
