/**
 * Compiles every sebuf RPC gateway (api/<domain>/v1/[rpc].ts) into a
 * self-contained ESM bundle (api/<domain>/v1/[rpc].js) so the Tauri sidecar's
 * buildRouteTable() can discover and load it.
 *
 * Run: node scripts/build-sidecar-sebuf.mjs
 * Or:  npm run build:sidecar-sebuf
 */

import { build } from 'esbuild';
import { readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const apiDir = path.join(projectRoot, 'api');

const domains = (await readdir(apiDir, { withFileTypes: true }))
  .filter(d => d.isDirectory())
  .map(d => d.name);

let built = 0;
let failed = 0;

for (const domain of domains) {
  const entryPoint = path.join(apiDir, domain, 'v1', '[rpc].ts');
  if (!existsSync(entryPoint)) continue;

  const outfile = path.join(apiDir, domain, 'v1', '[rpc].js');
  try {
    await build({
      entryPoints: [entryPoint],
      outfile,
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      treeShaking: true,
      logLevel: 'silent',
    });
    const { size } = await stat(outfile);
    const sizeKB = (size / 1024).toFixed(1);
    console.log(`  ✓ api/${domain}/v1/[rpc].js  ${sizeKB} KB`);
    built++;
  } catch (err) {
    console.error(`  ✗ api/${domain}/v1/[rpc].ts  ${err.message}`);
    failed++;
  }
}

console.log(`\nbuild:sidecar-sebuf  ${built} compiled, ${failed} failed`);
if (failed > 0) process.exit(1);
