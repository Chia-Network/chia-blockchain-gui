# NFT audit integration — 2026-09-06

The eight audit PRs now form this dependency order:

**#3060 → #3061 → #3066 → #3062 → #3067 → #3068 → #3069 → #3063**

The first three heads already have that ancestry. The other five branches receive
merge follow-ups preserving their original heads and the preceding integrated
head. No existing signed commit is discarded. Review the complete implementation
at the top of the stack, #3063; lower branches contain their prerequisites only.
Use upstream merge commits to preserve this ancestry, or restack descendants after
squashing. The PRs continue to target `release/2.7.4`.

## Conflict resolutions and additional fixes

| PR    | Integrated behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #3062 | Gateway and deadline live together on each coalesced request. Original-host and fallback transfers share the remaining deadline; a joining metadata caller tightens the original start. Gateway-change rechecks share the same consumed allowance. The production-source runner uses the actual URL validator and includes both gateway/deadline interactions. Node 20 declarations are updated from 20.5.2 to 20.19.9 to match TypeScript 5.7's typed arrays.                                                                                                                                      |
| #3067 | Retains transient retry limits, the IPC batch cap and the filesystem lookup concurrency cap, including both branches' tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| #3068 | Preserves the maintenance admission barrier, URL-scoped invalidation drain, exact request cleanup, temp accounting, copy-first migration and rollback. Bundled reads detect maintenance that starts or finishes during lookup; actual reads hold a short file lease so maintenance cannot delete their bytes. Missing files trigger bounded repair. Rechecks consume the remaining transfer budget. After eight LIFO admissions an oldest queued task gets a turn. Unchanged preferences reuse parsed YAML, while saves/external replacement invalidate it and callers receive independent objects. |
| #3069 | Retains the bounded confirmation resolver, including URI inspection/length/attempt limits, disabled-IPFS skipping and no-hash early exit.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| #3063 | Retains both gateway and exclusion effect dependencies. Decoder probes share four active slots and at most 64 queued entries; aborts and timeouts remove queued probes before creating an element. Verification examines the first ten URIs before exclusions and reuses per-generation outcomes, including errors and overlapping calls. NFT/metadata refresh, gateway changes and size-policy changes reset the relevant memo. The two audit settings forms use MUI's typed loading button directly.                                                                                              |

The shared downloader retains its write-stream error handler and exception-safe
cleanup. The three formerly reproduced #3068 defects remain covered: invalidation
already underway before migration, selecting the same folder, and an orphaned
CACHED sidecar during migration.

## Ticketed PDF findings

| Finding  | Protection retained in the combined implementation                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-1233 | Bounded preview URI sweep, 500-URL renderer batches, 1,000-URL IPC cap and 16 filesystem lookups.                                                                            |
| SEC-1234 | At most five metadata candidates split a 60-second active-transfer allowance; actual network cancellation, coalesced deadline tightening and shared fallback/recheck budget. |
| SEC-1235 | IPFS path containment and validation of the final network URL.                                                                                                               |
| SEC-1236 | Gateway-link extraction uses the same contained path policy.                                                                                                                 |
| SEC-1237 | Transient retry classification, exponential backoff and eight consecutive in-session failures.                                                                               |
| SEC-1238 | Multiple metadata copies require a hash; checksum validation precedes JSON parsing.                                                                                          |
| SEC-1239 | Single-NFT downloads validate the actual translated request URL.                                                                                                             |
| SEC-1240 | Confirmation preview preprocessing and attempts are bounded; disabled IPFS and missing hashes exit early.                                                                    |
| SEC-1241 | Refresh invalidates all metadata URIs, resets in-memory state, avoids unbounded spread and serializes cache invalidation with migration.                                     |
| SEC-1242 | Temporary files participate in accounting, eviction, startup cleanup and clear; maintenance drains requests.                                                                 |
| SEC-1243 | Zero, empty and nonfinite limits are rejected with visible settings validation; invalid persisted values fall back.                                                          |

The metadata allowance measures admitted transfer work, not an end-to-end
60-second UI deadline. Queue wait is excluded. Disk/checksum completion is
conservatively charged before a recheck. Unused shares across distinct metadata
URIs are not redistributed.

## Validation

The following results apply to the complete combined code, not to eight separate
snapshots counted repeatedly:

- Full GUI Jest suite: **53 suites, 662 tests passed**. One Jest test runs a child
  harness with **17/17 production-source scenarios**, including fallback deadlines,
  coalesced fallback callers and a clear followed by a budget-preserving recheck.
- Existing audit-focused combined subset: **21 suites, 387 tests passed**.
- Production Electron/React builds and the API, API-react, icons, core and wallets
  dependency builds passed.
- The repository's required `npm run check:types` gate (API, API-react, icons)
  passed. Full GUI type checking is still not clean: the same-environment release
  baseline reports 753 diagnostics; the combined checkout reports 713. The
  remaining diagnostics include unmodified GUI/core typing problems. No error
  remains in the changed cache, downloader, deadline, preference, verification,
  probe or audit settings implementation. This is not a claim that GUI-wide
  type checking passes.
- ESLint and formatting checks cover the changed TypeScript/TSX files.
- **4/4 real Electron 43.4.0 main-process smoke checks passed**, using a loopback
  HTTP gateway and real files: bundled download, read overlapping clear,
  migration/refresh/redownload, and deadline abort/temp cleanup. Run
  `electron packages/gui/tests/audit/electron-cache-smoke.cjs --cache-only`.
  A headless Linux container can additionally need `--no-sandbox
--ozone-platform=headless` when invoking Electron as root.
- The optional BrowserWindow/media smoke scenario crashes in this environment
  after those four main-process checks. Actual desktop decoder behavior and
  Windows/cross-volume flows remain release checks; unit media events are mocked.

## Informational dispositions and release gates

I2 (probe concurrency), I3 (repeated verification), queue starvation and repeated
preference parsing now have code changes and regressions. I5's privacy disclosure,
I6's sidecar error redaction and I7's exception-safe cleanup remain implemented.

These are retained design boundaries, requiring an owner/maintainer disposition
rather than being described as newly fixed security tickets:

- I1: probes still use a detached element in the hardened renderer; the display
  iframe remains scriptless. The concurrency change does not move decoding to a
  new security boundary.
- I4: a gateway change intentionally retries relevant resources, within the
  shared ten-download concurrency limit.
- The prior Informative optimistic-preview/badge behavior and the broader
  compromised-renderer preference-consent recommendation remain unchanged.
- The metadata, gallery and confirmation walks retain their different ordering,
  hash/error and allowance policies. Shared validation/deadline primitives and
  bounded walks do not amount to one unified fallback implementation.
- The PDF's duplicate-closed redirect/buffering reports and broader SEC-801
  private-IP policy are outside these eleven ticketed fixes; no new resolution
  is claimed for them.

Before release, an upstream maintainer must approve/run the PR workflows that
were awaiting action and review the full stack. New follow-ups are published
unsigned under the existing owner-approved signing arrangement. Reapply signing
from #3062 upward, updating dependent merge parents in the same order. Nothing in
this work merges the PRs into the upstream release branch.
