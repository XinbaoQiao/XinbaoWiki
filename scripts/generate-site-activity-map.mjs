import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputFile = path.join(root, 'public', 'maps', 'world-land-dots.svg');
const sourceUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
const response = await fetch(sourceUrl);

if (!response.ok) throw new Error(`Unable to load world-atlas geometry: ${response.status}`);

const topology = await response.json();
const [scaleX, scaleY] = topology.transform.scale;
const [translateX, translateY] = topology.transform.translate;
const decodedArcs = new Map();
const map = { height: 276, north: 82, south: -58, width: 672 };

function decodeArc(index) {
  const sourceIndex = index < 0 ? ~index : index;
  if (!decodedArcs.has(sourceIndex)) {
    let x = 0;
    let y = 0;
    decodedArcs.set(sourceIndex, topology.arcs[sourceIndex].map(([deltaX, deltaY]) => {
      x += deltaX;
      y += deltaY;
      return [x * scaleX + translateX, y * scaleY + translateY];
    }));
  }
  const points = decodedArcs.get(sourceIndex);
  return index < 0 ? points.slice().reverse() : points;
}

function stitchRing(arcIndexes) {
  return arcIndexes.flatMap((arcIndex, position) => {
    const points = decodeArc(arcIndex);
    return position === 0 ? points : points.slice(1);
  });
}

function project([longitude, latitude]) {
  return [
    ((longitude + 180) / 360) * map.width,
    ((map.north - Math.max(map.south, Math.min(map.north, latitude))) / (map.north - map.south)) * map.height
  ];
}

function ringPath(ring) {
  if (ring.length < 3 || Math.max(...ring.map(([, latitude]) => latitude)) < map.south) return '';
  const segments = [];
  let current = [];
  for (let index = 0; index < ring.length; index += 1) {
    if (index > 0 && Math.abs(ring[index][0] - ring[index - 1][0]) > 180) {
      if (current.length > 2) segments.push(current);
      current = [];
    }
    current.push(project(ring[index]));
  }
  if (current.length > 2) segments.push(current);
  return segments.map((segment) => {
    const commands = segment.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
    return `${commands.join(' ')} Z`;
  }).join(' ');
}

function geometryPath(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.arcs] : geometry.arcs;
  return polygons
    .flatMap((polygon) => polygon.map((ring) => ringPath(stitchRing(ring))))
    .filter(Boolean)
    .join(' ');
}

const landPath = topology.objects.countries.geometries.map(geometryPath).filter(Boolean).join(' ');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="672" height="276" viewBox="0 0 672 276" aria-hidden="true">
  <!-- Generated from world-atlas 2.0.2 / Natural Earth as an abstract land silhouette without internal political borders. -->
  <defs>
    <pattern id="dots" width="11" height="11" patternUnits="userSpaceOnUse">
      <circle cx="5.5" cy="5.5" r="2.15" fill="#c8ccd1"/>
    </pattern>
  </defs>
  <rect width="672" height="276" fill="#fafbfc"/>
  <path d="${landPath}" fill="url(#dots)" fill-rule="evenodd"/>
</svg>`;

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, svg, 'utf8');
console.log(`Wrote ${path.relative(root, outputFile)}`);
