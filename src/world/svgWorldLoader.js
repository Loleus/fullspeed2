// svgWorldLoader.js – ładowanie, rasteryzacja i mapa kolizji świata z SVG
// Użycie: import { loadSVGWorld } from './svgWorldLoader.js';
// await loadSVGWorld('SCENE_2.svg', 1024, 4096)

import { initTiles } from './tiles.js';

export async function loadSVGWorld(svgUrl, collisionMapSize, worldSize) {
  try {
    // Stałe rozmiary (potęgi dwójki)
    const svgSize = 128; // Rozmiar SVG (viewBox 0 0 128 128)
    
    // Prekalkulowane wartości dla wydajności
    const svgSizeInv = 1 / svgSize; // zamiast dzielenia przez svgSize
    const worldSizeScale = worldSize * svgSizeInv; // prekalkulowane skalowanie
    const collisionMapScale = collisionMapSize / worldSize; // prekalkulowane skalowanie do collisionMap
    const collisionMapScaleInv = 1 / collisionMapScale; // odwrotność dla getSurfaceTypeAt
    
    // 1. Pobierz SVG jako tekst
    console.log('Ładowanie SVG z:', svgUrl);
    const response = await fetch(svgUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const svgText = await response.text();
    console.log('SVG załadowane, długość:', svgText.length);
    
    // 2. Stwórz element SVG w DOM (niewidoczny)
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');

    // Sprawdź błędy parsowania
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('Błąd parsowania SVG:', parserError.textContent);
      throw new Error('Błąd parsowania SVG: ' + parserError.textContent);
    }
    
    const svgElem = doc.documentElement;
    if (!svgElem || svgElem.tagName !== 'svg') {
      throw new Error('Nieprawidłowy plik SVG');
    }
    
    // Usuń całkowicie warstwę tła (BACKGROUND) z SVG przed rasteryzacją
    const bgElem = svgElem.querySelector('[id^="BACKGROUND"]');
    if (bgElem) {
      bgElem.parentNode.removeChild(bgElem);
    }

    // Dodaj przezroczysty prostokąt na samym początku SVG, by wymusić przezroczyste tło
    const svgNS = 'http://www.w3.org/2000/svg';
    const transparentRect = doc.createElementNS(svgNS, 'rect');
    transparentRect.setAttribute('x', '0');
    transparentRect.setAttribute('y', '0');
    transparentRect.setAttribute('width', svgSize);
    transparentRect.setAttribute('height', svgSize);
    transparentRect.setAttribute('fill', 'white');
    transparentRect.setAttribute('fill-opacity', '0');
    svgElem.insertBefore(transparentRect, svgElem.firstChild);
    
    console.log('SVG sparsowane pomyślnie');

    // 3. Rasteryzacja do collisionMapSize (np. 1024x1024) – mapa kolizji
    const collisionCanvas = document.createElement('canvas');
    collisionCanvas.width = collisionMapSize;
    collisionCanvas.height = collisionMapSize;
    const collisionCtx = collisionCanvas.getContext('2d');
    // Skopiuj SVG do <img> i narysuj na canvasie
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    await new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        collisionCtx.clearRect(0, 0, collisionCanvas.width, collisionCanvas.height); // przezroczyste tło
        collisionCtx.drawImage(img, 0, 0, collisionMapSize, collisionMapSize);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.src = url;
    });

    // 4. Rasteryzacja do worldSize (np. 4096x4096) – grafika świata
    const worldCanvas = document.createElement('canvas');
    worldCanvas.width = worldSize;
    worldCanvas.height = worldSize;
    const worldCtx = worldCanvas.getContext('2d');

    // Najpierw rasteryzuj teksturę trawy na całym worldCanvas (kafelkowanie grass.png)
    await new Promise((resolve) => {
      const grassImg = new window.Image();
      grassImg.onload = () => {
        for (let x = 0; x < worldSize; x += 512) {
          for (let y = 0; y < worldSize; y += 512) {
            worldCtx.drawImage(grassImg, x, y, 512, 512);
          }
        }
        resolve();
      };
      grassImg.src = 'assets/images/grass.png';
    });

    // Następnie rasteryzuj SVG na worldCanvas
    await new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        // NIE czyść worldCanvas! Chcemy mieć trawę pod spodem
        worldCtx.drawImage(img, 0, 0, worldSize, worldSize);
        resolve();
      };
      img.src = url;
    });

    // Podział worldCanvas na kafelki
    const tileSize = 256;
    initTiles(worldCanvas, tileSize, worldSize);

    // 5. Generowanie mapy kolizji na podstawie id warstw/obiektów
    // Tworzymy mapę typów: collisionTypeMap[ix + iy * collisionMapSize] = 'asphalt' | 'grass' | 'obstacle'
    const collisionTypeMap = new Array(collisionMapSize * collisionMapSize).fill('grass');

    // Przechodzimy po elementach SVG i rysujemy je na collisionCanvas z unikalnym kolorem dla każdego typu
    // 1. Najpierw tło (background)
    // const bg = svgElem.querySelector('[id^="BACKGROUND_"]');
    // if (bg) { ... }
    // 2. Droga (ROAD_*)

    const road = svgElem.querySelector('[id^="ROAD_"]');
    if (road) {
      // Rysuj na collisionCanvas z innym kolorem
      const roadSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${collisionMapSize}' height='${collisionMapSize}' viewBox='0 0 ${svgSize} ${svgSize}'>${road.outerHTML}</svg>`;
      const roadImg = new window.Image();
      await new Promise((resolve) => {
        roadImg.onload = () => {
          collisionCtx.globalCompositeOperation = 'source-over';
          collisionCtx.drawImage(roadImg, 0, 0, collisionMapSize, collisionMapSize);
          resolve();
        };
        const blob = new Blob([roadSvg], { type: 'image/svg+xml' });
        roadImg.src = URL.createObjectURL(blob);
      });
      // Oznacz piksele drogi jako 'asphalt'
      const imgData = collisionCtx.getImageData(0, 0, collisionMapSize, collisionMapSize);
      for (let i = 0; i < imgData.data.length; i += 4) {
        // Zoptymalizowane: mnożenie zamiast dzielenia przez 4
        const pixelIndex = i * 0.25; // zamiast i / 4
        // Jeśli piksel nie jest tłem (#010101), to droga
        if (!(imgData.data[i] === 1 && imgData.data[i+1] === 1 && imgData.data[i+2] === 1)) {
          collisionTypeMap[pixelIndex] = 'asphalt';
        }
      }
    }
    // 3. Przeszkoda (obstacle)
    const obs = svgElem.querySelector('#obstacle, #OBSTACLE, [id^="obstacle"], [id^="OBSTACLE"]');
    if (obs) {
      const obsSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${collisionMapSize}' height='${collisionMapSize}' viewBox='0 0 ${svgSize} ${svgSize}'>${obs.outerHTML}</svg>`;
      const obsImg = new window.Image();
      await new Promise((resolve) => {
        obsImg.onload = () => {
          collisionCtx.globalCompositeOperation = 'source-over';
          collisionCtx.drawImage(obsImg, 0, 0, collisionMapSize, collisionMapSize);
          resolve();
        };
        const blob = new Blob([obsSvg], { type: 'image/svg+xml' });
        obsImg.src = URL.createObjectURL(blob);
      });
      // Oznacz piksele przeszkody jako 'obstacle'
      const imgData = collisionCtx.getImageData(0, 0, collisionMapSize, collisionMapSize);
      for (let i = 0; i < imgData.data.length; i += 4) {
        // Zoptymalizowane: mnożenie zamiast dzielenia przez 4
        const pixelIndex = i * 0.25; // zamiast i / 4
        if (imgData.data[i] === 255 && imgData.data[i+1] === 255 && imgData.data[i+2] === 255) {
          collisionTypeMap[pixelIndex] = 'obstacle';
        }
      }
    }

    // 7. Pozycja startowa z SVG (id='START' lub 'start')
    let startPos = { x: 50, y: 50 };
    const startElem = svgElem.querySelector('#START, #start');
    if (startElem) {
      // Obsługa <circle> i <rect> (najczęstsze przypadki)
      if (startElem.tagName === 'circle') {
        const cx = parseFloat(startElem.getAttribute('cx'));
        const cy = parseFloat(startElem.getAttribute('cy'));
        if (!isNaN(cx) && !isNaN(cy)) {
          // Zoptymalizowane: prekalkulowane skalowanie
          startPos = { x: cx * worldSizeScale, y: cy * worldSizeScale };
        }
      } else if (startElem.tagName === 'rect') {
        const x = parseFloat(startElem.getAttribute('x'));
        const y = parseFloat(startElem.getAttribute('y'));
        if (!isNaN(x) && !isNaN(y)) {
          // Zoptymalizowane: prekalkulowane skalowanie
          startPos = { x: x * worldSizeScale, y: y * worldSizeScale };
        }
      } else if (startElem.hasAttribute('transform')) {
        // Próba wyciągnięcia translate z transform
        const tr = startElem.getAttribute('transform');
        const match = /translate\(([-\d.]+)[ ,]+([\-\d.]+)\)/.exec(tr);
        if (match) {
          // Zoptymalizowane: prekalkulowane skalowanie
          startPos = { x: parseFloat(match[1]) * worldSizeScale, y: parseFloat(match[2]) * worldSizeScale };
        }
      }
    }

    // 7b. Zbierz obrysy przeszkód jako tablice punktów (polygony w worldSize)
    function pathToPoly(pathElem) {
      // Użyj Path2D i getPointAtLength do rasteryzacji na punkty
      const d = pathElem.getAttribute('d');
      if (!d) return null;
      const path = new Path2D(d);
      const len = pathElem.getTotalLength ? pathElem.getTotalLength() : 0;
      const points = [];
      // Zoptymalizowane: prekalkulowane kroki
      const steps = Math.max(8, Math.floor(len * 0.25)); // zamiast len / 4
      for (let i = 0; i <= steps; ++i) {
        const l = len * i / steps;
        let pt;
        if (pathElem.getPointAtLength) {
          pt = pathElem.getPointAtLength(l);
        } else {
          // fallback: niech będzie pusta tablica
          pt = null;
        }
        if (pt) {
          // Zoptymalizowane: prekalkulowane skalowanie
          points.push({ x: pt.x * worldSizeScale, y: pt.y * worldSizeScale });
        }
      }
      return points.length > 2 ? points : null;
    }
    const obstaclePolys = [];
    svgElem.querySelectorAll('path[id^="OBSTACKLE"], path[id^="OBSTACLE"], path#OBSTACLE, path#OBSTACKLE').forEach(pathElem => {
      const poly = pathToPoly(pathElem);
      if (poly) obstaclePolys.push(poly);
    });

    // 8. Zwróć obiekty i API
    return {
      collisionCanvas,
      worldCanvas,
      getSurfaceTypeAt: (x, y) => {
        // x, y w skali świata (0..worldSize)
        // Zoptymalizowane: prekalkulowane skalowanie
        const ix = Math.floor(x * collisionMapScale);
        const iy = Math.floor(y * collisionMapScale);
        if (ix < 0 || iy < 0 || ix >= collisionMapSize || iy >= collisionMapSize) return 'grass';
        return collisionTypeMap[ix + iy * collisionMapSize];
      },
      startPos,
      obstaclePolys
    };
  } catch (error) {
    console.error('Błąd podczas ładowania SVG:', error);
    throw error;
  }
}

// Pomocnicza funkcja do ładowania obrazków asynchronicznie
async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
