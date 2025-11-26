import { WalletType } from '@chia-network/api';
import { useGetCatListQuery, useGetWalletsQuery } from '@chia-network/api-react';
import type { CATToken, Wallet } from '@chia-network/core';
import { useCurrencyCode } from '@chia-network/core';
import { useMemo, useRef, useCallback } from 'react';

// Normalize asset ID by removing 0x prefix and converting to lowercase
// This is needed because the backend may return asset IDs with or without 0x prefix
function normalizeAssetId(assetId: string): string {
  return assetId.toLowerCase().replace(/^0x/, '');
}

export type AssetIdMapEntry = {
  walletId: number;
  walletType: WalletType;
  isVerified: boolean;
  name: string;
  symbol?: string;
  displayName: string;
  assetId: string;
};

export default function useAssetIdName() {
  const { data: wallets = [], isLoading: isLoadingWallets, error: errorWallets } = useGetWalletsQuery();
  const { data: catList = [], isLoading: isCatListLoading, error: errorCatList } = useGetCatListQuery();
  const currencyCode = useCurrencyCode();

  const isLoading = isLoadingWallets || isCatListLoading;
  const error = errorWallets || errorCatList;

  const memoized = useMemo(() => {
    const assetIdNameMapping = new Map<string, AssetIdMapEntry>();
    const walletIdNameMapping = new Map<number, AssetIdMapEntry>();

    if (isLoading) {
      return { assetIdNameMapping, walletIdNameMapping };
    }

    wallets.forEach((wallet: Wallet) => {
      const walletId: number = wallet.id;
      const walletType: WalletType = wallet.type;
      let assetId: string | undefined;
      let name: string | undefined;
      let symbol: string | undefined;
      let isVerified = false;

      if (walletType === WalletType.STANDARD_WALLET) {
        assetId = 'xch';
        name = 'Chia';
        symbol = currencyCode;
        isVerified = true;
      } else if ([WalletType.CAT, WalletType.RCAT, WalletType.CRCAT].includes(walletType)) {
        const normalizedTail = normalizeAssetId(wallet.meta.assetId);
        const cat = catList.find((catItem: CATToken) => normalizeAssetId(catItem.assetId) === normalizedTail);

        assetId = normalizedTail;
        name = wallet.name;

        if (cat) {
          symbol = cat.symbol;
          isVerified = true;
        }
      }

      if (assetId && name) {
        const displayName = symbol || name;
        const entry: AssetIdMapEntry = {
          walletId,
          walletType,
          name,
          symbol,
          displayName,
          isVerified,
          assetId,
        };
        assetIdNameMapping.set(assetId, entry);
        walletIdNameMapping.set(walletId, entry);
      }
    });

    catList.forEach((cat: CATToken) => {
      const normalizedCatAssetId = normalizeAssetId(cat.assetId);
      if (assetIdNameMapping.has(normalizedCatAssetId)) {
        return;
      }

      const { name } = cat;
      const { symbol } = cat;
      const displayName = symbol || name;
      const entry: AssetIdMapEntry = {
        walletId: 0,
        walletType: WalletType.CAT,
        name,
        symbol,
        displayName,
        isVerified: true,
        assetId: normalizedCatAssetId,
      };
      assetIdNameMapping.set(normalizedCatAssetId, entry);
    });

    // If using testnet, add a TXCH assetId entry
    if (currencyCode === 'TXCH') {
      const assetId = 'txch';
      const name = 'Chia (Testnet)';
      const symbol = 'TXCH';
      const displayName = symbol || name;
      const entry: AssetIdMapEntry = {
        walletId: 1,
        walletType: WalletType.STANDARD_WALLET,
        name,
        symbol,
        displayName,
        isVerified: true,
      };
      assetIdNameMapping.set(assetId, entry);
    }

    return { assetIdNameMapping, walletIdNameMapping };
  }, [isLoading, wallets, catList, currencyCode]);

  const ref = useRef(memoized);
  ref.current = memoized;

  const lookupByAssetId = useCallback(
    (assetId: string) => ref.current.assetIdNameMapping.get(normalizeAssetId(assetId)),
    [ref],
  );

  const lookupByWalletId = useCallback(
    (walletId: number | string) => ref.current.walletIdNameMapping.get(Number(walletId)),
    [ref],
  );

  return { lookupByAssetId, lookupByWalletId, isLoading, error };
}
