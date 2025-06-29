// svgWorldLoader.js – ładowanie, rasteryzacja i mapa kolizji świata z SVG
// Użycie: import { loadSVGWorld } from './svgWorldLoader.js';
// await loadSVGWorld('SCENE_2.svg', 1024, 6144)

import { initTiles } from './tiles.js';

// Funkcja pomocnicza do skalowania ścieżek SVG
function scaleSvgPath(svgPath, worldSizeScale) {
  return svgPath.replace(/([0-9.]+)/g, (match) => {
    return parseFloat(match) * worldSizeScale;
  });
}

// Funkcja pomocnicza do obsługi pozycji startowej
function getStartPosition(startElem, worldSizeScale) {
  if (!startElem) return { x: 50, y: 50 };
  
  if (startElem.tagName === 'circle') {
    const cx = parseFloat(startElem.getAttribute('cx'));
    const cy = parseFloat(startElem.getAttribute('cy'));
    if (!isNaN(cx) && !isNaN(cy)) {
      return { x: cx * worldSizeScale, y: cy * worldSizeScale };
    }
  } else if (startElem.tagName === 'rect') {
    const x = parseFloat(startElem.getAttribute('x'));
    const y = parseFloat(startElem.getAttribute('y'));
    if (!isNaN(x) && !isNaN(y)) {
      return { x: x * worldSizeScale, y: y * worldSizeScale };
    }
  } else if (startElem.hasAttribute('transform')) {
    const tr = startElem.getAttribute('transform');
    const match = /translate\(([-\d.]+)[ ,]+([\-\d.]+)\)/.exec(tr);
    if (match) {
      return { x: parseFloat(match[1]) * worldSizeScale, y: parseFloat(match[2]) * worldSizeScale };
    }
  }
  return { x: 50, y: 50 };
}

export async function loadSVGWorld(svgUrl, collisionMapSize, worldSize) {
  try {
    // Stałe rozmiary (potęgi dwójki)
    const svgSize = 1024; // Rozmiar SVG (viewBox 0 0 1024 1024)
    
    // Prekalkulowane wartości dla wydajności
    const svgSizeInv = 1 / svgSize; // zamiast dzielenia przez svgSize
    const worldSizeScale = worldSize * svgSizeInv; // prekalkulowane skalowanie
    const collisionMapScale = collisionMapSize / worldSize; // prekalkulowane skalowanie do collisionMap
    
    // 1. Pobierz SVG jako tekst
    const response = await fetch(svgUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const svgText = await response.text();
    
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
    
    // Pobierz teksturę tła PRZED usunięciem elementu
    const bgElem = svgElem.querySelector('[id^="BACKGROUND"]');
    const bgTexture = bgElem ? bgElem.id.split('_')[1] || 'grass' : 'grass';
    
    // Usuń całkowicie warstwę tła (BACKGROUND) z SVG przed rasteryzacją
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
    
    // Wygeneruj nowy tekst SVG po modyfikacjach
    const modifiedSvgText = new XMLSerializer().serializeToString(svgElem);

    // 3. Rasteryzacja do collisionMapSize (np. 1024x1024) – mapa kolizji
    const collisionCanvas = document.createElement('canvas');
    collisionCanvas.width = collisionMapSize;
    collisionCanvas.height = collisionMapSize;
    const collisionCtx = collisionCanvas.getContext('2d');
    // Skopiuj zmodyfikowane SVG do <img> i narysuj na canvasie
    const svgBlob = new Blob([modifiedSvgText], { type: 'image/svg+xml' });
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

    // 4. Rasteryzacja do worldSize (np. 6144x6144) – grafika świata
    const worldCanvas = document.createElement('canvas');
    worldCanvas.width = worldSize;
    worldCanvas.height = worldSize;
    const worldCtx = worldCanvas.getContext('2d');

    // Najpierw rasteryzuj teksturę tła na całym worldCanvas
    await new Promise((resolve) => {
      const bgImg = new window.Image();
      bgImg.onload = () => {
        for (let x = 0; x < worldSize; x += 512) {
          for (let y = 0; y < worldSize; y += 512) {
            worldCtx.drawImage(bgImg, x, y, 512, 512);
          }
        }
        resolve();
      };
      bgImg.onerror = (e) => {
        console.error('Błąd ładowania tekstury tła:', e);
        resolve();
      };
      bgImg.src = `assets/images/${bgTexture}.png`;
    });

    // Znajdź grupy ROAD i OBSTACLES
    const roadGroup = svgElem.querySelector('#ROAD');
    const obstaclesGroup = svgElem.querySelector('#OBSTACLES');

    // Ukryj grupy ROAD i OBSTACLES przed rasteryzacją, żeby nie nadpisywały tekstur
    const originalRoadDisplay = roadGroup ? roadGroup.style.display : '';
    const originalObstaclesDisplay = obstaclesGroup ? obstaclesGroup.style.display : '';
    
    if (roadGroup) roadGroup.style.display = 'none';
    if (obstaclesGroup) obstaclesGroup.style.display = 'none';

    // Następnie rasteryzuj SVG na worldCanvas (bez dróg i przeszkód)
    await new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        // NIE czyść worldCanvas! Chcemy mieć tło pod spodem
        worldCtx.drawImage(img, 0, 0, worldSize, worldSize);
        resolve();
      };
      img.onerror = (e) => {
        console.error('Błąd rasteryzacji SVG:', e);
        resolve();
      };
      img.src = url;
    });

    // Przywróć oryginalne wyświetlanie grup
    if (roadGroup) roadGroup.style.display = originalRoadDisplay;
    if (obstaclesGroup) obstaclesGroup.style.display = originalObstaclesDisplay;

    // 5. Generowanie mapy kolizji na podstawie id warstw/obiektów
    // Tworzymy mapę typów: collisionTypeMap[ix + iy * collisionMapSize] = 'asphalt' | 'grass' | 'obstacle'
    const collisionTypeMap = new Array(collisionMapSize * collisionMapSize).fill(bgTexture);

    // 1. Droga (TRACK_* z grupy ROAD) - najpierw drogi
    if (roadGroup) {
      const trackElements = roadGroup.querySelectorAll('[id^="TRACK_"]');
      for (const track of trackElements) {
        const surfaceType = track.id.split('_')[1] || 'asphalt';
        const trackSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${collisionMapSize}' height='${collisionMapSize}' viewBox='0 0 ${svgSize} ${svgSize}'>${track.outerHTML}</svg>`;
        const trackImg = new window.Image();
        await new Promise((resolve) => {
          trackImg.onload = () => {
            collisionCtx.globalCompositeOperation = 'source-over';
            collisionCtx.drawImage(trackImg, 0, 0, collisionMapSize, collisionMapSize);
            resolve();
          };
          const blob = new Blob([trackSvg], { type: 'image/svg+xml' });
          trackImg.src = URL.createObjectURL(blob);
        });
        // Oznacz piksele drogi w collisionTypeMap
        const imgData = collisionCtx.getImageData(0, 0, collisionMapSize, collisionMapSize);
        for (let i = 0; i < imgData.data.length; i += 4) {
          const pixelIndex = i * 0.25;
          // Sprawdź czy piksel nie jest przezroczysty (nie jest tłem)
          if (imgData.data[i+3] > 0) { // alpha > 0
            collisionTypeMap[pixelIndex] = surfaceType;
          }
        }
      }
    }

    // 2. Przeszkody (z grupy OBSTACLES) - potem przeszkody (nadpisują drogi)
    if (obstaclesGroup) {
      const obstacles = obstaclesGroup.querySelectorAll('[id^="1_"], [id^="2_"], [id^="3_"], [id^="4_"], [id^="5_"], [id^="6_"], [id^="7_"], [id^="8_"], [id^="9_"], [id^="10_"]');
      for (const obstacle of obstacles) {
        // Utwórz tymczasowy canvas dla przeszkody
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = collisionMapSize;
        tempCanvas.height = collisionMapSize;
        const tempCtx = tempCanvas.getContext('2d');
        
        const obstacleSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${collisionMapSize}' height='${collisionMapSize}' viewBox='0 0 ${svgSize} ${svgSize}'>${obstacle.outerHTML}</svg>`;
        const obstacleImg = new window.Image();
        await new Promise((resolve) => {
          obstacleImg.onload = () => {
            tempCtx.drawImage(obstacleImg, 0, 0, collisionMapSize, collisionMapSize);
            resolve();
          };
          const blob = new Blob([obstacleSvg], { type: 'image/svg+xml' });
          obstacleImg.src = URL.createObjectURL(blob);
        });
        
        // Oznacz tylko piksele przeszkody jako 'obstacle' (nie nadpisuj dróg)
        const imgData = tempCtx.getImageData(0, 0, collisionMapSize, collisionMapSize);
        for (let i = 0; i < imgData.data.length; i += 4) {
          const pixelIndex = i * 0.25;
          // Sprawdź czy piksel nie jest przezroczysty (nie jest tłem)
          if (imgData.data[i+3] > 0) { // alpha > 0
            collisionTypeMap[pixelIndex] = 'obstacle';
          }
        }
      }
    }

    // 4. Dodaj tekstury dla dróg i przeszkód na worldCanvas (PO rasteryzacji SVG)
    // Tekstury dróg
    if (roadGroup) {
      const trackElements = roadGroup.querySelectorAll('[id^="TRACK_"]');
      for (const track of trackElements) {
        const surfaceType = track.id.split('_')[1] || 'asphalt';
        
        // Utwórz Path2D z kształtu drogi (przeskalowany z SVG viewBox na worldCanvas)
        const svgPath = track.getAttribute('d');
        const scaledPath = scaleSvgPath(svgPath, worldSizeScale);
        const trackPath = new Path2D(scaledPath);
        
        await new Promise((resolve) => {
          // Użyj tekstury jako pattern
          const patternCanvas = document.createElement('canvas');
          const patternCtx = patternCanvas.getContext('2d');
          patternCanvas.width = 512;
          patternCanvas.height = 512;
          
          const textureImg = new window.Image();
          textureImg.onload = () => {
            // Kafelkuj teksturę - tekstura 512x512 rysowana raz w patternCanvas 512x512
            patternCtx.drawImage(textureImg, 0, 0, 512, 512);
            
            // Zastosuj pattern do ścieżki drogi z clip-path
            worldCtx.save();
            const pattern = worldCtx.createPattern(patternCanvas, 'repeat');
            worldCtx.fillStyle = pattern;
            worldCtx.clip(trackPath);
            worldCtx.fillRect(0, 0, worldSize, worldSize);
            worldCtx.restore();
            
            resolve();
          };
          textureImg.onerror = (e) => {
            console.error(`Błąd ładowania tekstury ${surfaceType}:`, e);
            // Fallback: narysuj bez tekstury
            worldCtx.save();
            worldCtx.fillStyle = '#64566D'; // Kolor asfaltu
            worldCtx.clip(trackPath);
            worldCtx.fillRect(0, 0, worldSize, worldSize);
            worldCtx.restore();
            resolve();
          };
          textureImg.src = `assets/images/${surfaceType}.jpg`;
        });
      }
    }

    // Tekstury przeszkód na worldCanvas (tylko dla wyświetlania, nie dla kolizji)
    if (obstaclesGroup) {
      const obstacles = obstaclesGroup.querySelectorAll('[id^="1_"], [id^="2_"], [id^="3_"], [id^="4_"], [id^="5_"], [id^="6_"], [id^="7_"], [id^="8_"], [id^="9_"], [id^="10_"]');
      for (const obs of obstacles) {
        const obstacleType = obs.id.split('_')[1] || 'obstacle';
        
        // Utwórz Path2D z kształtu przeszkody (przeskalowany z SVG viewBox na worldCanvas)
        const svgPath = obs.getAttribute('d');
        const scaledPath = scaleSvgPath(svgPath, worldSizeScale);
        const obsPath = new Path2D(scaledPath);
        
        await new Promise((resolve) => {
          // Użyj tekstury jako pattern
          const patternCanvas = document.createElement('canvas');
          const patternCtx = patternCanvas.getContext('2d');
          patternCanvas.width = 256;
          patternCanvas.height = 256;
          
          const textureImg = new window.Image();
          textureImg.onload = () => {
            // Kafelkuj teksturę - podziel 512x512 na 4 kafelki 256x256
            for (let x = 0; x < 256; x += 128) {
              for (let y = 0; y < 256; y += 128) {
                patternCtx.drawImage(textureImg, x, y, 128, 128);
              }
            }
            
            // Zastosuj pattern do przeszkody z clip-path
            worldCtx.save();
            const pattern = worldCtx.createPattern(patternCanvas, 'repeat');
            worldCtx.fillStyle = pattern;
            worldCtx.clip(obsPath);
            worldCtx.fillRect(0, 0, worldSize, worldSize);
            worldCtx.restore();
            
            resolve();
          };
          textureImg.onerror = (e) => {
            console.error(`Błąd ładowania tekstury przeszkody ${obstacleType}:`, e);
            // Fallback: narysuj bez tekstury
            worldCtx.save();
            worldCtx.fillStyle = '#FFFFFF'; // Kolor przeszkody
            worldCtx.clip(obsPath);
            worldCtx.fillRect(0, 0, worldSize, worldSize);
            worldCtx.restore();
            resolve();
          };
          textureImg.src = `assets/images/${obstacleType}.jpg`;
        });
      }
    }

    // Podział worldCanvas na kafelki
    const tileSize = 256;
    initTiles(worldCanvas, tileSize, worldSize);

    // 7. Pozycja startowa z SVG (id='START' w grupie ROAD)
    let startPos = { x: 50, y: 50 };
    const startElem = svgElem.querySelector('#START');
    if (startElem) {
      startPos = getStartPosition(startElem, worldSizeScale);
    }

    // 7b. Zbierz obrysy przeszkód jako tablice punktów (polygony w worldSize)
    function pathToPoly(pathElem) {
      const d = pathElem.getAttribute('d');
      if (!d) return null;
      const path = new Path2D(d);
      const len = pathElem.getTotalLength ? pathElem.getTotalLength() : 0;
      const points = [];
      const steps = Math.max(8, Math.floor(len * 0.25));
      for (let i = 0; i <= steps; ++i) {
        const l = len * i / steps;
        let pt;
        if (pathElem.getPointAtLength) {
          pt = pathElem.getPointAtLength(l);
        } else {
          pt = null;
        }
        if (pt) {
          points.push({ x: pt.x * worldSizeScale, y: pt.y * worldSizeScale });
        }
      }
      return points.length > 2 ? points : null;
    }
    const obstaclePolys = [];
    if (obstaclesGroup) {
      obstaclesGroup.querySelectorAll('path[id^="1_"], path[id^="2_"], path[id^="3_"], path[id^="4_"], path[id^="5_"], path[id^="6_"], path[id^="7_"], path[id^="8_"], path[id^="9_"], path[id^="10_"]').forEach((pathElem, index) => {
        const poly = pathToPoly(pathElem);
        if (poly) {
          obstaclePolys.push(poly);
        }
      });
    }

    // 8. Zwróć obiekty i API
    const result = {
      collisionCanvas,
      collisionTypeMap,
      worldCanvas,
      getSurfaceTypeAt: (x, y) => {
        // x, y w skali świata (0..worldSize)
        // Zoptymalizowane: prekalkulowane skalowanie
        const ix = Math.floor(x * collisionMapScale);
        const iy = Math.floor(y * collisionMapScale);
        
        if (ix < 0 || iy < 0 || ix >= collisionMapSize || iy >= collisionMapSize) return 'grass';
        
        const surfaceType = collisionTypeMap[ix + iy * collisionMapSize];
        
        return surfaceType;
      },
      startPos,
      obstaclePolys
    };
    
    return result;
  } catch (error) {
    console.error('Błąd podczas ładowania SVG:', error);
    throw error;
  }
}
