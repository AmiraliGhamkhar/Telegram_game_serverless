import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const outDir = path.join(root, 'build');
const outFile = path.join(outDir, 'immortal-bastion.zip');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function collectFiles(dir, base = '') {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const item of items) {
    const rel = base ? base + '/' + item.name : item.name;
    if (item.isDirectory()) {
      if (item.name === '.git' || item.name === 'node_modules' || item.name === 'build') continue;
      files.push(...collectFiles(path.join(dir, item.name), rel));
    } else {
      files.push({ rel, abs: path.join(dir, item.name) });
    }
  }
  return files;
}

const files = collectFiles(root);
const chunks = [];

function toZipName(p) { return p.replace(/\\/g, '/').replace(/^\//, ''); }

// Simple ZIP writer using zlib.deflateRaw
function makeLocalHeader(name, uncompressedSize, compressedSize) {
  const nameBuf = Buffer.from(name, 'utf8');
  const buf = Buffer.allocUnsafe(30 + nameBuf.length);
  let o = 0;
  buf.writeUInt32LE(0x04034b50, o); o += 4; // local file header signature
  buf.writeUInt16LE(20, o); o += 2; // version needed (2.0)
  buf.writeUInt16LE(0, o); o += 2; // general purpose bit flag
  buf.writeUInt16LE(8, o); o += 2; // compression method = deflate
  buf.writeUInt16LE(0, o); o += 2; // file last mod time
  buf.writeUInt16LE(0, o); o += 2; // file last mod date
  buf.writeUInt32LE(0, o); o += 4; // crc-32 (fake 0 for simplicity, many unzip support)
  buf.writeUInt32LE(compressedSize, o); o += 4;
  buf.writeUInt32LE(uncompressedSize, o); o += 4;
  buf.writeUInt16LE(nameBuf.length, o); o += 2;
  buf.writeUInt16LE(0, o); o += 2; // extra field length
  nameBuf.copy(buf, o);
  return buf;
}

function makeCentralHeader(name, uncompressedSize, compressedSize, offset) {
  const nameBuf = Buffer.from(name, 'utf8');
  const buf = Buffer.allocUnsafe(46 + nameBuf.length);
  let o = 0;
  buf.writeUInt32LE(0x02014b50, o); o += 4; // central dir signature
  buf.writeUInt16LE(20, o); o += 2; // version made by
  buf.writeUInt16LE(20, o); o += 2; // version needed
  buf.writeUInt16LE(0, o); o += 2; // bit flag
  buf.writeUInt16LE(8, o); o += 2; // compression method
  buf.writeUInt16LE(0, o); o += 2; // time
  buf.writeUInt16LE(0, o); o += 2; // date
  buf.writeUInt32LE(0, o); o += 4; // crc
  buf.writeUInt32LE(compressedSize, o); o += 4;
  buf.writeUInt32LE(uncompressedSize, o); o += 4;
  buf.writeUInt16LE(nameBuf.length, o); o += 2;
  buf.writeUInt16LE(0, o); o += 2; // extra length
  buf.writeUInt16LE(0, o); o += 2; // comment length
  buf.writeUInt16LE(0, o); o += 2; // disk number
  buf.writeUInt16LE(0, o); o += 2; // internal attr
  buf.writeUInt32LE(0, o); o += 4; // external attr
  buf.writeUInt32LE(offset, o); o += 4; // relative offset
  nameBuf.copy(buf, o);
  return buf;
}

function makeEndOfCentralDir(count, size, offset) {
  const buf = Buffer.allocUnsafe(22);
  let o = 0;
  buf.writeUInt32LE(0x06054b50, o); o += 4;
  buf.writeUInt16LE(0, o); o += 2; // disk number
  buf.writeUInt16LE(0, o); o += 2; // disk with cd
  buf.writeUInt16LE(count, o); o += 2; // entries on disk
  buf.writeUInt16LE(count, o); o += 2; // total entries
  buf.writeUInt32LE(size, o); o += 4; // cd size
  buf.writeUInt32LE(offset, o); o += 4; // cd offset
  buf.writeUInt16LE(0, o); o += 2; // comment length
  return buf;
}

let offset = 0;
const centralHeaders = [];

for (const f of files) {
  const name = toZipName(f.rel);
  const data = fs.readFileSync(f.abs);
  const compressed = zlib.deflateRawSync(data);
  const compressedSize = compressed.length;
  const uncompressedSize = data.length;
  const localHeader = makeLocalHeader(name, uncompressedSize, compressedSize);
  chunks.push(localHeader, compressed);
  centralHeaders.push({ buf: makeCentralHeader(name, uncompressedSize, compressedSize, offset), len: makeCentralHeader(name, uncompressedSize, compressedSize, offset).length });
  offset += localHeader.length + compressedSize;
}

const cdOffset = offset;
const cdSize = centralHeaders.reduce((s, h) => s + h.buf.length, 0);
for (const h of centralHeaders) chunks.push(h.buf);
chunks.push(makeEndOfCentralDir(files.length, cdSize, cdOffset));

const out = Buffer.concat(chunks);
fs.writeFileSync(outFile, out);
console.log('Built:', outFile, 'size:', (out.length/1024/1024).toFixed(2), 'MB', '| files:', files.length);
