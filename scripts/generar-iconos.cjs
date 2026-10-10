// Genera los PNG del icono (16, 32, 48 y 128 px) a partir de la geometría de extension/icons/icono.svg.
// Chrome no admite SVG en el manifest, así que el SVG es la fuente y estos PNG lo que se carga.
// Uso: node scripts/generar-iconos.cjs   (sin dependencias: rasteriza con suavizado y escribe el PNG con zlib)
// Si cambias el dibujo, actualiza a la vez el SVG y las formas de aquí abajo (mismo viewBox de 128).

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const FONDO = [0x11, 0xf3, 0xaf], TRAZO = [0x0b, 0x2a, 0x22];
const FORMAS = [  // trazos oscuros redondeados, en coordenadas del viewBox 128
  { tipo: 'marco', cx: 64, cy: 64, mx: 44, my: 36, r: 10, grosor: 9 },       // ventana del navegador
  { tipo: 'segmento', a: [22, 48], b: [106, 48], grosor: 8 },                // barra superior
  { tipo: 'segmento', a: [42, 75], b: [55, 87], grosor: 10 },                // check
  { tipo: 'segmento', a: [55, 87], b: [83, 62], grosor: 10 }
];

const distSegmento = (x, y, [ax, ay], [bx, by]) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
};
const dentroFondo = (x, y) => {   // cuadrado de 128 con esquinas de radio 28
  const R = 28, qx = Math.max(Math.abs(x - 64) - (64 - R), 0), qy = Math.max(Math.abs(y - 64) - (64 - R), 0);
  return Math.hypot(qx, qy) <= R;
};
// Distancia con signo a un rectángulo redondeado (mitades mx, my; radio r)
const distMarco = (x, y, f) => {
  const qx = Math.max(Math.abs(x - f.cx) - (f.mx - f.r), 0), qy = Math.max(Math.abs(y - f.cy) - (f.my - f.r), 0);
  const fuera = Math.hypot(qx, qy) - f.r;
  return fuera > 0 ? fuera : Math.max(Math.abs(x - f.cx) - f.mx, Math.abs(y - f.cy) - f.my, fuera);
};
const dentroTrazo = (x, y) => FORMAS.some(f => f.tipo === 'marco'
  ? Math.abs(distMarco(x, y, f)) <= f.grosor / 2
  : distSegmento(x, y, f.a, f.b) <= f.grosor / 2);

function rasterizar(tam) {
  const S = 6, esc = 128 / tam, px = Buffer.alloc(tam * tam * 4);   // S×S muestras por píxel
  for (let j = 0; j < tam; j++) for (let i = 0; i < tam; i++) {
    let fondo = 0, trazo = 0;
    for (let sj = 0; sj < S; sj++) for (let si = 0; si < S; si++) {
      const x = (i + (si + .5) / S) * esc, y = (j + (sj + .5) / S) * esc;
      if (!dentroFondo(x, y)) continue;
      fondo++; if (dentroTrazo(x, y)) trazo++;
    }
    const n = S * S, o = (j * tam + i) * 4, mezcla = fondo ? trazo / fondo : 0;
    for (let c = 0; c < 3; c++) px[o + c] = Math.round(FONDO[c] * (1 - mezcla) + TRAZO[c] * mezcla);
    px[o + 3] = Math.round(255 * fondo / n);
  }
  return px;
}

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const x of b) c = TABLA_CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const trozo = (tipo, datos) => {
  const t = Buffer.concat([Buffer.from(tipo), datos]), lon = Buffer.alloc(4), suma = Buffer.alloc(4);
  lon.writeUInt32BE(datos.length); suma.writeUInt32BE(crc(t));
  return Buffer.concat([lon, t, suma]);
};
function png(tam, px) {
  const cab = Buffer.alloc(13); cab.writeUInt32BE(tam, 0); cab.writeUInt32BE(tam, 4); cab[8] = 8; cab[9] = 6;   // 8 bits, RGBA
  const filas = Buffer.alloc((tam * 4 + 1) * tam);
  for (let j = 0; j < tam; j++) px.copy(filas, j * (tam * 4 + 1) + 1, j * tam * 4, (j + 1) * tam * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo('IHDR', cab), trozo('IDAT', zlib.deflateSync(filas)), trozo('IEND', Buffer.alloc(0))]);
}

const destino = path.join(__dirname, '..', 'extension', 'icons');
for (const tam of [16, 32, 48, 128]) {
  fs.writeFileSync(path.join(destino, `icono-${tam}.png`), png(tam, rasterizar(tam)));
  console.log(`icono-${tam}.png`);
}
