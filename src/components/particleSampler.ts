export const PARTICLE_COUNT = 4800;

/**
 * Samples a 2D currency glyph into normalized [x, y, z] points.
 */
export function sampleGlyph(
  char: string,
  count: number = PARTICLE_COUNT,
  fontFamily: string = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
): Float32Array {
  const canvas = document.createElement("canvas");
  const size = 320;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) return new Float32Array(count * 3);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold 220px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, size / 2, size / 2 + 10);

  const imgData = ctx.getImageData(0, 0, size, size).data;
  const validPixels: [number, number][] = [];

  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const idx = (y * size + x) * 4;
      if (imgData[idx] > 120) {
        const px = (x / size - 0.5) * 3.6;
        const py = -(y / size - 0.5) * 3.6;
        validPixels.push([px, py]);
      }
    }
  }

  const positions = new Float32Array(count * 3);
  if (validPixels.length === 0) return positions;

  for (let i = 0; i < count; i++) {
    const [px, py] = validPixels[i % validPixels.length];
    positions[i * 3 + 0] = px + (Math.random() - 0.5) * 0.03;
    positions[i * 3 + 1] = py + (Math.random() - 0.5) * 0.03;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
  }

  return positions;
}

/**
 * High-accuracy mathematical polygon outlines for all world continents [longitude, latitude].
 * Zero canvas dependencies: 100% deterministic mathematical execution.
 */
const CONTINENTS: [number, number][][] = [
  // North America
  [[-168, 65], [-140, 70], [-125, 72], [-85, 75], [-75, 62], [-55, 50], [-65, 42], [-80, 25], [-82, 10], [-90, 16], [-105, 20], [-120, 34], [-125, 48], [-168, 60]],
  // Central America
  [[-115, 30], [-100, 20], [-85, 15], [-77, 8], [-83, 8], [-95, 16], [-110, 26]],
  // South America
  [[-77, 12], [-60, 10], [-35, -5], [-35, -22], [-42, -23], [-50, -32], [-55, -55], [-70, -55], [-75, -45], [-70, -18], [-80, -2], [-77, 12]],
  // Europe
  [[-10, 36], [0, 38], [15, 38], [30, 42], [40, 55], [30, 71], [15, 71], [5, 62], [-5, 58], [-10, 44]],
  // Scandinavia
  [[5, 58], [25, 71], [32, 70], [28, 60], [12, 56]],
  // Africa
  [[-18, 35], [10, 37], [32, 32], [42, 15], [51, 12], [44, -5], [35, -25], [28, -34], [16, -34], [12, -18], [10, 5], [-15, 12], [-18, 28]],
  // Eurasia / North Asia
  [[30, 42], [60, 42], [90, 50], [130, 60], [170, 68], [170, 60], [140, 50], [125, 40], [120, 30], [110, 20], [100, 10], [100, 22], [80, 28], [55, 25], [35, 32]],
  // Indian Subcontinent (Prominent Peninsular Silhouette)
  [[68, 25], [75, 32], [88, 28], [92, 22], [84, 18], [80, 8], [76, 10], [72, 18], [68, 22]],
  // East Asia & China
  [[100, 22], [120, 22], [122, 38], [115, 40], [105, 32]],
  // Southeast Asia & Maritime Archipelagos
  [[98, 6], [105, 2], [115, -4], [115, -8], [106, -6], [98, 2]],
  // Australia
  [[113, -22], [120, -15], [136, -12], [148, -18], [154, -28], [148, -38], [115, -35], [113, -25]],
  // Japan
  [[130, 32], [138, 36], [142, 44], [145, 42], [136, 34], [130, 32]],
  // United Kingdom & Ireland
  [[-10, 51], [-2, 50], [2, 53], [-2, 58], [-6, 58], [-10, 54]],
  // Greenland
  [[-55, 60], [-25, 65], [-18, 76], [-30, 83], [-55, 83], [-55, 70]]
];

/**
 * Standard Ray-casting point-in-polygon algorithm.
 */
function isPointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isEarthLand(lon: number, lat: number): boolean {
  for (let i = 0; i < CONTINENTS.length; i++) {
    if (isPointInPolygon([lon, lat], CONTINENTS[i])) {
      return true;
    }
  }
  return false;
}

/**
 * Generates an unmistakable Halftone Dotted Earth Globe matching reference vector graphics.
 * Structured latitude/longitude grid matrix with empty oceans and dense continental dots.
 */
export function generateEarthGlobe(
  count: number = PARTICLE_COUNT,
  radius: number = 1.65
): Float32Array {
  const landGridPoints: [number, number, number][] = [];
  const oceanGridPoints: [number, number, number][] = [];

  // Halftone matrix scanning from 78 deg N to 78 deg S
  for (let lat = 78; lat >= -78; lat -= 3.0) {
    const latRad = (lat * Math.PI) / 180;
    const cosLat = Math.cos(latRad);
    const sinLat = Math.sin(latRad);

    // Circumference-weighted dot spacing: eliminates pole bunching
    const dotsInRing = Math.max(1, Math.round(140 * cosLat));

    for (let i = 0; i < dotsInRing; i++) {
      const lon = (i / dotsInRing) * 360 - 180;
      const lonRad = (lon * Math.PI) / 180;

      const x = radius * cosLat * Math.sin(lonRad);
      const y = radius * sinLat;
      const z = radius * cosLat * Math.cos(lonRad);

      if (isEarthLand(lon, lat)) {
        landGridPoints.push([x, y, z]);
      } else if (i % 5 === 0) {
        // Very sparse ocean background points for subtle depth
        oceanGridPoints.push([x, y, z]);
      }
    }
  }

  const positions = new Float32Array(count * 3);

  // Guarantee that every single particle index has real 3D coordinates
  for (let i = 0; i < count; i++) {
    if (i < landGridPoints.length) {
      const [px, py, pz] = landGridPoints[i];
      positions[i * 3 + 0] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
    } else {
      // Fill remaining buffer slots with structured land repeats and graticule points
      const pool = landGridPoints.length > 0 ? landGridPoints : oceanGridPoints;
      const [px, py, pz] = pool[i % pool.length];
      positions[i * 3 + 0] = px + (Math.random() - 0.5) * 0.015;
      positions[i * 3 + 1] = py + (Math.random() - 0.5) * 0.015;
      positions[i * 3 + 2] = pz + (Math.random() - 0.5) * 0.015;
    }
  }

  return positions;
}
