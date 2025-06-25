// gameLoop.js – logika pętli gry, FPS, timing

export class GameLoop {
  constructor() {
    this.fps = 0;
    this.lastFpsUpdate = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
  }

  updateFPS(now) {
    this.frameCount++;
    if (now - this.lastFpsUpdate > 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.lastFpsUpdate = now;
      this.frameCount = 0;
    }
  }

  getDeltaTime(now) {
    let dt = (now - this.lastTime) / 16.666;
    dt = Math.min(dt, 1.5); // clamp dt, by ograniczyć duże przeskoki
    this.lastTime = now;
    return dt;
  }

  getFPS() {
    return this.fps;
  }
} 