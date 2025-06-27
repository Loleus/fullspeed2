// surfaceTypes.js – logika rozpoznawania typów powierzchni z SVG

// Funkcja pomocnicza do rasteryzacji elementu SVG i oznaczania pikseli
export async function rasterizeAndMarkSurface(element, surfaceType, collisionCtx, collisionTypeMap, collisionMapSize, svgSize) {
  if (!element) return;
  
  const elementSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${collisionMapSize}' height='${collisionMapSize}' viewBox='0 0 ${svgSize} ${svgSize}'>${element.outerHTML}</svg>`;
  const elementImg = new window.Image();
  await new Promise((resolve) => {
    elementImg.onload = () => {
      collisionCtx.globalCompositeOperation = 'source-over';
      collisionCtx.drawImage(elementImg, 0, 0, collisionMapSize, collisionMapSize);
      resolve();
    };
    const blob = new Blob([elementSvg], { type: 'image/svg+xml' });
    elementImg.src = URL.createObjectURL(blob);
  });
  
  // Oznacz piksele jako dany typ powierzchni
  const imgData = collisionCtx.getImageData(0, 0, collisionMapSize, collisionMapSize);
  for (let i = 0; i < imgData.data.length; i += 4) {
    // Jeśli piksel nie jest tłem (#010101), to oznacz jako dany typ
    if (!(imgData.data[i] === 1 && imgData.data[i+1] === 1 && imgData.data[i+2] === 1)) {
      collisionTypeMap[i / 4] = surfaceType;
    }
  }
}

// Rozpoznawanie różnych typów powierzchni na podstawie ID elementów
export async function processSurfaceTypes(svgElem, collisionCtx, collisionTypeMap, collisionMapSize, svgSize) {
  const surfaceTypes = [
    { selector: '[id^="ROAD_asphalt"], [id*="asphalt"]', type: 'asphalt' },
    { selector: '[id^="ROAD_concrete"], [id*="concrete"]', type: 'concrete' },
    { selector: '[id^="ROAD_gravel"], [id*="gravel"]', type: 'gravel' },
    { selector: '[id^="ROAD_dirt"], [id*="dirt"]', type: 'dirt' },
    { selector: '[id^="ROAD_mud"], [id*="mud"]', type: 'mud' },
    { selector: '[id^="ROAD_sand"], [id*="sand"]', type: 'sand' },
    { selector: '[id^="ROAD_ice"], [id*="ice"]', type: 'ice' },
    { selector: '[id^="ROAD_snow"], [id*="snow"]', type: 'snow' },
    { selector: '[id^="ROAD_grass"], [id*="grass"]', type: 'grass' },
    // Fallback dla starych oznaczeń - jeśli nie ma konkretnego typu, to asphalt
    { selector: '[id^="ROAD_"]', type: 'asphalt' }
  ];

  // Przetwarzaj typy powierzchni w kolejności (od najbardziej specyficznych do ogólnych)
  for (const surfaceType of surfaceTypes) {
    const elements = svgElem.querySelectorAll(surfaceType.selector);
    for (const element of elements) {
      await rasterizeAndMarkSurface(element, surfaceType.type, collisionCtx, collisionTypeMap, collisionMapSize, svgSize);
    }
  }
} 