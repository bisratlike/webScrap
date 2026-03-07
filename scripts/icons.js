/**
 * Creates placeholder PNG icon files
 * Generates minimal valid PNG files with solid color backgrounds
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.resolve(__dirname, '..', 'public', 'icons');
fs.mkdirSync(ICONS_DIR, { recursive: true });

/**
 * Creates a minimal valid PNG buffer with a solid color
 * @param {number} size - Icon size
 * @param {number[]} color - [R, G, B] color
 * @returns {Buffer}
 */
function createPNG(size, color = [59, 130, 246]) {
  const { createCanvas } = (() => {
    try { return require('canvas'); } catch { return null; }
  })() || {};

  if (createCanvas) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = `rgb(${color.join(',')})`;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('D', size / 2, size / 2);
    return canvas.toBuffer('image/png');
  }

  return createMinimalPNG(size, color);
}

function createMinimalPNG(size, [r, g, b]) {
  // PNG header + IHDR + IDAT + IEND for a size×size solid color image
  const CRC32 = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    return (data) => {
      let crc = 0xFFFFFFFF;
      for (const byte of data) crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
      return (crc ^ 0xFFFFFFFF) >>> 0;
    };
  })();

  function u32(n) {
    return Buffer.from([(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF]);
  }
  function chunk(type, data) {
    const typeBytes = Buffer.from(type);
    const crc = CRC32(Buffer.concat([typeBytes, data]));
    return Buffer.concat([u32(data.length), typeBytes, data, u32(crc)]);
  }

  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const IHDR = chunk('IHDR', Buffer.from([...u32(size), ...u32(size), 8, 2, 0, 0, 0]));

  // Build raw image data (RGB, filter byte 0 per row)
  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter type None
    for (let x = 0; x < size; x++) {
      const offset = y * rowSize + 1 + x * 3;
      raw[offset] = r; raw[offset + 1] = g; raw[offset + 2] = b;
    }
  }

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(raw);
  const IDAT = chunk('IDAT', compressed);
  const IEND = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSig, IHDR, IDAT, IEND]);
}

const SIZES = [16, 48, 128];
const COLOR = [59, 130, 246]; // Blue-500

SIZES.forEach(size => {
  const buf = createPNG(size, COLOR);
  const filePath = path.join(ICONS_DIR, `icon${size}.png`);
  fs.writeFileSync(filePath, buf);
  console.log(`Created ${filePath} (${buf.length} bytes)`);
});

console.log('Icons generated successfully!');
