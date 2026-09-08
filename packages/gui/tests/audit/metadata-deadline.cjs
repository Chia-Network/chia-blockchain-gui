// Executes repository production TS via the pinned TypeScript dependency. Network is an Electron
// event double; filesystem, byte hashing, request cleanup and limit are real.
const ts = require('typescript');
const fs = require('node:fs');
const fsp = fs.promises;
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const root = path.resolve(__dirname, '../../src');
const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}
async function spin(predicate) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise(setImmediate);
  }
  throw new Error('asynchronous operation did not reach expected state');
}
function environment() {
  let now = 0,
    id = 0;
  const timers = new Map(),
    requests = [],
    handlers = new Map(),
    exposed = {};
  const clock = {
    advance(ms) {
      const target = now + ms;
      for (;;) {
        let next;
        for (const [key, t] of timers) if (t.at <= target && (!next || t.at < next[1].at)) next = [key, t];
        if (!next) break;
        now = next[1].at;
        timers.delete(next[0]);
        next[1].fn();
      }
      now = target;
    },
    get now() {
      return now;
    },
    get pending() {
      return timers.size;
    },
  };
  class TestDate extends Date {
    static now() {
      return now;
    }
  }
  class Request extends EventEmitter {
    constructor(url) {
      super();
      this.url = url;
      this.aborted = false;
      requests.push(this);
    }
    setHeader() {}
    followRedirect() {}
    end() {
      this.ended = true;
    }
    abort() {
      if (!this.aborted) {
        this.aborted = true;
        this.emit('abort');
      }
    }
    response(status = 200) {
      const r = new EventEmitter();
      r.statusCode = status;
      r.headers = { 'content-type': 'application/json' };
      this.emit('response', r);
      this.incoming = r;
      return r;
    }
    succeed(text) {
      const r = this.response();
      r.emit('data', Buffer.from(text));
      r.emit('end');
    }
  }
  const cache = new Map();
  const moduleDefault = (x) => ({ __esModule: true, default: x });
  const state = { CACHED: 'CACHED', ERROR: 'ERROR', NOT_CACHED: 'NOT_CACHED' };
  const electron = {
    // downloadFile passes { url, redirect: 'manual' }; older callers a string
    net: { request: (options) => new Request(typeof options === 'string' ? options : options.url) },
    BrowserWindow: class {},
    dialog: { showOpenDialog: async () => ({ canceled: true }) },
    contextBridge: { exposeInMainWorld: (name, value) => (exposed[name] = value) },
    ipcRenderer: { invoke: (channel, ...args) => handlers.get(channel)(...args), on() {}, off() {} },
  };
  const sandbox = {
    console,
    Buffer,
    TextDecoder,
    AbortController,
    URL,
    URLSearchParams,
    Error,
    Date: TestDate,
    setTimeout: (fn, ms) => {
      timers.set(++id, { at: now + Number(ms), fn });
      return id;
    },
    clearTimeout: (key) => timers.delete(key),
  };
  const context = vm.createContext(sandbox);
  let cacheBinding;
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const source = fs.readFileSync(file, 'utf8');
    const result = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
      reportDiagnostics: true,
    });
    assert.equal(
      result.diagnostics?.filter((d) => d.category === ts.DiagnosticCategory.Error).length,
      0,
      file + ' parse diagnostics',
    );
    const module = { exports: {} };
    cache.set(file, module);
    function localRequire(name) {
      if (name === 'electron') return electron;
      if (name === 'debug') return moduleDefault(() => () => {});
      if (name === 'react') return { useCallback: (fn) => fn };
      if (name === './useCache') return moduleDefault(() => cacheBinding);
      if (name.endsWith('/compareChecksums'))
        return moduleDefault((a, b) => a.replace(/^0x/, '') === b.replace(/^0x/, ''));
      if (name.endsWith('/parseFileContent')) return moduleDefault((content) => new TextDecoder().decode(content));
      if (name.endsWith('/CacheState')) return moduleDefault(state);
      if (name.endsWith('/ipfsGateway'))
        return {
          IpfsGatewayDisabledError: class extends Error {},
          toFetchableUrl: (s) => s,
          ipfsGatewayEnabled: () => true,
          ipfsGatewayBase: () => 'https://ipfs.io/ipfs/',
        };
      if (name.endsWith('/ipcMainHandle')) return moduleDefault((name, fn) => handlers.set(name, fn));
      if (name.endsWith('/ensureDirectoryExists')) return moduleDefault((p) => fsp.mkdir(p, { recursive: true }));
      if (name.endsWith('/getChecksum'))
        return moduleDefault(async (p) =>
          crypto
            .createHash('sha256')
            .update(await fsp.readFile(p))
            .digest('hex'),
        );
      if (name.endsWith('/fileExists'))
        return moduleDefault(async (p) => {
          try {
            await fsp.stat(p);
            return true;
          } catch {
            return false;
          }
        });
      if (name.endsWith('/sanitizeFilename')) return moduleDefault((s) => s);
      if (name.endsWith('/sanitizeNumber')) return moduleDefault((s) => Number(s));
      if (name.endsWith('/limit')) return load(path.join(root, 'util/limit.ts'));
      if (name === './constants/API' || name === './API')
        return moduleDefault({
          APP: 'app',
          PREFERENCES: 'preferences',
          CHIA_LOGS: 'chiaLogs',
          LINK: 'link',
          PERMISSIONS: 'permissions',
          ADDRESS_BOOK: 'addressBook',
          CACHE: 'cache',
          WEBSOCKET: 'websocket',
        });
      if (name.startsWith('./constants/') && !name.endsWith('/CacheAPI'))
        return moduleDefault(new Proxy({}, { get: (_, k) => String(k) }));
      if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name + '.ts'));
      return require(name);
    }
    vm.runInContext(`(function(exports,require,module,__filename,__dirname){${result.outputText}\n})`, context, {
      filename: file,
    })(module.exports, localRequire, module, file, path.dirname(file));
    return module.exports;
  }
  return { clock, requests, handlers, exposed, load, bind: (binding) => (cacheBinding = binding) };
}
async function withManager(fn, concurrency = 1) {
  const env = environment();
  const { default: CacheManager } = env.load(path.join(root, 'electron/CacheManager.ts'));
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'pr3062-'));
  const manager = new CacheManager({ cacheDirectory: dir, maxCacheSize: 1024 * 1024, concurrency });
  await manager.init();
  try {
    await fn({ ...env, manager, dir });
  } finally {
    for (const r of env.requests) r.abort();
    await spin(() => manager.ongoingRequests.size === 0);
    await fsp.rm(dir, { recursive: true, force: true });
  }
}
test('invalid IPC durations are refused before any request', async () =>
  withManager(async ({ manager, requests }) => {
    for (const maxDuration of [0, -1, NaN, Infinity, '100', null])
      await assert.rejects(manager.getContent('https://test.invalid/x', { maxDuration }), /positive finite/);
    assert.equal(requests.length, 0);
  }));
test('active trickle hits absolute deadline, aborts real downloader, deletes temp and releases slot', async () =>
  withManager(async ({ manager, requests, clock, dir }) => {
    const first = manager.getContent('https://test.invalid/slow', { maxDuration: 100 });
    const failure = assert.rejects(first, /download deadline/);
    await spin(() => requests.length === 1);
    const response = requests[0].response();
    response.emit('data', Buffer.from('{'));
    const second = manager.getContent('https://test.invalid/next', { maxDuration: 100 });
    await spin(() => manager.ongoingRequests.size === 2);
    clock.advance(90);
    response.emit('data', Buffer.from(' '));
    clock.advance(10);
    await failure;
    assert.equal(requests[0].aborted, true);
    await spin(() => requests.length === 2);
    requests[1].succeed('{}');
    await second;
    assert.equal(
      (await fsp.readdir(dir)).some((f) => f.endsWith('.tmp')),
      false,
    );
    const [info] = await manager.getCacheInfos(['https://test.invalid/slow']);
    assert.match(info.error, /download deadline/);
    const count = requests.length;
    await assert.rejects(manager.getContent('https://test.invalid/slow', { maxDuration: 100 }), /download deadline/);
    assert.equal(requests.length, count);
    assert.equal(clock.pending, 0);
  }));
test('a first metadata request queued longer than its allowance still gets its full transfer share', async () =>
  withManager(async ({ manager, requests, clock }) => {
    const first = manager.getContent('https://test.invalid/video');
    await spin(() => requests.length === 1);
    const second = manager.getContent('https://test.invalid/metadata', { maxDuration: 100 });
    const failure = assert.rejects(second, /download deadline/);
    await spin(() => manager.ongoingRequests.size === 2);
    clock.advance(200);
    assert.equal(requests[0].aborted, false);
    assert.equal(requests.length, 1);
    requests[0].succeed('{}');
    await first;
    await spin(() => requests.length === 2);
    clock.advance(99);
    assert.equal(requests[1].aborted, false);
    clock.advance(1);
    await failure;
  }));
test('metadata joining an active video-sized request gives up after its own allowance and leaves the transfer running', async () =>
  withManager(async ({ manager, requests, clock }) => {
    const first = manager.getContent('https://test.invalid/shared');
    await spin(() => requests.length === 1);
    clock.advance(80);
    const joined = manager.getContent('https://test.invalid/shared', { maxDuration: 100 });
    const joinedRejected = assert.rejects(joined, /shared download deadline/);
    await spin(() => manager.ongoingRequests.size === 1);
    clock.advance(99);
    assert.equal(requests[0].aborted, false);
    clock.advance(1);
    await joinedRejected;
    // the transfer another caller is waiting on was not touched
    assert.equal(requests[0].aborted, false);
    assert.equal(requests.length, 1);
    requests[0].succeed('{}');
    await first;
  }));
test('joining a transfer that has run longer than the allowance is refused after the allowance, not at once', async () =>
  withManager(async ({ manager, requests, clock }) => {
    const first = manager.getContent('https://test.invalid/late');
    await spin(() => requests.length === 1);
    clock.advance(200);
    const joined = manager.getContent('https://test.invalid/late', { maxDuration: 100 });
    const r2 = assert.rejects(joined, /shared download deadline/);
    await spin(() => manager.ongoingRequests.size === 1);
    clock.advance(99);
    assert.equal(requests[0].aborted, false);
    clock.advance(1);
    await r2;
    assert.equal(requests[0].aborted, false);
    requests[0].succeed('{}');
    await first;
  }));
test('a longer coalesced caller retries after the short owner deadline within its remaining allowance', async () =>
  withManager(async ({ manager, requests, clock }) => {
    const r1 = assert.rejects(manager.getContent('https://test.invalid/short', { maxDuration: 100 }), /deadline/);
    await spin(() => requests.length === 1);
    clock.advance(50);
    const r2 = manager.getContent('https://test.invalid/short', { maxDuration: 200 });
    await new Promise(setImmediate);
    clock.advance(50);
    await r1;
    assert.equal(requests[0].aborted, true);
    await spin(() => requests.length === 2);
    clock.advance(149);
    assert.equal(requests[1].aborted, false);
    requests[1].succeed('{}');
    assert.equal((await r2).toString(), '{}');
  }));
test('a joiner of a queued transfer is not charged for the queue wait, and gives up after its allowance once the transfer runs', async () =>
  withManager(async ({ manager, requests, clock }) => {
    const video = manager.getContent('https://test.invalid/queue-video');
    await spin(() => requests.length === 1);
    const queued = manager.getContent('https://test.invalid/shared-queue');
    const joined = manager.getContent('https://test.invalid/shared-queue', { maxDuration: 100 });
    const r2 = assert.rejects(joined, /shared download deadline/);
    await spin(() => manager.ongoingRequests.size === 2);
    clock.advance(1000);
    assert.equal(requests.length, 1);
    requests[0].succeed('{}');
    await video;
    await spin(() => requests.length === 2);
    clock.advance(99);
    assert.equal(requests[1].aborted, false);
    clock.advance(1);
    await r2;
    assert.equal(requests[1].aborted, false);
    requests[1].succeed('{}');
    await queued;
  }));
test('content+headers+checksum returns a single network result and hashes returned bytes', async () =>
  withManager(async ({ manager, requests }) => {
    const result = manager.getContentWithInfo('https://test.invalid/bundle', { maxDuration: 1000 });
    await spin(() => requests.length === 1);
    requests[0].succeed('{"name":"nft"}');
    const value = await result;
    assert.equal(Buffer.from(value.content).toString(), '{"name":"nft"}');
    assert.equal(value.headers['content-type'], 'application/json');
    assert.equal(value.checksum, crypto.createHash('sha256').update(value.content).digest('hex'));
    const again = await manager.getContentWithInfo('https://test.invalid/bundle', { maxDuration: 1000 });
    assert.equal(again.checksum, value.checksum);
    assert.equal(requests.length, 1);
  }));
test('bundle reads honor the migration barrier from PR3068', async () =>
  withManager(async ({ manager, requests }) => {
    const url = 'https://test.invalid/maintenance';
    const first = manager.getContentWithInfo(url, { maxDuration: 1000 });
    await spin(() => requests.length === 1);
    requests[0].succeed('{}');
    await first;
    let release;
    manager.maintenance = new Promise((resolve) => {
      release = resolve;
    });
    let completed = false;
    const pending = manager.getContentWithInfo(url, { maxDuration: 1000 }).then((value) => {
      completed = true;
      return value;
    });
    for (let i = 0; i < 50; i++) await new Promise(setImmediate);
    assert.equal(completed, false);
    manager.maintenance = undefined;
    release();
    await pending;
    assert.equal(completed, true);
  }));
test('metadata helper reserves <=60 seconds across all five transfers including the first', async () => {
  const env = environment();
  const helper = env.load(path.join(root, 'util/fetchMetadataFromUris.ts'));
  const calls = [];
  await assert.rejects(
    helper.default(
      Array.from({ length: 20 }, (_, i) => 'https://test.invalid/' + i),
      'hash',
      async (u, h, o) => {
        calls.push(o.maxDuration);
        env.clock.advance(o.maxDuration);
        throw new Error('failed');
      },
    ),
  );
  assert.equal(calls.length, 5);
  assert.equal(
    calls.reduce((a, b) => a + b, 0),
    60000,
  );
  assert.equal(calls[0], 12000);
});
test('metadata helper preserves no-hash single URI, first success and mismatch priority', async () => {
  const env = environment();
  const { default: fetch, CHECKSUM_MISMATCH_ERROR } = env.load(path.join(root, 'util/fetchMetadataFromUris.ts'));
  let count = 0;
  await assert.rejects(
    fetch(['a', 'b'], undefined, async (u, h, o) => {
      count++;
      assert.equal(u, 'a');
      assert.equal(o.maxDuration, 60000);
      throw new Error('failed');
    }),
  );
  assert.equal(count, 1);
  count = 0;
  assert.equal(
    await fetch(['a', 'b'], 'hash', async () => {
      count++;
      return 42;
    }),
    42,
  );
  assert.equal(count, 1);
  await assert.rejects(
    fetch(['a', 'b'], 'hash', async (u) => {
      throw new Error(u === 'b' ? CHECKSUM_MISMATCH_ERROR : 'network');
    }),
    /Checksum mismatch/,
  );
});
test('metadata wrapper passes one bounded call and validates before parsing', async () => {
  const env = environment();
  let calls = 0;
  env.bind({
    getContentWithInfo: async (u, o) => {
      calls++;
      assert.equal(o.maxDuration, 12000);
      return { checksum: 'hash', headers: {}, content: Buffer.from('{"ok":true}') };
    },
  });
  const fn = env.load(path.join(root, 'hooks/useFetchAndProcessMetadata.ts')).default();
  const data = await fn('a', 'hash', { maxDuration: 12000 });
  assert.equal(data.ok, true);
  assert.equal(calls, 1);
  env.bind({ getContentWithInfo: async () => ({ checksum: 'wrong', headers: {}, content: Buffer.from('not JSON') }) });
  const fn2 = env.load(path.join(root, 'hooks/useFetchAndProcessMetadata.ts')).default();
  await assert.rejects(fn2('a', 'hash'), /Checksum mismatch/);
});
test('preload forwards the bounded options to the registered main-process bundle handler', async () =>
  withManager(async (env) => {
    env.load(path.join(root, 'electron/preload.ts'));
    const result = env.exposed.cache.getContentWithInfo('https://test.invalid/ipc', { maxDuration: 100 });
    const failure = assert.rejects(result, /deadline/);
    await spin(() => env.requests.length === 1);
    env.clock.advance(100);
    await failure;
  }));
test('write-open failure rejects rather than leaking a slot', async () =>
  withManager(async ({ manager, requests, dir }) => {
    const url = 'https://test.invalid/bad-write';
    const file = crypto.createHash('md5').update(url).digest('hex') + '-chiacache.tmp';
    await fsp.mkdir(path.join(dir, file));
    await assert.rejects(manager.getContent(url, { maxDuration: 1000 }), /EISDIR|EACCES|EPERM/);
    assert.equal(requests[0].aborted, true);
    const next = manager.getContent('https://test.invalid/good-write', { maxDuration: 1000 });
    await spin(() => requests.length === 2);
    requests[1].succeed('{}');
    await next;
  }));
test('gateway fallback consumes only the remaining metadata deadline', async () =>
  withManager(async ({ manager, requests, clock }) => {
    const url = 'https://nftstorage.link/ipfs/bafybeigdyrztest/metadata.json';
    const failure = assert.rejects(manager.getContentWithInfo(url, { maxDuration: 100 }), /download deadline/);
    await spin(() => requests.length === 1);
    clock.advance(70);
    requests[0].response(503);
    await spin(() => requests.length === 2);
    assert.equal(requests[1].url, 'https://ipfs.io/ipfs/bafybeigdyrztest/metadata.json');
    clock.advance(29);
    assert.equal(requests[1].aborted, false);
    clock.advance(1);
    await failure;
    assert.equal(requests[1].aborted, true);
    assert.equal(manager.ongoingRequests.size, 0);
  }));
test('joining an active fallback is bounded by the joining allowance and leaves the fallback running', async () =>
  withManager(async ({ manager, requests, clock }) => {
    const url = 'https://nftstorage.link/ipfs/bafybeigdyrztest/join.json';
    const first = manager.getContent(url);
    await spin(() => requests.length === 1);
    clock.advance(60);
    requests[0].response(503);
    await spin(() => requests.length === 2);
    clock.advance(20);
    const joined = assert.rejects(manager.getContentWithInfo(url, { maxDuration: 100 }), /shared download deadline/);
    await spin(() => manager.ongoingRequests.size === 1);
    clock.advance(100);
    await joined;
    assert.equal(requests[1].aborted, false);
    requests[1].succeed('{}');
    await first;
  }));
test('a read retry after a completed clear keeps its remaining active budget', async () =>
  withManager(async ({ manager, requests, clock }) => {
    const url = 'https://test.invalid/clear-after-success';
    let cleared = false;
    const original = manager.fetchRemoteContent.bind(manager);
    manager.fetchRemoteContent = async (...args) => {
      const info = await original(...args);
      if (!cleared && info.state === 'CACHED') {
        cleared = true;
        await manager.clearCache();
      }
      return info;
    };
    const failure = assert.rejects(manager.getContentWithInfo(url, { maxDuration: 100 }), /download deadline/);
    await spin(() => requests.length === 1);
    clock.advance(70);
    requests[0].succeed('{}');
    await spin(() => requests.length === 2);
    clock.advance(29);
    assert.equal(requests[1].aborted, false);
    clock.advance(1);
    await failure;
    assert.equal(requests[1].aborted, true);
  }));
(async () => {
  let passed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log('PASS ' + name);
      passed++;
    } catch (e) {
      console.error('FAIL ' + name, e);
      process.exitCode = 1;
      break;
    }
  }
  console.log(`${passed}/${tests.length} focused production-source regressions passed`);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
