# PR #3068 audit follow-up: serialize directory migration with downloads and clear

## 2026-09-07: enforce the quota for failed-download records

Eviction now groups every owned file by its cache entry, including standalone
ERROR sidecars and stale sidecar temporary files. Its byte total therefore
matches the size display even when no download succeeds. Housekeeping runs
after saving failures as well as successes. The newest result stays available
to its caller, while older entries can be removed to meet the configured quota.

Eviction passes are serialized so concurrent failure completions do not all
skip each other's unfinished writes and leave the cache permanently oversized.
Active downloads and leased reads protect all files belonging to their entry.
As before, active files or an individual preserved entry larger than the quota
can temporarily exceed it; the setting is not a reservation of disk space.

Four regressions cover reducing a failure-only cache's limit, automatic
housekeeping after failures, concurrent failure bursts, and orphan sidecar
temporaries. The migration, read-lease, deadline and existing eviction tests
also run against the combined implementation.

## Earlier migration follow-up

The previous implementation left a live temporary file in the old directory,
then published the new cache directory while the transfer was still active.
The transfer subsequently renamed its data in the old directory but wrote its
CACHED sidecar using the new directory. The content read therefore failed with
ENOENT and the old payload escaped the new directory's accounting and clear.

## Changes

Clear and migration now share a serialized maintenance barrier. Before touching
files, they abort and await all admitted transfers, including checksum and
sidecar completion. New fetches wait outside the ongoing-request map; putting a
waiter in the map would make maintenance wait for a request waiting for itself.
The identity-checked map cleanup from the earlier follow-up is preserved.

Migration resolves its source directory after acquiring the barrier, copies
only complete entries to an exclusive destination, rolls back its own copies
on copy failure, and publishes the destination only after the copy pass. The
copy-first path supports cross-volume destinations and refuses to overwrite an
existing destination cache. Stale temporary files are removed. A failed old-copy
unlink is logged; filesystem permission failures are not claimed to be repaired.
A queued clear runs after migration against the published directory. Content
reads waiting on a completing transfer also wait for maintenance to finish.

## Validation

Four focused scenarios ran using the modified production CacheManager class
transpiled with TypeScript, real temporary filesystem directories, and mocked
Electron/download dependencies: abort cleanup plus replacement admission;
success-path completion; clear queued after migration; and copy-failure rollback
with subsequent requests unblocked. All four passed. Corresponding Jest tests
are added in CacheManager.migration.test.ts.

Full repository Jest, ESLint, type-check, and live Electron/Windows integration
have not run in this environment. Runtime filesystem races with a separate
external process or an OS crash mid-copy are outside these tests.

## Integration and signing

Preserve this barrier and identity cleanup alongside the retry/gateway and
metadata-budget changes in the other open PRs when resolving overlap in
CacheManager.ts. No existing PR history was rewritten. This update is published
unsigned with the owner's permission; the owner will apply their signing workflow.

The upstream GitHub integration denied both Conversation comments and reviews
with HTTP 403. This tracked note retains the full explanation for review.

## Follow-up: invalidation that starts before migration

Rechecking head `ee9219ab2b7ecdc4285b23cf8a1a7d2e54537733` reproduced the reverse
ordering of the existing migration/invalidation test. Invalidation passed its
maintenance check and started an asynchronous unlink. Migration could then copy
both files and publish the destination before that unlink finished. The refresh
removed only the old copy, leaving the destination entry `CACHED`.

Invalidation now registers in the same maintenance queue before its first await.
It resolves the current directory inside its queued operation and keeps the
barrier through both data and sidecar deletion. A preceding migration finishes
first; a later migration cannot overtake a deletion already underway.

The barrier aborts and awaits the complete request for the invalidated URL,
including checksum and sidecar writes. Without that drain, an aborted request
could recreate its ERROR sidecar after deletion, or a transfer past its last
abort check could recreate a CACHED entry. Clear and migration still drain all
requests. Invalidation leaves unrelated admitted downloads running, and new
requests wait outside the request map until maintenance releases them.

### Regression coverage and validation

Four new scenarios in `CacheManager.migration.test.ts` cover deletion before
migration, abort cleanup, late successful completion, and replacement admission
while an unrelated download remains active. The deletion-order regression uses
real temporary files and synchronous filesystem adapters for the migration
calls, so the blocked unlink deterministically lets an unguarded migration
finish in one event-loop turn. The other cases use real asynchronous filesystem
operations with explicit promise gates. Electron and network downloads are mocked.

The first three new scenarios failed on the unchanged PR head. With the fix,
all **44 tests in four focused suites pass**: `CacheManager.migration.test.ts`,
`CacheManager.test.ts`, `downloadFile.test.ts`, and
`resolveStoredMaxCacheSize.test.ts`. This includes the existing migration-first,
same-folder, missing-data sidecar, clear, rollback, temp-file, and cache-limit
coverage. ESLint and Prettier pass for both changed TypeScript files.

A focused TypeScript check of the two changed files and their dependency graph
reports the same pre-existing `TS2345` in `utils/getChecksum.ts:10` on the old and
new code, with no new diagnostics. This was checked with TypeScript 5.7.3,
the repository's ES2020/ESNext library settings, and pinned Node 20.5.2 types;
it is not a clean full-project type-check result.

This is an additional commit on the existing PR branch; no history is rewritten.
Full repository and live Electron/Windows checks remain for upstream CI and
integration review. The existing owner-approved unsigned publication arrangement
still applies; no signing key is available in this environment.
