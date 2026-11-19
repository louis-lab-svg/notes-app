// Fabrique les icônes PNG de l'appli (fond violet + 3 points reliés, rappel du graphe).
// Aucune dépendance : on calcule chaque pixel et on écrit le PNG à la main.
// Lancer avec : npm run icons
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// Positions en fraction de la taille de l'icône (tout reste dans la zone centrale « sûre »).
const DOTS = [
  [0.34, 0.36, 0.085],
  [0.67, 0.42, 0.07],
  [0.42, 0.68, 0.075],
];
const LINES = [
  [0, 1],
  [1, 2],
  [2, 0],
];
const LINE_WIDTH = 0.022;
const TOP = [124, 92, 255]; // violet clair
const BOTTOM = [86, 56, 214]; // violet foncé

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

function render(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filtre PNG « aucun »
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      // distance (en pixels) à la forme blanche la plus proche
      let d = Infinity;
      for (const [cx, cy, r] of DOTS) d = Math.min(d, (Math.hypot(u - cx, v - cy) - r) * size);
      for (const [a, b] of LINES) {
        const [ax, ay] = DOTS[a];
        const [bx, by] = DOTS[b];
        d = Math.min(d, (distToSegment(u, v, ax, ay, bx, by) - LINE_WIDTH / 2) * size);
      }
      const white = Math.max(0, Math.min(1, 0.5 - d)); // anticrénelage sur 1 pixel
      const i = y * (size * 3 + 1) + 1 + x * 3;
      for (let c = 0; c < 3; c++) {
        const bg = TOP[c] + (BOTTOM[c] - TOP[c]) * v;
        raw[i + c] = Math.round(bg + (255 - bg) * white);
      }
    }
  }
  return png(size, raw);
}

// ----- Écriture d'un fichier PNG minimal -----
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(size, raw) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // 8 bits par couleur
  header[9] = 2; // RVB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const OUTPUT = {
  'public/icon-192.png': 192,
  'public/icon-512.png': 512,
  'public/apple-touch-icon.png': 180, // icône utilisée par l'iPhone
  'public/favicon.png': 64, // icône de l'onglet du navigateur
};
for (const [file, size] of Object.entries(OUTPUT)) {
  writeFileSync(file, render(size));
  console.log('✓', file);
}
