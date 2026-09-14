# PR #3071 audit follow-up — 2026-09-07

## Admission after a gateway failure

A queued request used to retain its admission decision even if an earlier
download received HTTP 429. Record the gateway response before releasing the
download slot, then recheck both the host cooldown and exact-path failure at
actual admission. A request whose host is now cooling releases its slot and
waits outside the limiter. It rechecks when admitted again, including when a
later response has extended the cooldown.

Cooldown and queue waits do not consume the transfer deadline. Unrelated hosts
can continue using the available slot. Cache maintenance can still abort and
drain a request that has returned to a cooldown wait.

## Failure scope

A 5xx response or inactivity timeout for one path does not establish that all
files under its CID are unavailable. Remove CID-wide negative-cache entries and
consult only the exact IPFS path, including its query, under the selected gateway.
Untried sibling paths retain their normal origin and gateway attempts.

The existing ten-minute expiry and exact-path deduplication remain: a gateway
failure suppresses the same path through that gateway; when the origin also
failed, equivalent links to that exact path share the failure. Refresh removes
that path's in-memory verdict across gateways, and clearing the cache removes
all verdicts.

## Regression coverage

`CacheManager.admission.test.ts` covers queued requests after a direct-host,
IPFS-gateway or fallback HTTP 429; use of the freed slot by an unrelated host;
preservation of the queued caller's transfer allowance; exact-path refusal
after enqueue; maintenance during the renewed cooldown; and successful sibling
downloads after both 504 and inactivity failures. Existing negative-cache tests
also exercise expiry, invalidation, gateway changes and exact-path deduplication.

This branch includes the #3062 caller-policy and #3068 failure-sidecar quota
follow-ups through the existing stack. Validation of the complete stack is
recorded below.

## Combined validation

The full dependency order remains #3060 → #3061 → #3066 → #3062 → #3067 →
#3068 → #3069 → #3063 → #3070 → #3071. Follow-ups preserve each original head
and merge the updated preceding branch, without rewriting existing commits.

- Full GUI Jest suite: **62 suites, 955 tests passed**, including the 15 added
  policy, quota and admission regression cases. The suite also runs the existing
  **17/17 production-source deadline scenarios**.
- **4/4 real Electron main-process cache scenarios passed** with real network
  requests to a loopback gateway, file reads, migration, refresh and abort cleanup.
  Renderer media events remain mocked; no desktop decoder result is claimed.
- The production Electron build and the repository's required type-check command
  for API, API-react and icons passed.
- Changed TypeScript files pass ESLint and formatting checks. GUI-wide type
  checking remains affected by existing unrelated diagnostics; no diagnostics
  remain in the changed cache implementation, sidecar types or regression tests.

The upstream PR workflows still need to run against the published commits before
merge. These follow-ups use the owner's previously approved unsigned-commit
arrangement. This update does not merge the PRs into the release branch.
