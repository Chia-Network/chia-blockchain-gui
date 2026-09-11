// Run with Electron 43: electron tests/audit/electron-cache-smoke.cjs
// Headless containers can run the four main-process checks with --cache-only.
// Uses the real Electron network stack, local HTTP gateway and filesystem.
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const assert = require('node:assert/strict');
const ts = require('typescript');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'chia-electron-audit-'));
process.env.CHIA_ROOT = scratch;
app.setPath('userData', path.join(scratch, 'electron'));
app.disableHardwareAcceleration();
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(
    ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText,
    filename,
  );
};
const sourceRoot = path.resolve(__dirname, '../../src');
let server;
let window;
(async () => {
  await app.whenReady();
  let requests = 0;
  server = http.createServer((req, res) => {
    requests += 1;
    if (req.url.endsWith('/slow')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.write('{');
    } else {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"name":"verified"}');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const userData = require(path.join(sourceRoot, 'electron/utils/userData.ts')).getUserDataDir();
  await fsp.mkdir(userData, { recursive: true });
  require(path.join(sourceRoot, 'electron/prefs.ts')).savePrefs({
    nftIpfsGateway: true,
    nftIpfsGatewayUrl: `http://127.0.0.1:${server.address().port}/ipfs/`,
  });
  const CacheManager = require(path.join(sourceRoot, 'electron/CacheManager.ts')).default;
  const manager = new CacheManager({ cacheDirectory: path.join(scratch, 'cache'), concurrency: 1 });
  await manager.init();
  const url = 'ipfs://bafybeigdyrztest/metadata.json';
  assert.equal((await manager.getContentWithInfo(url)).content.toString(), '{"name":"verified"}');
  console.log('PASS real Electron gateway download and bundled bytes');
  const read = manager.getContentWithInfo(url);
  await manager.clearCache();
  assert.equal((await read).content.toString(), '{"name":"verified"}');
  console.log('PASS real Electron bundled read overlapping clear');
  const destination = path.join(scratch, 'migrated');
  await fsp.mkdir(destination);
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [destination] });
  await manager.setCacheDirectory();
  await manager.invalidate(url);
  assert.equal((await manager.getCacheInfos([url]))[0].state, 'NOT_CACHED');
  assert.equal((await manager.getContentWithInfo(url)).content.toString(), '{"name":"verified"}');
  console.log('PASS real Electron migration, refresh and redownload');
  await assert.rejects(manager.getContent('ipfs://bafybeigdyrztest/slow', { maxDuration: 100 }), /download deadline/);
  assert.equal(manager.ongoingRequests.size, 0);
  assert.equal(
    (await fsp.readdir(destination)).some((file) => file.endsWith('.tmp')),
    false,
  );
  console.log('PASS real Electron deadline abort and temp cleanup');
  if (process.argv.includes('--cache-only')) {
    console.log(`4/4 Electron cache scenarios passed (${requests} local requests)`);
    return;
  }
  window = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  await window.loadURL('data:text/html,<html><body></body></html>');
  const probeSource = ts.transpileModule(
    fs.readFileSync(path.join(sourceRoot, 'util/probeMediaPlayability.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const wav = Buffer.alloc(44 + 800);
  wav.write('RIFF');
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(8000, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(800, 40);
  wav.fill(128, 44);
  const result = await window.webContents.executeJavaScript(
    `(async () => { const exports = {}; ${probeSource}\n return Promise.all([exports.default(${JSON.stringify('data:audio/wav;base64,' + wav.toString('base64'))}, 'audio'), exports.default('data:video/mp4;base64,YmFk', 'video')]); })()`,
  );
  assert.deepEqual(result, ['playable', 'unsupported']);
  console.log('PASS real Chromium playable and unsupported media probes');
  console.log(`5/5 Electron smoke scenarios passed (${requests} local requests)`);
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    window?.destroy();
    server?.closeAllConnections();
    server?.close();
    await fsp.rm(scratch, { recursive: true, force: true });
    app.exit(process.exitCode || 0);
  });
setTimeout(() => {
  console.error('Electron smoke deadline exceeded');
  app.exit(1);
}, 30000).unref();
