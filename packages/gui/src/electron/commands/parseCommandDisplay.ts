import { catAssetIdToName } from '../api/catAssetIdToName';
import { getOfferSummary } from '../api/getOfferSummary';
import { getWalletInfos, type WalletInfo } from '../api/getWalletNames';
import { nftGetInfo } from '../api/nftGetInfo';
import WalletType from '../constants/WalletType';
import type { DisplayWalletDelta, DisplayWalletDeltaItem } from '../dialogs/Confirm/Confirm';
import { isNumericKey } from '../utils/isNumericKey';
import { isPlainObject } from '../utils/isPlainObject';
import isValidURL from '../utils/isValidURL';
import mojoToCATLocaleString from '../utils/mojoToCATLocaleString';
import mojoToChiaLocaleString from '../utils/mojoToChiaLocaleString';
import { parseMojos } from '../utils/parseMojos';
import toBech32m from '../utils/toBech32m';
import { type WalletDelta, offerSummaryToWalletDelta, createOfferToWalletDelta } from '../utils/walletDelta';

type AssetDisplayKind = 'chia' | 'wallet' | 'cat' | 'nft';

type AssetDisplayKinds = {
  spending: Record<string, AssetDisplayKind | undefined>;
  receiving: Record<string, AssetDisplayKind | undefined>;
};

type AssetRoyaltyPercentages = {
  spending: Record<string, number | undefined>;
  receiving: Record<string, number | undefined>;
};

type OfferSummaryForDisplay = {
  fees: unknown;
  offered: Record<string, unknown>;
  requested: Record<string, unknown>;
  infos?: Record<string, unknown>;
};

type DisplayWalletDeltaItemWithKey = {
  key: string;
  line: DisplayWalletDeltaItem;
};

function hexToNftId(hex: string): string {
  try {
    return toBech32m(hex, 'nft');
  } catch {
    return hex;
  }
}

function parseRoyaltyPercentage(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value);
  }

  return undefined;
}

function royaltyPercentageForDriverInfo(driverInfo: unknown): number | undefined {
  if (!isPlainObject(driverInfo)) {
    return undefined;
  }

  const { also } = driverInfo;
  if (!isPlainObject(also)) {
    return undefined;
  }

  const ownershipLayer = also.also;
  if (!isPlainObject(ownershipLayer)) {
    return undefined;
  }

  const transferProgram = ownershipLayer.transfer_program;
  if (!isPlainObject(transferProgram)) {
    return undefined;
  }

  return parseRoyaltyPercentage(transferProgram.royalty_percentage);
}

function assetKindForWalletId(walletId: string, walletInfos: Record<string, WalletInfo>): AssetDisplayKind {
  const walletInfo = walletInfos[walletId];

  if (walletId === '1' || walletInfo?.type === WalletType.STANDARD_WALLET) {
    return 'chia';
  }

  return 'wallet';
}

function assetKindForOfferSummaryAssetId(
  assetId: string,
  offerSummary: OfferSummaryForDisplay,
): AssetDisplayKind | undefined {
  if (assetId === 'xch') {
    return 'chia';
  }

  const { infos } = offerSummary;
  if (!isPlainObject(infos)) {
    return undefined;
  }

  const info = infos[assetId];
  if (!isPlainObject(info) || typeof info.type !== 'string') {
    return undefined;
  }

  switch (info.type.toLowerCase()) {
    case 'cat':
      return 'cat';
    case 'singleton':
      return 'nft';
    default:
      return undefined;
  }
}

function normalizeDriverAssetId(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.startsWith('0x') ? value.slice(2) : value;
  if (!/^[\da-f]{64}$/.test(normalized)) {
    return undefined;
  }

  return normalized;
}

function assetKindForDriverDictAssetId(
  assetId: string,
  driverDict: Record<string, unknown>,
): AssetDisplayKind | undefined {
  const driverInfo = driverDict[assetId] ?? driverDict[`0x${assetId}`];
  if (driverInfo === undefined) {
    return undefined;
  }

  if (!isPlainObject(driverInfo) || typeof driverInfo.type !== 'string') {
    throw new Error('Driver Dict is not valid');
  }

  const driverType = driverInfo.type.toLowerCase();

  switch (driverType) {
    case 'cat':
      if (normalizeDriverAssetId(driverInfo.tail) !== assetId) {
        throw new Error('Driver Dict is not valid');
      }
      return 'cat';
    case 'singleton':
      if (normalizeDriverAssetId(driverInfo.launcher_id) !== assetId) {
        throw new Error('Driver Dict is not valid');
      }
      return 'nft';
    default:
      throw new Error('Driver Dict is not valid');
  }
}

function offerSummaryAssetKinds(offerSummary: OfferSummaryForDisplay): AssetDisplayKinds {
  const assetKinds: AssetDisplayKinds = {
    spending: {},
    receiving: {},
  };

  for (const assetId of Object.keys(offerSummary.requested)) {
    const parsedAssetId = assetId === 'xch' ? '1' : assetId;
    assetKinds.spending[parsedAssetId] = assetKindForOfferSummaryAssetId(assetId, offerSummary);
  }

  for (const assetId of Object.keys(offerSummary.offered)) {
    const parsedAssetId = assetId === 'xch' ? '1' : assetId;
    assetKinds.receiving[parsedAssetId] = assetKindForOfferSummaryAssetId(assetId, offerSummary);
  }

  return assetKinds;
}

function offerSummaryRoyaltyPercentages(offerSummary: OfferSummaryForDisplay): AssetRoyaltyPercentages {
  const royaltyPercentages: AssetRoyaltyPercentages = {
    spending: {},
    receiving: {},
  };

  const { infos } = offerSummary;
  if (!isPlainObject(infos)) {
    return royaltyPercentages;
  }

  for (const assetId of Object.keys(offerSummary.requested)) {
    const parsedAssetId = assetId === 'xch' ? '1' : assetId;
    royaltyPercentages.spending[parsedAssetId] = royaltyPercentageForDriverInfo(infos[assetId]);
  }

  for (const assetId of Object.keys(offerSummary.offered)) {
    const parsedAssetId = assetId === 'xch' ? '1' : assetId;
    royaltyPercentages.receiving[parsedAssetId] = royaltyPercentageForDriverInfo(infos[assetId]);
  }

  return royaltyPercentages;
}

function createOfferAssetKinds(
  walletDelta: WalletDelta,
  walletInfos: Record<string, WalletInfo>,
  driverDict: Record<string, unknown>,
): AssetDisplayKinds {
  const assetKinds: AssetDisplayKinds = {
    spending: {},
    receiving: {},
  };

  for (const assetId of Object.keys(walletDelta.spending)) {
    if (isNumericKey(assetId)) {
      assetKinds.spending[assetId] = assetKindForWalletId(assetId, walletInfos);
    } else {
      assetKinds.spending[assetId] = assetKindForDriverDictAssetId(assetId, driverDict);
    }
  }

  for (const assetId of Object.keys(walletDelta.receiving)) {
    if (isNumericKey(assetId)) {
      assetKinds.receiving[assetId] = assetKindForWalletId(assetId, walletInfos);
    } else {
      // Backend legacy behavior treats positive requested bytes32 assets with
      // no explicit driver as CATs.
      assetKinds.receiving[assetId] = assetKindForDriverDictAssetId(assetId, driverDict) ?? 'cat';
    }
  }

  return assetKinds;
}

function createOfferRoyaltyPercentages(
  walletDelta: WalletDelta,
  driverDict: Record<string, unknown>,
): AssetRoyaltyPercentages {
  const royaltyPercentages: AssetRoyaltyPercentages = {
    spending: {},
    receiving: {},
  };

  for (const assetId of Object.keys(walletDelta.spending)) {
    royaltyPercentages.spending[assetId] = royaltyPercentageForDriverInfo(
      driverDict[assetId] ?? driverDict[`0x${assetId}`],
    );
  }

  for (const assetId of Object.keys(walletDelta.receiving)) {
    royaltyPercentages.receiving[assetId] = royaltyPercentageForDriverInfo(
      driverDict[assetId] ?? driverDict[`0x${assetId}`],
    );
  }

  return royaltyPercentages;
}

async function parseWalletDeltaItem(
  key: string,
  value: bigint,
  walletInfos: Record<string, WalletInfo>,
  assetKind: AssetDisplayKind | undefined,
  royaltyPercentage?: number,
): Promise<DisplayWalletDeltaItem> {
  if (typeof key !== 'string') {
    throw new Error('Key is not a string');
  }

  if (typeof value !== 'bigint') {
    throw new Error('Value is not a bigint');
  }

  if (value < 0) {
    throw new Error('Value is not a positive bigint');
  }

  if (key === 'xch') {
    throw new Error('XCH is not a valid asset ID');
  }

  if (assetKind === 'chia' || key === '1') {
    return {
      kind: 'xch',
      amount: mojoToChiaLocaleString(value),
    };
  }

  if (assetKind === 'wallet' || isNumericKey(key)) {
    return {
      kind: 'wallet',
      walletId: key,
      walletName: walletInfos[key]?.name,
      amount: mojoToCATLocaleString(value),
    };
  }

  if (assetKind === 'nft') {
    const nftId = hexToNftId(key);

    const result: DisplayWalletDeltaItem = {
      kind: 'nft',
      nftId,
      royaltyPercentage,
    };

    try {
      const nftInfo = await nftGetInfo(key);
      if (nftInfo && nftInfo.success && nftInfo.nft_info && nftInfo.nft_info.data_uris) {
        const previewUrl = nftInfo.nft_info.data_uris.find((u) => isValidURL(u));

        if (previewUrl) {
          result.previewUrl = previewUrl;
        }

        if ('royalty_percentage' in nftInfo.nft_info) {
          result.royaltyPercentage = parseRoyaltyPercentage(nftInfo.nft_info.royalty_percentage);
        }
      }
    } catch {
      // NFT type has already been resolved from offer data; metadata is best effort.
    }

    return result;
  }

  if (assetKind !== 'cat') {
    throw new Error('Asset type is not valid');
  }

  const { name } = await catAssetIdToName(key);

  return {
    kind: 'cat',
    amount: mojoToCATLocaleString(value),
    assetId: key,
    symbol: name,
  };
}

function royaltyPercentagesForSide(lines: DisplayWalletDeltaItem[]): number[] {
  return lines
    .filter((line): line is Extract<DisplayWalletDeltaItem, { kind: 'nft' }> => line.kind === 'nft')
    .map((line) => line.royaltyPercentage)
    .filter(
      (royaltyPercentage): royaltyPercentage is number => royaltyPercentage !== undefined && royaltyPercentage > 0,
    );
}

function formatAmountWithRoyalties(
  line: DisplayWalletDeltaItem,
  amount: bigint,
  royaltyPercentages: number[],
): string | undefined {
  if (royaltyPercentages.length === 0 || line.kind === 'nft') {
    return undefined;
  }

  const splitAmount = amount / BigInt(royaltyPercentages.length);
  const royaltyAmount = royaltyPercentages.reduce(
    (total, royaltyPercentage) => total + (splitAmount * BigInt(royaltyPercentage)) / 10_000n,
    0n,
  );
  const totalAmount = amount + royaltyAmount;

  if (line.kind === 'xch') {
    return mojoToChiaLocaleString(totalAmount);
  }

  return mojoToCATLocaleString(totalAmount);
}

function withRoyaltyTotals(
  items: DisplayWalletDeltaItemWithKey[],
  amounts: Record<string, bigint>,
  oppositeSideLines: DisplayWalletDeltaItem[],
): DisplayWalletDeltaItem[] {
  const royaltyPercentages = royaltyPercentagesForSide(oppositeSideLines);

  return items.map(({ key, line }) => {
    if (line.kind === 'nft') {
      return line;
    }

    const amount = amounts[key];
    const amountWithRoyalties = amount ? formatAmountWithRoyalties(line, amount, royaltyPercentages) : undefined;

    return amountWithRoyalties ? { ...line, amountWithRoyalties } : line;
  });
}

async function walletDeltaToDisplay(
  walletDelta: WalletDelta,
  walletInfos: Record<string, WalletInfo>,
  assetKinds: AssetDisplayKinds,
  royaltyPercentages: AssetRoyaltyPercentages,
  fee?: bigint,
): Promise<DisplayWalletDelta> {
  const { spending, receiving } = walletDelta;
  const spendingItems = await Promise.all(
    Object.entries(spending).map(async ([key, value]) => ({
      key,
      line: await parseWalletDeltaItem(
        key,
        value,
        walletInfos,
        assetKinds.spending[key],
        royaltyPercentages.spending[key],
      ),
    })),
  );
  const receivingItems = await Promise.all(
    Object.entries(receiving).map(async ([key, value]) => ({
      key,
      line: await parseWalletDeltaItem(
        key,
        value,
        walletInfos,
        assetKinds.receiving[key],
        royaltyPercentages.receiving[key],
      ),
    })),
  );
  const spendingLines = spendingItems.map(({ line }) => line);
  const receivingLines = receivingItems.map(({ line }) => line);

  return {
    spending: withRoyaltyTotals(spendingItems, spending, receivingLines),
    receiving: withRoyaltyTotals(receivingItems, receiving, spendingLines),
    fee: fee !== undefined ? mojoToChiaLocaleString(fee) : undefined,
  };
}

export async function parseCommandDisplay(command: string, params: Record<string, unknown>) {
  if (command === 'chia_wallet.take_offer') {
    if (!params.offer || typeof params.offer !== 'string') {
      throw new Error('Offer is not valid');
    }

    const offerSummary = await getOfferSummary(params.offer);
    if (!offerSummary || !offerSummary.summary || !offerSummary.success) {
      throw new Error('Offer is not valid');
    }

    const { summary } = offerSummary;

    const walletDelta = offerSummaryToWalletDelta(summary);
    const walletInfos = await getWalletInfos();
    const assetKinds = offerSummaryAssetKinds(summary);
    const royaltyPercentages = offerSummaryRoyaltyPercentages(summary);
    const fees = parseMojos(summary.fees);

    return {
      walletDelta: await walletDeltaToDisplay(walletDelta, walletInfos, assetKinds, royaltyPercentages, fees),
    };
  }

  if (command === 'chia_wallet.create_offer_for_ids') {
    if (!params.offer || !isPlainObject(params.offer)) {
      throw new Error('Offer is not valid');
    }

    if (params.driver_dict !== undefined && !isPlainObject(params.driver_dict)) {
      throw new Error('Driver Dict is not valid');
    }

    const walletDelta = createOfferToWalletDelta(params.offer);
    const walletInfos = await getWalletInfos();
    const driverDict = params.driver_dict ?? {};
    const assetKinds = createOfferAssetKinds(walletDelta, walletInfos, driverDict);
    const royaltyPercentages = createOfferRoyaltyPercentages(walletDelta, driverDict);

    return {
      walletDelta: await walletDeltaToDisplay(walletDelta, walletInfos, assetKinds, royaltyPercentages, undefined),
    };
  }

  return undefined;
}
