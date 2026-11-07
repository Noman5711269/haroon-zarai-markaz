const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 Table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crcVal = crc32(typeAndData);
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

function createPNG(size, drawFn) {
  const width = size;
  const height = size;

  // IHDR: width(4), height(4), bitDepth(1), colorType(1), comp(1), filter(1), interlace(1)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // standard filter
  ihdrData[12] = 0; // no interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image rows: each row has 1 filter byte (0) + width * 4 bytes RGBA
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw Haroon Zarai Markaz Icon
// Emerald green gradient background, golden rounded inner border, golden wheat/emblem & badge
function drawIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxRadius = w / 2;

  // Background: Deep emerald to forest green gradient
  // top-left to bottom-right
  const gradFactor = (x + y) / (w + h);
  let bgR = Math.round(5 + gradFactor * 15);   // ~5-20
  let bgG = Math.round(78 + gradFactor * 40);  // ~78-118
  let bgB = Math.round(59 + gradFactor * 25);  // ~59-84
  let bgA = 255;

  if (!isMaskable) {
    // Smooth rounded square mask (squircle / iOS icon shape)
    const cornerRadius = w * 0.22;
    const qx = Math.max(Math.abs(x - cx) - (cx - cornerRadius), 0);
    const qy = Math.max(Math.abs(y - cy) - (cy - cornerRadius), 0);
    const cornerDist = Math.sqrt(qx * qx + qy * qy);
    if (cornerDist > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent outside
    }
  }

  // Golden Circular / Oval Badge Ring in Center
  const ringRadius = w * 0.36;
  const ringThickness = Math.max(2, Math.round(w * 0.025));
  const ringDist = Math.abs(dist - ringRadius);

  if (ringDist <= ringThickness) {
    // Golden Ring
    return [250, 204, 21, 255]; // Golden Yellow (#facc15)
  }

  // Inside Center Emblem: Darker rich emerald circle
  if (dist < ringRadius - ringThickness) {
    bgR = 4;
    bgG = 65;
    bgB = 45;
  }

  // Central Stalk & Grains (Stylized Golden Wheat / Plant Pattern)
  const normX = dx / (w * 0.35);
  const normY = dy / (w * 0.35);

  // Vertical central stem
  if (Math.abs(normX) < 0.05 && normY > -0.65 && normY < 0.65) {
    return [245, 158, 11, 255]; // Amber stem
  }

  // Wheat grains (symmetric pairs)
  for (let level = -3; level <= 3; level++) {
    const grainCenterY = level * 0.16;
    for (const side of [-1, 1]) {
      const grainCenterX = side * 0.18;
      // Elliptical wheat grain
      const gdx = normX - grainCenterX;
      const gdy = (normY - grainCenterY) + side * 0.05 * normX;
      // Rotated ellipse distance
      const grainDist = (gdx * gdx) / (0.10 * 0.10) + (gdy * gdy) / (0.07 * 0.07);
      if (grainDist <= 1.0) {
        // Golden grain gradient
        return [251, 191, 36, 255]; // Amber 400
      }
    }
  }

  // Crown grain at the top
  const topGdx = normX;
  const topGdy = normY + 0.65;
  if ((topGdx * topGdx) / (0.07 * 0.07) + (topGdy * topGdy) / (0.12 * 0.12) <= 1.0) {
    return [253, 224, 71, 255]; // Light gold
  }

  return [bgR, bgG, bgB, bgA];
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA icons...');

// 1. icon-192.png
const icon192 = createPNG(192, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);
console.log(' - icon-192.png generated (' + icon192.length + ' bytes)');

// 2. icon-512.png
const icon512 = createPNG(512, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);
console.log(' - icon-512.png generated (' + icon512.length + ' bytes)');

// 3. icon-192-maskable.png & icon-512-maskable.png (full bleed for Android adaptive icons)
const icon192Maskable = createPNG(192, (x, y, w, h) => drawIcon(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'icon-192-maskable.png'), icon192Maskable);

const icon512Maskable = createPNG(512, (x, y, w, h) => drawIcon(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'icon-512-maskable.png'), icon512Maskable);
console.log(' - Maskable icons generated');

// 4. apple-touch-icon.png (180x180)
const appleIcon = createPNG(180, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleIcon);
console.log(' - apple-touch-icon.png generated (' + appleIcon.length + ' bytes)');

// 5. favicon-32x32.png
const favicon32 = createPNG(32, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'favicon-32x32.png'), favicon32);
console.log(' - favicon-32x32.png generated');

console.log('All PWA icons generated successfully!');
