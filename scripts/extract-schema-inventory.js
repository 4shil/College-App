#!/usr/bin/env node
/*
  Extract tables, foreign keys, and SQL functions from SQL files.
  Sources scanned:
    - supabase/migrations (all .sql files)
    - database (all .sql files)

  Output: JSON (to stdout or --out <path>)

  Notes:
    - This is a best-effort parser (regex + lightweight block scanning), not a full SQL parser.
    - It specifically handles common Postgres FK patterns:
        - Inline: col TYPE REFERENCES other_table(id)
        - Table constraint: FOREIGN KEY (col) REFERENCES other_table(id)
        - Alter: ALTER TABLE t ADD CONSTRAINT ... FOREIGN KEY (col) REFERENCES other_table(id)
*/

const fs = require('fs');
const path = require('path');

const ROOTS = ['supabase/migrations', 'database'];

function listSqlFiles(rootRel) {
  const abs = path.join(process.cwd(), rootRel);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const fp = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(fp);
      else if (ent.isFile() && ent.name.toLowerCase().endsWith('.sql')) out.push(fp);
    }
  };
  walk(abs);
  return out;
}

function stripQuotes(s) {
  return String(s || '').trim().replace(/^"|"$/g, '');
}

function splitIdent(full) {
  const cleaned = stripQuotes(full);
  if (!cleaned) return { schema: null, name: '' };
  const parts = cleaned.split('.').map(stripQuotes);
  if (parts.length === 1) return { schema: null, name: parts[0] };
  return { schema: parts.slice(0, -1).join('.'), name: parts[parts.length - 1] };
}

function splitColumnsList(list) {
  return String(list || '')
    .split(',')
    .map((s) => stripQuotes(s.trim()))
    .filter(Boolean);
}

function addTable(tables, name, definedIn, fullName) {
  if (!name) return;
  if (!tables.has(name)) {
    tables.set(name, { name, definedIn: new Set(), fullNames: new Set() });
  }
  const t = tables.get(name);
  if (definedIn) t.definedIn.add(definedIn);
  if (fullName) t.fullNames.add(fullName);
}

function addFunction(functions, name, file) {
  if (!name) return;
  const key = `${name}@@${file}`;
  if (functions._seen.has(key)) return;
  functions._seen.add(key);
  functions.items.push({ name, file });
}

function addFk(fks, fk) {
  const fromTable = fk.fromTable;
  const toTable = fk.toTable;
  const fromCol = fk.fromCol;
  const toCol = fk.toCol;
  if (!fromTable || !toTable || !fromCol || !toCol) return;

  const key = `${fromTable}.${fromCol}->${toTable}.${toCol}`;
  if (!fks.has(key)) {
    fks.set(key, {
      fromTable,
      fromCol,
      toTable,
      toCol,
      sources: new Set(),
    });
  }
  fks.get(key).sources.add(fk.source);
}

function sanitizeForMermaid(name) {
  return String(name).replace(/[^A-Za-z0-9_]/g, '_');
}

function findCreateTableBlocks(sql) {
  const blocks = [];
  const re = /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w\.\"]+)/gi;
  for (const m of sql.matchAll(re)) {
    const tableFull = stripQuotes(m[1]);
    const start = m.index;
    // Find the first '(' after CREATE TABLE <name>
    const openIdx = sql.indexOf('(', start);
    if (openIdx === -1) continue;
    let depth = 0;
    let endIdx = -1;
    for (let i = openIdx; i < sql.length; i++) {
      const ch = sql[i];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx === -1) continue;

    const body = sql.slice(openIdx + 1, endIdx);
    blocks.push({ tableFull, body, startIndex: start, openIdx, endIdx });
  }
  return blocks;
}

function main() {
  const args = process.argv.slice(2);
  const outArgIdx = args.indexOf('--out');
  const outPath = outArgIdx >= 0 ? args[outArgIdx + 1] : null;

  const sqlFiles = ROOTS.flatMap(listSqlFiles);
  const tables = new Map();
  const fks = new Map();
  const functions = { items: [], _seen: new Set() };

  // Parse per file
  for (const fp of sqlFiles) {
    const rel = path.relative(process.cwd(), fp).replace(/\\/g, '/');
    const sql = fs.readFileSync(fp, 'utf8');

    // CREATE TABLE tables
    for (const m of sql.matchAll(/\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w\.\"]+)/gi)) {
      const full = stripQuotes(m[1]);
      const { schema, name } = splitIdent(full);
      addTable(tables, name, rel, schema ? `${schema}.${name}` : name);
    }

    // ALTER TABLE ... FOREIGN KEY ... REFERENCES
    const alterFkRe = /\bALTER\s+TABLE\s+(?:ONLY\s+)?([\w\.\"]+)\s+ADD\s+CONSTRAINT\s+[\w\"]+\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+([\w\.\"]+)\s*\(([^)]+)\)/gi;
    for (const m of sql.matchAll(alterFkRe)) {
      const fromFull = stripQuotes(m[1]);
      const toFull = stripQuotes(m[3]);
      const fromCols = splitColumnsList(m[2]);
      const toCols = splitColumnsList(m[4]);
      const from = splitIdent(fromFull);
      const to = splitIdent(toFull);

      addTable(tables, from.name, rel, from.schema ? `${from.schema}.${from.name}` : from.name);
      addTable(tables, to.name, null, to.schema ? `${to.schema}.${to.name}` : to.name);

      const count = Math.min(fromCols.length, toCols.length);
      for (let i = 0; i < count; i++) {
        addFk(fks, {
          fromTable: from.name,
          fromCol: fromCols[i],
          toTable: to.name,
          toCol: toCols[i],
          source: rel,
        });
      }
    }

    // CREATE TABLE blocks: inline refs and constraint refs
    const blocks = findCreateTableBlocks(sql);
    for (const b of blocks) {
      const from = splitIdent(b.tableFull);
      addTable(tables, from.name, rel, from.schema ? `${from.schema}.${from.name}` : from.name);

      // Inline column references
      const inlineRefRe = /^\s*([\w\"]+)\s+[^,\n]*?\bREFERENCES\s+([\w\.\"]+)\s*\(\s*([\w\"]+)\s*\)/gmi;
      for (const m of b.body.matchAll(inlineRefRe)) {
        const fromCol = stripQuotes(m[1]);
        const toFull = stripQuotes(m[2]);
        const toCol = stripQuotes(m[3]);
        const to = splitIdent(toFull);

        addTable(tables, to.name, null, to.schema ? `${to.schema}.${to.name}` : to.name);
        addFk(fks, { fromTable: from.name, fromCol, toTable: to.name, toCol, source: rel });
      }

      // Table constraint FK (with or without CONSTRAINT)
      const constraintFkRe = /\b(?:CONSTRAINT\s+[\w\"]+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+([\w\.\"]+)\s*\(([^)]+)\)/gi;
      for (const m of b.body.matchAll(constraintFkRe)) {
        const fromCols = splitColumnsList(m[1]);
        const toFull = stripQuotes(m[2]);
        const toCols = splitColumnsList(m[3]);
        const to = splitIdent(toFull);

        addTable(tables, to.name, null, to.schema ? `${to.schema}.${to.name}` : to.name);
        const count = Math.min(fromCols.length, toCols.length);
        for (let i = 0; i < count; i++) {
          addFk(fks, {
            fromTable: from.name,
            fromCol: fromCols[i],
            toTable: to.name,
            toCol: toCols[i],
            source: rel,
          });
        }
      }
    }

    // Functions
    for (const m of sql.matchAll(/\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([\w\.\"]+)\s*\(/gi)) {
      const full = stripQuotes(m[1]);
      const { name } = splitIdent(full);
      addFunction(functions, name, rel);
    }
  }

  // Identify external tables (not created here)
  const created = new Set();
  for (const [name, info] of tables.entries()) {
    if (info.definedIn.size > 0) created.add(name);
  }
  const externalTables = [...tables.keys()].filter((t) => !created.has(t)).sort((a, b) => a.localeCompare(b));

  const out = {
    generatedAt: new Date().toISOString(),
    sqlFileCount: sqlFiles.length,
    tables: [...tables.values()]
      .map((t) => ({
        name: t.name,
        definedIn: [...t.definedIn].sort(),
        fullNames: [...t.fullNames].sort(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    externalTables,
    foreignKeys: [...fks.values()]
      .map((r) => ({
        fromTable: r.fromTable,
        fromCol: r.fromCol,
        toTable: r.toTable,
        toCol: r.toCol,
        sources: [...r.sources].sort(),
      }))
      .sort((a, b) => `${a.fromTable}.${a.fromCol}`.localeCompare(`${b.fromTable}.${b.fromCol}`)),
    functions: functions.items.sort((a, b) => a.name.localeCompare(b.name)),
    _mermaid: {
      sanitizeForMermaid,
    },
  };

  const json = JSON.stringify(out, null, 2);
  if (outPath) {
    fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
    fs.writeFileSync(path.resolve(outPath), json, 'utf8');
  } else {
    process.stdout.write(json);
  }
}

main();
