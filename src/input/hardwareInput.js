// hardwareInput.js – obsługa eventów sprzętowych (klawiatura, tryb kamery)

export const keys = {};
export let cameraMode = 'classic';

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.key === 'v' || e.key === 'V') {
    cameraMode = cameraMode === 'classic' ? 'fvp' : 'classic';
  }
});
window.addEventListener('keyup', (e) => (keys[e.key] = false)); 