/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'hooks', 'lib', 'store', 'types'];

// Best-effort emoji detector.
// Node supports Unicode property escapes; this catches most emoji/pictographs.
const EMOJI_RE = /\p{Extended_Pictographic}/u;

const TEXT_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md']);

function isProbablyBinary(buffer) {
  // If it contains a NUL byte, treat as binary.
  return buffer.includes(0);
}

function walk(dirPath, onFile) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'android' || entry.name === 'ios') {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, onFile);
    } else if (entry.isFile()) {
      onFile(fullPath);
    }
  }
}

function scanFile(fullPath) {
  const ext = path.extname(fullPath).toLowerCase();
  if (!TEXT_EXTS.has(ext)) return;

  let buf;
  try {
    buf = fs.readFileSync(fullPath);
  } catch {
    return;
  }

  if (isProbablyBinary(buf)) return;

  const text = buf.toString('utf8');
  if (!EMOJI_RE.test(text)) return;

  const rel = path.relative(ROOT, fullPath).split(path.sep).join('/');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (EMOJI_RE.test(lines[i])) {
      console.log(`${rel}:${i + 1}: ${lines[i]}`);
    }
  }
}

function main() {
  let foundAny = false;
  const originalLog = console.log;
  console.log = (...args) => {
    foundAny = true;
    originalLog(...args);
  };

  for (const dir of SCAN_DIRS) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) continue;
    walk(full, scanFile);
  }

  if (!foundAny) {
    originalLog('No emoji characters found in scanned source dirs.');
  }
}

main();
