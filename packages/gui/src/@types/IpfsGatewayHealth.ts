// What the main process currently knows about the IPFS gateway it fetches
// through, learned from the downloads themselves: after a run of requests that
// could not reach the gateway host at all (its name does not resolve, nothing
// listens, its certificate is not for that name) the gateway is reported
// unreachable, and reported reachable again as soon as it answers anything.
// A single notice built from this replaces the identical generic error every
// tile would otherwise show for a gateway address that is simply wrong.
type IpfsGatewayHealth = {
  // the normalized gateway base the verdict is about
  gateway: string;
  reachable: boolean;
  // the network error of the last request that could not reach it
  error?: string;
  // how many requests in a row could not reach it
  failures: number;
  // when a reachable verdict was reached after an unreachable one: the moment
  // the gateway was seen answering again. A failure to reach it whose
  // transfer began before that moment is retried on the next access
  // (CacheManager.isRecoveredGatewayFailure), so a reader of the sidecars
  // treats it as unset; one that began after it is a new failure.
  recoveredAt?: number;
};

export default IpfsGatewayHealth;
