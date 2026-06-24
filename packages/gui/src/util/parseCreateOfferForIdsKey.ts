import removeHexPrefix from './removeHexPrefix';

/**
 * Parses keys for createOfferForIds / WalletConnect preview to match
 * `CreateOfferForIDs.offer_spec` in chia/wallet/wallet_request_types.py:
 * - len(key) > 16  → bytes32 hex string (NFT launcher id, CAT asset id, …)
 * - else           → wallet id via Python-style decimal (ASCII digits only),
 *                    constrained to uint32 like `trade_manager` (`uint32(id)`).
 *
 * JavaScript `Number()` / `parseInt()` accept unicode digits and other inputs
 * that Python `int()` rejects, which caused preview/backend mismatches.
 */

export type ParsedCreateOfferForIdsKey =
  | { type: 'walletId'; walletId: number }
  | { type: 'assetHex'; normalizedHex: string };

const UINT32_MAX = 4_294_967_295;

/** After trim, unsigned ASCII decimal (wallet ids are non-negative in practice; matches RPC usage). */
const PYTHON_DECIMAL_UINT_RE = /^[0-9]+$/;

function isValidBytes32Hex(hex: string): boolean {
  if (hex.length !== 64) {
    return false;
  }
  return /^[0-9a-fA-F]+$/.test(hex);
}

/**
 * Parse a single offer-dict key the same way the wallet RPC unmarshals `offer`.
 */
export default function parseCreateOfferForIdsKey(rawKey: string): ParsedCreateOfferForIdsKey {
  if (rawKey.length > 16) {
    const normalized = removeHexPrefix(rawKey);
    if (!isValidBytes32Hex(normalized)) {
      throw new Error(`Invalid asset id key (expected 64 hex characters, optional 0x prefix): ${rawKey}`);
    }
    return { type: 'assetHex', normalizedHex: normalized.toLowerCase() };
  }

  const trimmed = rawKey.trim();
  if (!PYTHON_DECIMAL_UINT_RE.test(trimmed)) {
    throw new Error(`Invalid wallet id key (expected ASCII decimal digits, matching Python int()): ${rawKey}`);
  }

  const walletId = Number(trimmed);
  if (!Number.isSafeInteger(walletId) || walletId > UINT32_MAX) {
    throw new Error(`Wallet id out of uint32 range: ${rawKey}`);
  }

  return { type: 'walletId', walletId };
}
