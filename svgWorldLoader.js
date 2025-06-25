// svgWorldLoader.js – ładowanie, rasteryzacja i mapa kolizji świata z SVG
// Użycie: import { loadSVGWorld } from './svgWorldLoader.js';
// await loadSVGWorld('SCENE_1.svg', 1000, 4000)

export async function loadSVGWorld(svgUrl, collisionMapSize = 1000, worldSize = 4000) {
  // 1. Pobierz SVG jako tekst
  const svgText = await fetch(svgUrl).then(r => r.text());
  // 2. Stwórz element SVG w DOM (niewidoczny)
  const svgElem = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement;

  // 3. Rasteryzacja do collisionMapSize (np. 1000x1000) – mapa kolizji
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
      collisionCtx.drawImage(img, 0, 0, collisionMapSize, collisionMapSize);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.src = url;
  });

  // 4. Rasteryzacja do worldSize (np. 4000x4000) – grafika świata
  const worldCanvas = document.createElement('canvas');
  worldCanvas.width = worldSize;
  worldCanvas.height = worldSize;
  const worldCtx = worldCanvas.getContext('2d');
  await new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      worldCtx.drawImage(img, 0, 0, worldSize, worldSize);
      resolve();
    };
    img.src = url;
  });

  // Podział worldCanvas na kafelki 500x500
  const tileSize = 500;
  const tiles = [];
  const numTilesX = Math.ceil(worldSize / tileSize);
  const numTilesY = Math.ceil(worldSize / tileSize);
  for (let ty = 0; ty < numTilesY; ++ty) {
    for (let tx = 0; tx < numTilesX; ++tx) {
      const tileCanvas = document.createElement('canvas');
      tileCanvas.width = tileSize;
      tileCanvas.height = tileSize;
      const tileCtx = tileCanvas.getContext('2d');
      tileCtx.drawImage(
        worldCanvas,
        tx * tileSize, ty * tileSize, tileSize, tileSize,
        0, 0, tileSize, tileSize
      );
      tiles.push({ x: tx, y: ty, canvas: tileCanvas });
    }
  }

  // 5. Generowanie mapy kolizji na podstawie id warstw/obiektów
  // Tworzymy mapę typów: collisionTypeMap[ix + iy * collisionMapSize] = 'asphalt' | 'grass' | 'obstacle'
  const collisionTypeMap = new Array(collisionMapSize * collisionMapSize).fill('grass');

  // Przechodzimy po elementach SVG i rysujemy je na collisionCanvas z unikalnym kolorem dla każdego typu
  // 1. Najpierw tło (background)
  const bg = svgElem.querySelector('[id^="BACKGROUND_"]');
  if (bg) {
    collisionCtx.save();
    collisionCtx.fillStyle = '#010101'; // unikalny kolor dla tła
    collisionCtx.fillRect(0, 0, collisionMapSize, collisionMapSize);
    collisionCtx.restore();
    for (let i = 0; i < collisionTypeMap.length; ++i) collisionTypeMap[i] = 'grass';
  }
  // 2. Droga (ROAD_*)

  const road = svgElem.querySelector('[id^="ROAD_"]');
  if (road) {
    // Rysuj na collisionCanvas z innym kolorem
    const roadSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${collisionMapSize}' height='${collisionMapSize}' viewBox='0 0 100 100'>${road.outerHTML}</svg>`;
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
      // Jeśli piksel nie jest tłem (#010101), to droga
      if (!(imgData.data[i] === 1 && imgData.data[i+1] === 1 && imgData.data[i+2] === 1)) {
        collisionTypeMap[i / 4] = 'asphalt';
      }
    }
  }
  // 3. Przeszkoda (obstacle)
  const obs = svgElem.querySelector('#obstacle, #OBSTACLE, [id^="obstacle"], [id^="OBSTACLE"]');
  if (obs) {
    const obsSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${collisionMapSize}' height='${collisionMapSize}' viewBox='0 0 100 100'>${obs.outerHTML}</svg>`;
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
      if (imgData.data[i] === 255 && imgData.data[i+1] === 255 && imgData.data[i+2] === 255) {
        collisionTypeMap[i / 4] = 'obstacle';
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
        startPos = { x: cx / 100 * worldSize, y: cy / 100 * worldSize };
      }
    } else if (startElem.tagName === 'rect') {
      const x = parseFloat(startElem.getAttribute('x'));
      const y = parseFloat(startElem.getAttribute('y'));
      if (!isNaN(x) && !isNaN(y)) {
        startPos = { x: x / 100 * worldSize, y: y / 100 * worldSize };
      }
    } else if (startElem.hasAttribute('transform')) {
      // Próba wyciągnięcia translate z transform
      const tr = startElem.getAttribute('transform');
      const match = /translate\(([-\d.]+)[ ,]+([\-\d.]+)\)/.exec(tr);
      if (match) {
        startPos = { x: parseFloat(match[1]) / 100 * worldSize, y: parseFloat(match[2]) / 100 * worldSize };
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
    const steps = Math.max(8, Math.floor(len / 4));
    for (let i = 0; i <= steps; ++i) {
      const l = len * i / steps;
      let pt;
      if (pathElem.getPointAtLength) {
        pt = pathElem.getPointAtLength(l);
      } else {
        // fallback: niech będzie pusta tablica
        pt = null;
      }
      if (pt) points.push({ x: pt.x / 100 * worldSize, y: pt.y / 100 * worldSize });
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
    tiles,
    tileSize,
    getSurfaceTypeAt: (x, y) => {
      // x, y w skali świata (0..worldSize)
      // Przeskaluj do collisionMapSize
      const ix = Math.floor(x * collisionMapSize / worldSize);
      const iy = Math.floor(y * collisionMapSize / worldSize);
      if (ix < 0 || iy < 0 || ix >= collisionMapSize || iy >= collisionMapSize) return 'grass';
      return collisionTypeMap[ix + iy * collisionMapSize];
    },
    startPos,
    obstaclePolys
  };
}
