import { fromBech32m, toBech32m, WalletType } from '@chia-network/api';
import { mojoToChia } from '@chia-network/core';
import BigNumber from 'bignumber.js';

import OfferBuilderData from '../@types/OfferBuilderData';
import { AssetIdMapEntry } from '../hooks/useAssetIdName';
import createOfferForIdsToOfferBuilderData from './createOfferForIdsToOfferBuilderData';

/**
 * GUI-only enrichment for a dapp command. The renderer already has the asset
 * registry and offer parser; main does not. Rather than replicate that state
 * inside the (sandboxed) Confirm dialog window, we resolve everything in the
 * renderer and pass a flat snapshot to main, which just renders it.
 *
 * The shape is intentionally pre-formatted (strings, not numbers) — main does
 * zero conversion. `display` never reaches the daemon.
 */
export type DappCommandDisplay = {
  cat?: {
    displayName: string;
    isRevocable: boolean;
  };
  offer?: OfferDisplay;
};

export type OfferDisplayLine =
  | { kind: 'xch'; amount: string }
  | { kind: 'cat'; amount: string; assetId: string }
  | { kind: 'nft'; nftId: string; name?: string; previewUrl?: string };

export type OfferDisplay = {
  offered: OfferDisplayLine[];
  requested: OfferDisplayLine[];
  fee?: string;
};

export function buildCatDisplay(
  values: Record<string, unknown>,
  lookupByWalletId: (walletId: string) => AssetIdMapEntry | undefined,
): DappCommandDisplay['cat'] | undefined {
  const walletIdRaw = values.walletId;
  const walletId = typeof walletIdRaw === 'number' ? String(walletIdRaw) : (walletIdRaw as string | undefined);
  if (!walletId) return undefined;
  const asset = lookupByWalletId(walletId);
  if (!asset) return undefined;
  return {
    displayName: asset.displayName,
    isRevocable: asset.walletType === WalletType.RCAT,
  };
}

function flattenBuilderData(builder: OfferBuilderData): OfferDisplay {
  const lineFromXch = (x: { amount: string }): OfferDisplayLine => ({ kind: 'xch', amount: x.amount });
  const lineFromCat = (x: { amount: string; assetId: string }): OfferDisplayLine => ({
    kind: 'cat',
    amount: x.amount,
    assetId: x.assetId,
  });
  const lineFromNft = (x: { nftId: string }): OfferDisplayLine => ({ kind: 'nft', nftId: x.nftId });

  return {
    offered: [
      ...builder.offered.xch.map(lineFromXch),
      ...builder.offered.tokens.map(lineFromCat),
      ...builder.offered.nfts.map(lineFromNft),
    ],
    requested: [
      ...builder.requested.xch.map(lineFromXch),
      ...builder.requested.tokens.map(lineFromCat),
      ...builder.requested.nfts.map(lineFromNft),
    ],
    fee: builder.offered.fee?.[0]?.amount,
  };
}

/**
 * For `chia_wallet.create_offer_for_ids`. The dapp passed a wallet-id-keyed
 * dict; we resolve each id to its asset and bucket into offered/requested.
 */
export function buildCreateOfferDisplay(
  values: Record<string, unknown>,
  lookupByWalletId: (walletId: string) => AssetIdMapEntry | undefined,
): OfferDisplay | undefined {
  const offer = values.offer as Record<string, number | string | BigNumber> | undefined;
  if (!offer || typeof offer !== 'object') return undefined;

  const feeMojos = values.fee !== undefined && values.fee !== null ? String(values.fee) : undefined;
  try {
    const builder = createOfferForIdsToOfferBuilderData(
      offer as Record<string, number>,
      lookupByWalletId,
      feeMojos,
    );
    return flattenBuilderData(builder);
  } catch {
    return undefined;
  }
}

/**
 * Resolve `nftId` (bech32) → coinId hex usable with `getNFTInfo`. Returns
 * undefined when decoding fails — caller should treat it as "no preview".
 */
export function nftIdToCoinId(nftId: string): string | undefined {
  try {
    return fromBech32m(nftId);
  } catch {
    return undefined;
  }
}

/**
 * Walk every NFT line and call `enrich` to fill in name + previewUrl. Best
 * effort — failures leave the line untouched. Mutates the snapshot in place
 * because it's not exposed elsewhere.
 */
export async function enrichOfferNfts(
  offer: OfferDisplay,
  enrich: (line: { nftId: string }) => Promise<{ name?: string; previewUrl?: string } | undefined>,
): Promise<void> {
  const nftLines = [...offer.offered, ...offer.requested].filter(
    (l): l is OfferDisplayLine & { kind: 'nft' } => l.kind === 'nft',
  );
  await Promise.all(
    nftLines.map(async (line) => {
      try {
        const enriched = await enrich(line);
        if (enriched?.name) line.name = enriched.name;
        if (enriched?.previewUrl) line.previewUrl = enriched.previewUrl;
      } catch {
        // best effort
      }
    }),
  );
}

/**
 * For `chia_wallet.take_offer`. We've already fetched the parsed summary via
 * `getOfferSummary`; this just folds it into the display shape, looking up
 * CAT symbols where available.
 */
export function buildTakeOfferDisplay(
  summary: {
    offered: Record<string, number | BigNumber | string>;
    requested: Record<string, number | BigNumber | string>;
    infos: Record<string, { type: 'CAT' | 'NFT'; tail?: string; launcherId?: string }>;
    fees?: number;
  },
  takeOfferFeeMojos: number | string | BigNumber | undefined,
): OfferDisplay {
  function toLines(map: Record<string, number | BigNumber | string>): OfferDisplayLine[] {
    return Object.entries(map).map(([key, rawAmount]) => {
      const amount = new BigNumber(rawAmount as BigNumber.Value);
      if (key === 'xch') {
        return { kind: 'xch', amount: mojoToChia(amount.abs()).toFixed() };
      }
      const info = summary.infos[key];
      if (info?.type === 'NFT' && info.launcherId) {
        // launcherId from the daemon comes back as hex; normalize to bech32m
        // so every NFT line in the snapshot uses the same id format that the
        // create-offer path emits via createOfferForIdsToOfferBuilderData.
        let nftId = info.launcherId;
        try {
          nftId = toBech32m(info.launcherId, 'nft');
        } catch {
          // fall through with raw hex
        }
        return { kind: 'nft', nftId };
      }
      return { kind: 'cat', amount: amount.abs().toFixed(), assetId: key };
    });
  }

  return {
    offered: toLines(summary.offered),
    requested: toLines(summary.requested),
    fee: takeOfferFeeMojos !== undefined ? mojoToChia(takeOfferFeeMojos).toFixed() : undefined,
  };
}
