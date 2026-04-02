import type { DataLayerOfferSummary } from '@chia-network/api';

export default function isDataLayerOfferSummary(summary: unknown): summary is DataLayerOfferSummary {
  if (summary == null || typeof summary !== 'object') {
    return false;
  }
  const { offered } = summary as Record<string, unknown>;
  if (!Array.isArray(offered)) {
    return false;
  }
  return offered.every(
    (entry) =>
      entry != null &&
      typeof entry === 'object' &&
      typeof (entry as Record<string, unknown>).launcherId === 'string' &&
      typeof (entry as Record<string, unknown>).newRoot === 'string' &&
      Array.isArray((entry as Record<string, unknown>).dependencies),
  );
}
