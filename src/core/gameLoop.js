// gameLoop.js – logika pętli gry, FPS, timing

// Prekalkulowane stałe dla wydajności
const FRAME_TIME_INV = 1 / 16.666; // zamiast dzielenia przez 16.666
const FPS_UPDATE_INTERVAL = 500; // 500ms = 0.5s
const FPS_MULTIPLIER = 1000; // dla obliczania FPS

export class GameLoop {
  constructor() {
    this.fps = 0;
    this.lastFpsUpdate = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
  }

  updateFPS(now) {
    this.frameCount++;
    if (now - this.lastFpsUpdate > FPS_UPDATE_INTERVAL) {
      // Zoptymalizowane: mnożenie zamiast dzielenia
      const timeDiff = now - this.lastFpsUpdate;
      this.fps = Math.round((this.frameCount * FPS_MULTIPLIER) * (1 / timeDiff));
      this.lastFpsUpdate = now;
      this.frameCount = 0;
    }
  }

  getDeltaTime(now) {
    // Zoptymalizowane: mnożenie zamiast dzielenia przez 16.666
    let dt = (now - this.lastTime) * FRAME_TIME_INV;
    dt = Math.min(dt, 1.5); // clamp dt, by ograniczyć duże przeskoki
    this.lastTime = now;
    return dt;
  }

  getFPS() {
    return this.fps;
  }
} 