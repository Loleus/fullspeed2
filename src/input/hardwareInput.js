// hardwareInput.js – obsługa eventów sprzętowych (klawiatura, tryb kamery)
import { registerKey, unregisterKey } from './gameInput.js';

export const keys = {};
export let cameraMode = 'classic';

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  
  // Przełączanie trybu kamery
  if (e.key === 'v' || e.key === 'V') {
    cameraMode = cameraMode === 'classic' ? 'fvp' : 'classic';
    return;
  }
  
  // Zarejestruj klawisz w systemie gry
  registerKey(e.key);
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
  
  // Wyrejestruj klawisz z systemu gry
  unregisterKey(e.key);
}); 