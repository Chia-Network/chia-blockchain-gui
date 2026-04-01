import type { DataLayerOfferSummary } from '@chia-network/api';

export default function isDataLayerOfferSummary(summary: unknown): summary is DataLayerOfferSummary {
  if (summary == null || typeof summary !== 'object') {
    return false;
  }
  const { offered } = summary as Record<string, unknown>;
  if (!Array.isArray(offered)) {
    return false;
  }
  if (offered.length === 0) {
    const keys = Object.keys(summary as object);
    return keys.length === 1 && keys[0] === 'offered';
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
