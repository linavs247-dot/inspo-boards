// Reads width and height from image file headers without any dependencies.
// Knowing the size in advance lets the gallery reserve the right space for
// every image before it loads, so the masonry layout never jumps around.
//
// Supports PNG, GIF, JPEG (including phone photos rotated via EXIF), WebP,
// AVIF, BMP and SVG. Returns null when the size can't be read; the website
// then measures the image itself once it loads.

import { open, readFile } from 'node:fs/promises';

const HEAD_BYTES = 256 * 1024;

export async function readImageSize(filePath) {
  try {
    const buf = await readHead(filePath, HEAD_BYTES);
    const ext = filePath.toLowerCase().split('.').pop();

    if (ext === 'svg') return svgSize((await readFile(filePath, 'utf8')).slice(0, 4000));

    let size = sniff(buf);
    // Large EXIF blocks can push the JPEG size marker past the first chunk.
    if (!size && isJpeg(buf)) size = jpegSize(await readFile(filePath));
    return size && size.w > 0 && size.h > 0 ? size : null;
  } catch {
    return null;
  }
}

async function readHead(filePath, bytes) {
  const handle = await open(filePath, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    const { bytesRead } = await handle.read(buf, 0, bytes, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

function sniff(b) {
  if (b.length < 30) return null;
  // PNG
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  // GIF
  if (b.toString('ascii', 0, 3) === 'GIF') return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  // JPEG
  if (isJpeg(b)) return jpegSize(b);
  // WebP
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return webpSize(b);
  // BMP
  if (b.toString('ascii', 0, 2) === 'BM') return { w: b.readInt32LE(18), h: Math.abs(b.readInt32LE(22)) };
  // AVIF / HEIF container: look for the "ispe" (image spatial extent) box
  if (b.toString('ascii', 4, 8) === 'ftyp') {
    const i = b.indexOf('ispe');
    if (i > 0 && i + 16 <= b.length) return { w: b.readUInt32BE(i + 8), h: b.readUInt32BE(i + 12) };
  }
  return null;
}

function isJpeg(b) {
  return b.length > 3 && b[0] === 0xff && b[1] === 0xd8;
}

function jpegSize(b) {
  let i = 2;
  let orientation = 1;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker === 0xff) { i++; continue; }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = b.readUInt16BE(i + 2);
    if (marker === 0xe1) orientation = exifOrientation(b, i + 4, len - 2) || orientation;
    const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof) {
      const h = b.readUInt16BE(i + 5);
      const w = b.readUInt16BE(i + 7);
      // Orientations 5 to 8 mean the photo is displayed rotated 90 degrees.
      return orientation >= 5 ? { w: h, h: w } : { w, h };
    }
    i += 2 + len;
  }
  return null;
}

function exifOrientation(b, start, length) {
  try {
    if (b.toString('ascii', start, start + 4) !== 'Exif') return null;
    const tiff = start + 6;
    const le = b.toString('ascii', tiff, tiff + 2) === 'II';
    const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
    const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
    const ifd = tiff + u32(tiff + 4);
    const count = u16(ifd);
    for (let n = 0; n < count; n++) {
      const entry = ifd + 2 + n * 12;
      if (entry + 12 > start + length) break;
      if (u16(entry) === 0x0112) return u16(entry + 8);
    }
  } catch {
    // Malformed EXIF: ignore and treat as upright.
  }
  return null;
}

function webpSize(b) {
  const chunk = b.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (chunk === 'VP8L') {
    const [b0, b1, b2, b3] = [b[21], b[22], b[23], b[24]];
    return {
      w: 1 + (((b1 & 0x3f) << 8) | b0),
      h: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }
  if (chunk === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  return null;
}

function svgSize(text) {
  const tag = text.match(/<svg[^>]*>/i)?.[0] ?? '';
  const num = (name) => {
    const m = tag.match(new RegExp(`\\s${name}=["']?([\\d.]+)(px)?["'\\s>]`, 'i'));
    return m ? parseFloat(m[1]) : 0;
  };
  let w = num('width');
  let h = num('height');
  if (!w || !h) {
    const vb = tag.match(/viewBox=["']?\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (vb) { w = parseFloat(vb[1]); h = parseFloat(vb[2]); }
  }
  return w && h ? { w: Math.round(w), h: Math.round(h) } : null;
}
