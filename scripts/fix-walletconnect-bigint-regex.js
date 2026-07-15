#!/usr/bin/env node
/**
 * WalletConnect's @walletconnect/safe-json encodes BigInts as `${n}n` strings.
 * Upstream safeJsonParse only accepts /^\d+n$/ — negative values like "-100n"
 * (used for offer amounts) stay as strings and break parseMojos.
 *
 * patch-package fixes the safe-json package itself. Several WC UMD bundles
 * inline a copy of that parser; rewrite those too after install.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'node_modules', '@walletconnect');
const OLD = '/^\\d+n$/';
const NEW = '/^-?\\d+n$/';

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

let patched = 0;
for (const file of walk(ROOT)) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(OLD)) continue;
  fs.writeFileSync(file, text.split(OLD).join(NEW));
  patched += 1;
  console.log(`[fix-walletconnect-bigint-regex] ${path.relative(path.join(__dirname, '..'), file)}`);
}

console.log(`[fix-walletconnect-bigint-regex] patched ${patched} file(s)`);
