// gameInput.js – logika wejścia gry (mapowanie hardware na akcje gry)
import { keys, cameraMode } from './hardwareInput.js';

// Mapowanie klawiszy na akcje (pierwszy klawisz ma priorytet)
const keyMappings = {
  // Kierunki - pierwszy klawisz ma priorytet
  up: ['ArrowUp', 'KeyW', 'w', 'W'],
  down: ['ArrowDown', 'KeyS', 's', 'S'], 
  left: ['ArrowLeft', 'KeyA', 'a', 'A'],
  right: ['ArrowRight', 'KeyD', 'd', 'D']
};

// Śledzenie aktywnych klawiszy dla każdej akcji
const activeKeys = {
  up: null,    // null = brak, string = aktywny klawisz
  down: null,
  left: null,
  right: null
};

// Funkcja do sprawdzania czy klawisz jest aktywny dla danej akcji
function isKeyActive(action) {
  if (!activeKeys[action]) return false;
  return keys[activeKeys[action]] === true;
}

// Funkcja do dodawania nowego klawisza do akcji
function addKeyToAction(key, action) {
  // Jeśli akcja już ma aktywny klawisz, ignoruj nowy
  if (activeKeys[action]) return;
  
  // Sprawdź czy klawisz jest w mapowaniu dla tej akcji
  if (keyMappings[action].includes(key)) {
    activeKeys[action] = key;
  }
}

// Funkcja do usuwania klawisza z akcji
function removeKeyFromAction(key) {
  // Znajdź akcję dla tego klawisza
  for (const [action, keyList] of Object.entries(keyMappings)) {
    if (keyList.includes(key) && activeKeys[action] === key) {
      activeKeys[action] = null;
      break;
    }
  }
}

// Eksport funkcji do zarządzania klawiszami
export function registerKey(key) {
  for (const action of Object.keys(keyMappings)) {
    addKeyToAction(key, action);
  }
}

export function unregisterKey(key) {
  removeKeyFromAction(key);
}

export function getInputFromKeys() {
  return {
    up: isKeyActive('up'),
    down: isKeyActive('down'),
    left: isKeyActive('left'),
    right: isKeyActive('right')
  };
}

export function getCameraMode() {
  return cameraMode;
} 