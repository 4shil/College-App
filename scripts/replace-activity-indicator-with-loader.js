/*
  Bulk replace React Native ActivityIndicator usage in app TSX screens
  with the theme-aware LoadingIndicator (TriangleLoader wrapper).

  Usage:
    node scripts/replace-activity-indicator-with-loader.js
*/

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repoRoot, 'app');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      files.push(...walk(full));
    } else if (e.isFile() && full.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

function computeUiImport(filePath) {
  const relToApp = path.relative(appRoot, filePath); // e.g. (admin)\fees\students.tsx
  const dir = path.dirname(relToApp);
  const depthFromApp = dir === '.' ? 0 : dir.split(path.sep).length;
  const ups = depthFromApp + 1; // from app/* to repo root
  const prefix = Array.from({ length: ups }, () => '..').join('/');
  return `${prefix}/components/ui`;
}

function removeActivityIndicatorFromReactNativeImport(src) {
  // Handles both single-line and multi-line named imports.
  return src.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*['"]react-native['"];?/g,
    (match, inner) => {
      const parts = inner
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .filter(s => s !== 'ActivityIndicator');

      if (parts.length === 0) {
        // Unlikely, but avoid empty import braces.
        return match;
      }

      // Preserve multi-line formatting if original had newlines.
      const hasNewlines = inner.includes('\n');
      if (!hasNewlines) {
        return `import { ${parts.join(', ')} } from 'react-native';`;
      }

      const indentMatch = match.match(/import\s*\{\n(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '  ';
      const formatted = parts.map(p => `${indent}${p},`).join('\n');
      return `import {\n${formatted}\n} from 'react-native';`;
    }
  );
}

function ensureLoadingIndicatorImported(src, uiImportPath) {
  // If file already imports from components/ui barrel, add LoadingIndicator.
  const barrelImportRe = new RegExp(
    `import\\s*\\{([\\s\\S]*?)\\}\\s*from\\s*['\"]${uiImportPath.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}['\"];?`,
    'g'
  );

  if (barrelImportRe.test(src)) {
    return src.replace(barrelImportRe, (match, inner) => {
      if (inner.includes('LoadingIndicator')) return match;

      // Insert with minimal disturbance.
      if (!inner.includes('\n')) {
        const items = inner
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        items.push('LoadingIndicator');
        return `import { ${items.join(', ')} } from '${uiImportPath}';`;
      }

      // Multi-line: add on its own line (keep same indentation as others)
      const lines = inner.split('\n');
      // Find indentation used in existing imports (first non-empty line)
      const firstLine = lines.find(l => l.trim().length > 0) ?? '  ';
      const indent = firstLine.match(/^\s*/)?.[0] ?? '  ';
      const trimmedLines = lines.filter(l => l.trim().length > 0);
      // Add before closing brace (we're inside already)
      trimmedLines.push(`${indent}LoadingIndicator,`);
      return `import {\n${trimmedLines.join('\n')}\n} from '${uiImportPath}';`;
    });
  }

  // Otherwise, add a new import near the first components/ui import or after react-native import.
  if (src.includes("from '../../components/ui'") || src.includes("from '../../../components/ui'") || src.includes("from '../../../../components/ui'")) {
    // Some other relative barrel exists; skip and let the user patch manually.
    return src;
  }

  const insertion = `import { LoadingIndicator } from '${uiImportPath}';\n`;

  const rnImportMatch = src.match(/import[\s\S]*?from\s*['"]react-native['"];?\s*\n/);
  if (rnImportMatch) {
    const idx = rnImportMatch.index + rnImportMatch[0].length;
    return src.slice(0, idx) + insertion + src.slice(idx);
  }

  // Fallback: put at top.
  return insertion + src;
}

function replaceJsx(src) {
  // Replace ActivityIndicator tags (self-closing and open tags).
  src = src.replace(/<\s*ActivityIndicator\b/g, '<LoadingIndicator');
  // No closing tags expected; keep safe.
  return src;
}

function processFile(filePath) {
  const before = fs.readFileSync(filePath, 'utf8');
  if (!before.includes('ActivityIndicator')) return { changed: false };

  const uiImport = computeUiImport(filePath);

  let after = before;
  after = removeActivityIndicatorFromReactNativeImport(after);
  after = ensureLoadingIndicatorImported(after, uiImport);
  after = replaceJsx(after);

  if (after !== before) {
    fs.writeFileSync(filePath, after, 'utf8');
    return { changed: true };
  }
  return { changed: false };
}

const files = walk(appRoot);
let changedCount = 0;

for (const f of files) {
  const { changed } = processFile(f);
  if (changed) changedCount++;
}

console.log(`Done. Updated ${changedCount} file(s).`);
