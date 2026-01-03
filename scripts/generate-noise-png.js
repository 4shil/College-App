/* eslint-disable no-bitwise */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0 ^ -1;

  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }

  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateNoisePng({ width, height, seed }) {
  const rand = mulberry32(seed);

  // Each scanline: 1 filter byte + RGBA pixels
  const rowLen = 1 + width * 4;
  const raw = Buffer.alloc(rowLen * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowLen;
    raw[rowStart] = 0; // filter type 0
    for (let x = 0; x < width; x += 1) {
      const i = rowStart + 1 + x * 4;
      const g = Math.floor(rand() * 256);
      raw[i + 0] = g;
      raw[i + 1] = g;
      raw[i + 2] = g;
      raw[i + 3] = 255;
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idat = zlib.deflateSync(raw, { level: 6 });

  const chunks = Buffer.concat([
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  return Buffer.concat([signature, chunks]);
}

const outPath = path.join(__dirname, '..', 'assets', 'noise.png');
const png = generateNoisePng({ width: 64, height: 64, seed: 1337 });
fs.writeFileSync(outPath, png);
console.log(`Wrote ${outPath}`);
