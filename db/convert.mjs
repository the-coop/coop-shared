// One-off migration tool: converts the Postgres COPY data (extracted from the Heroku
// dump via `pg_restore --data-only --no-owner --no-privileges`) into MySQL INSERT
// statements compatible with db/schema.sql.
//
// Usage:
//   node db/convert.mjs <pg_data.sql> <out.sql>
//   # e.g. node db/convert.mjs ./pg_data.sql ./db/data.sql
//
// Handles: pg COPY escapes (\n \t \r \b \f \v \\ and \N -> NULL), boolean t/f -> 1/0,
// and MySQL-safe string escaping. Output is wrapped in FOREIGN_KEY_CHECKS=0 so table
// order is irrelevant.

import { readFileSync, writeFileSync } from 'node:fs';

const [, , inPath = './pg_data.sql', outPath = './db/data.sql'] = process.argv;

// Columns that are boolean in Postgres and TINYINT(1) in MySQL.
const BOOLEAN_COLS = {
    donations: new Set(['acknowledged']),
    events: new Set(['active']),
};

const CHUNK = 100; // rows per multi-row INSERT

// Decode a single pg COPY field (already tab-split). \N is handled by the caller.
function decodeCopyField(s) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c !== '\\') { out += c; continue; }
        const n = s[++i];
        switch (n) {
            case 'n': out += '\n'; break;
            case 't': out += '\t'; break;
            case 'r': out += '\r'; break;
            case 'b': out += '\b'; break;
            case 'f': out += '\f'; break;
            case 'v': out += '\v'; break;
            case '\\': out += '\\'; break;
            default: out += n; break; // unknown escape -> literal char
        }
    }
    return out;
}

// Escape a decoded string for a MySQL single-quoted literal.
function mysqlQuote(s) {
    let out = "'";
    for (const ch of s) {
        switch (ch) {
            case '\\': out += '\\\\'; break;
            case "'": out += "\\'"; break;
            case '\n': out += '\\n'; break;
            case '\r': out += '\\r'; break;
            case '\t': out += '\\t'; break;
            case '\0': out += '\\0'; break;
            case '\x1a': out += '\\Z'; break;
            default: out += ch;
        }
    }
    return out + "'";
}

const text = readFileSync(inPath, 'utf8');
const lines = text.split('\n');

const chunks = ['SET NAMES utf8mb4;', 'SET FOREIGN_KEY_CHECKS = 0;', ''];
let totalRows = 0;
const perTable = {};

let i = 0;
while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^COPY "public"\."([^"]+)" \(([^)]*)\) FROM stdin;/);
    if (!m) { i++; continue; }

    const table = m[1];
    const cols = m[2].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const boolSet = BOOLEAN_COLS[table] || new Set();
    const colList = cols.map(c => '`' + c + '`').join(', ');

    i++; // move past COPY header
    const rows = [];
    while (i < lines.length && lines[i] !== '\\.') {
        const raw = lines[i];
        i++;
        if (raw === '') continue;
        const fields = raw.split('\t');
        const vals = fields.map((f, idx) => {
            if (f === '\\N') return 'NULL';
            const decoded = decodeCopyField(f);
            if (boolSet.has(cols[idx])) {
                return decoded === 't' ? '1' : decoded === 'f' ? '0' : mysqlQuote(decoded);
            }
            return mysqlQuote(decoded);
        });
        rows.push('(' + vals.join(', ') + ')');
    }
    i++; // move past the terminating "\."

    perTable[table] = rows.length;
    totalRows += rows.length;
    if (!rows.length) continue;

    chunks.push(`-- ${table} (${rows.length} rows)`);
    for (let r = 0; r < rows.length; r += CHUNK) {
        const batch = rows.slice(r, r + CHUNK);
        chunks.push(`INSERT INTO \`${table}\` (${colList}) VALUES\n${batch.join(',\n')};`);
    }
    chunks.push('');
}

chunks.push('SET FOREIGN_KEY_CHECKS = 1;', '');
writeFileSync(outPath, chunks.join('\n'));

// Report per-table counts to stderr for verification against the dump.
console.error(`Wrote ${outPath}: ${totalRows} rows across ${Object.keys(perTable).length} tables`);
for (const [t, n] of Object.entries(perTable).sort()) console.error(`  ${t}: ${n}`);
