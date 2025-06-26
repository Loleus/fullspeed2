// gameInput.js – logika wejścia gry (mapowanie hardware na akcje gry)
import { keys, cameraMode } from './hardwareInput.js';

export function getInputFromKeys() {
  return {
    up: keys.ArrowUp,
    down: keys.ArrowDown,
    left: keys.ArrowLeft,
    right: keys.ArrowRight
  };
}

export function getCameraMode() {
  return cameraMode;
} 