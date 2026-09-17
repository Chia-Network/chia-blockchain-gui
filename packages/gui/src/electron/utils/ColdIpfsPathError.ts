// Thrown instead of asking the gateway for content it failed to produce a
// moment ago (see CacheManager's cold IPFS paths). The message is the error
// the gateway gave then, so the caller sees the same outcome a fresh request
// would have — but no download slot is spent and nothing is persisted: the
// verdict already recorded against the url that established it governs the
// retry schedule, and this one is retried as soon as the verdict expires.
export default class ColdIpfsPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ColdIpfsPathError';
  }
}
