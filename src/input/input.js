// input.js – obsługa wejścia lokalnego i sieciowego
export const keys = {};
export let cameraMode = 'classic'; // 'classic' lub 'fvp'

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.key === 'v' || e.key === 'V') {
    cameraMode = cameraMode === 'classic' ? 'fvp' : 'classic';
  }
});
window.addEventListener('keyup', (e) => (keys[e.key] = false));

export function getInputFromKeys() {
  return {
    up: keys.ArrowUp,
    down: keys.ArrowDown,
    left: keys.ArrowLeft,
    right: keys.ArrowRight
  };
}
