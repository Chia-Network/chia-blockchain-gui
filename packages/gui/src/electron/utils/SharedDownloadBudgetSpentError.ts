// A recheck whose shared allowance is spent asked for a transfer. A property
// of that caller's budget, not of the url: never persisted as a cache error.
// The message keeps the wording the download path has always used for a
// spent allowance, so callers matching on it see no change.
export default class SharedDownloadBudgetSpentError extends Error {
  constructor() {
    super('Request exceeded the shared download deadline');
    this.name = 'SharedDownloadBudgetSpentError';
  }
}
