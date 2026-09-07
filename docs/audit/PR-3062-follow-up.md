# PR #3062 follow-up: enforce the metadata transfer allowance

## Finding and failure mechanism

SEC-1234 identified metadata fallback consuming the 30-minute transfer deadline
intended for videos. The previous five-candidate cap removed the unbounded URI
multiplier, but the 60-second check ran only before another candidate started.
The first failure started that clock; neither the first active transfer nor a
fallback already in progress was cancelled by it. A first 30-minute transfer and
a second 30-minute transfer could therefore both run before the loop stopped.

## Implemented behavior

`fetchMetadataFromUris` now reserves an equal part of a 60,000 ms **active
transfer allowance** for each candidate, with at most five candidates. One
candidate gets 60 seconds, two get 30 seconds each, and five get 12 seconds each.
The first candidate receives the same enforced cap as the others. Unused shares
are not lent to later candidates. This deliberately bounds cumulative transfer
work without charging unrelated download-queue wait against a metadata copy.

The existing secondary fallback-admission clock remains: no further candidate
starts after 60 seconds following the first failure. That clock is not relied
on to terminate an active download. This is **not a promise of a 60-second
end-to-end wall-clock response**: queue wait, disk reads and JSON processing
are outside the network-transfer allowance. A single slow copy can now time
out while another reserved copy is still allowed to run; this is an intentional
compatibility tradeoff, not an accidental premature-expiry bug.

`maxDuration` travels from the metadata helper through its hook, shared
`CacheRequestOptions`, preload, the IPC handler, and `CacheManager` into
`downloadFile`. Main-process validation rejects zero, negative, nonfinite and
wrong-type values and clamps excessive finite values to the existing video
ceiling. A caller cannot disable the deadline by choosing an invalid value.

A `DownloadDeadline` belongs to each coalesced URL request. It starts only when
the shared limiter admits that transfer. A later metadata caller can only
shorten it, measured from the original transfer start. Therefore metadata
cannot silently inherit an already-running 30-minute video request. Expiry
aborts the actual `AbortController`, waits for the downloader's cleanup and
settlement, and frees the limiter slot. The persisted error keeps the existing
`Request exceeded the ... download deadline` shape, not an ordinary abort that
would immediately retry on each tile access. The strictest coalesced caller
may terminate the transfer for its other consumers too; no duplicate writer
is started for the same URL/cache path.

`getContentWithInfo` returns bytes, headers and checksum from one cache fetch
decision. Previously three independent cache calls could re-download after
invalidation or eviction and spend a candidate's allowance more than once.
The bundle checksum is computed from the bytes returned, so a replacement
cannot pair new bytes with an old sidecar checksum. The renderer still checks
the expected on-chain hash before decoding/parsing. A bundle read failure does
not silently fetch the same URI again.

The cleanup unlink is exception-safe and write-stream errors reject the
transfer; these are necessary to substantiate slot release even when cleanup
fails. These changes overlap the corresponding fixes in #3060 and #3068 and
should remain a single implementation when integrated.

## Preserved behavior

URI order, first-success selection, continued fallback after a mismatch,
mismatch priority when all copies fail, and the five-attempt limit are retained.
The existing compatibility policy of fetching only the first URI without a
metadata hash is retained, now with a metadata-sized transfer cap. This change
does not claim to forbid all unhashed metadata fetching. Generic video callers
still have the 30-minute default unless a stricter caller joins their URL.

## Tests and actual validation

The directly runnable test is:

```sh
node packages/gui/tests/audit/metadata-deadline.cjs
```

`CacheManager.deadlines.test.ts` invokes it from Jest, so the integration
regressions are discoverable by the existing suite. `DownloadDeadline.test.ts`
adds timer/normalization units, and `fetchMetadataFromUris.test.ts` updates
fallback expectations for the forwarded options and reserved budget.

The focused runner was executed against these production TypeScript files on
Node 22.16.0 with TypeScript 5.8.3: **14/14 scenarios passed**. It exercises real
`CacheManager`, `downloadFile`, the limiter, preload, the metadata helper/hook,
filesystem cleanup and hashing. Electron network events, preferences-related
URL translation/validation, React callback wiring and the clock are doubles.
It makes no external network requests and is not a live Electron integration
run. The repository pins TypeScript 5.7.3; that full dependency environment,
whole-repository Jest, lint/type-check and the combined PR tree were **not**
run here. Added Jest tests must still run in CI with the pinned dependencies.

Coverage includes invalid duration values; a continuously active/trickling
response reaching its absolute deadline; request abortion, temp cleanup and
limiter-slot reuse; no immediate retry of a deadline sidecar; queue wait longer
than the budget; tightening active and queued shared requests; immediate
expiry on a late join; no extension by a looser caller; one-result bundle
integrity; metadata-hash checks before parsing; cumulative transfer allocation;
the preload/main-process path; write-open failure; and the bundle read's
maintenance-barrier participation.

## Integration notes: do not drop the other PRs' protections

This is appended to #3062's existing head without rebasing or rewriting it.
`CacheManager` and `downloadFile` overlap #3066/#3068; they are not assumed to
merge as an already-tested combined tree.

- With #3066, preserve gateway pinning, retry counters/classification and the
  original/fallback shared deadline. Use the remaining `transferDeadline`
  duration for the original request **and** its fallback, not a new 30-minute
  allowance. Tighten an ongoing request before waiting for an old gateway's
  result. Retain one shared default-duration definition/import, not duplicate
  declarations introduced while resolving the overlap.
- With #3068, retain the maintenance wait **before registering new work**,
  maintenance serialization and per-request identity cleanup. Both changes
  declare `maintenance`; retain one declaration. The new bundle read waits on
  that same barrier before reading the final destination. The independent
  #3062 branch leaves the barrier unset until the maintenance implementation
  is integrated. The focused test injects the barrier to exercise this read
  contract, not the complete migration operation.
- Preserve #3067's bounded cache-info lookup and #3062's existing NFT refresh
  reset/invalidation ordering.

Run the full combined suite after resolving overlaps. Focused success does not
establish merge readiness or closure of every finding in the broader audit.

## Publication and signing

The owner authorized appending unsigned commits and signing via their own
workflow. This follow-up does not alter existing signed history. Full technical
explanations are kept here and in source/commit comments because upstream
Conversation/review comment writes were previously denied by the connector.

## Follow-up: a joiner no longer shortens the transfer it joins

The coalesced-deadline rule above let a later caller with a smaller
allowance tighten an active transfer's deadline from its original start,
ending it for every caller waiting on it. That made one NFT's metadata
fetch — whose URI list is minter-authored — able to abort another NFT's
video download by naming its URL. A joiner now waits within its own
allowance only, measured from the transfer's start (queue wait is still
not charged), and is refused with the spent-budget error when that runs
out; the transfer and its other callers are untouched. A metadata caller
still cannot inherit a video-sized wait. The harness scenarios for joining
were rewritten to this contract.

## 2026-09-07: preserve the larger caller's allowance in either arrival order

A smaller metadata request could still own a URL before a media caller joined.
Its size/deadline failure was then returned to both callers and persisted against
the URL. Time-limit failures now record the actual attempt's normalized limits,
as size failures already did. A larger caller may retry a limit failure; the same
or a smaller caller keeps the existing backoff. HTTP/network errors keep their
existing retry policy.

A joiner rechecks only after the owner's complete request has settled, so there
is still one writer per cache path. Its wait is deducted before a replacement
transfer starts: retries share the remaining allowance, including gateway legs.
This complements the earlier change that prevents a short joiner from aborting
a larger owner. New policy regressions cover both size and duration, persisted
failures, and preserving a remote 404 without another transfer.
