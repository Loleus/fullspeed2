// input.js – obsługa wejścia lokalnego i sieciowego
export const keys = {};
window.addEventListener('keydown', (e) => (keys[e.key] = true));
window.addEventListener('keyup', (e) => (keys[e.key] = false));

export function getInputFromKeys() {
  return {
    up: keys.ArrowUp,
    down: keys.ArrowDown,
    left: keys.ArrowLeft,
    right: keys.ArrowRight
  };
}
