import { execFileSync } from 'node:child_process';
import path from 'node:path';

// Keep the real downloader/limiter/filesystem integration isolated from other
// suites' Electron mocks. The child supplies Electron request events, not real
// network access, and advances deterministic clocks around real file cleanup.
it('enforces metadata deadlines through preload, CacheManager and downloadFile', () => {
  const output = execFileSync(process.execPath, [path.resolve(__dirname, '../../tests/audit/metadata-deadline.cjs')], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  expect(output).toContain('16/16 focused production-source regressions passed');
}, 35_000);
