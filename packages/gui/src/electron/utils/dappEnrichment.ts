// Confirm-dialog enrichment built in main from the same `data` that hits
// the wire, so a compromised renderer can't show "1 XCH to friend" while
// sending "50 XCH to attacker." Daemon RPCs are trusted (same machine,
// TLS-pinned socket).
import BigNumber from 'bignumber.js';
import crypto from 'node:crypto';

import WalletType from '../constants/WalletType';

import isValidURL from './isValidURL';
import mojoToCAT from './mojoToCAT';
import mojoToChia from './mojoToChia';
import toBech32m from './toBech32m';
import toCamelCase from './toCamelCase';
import toSnakeCase from './toSnakeCase';
import { sendDappAndAwait } from './webSocketBridge';

export type EnrichmentDisplay = {
  cat?: { displayName: string; isRevocable: boolean };
  offer?: {
    offered: OfferLine[];
    requested: OfferLine[];
    fee?: string;
  };
};

export type OfferLine =
  | { kind: 'xch'; amount: string }
  | { kind: 'cat'; amount: string; assetId: string; symbol?: string }
  | { kind: 'nft'; nftId: string; name?: string; previewUrl?: string };

type DaemonError = { error?: unknown; success?: boolean };

// Daemon RPC over the renderer's WebSocket; resolved by request_id via
// dappPending. Renderer never sees these calls.
async function callDaemon<T>(
  destination: string,
  command: string,
  data: Record<string, unknown> = {},
  timeoutMs = 15_000,
): Promise<T> {
  const requestId = crypto.randomBytes(32).toString('hex');
  const wire = {
    origin: 'wallet_ui',
    destination,
    command,
    data,
    ack: false,
    request_id: requestId,
  };
  const json = JSON.stringify(toSnakeCase(wire));
  const response = (await sendDappAndAwait(requestId, json, timeoutMs)) as { data?: DaemonError };
  const responseData = response?.data;
  if (responseData?.error) {
    throw new Error(String(responseData.error));
  }
  return toCamelCase(responseData ?? {}) as T;
}

type Wallet = {
  id: number;
  type: number;
  name?: string;
  meta?: { assetId?: string; tail?: string };
};

type CatNameInfo = { walletId?: number; name?: string };

export async function lookupCat(walletId: number | string): Promise<EnrichmentDisplay['cat'] | undefined> {
  try {
    const { wallets = [] } = await callDaemon<{ wallets?: Wallet[] }>('chia_wallet', 'get_wallets', {
      includeData: true,
    });
    const wallet = wallets.find((w) => Number(w.id) === Number(walletId));
    if (!wallet) return undefined;
    if (wallet.type !== WalletType.CAT && wallet.type !== WalletType.RCAT && wallet.type !== WalletType.CRCAT) {
      return undefined;
    }
    let displayName = wallet.name?.trim() || '';
    const assetId = wallet.meta?.assetId ?? wallet.meta?.tail;
    // Prefer the CAT registry's curated name when available.
    if (assetId) {
      try {
        const catName = await callDaemon<CatNameInfo>('chia_wallet', 'cat_asset_id_to_name', { assetId });
        if (catName?.name) displayName = catName.name;
      } catch {
        // fall back to wallet name
      }
    }
    if (!displayName) return undefined;
    return { displayName, isRevocable: wallet.type === WalletType.RCAT };
  } catch {
    return undefined;
  }
}

type NftInfo = { dataUris?: string[]; metadataUris?: string[]; nftCoinId?: string };

function pickPreviewUrl(dataUris: string[] | undefined): string | undefined {
  if (!dataUris) return undefined;
  return dataUris.find((u) => isValidURL(u));
}

async function lookupNft(launcherIdHex: string): Promise<{ name?: string; previewUrl?: string } | undefined> {
  try {
    const result = await callDaemon<{ nftInfo?: NftInfo } & NftInfo>('chia_wallet', 'nft_get_info', {
      coinId: launcherIdHex,
    });
    const info = result.nftInfo ?? result;
    const previewUrl = pickPreviewUrl(info.dataUris);
    return previewUrl ? { previewUrl } : undefined;
  } catch {
    return undefined;
  }
}

// Encode an NFT launcher hash as a bech32m `nft1...` id. Falls back to the
// raw hex on encoding failure (e.g. odd-length input).
function hexToNftId(hex: string): string {
  try {
    return toBech32m(hex, 'nft');
  } catch {
    return hex;
  }
}

// Daemon emits `'singleton'` for NFTs (NOT `'NFT'`). Confirmed against
// the rest of the renderer's offer code (offerToOfferBuilderData.ts).
type OfferSummaryRecord = {
  offered: Record<string, number | string>;
  requested: Record<string, number | string>;
  infos: Record<string, { type: 'CAT' | 'singleton'; tail?: string; launcherId?: string }>;
  fees?: number;
};

type GetOfferSummaryResult = { id?: string; summary: OfferSummaryRecord | unknown };

async function lookupCatNameByAssetId(assetId: string): Promise<string | undefined> {
  try {
    const result = await callDaemon<CatNameInfo>('chia_wallet', 'cat_asset_id_to_name', { assetId });
    return result.name;
  } catch {
    return undefined;
  }
}

async function summaryToOffer(
  summary: OfferSummaryRecord,
  feeMojos: number | string | undefined,
): Promise<EnrichmentDisplay['offer']> {
  async function toLines(map: Record<string, number | string>): Promise<OfferLine[]> {
    const entries = Object.entries(map);
    return Promise.all(
      entries.map(async ([key, rawAmount]): Promise<OfferLine> => {
        if (key === 'xch') {
          return { kind: 'xch', amount: mojoToChia(String(rawAmount).replace(/^-/, '')).toFixed() };
        }
        const info = summary.infos[key];
        if (info?.type === 'singleton' && info.launcherId) {
          const nftId = hexToNftId(info.launcherId);
          const enriched = await lookupNft(info.launcherId);
          return { kind: 'nft', nftId, ...enriched };
        }
        const symbol = await lookupCatNameByAssetId(key);
        return {
          kind: 'cat',
          amount: mojoToCAT(String(rawAmount).replace(/^-/, '')).toFixed(),
          assetId: key,
          symbol,
        };
      }),
    );
  }

  const [offered, requested] = await Promise.all([toLines(summary.offered), toLines(summary.requested)]);
  return {
    offered,
    requested,
    fee: feeMojos !== undefined && feeMojos !== null ? mojoToChia(String(feeMojos)).toFixed() : undefined,
  };
}

export async function buildTakeOfferDisplay(
  data: Record<string, unknown>,
): Promise<EnrichmentDisplay['offer'] | undefined> {
  const offer = data.offer;
  if (typeof offer !== 'string' || !offer) return undefined;
  try {
    const result = await callDaemon<GetOfferSummaryResult>('chia_wallet', 'get_offer_summary', { offer });
    const summary = result.summary;
    if (!summary || typeof summary !== 'object' || !('offered' in summary) || !('requested' in summary)) {
      return undefined;
    }
    return summaryToOffer(summary as OfferSummaryRecord, data.fee as number | string | undefined);
  } catch {
    return undefined;
  }
}

export async function buildCreateOfferDisplay(
  data: Record<string, unknown>,
): Promise<EnrichmentDisplay['offer'] | undefined> {
  const offerDict = data.offer;
  if (!offerDict || typeof offerDict !== 'object') return undefined;
  const fee = data.fee !== undefined && data.fee !== null ? mojoToChia(String(data.fee)).toFixed() : undefined;

  let wallets: Wallet[] = [];
  try {
    const result = await callDaemon<{ wallets?: Wallet[] }>('chia_wallet', 'get_wallets', { includeData: true });
    wallets = result.wallets ?? [];
  } catch {
    // proceed with no wallet info; lines still render with id-only labels
  }

  const offered: OfferLine[] = [];
  const requested: OfferLine[] = [];

  await Promise.all(
    Object.entries(offerDict as Record<string, unknown>).map(async ([key, raw]) => {
      // Mojo amounts can exceed Number.MAX_SAFE_INTEGER (2^53). Use BigNumber
      // so the displayed magnitude matches exactly what goes on the wire.
      let amount: BigNumber;
      try {
        amount = new BigNumber(typeof raw === 'string' || typeof raw === 'number' ? raw : String(raw));
      } catch {
        return;
      }
      if (!amount.isFinite() || amount.isZero()) return;
      const bucket = amount.isPositive() ? requested : offered;
      const abs = amount.abs().toFixed(0);

      // Numeric key → wallet id; otherwise treat as an asset id (CAT) or
      // bech32 nft id depending on prefix length.
      const isNumeric = /^-?\d+$/.test(key);
      if (isNumeric) {
        const wallet = wallets.find((w) => Number(w.id) === Number(key));
        if (!wallet) return;
        if (wallet.type === WalletType.STANDARD_WALLET) {
          bucket.push({ kind: 'xch', amount: mojoToChia(abs).toFixed() });
          return;
        }
        if (wallet.type === WalletType.CAT || wallet.type === WalletType.RCAT || wallet.type === WalletType.CRCAT) {
          const assetId = wallet.meta?.assetId ?? wallet.meta?.tail ?? '';
          const symbol = (await lookupCatNameByAssetId(assetId)) ?? wallet.name;
          bucket.push({
            kind: 'cat',
            amount: mojoToCAT(abs).toFixed(),
            assetId,
            symbol,
          });
          return;
        }
        return;
      }

      // Non-numeric key: assume hex launcher id, encode as nft1...
      const nftId = hexToNftId(key);
      const enriched = await lookupNft(key);
      bucket.push({ kind: 'nft', nftId, ...enriched });
    }),
  );

  return { offered, requested, fee };
}
