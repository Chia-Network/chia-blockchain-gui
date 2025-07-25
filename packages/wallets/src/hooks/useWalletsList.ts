import { WalletType } from '@chia-network/api';
import type { Wallet } from '@chia-network/api';
import {
  useGetWalletsQuery,
  useGetStrayCatsQuery,
  useGetCatListQuery,
  useAddCATTokenMutation,
} from '@chia-network/api-react';
import { useShowError } from '@chia-network/core';
import { orderBy } from 'lodash';
import { useMemo } from 'react';

import useHiddenWallet from './useHiddenWallet';

export type ListItem = {
  id: number | string;
  type: 'WALLET' | 'CAT_LIST' | 'STRAY_CAT';
  walletType: WalletType;
  hidden: boolean;
  name: string;
  walletId?: number; // walletId or assetId
  assetId?: string;
};

function getWalletTypeOrder(item: ListItem) {
  switch (item.walletType) {
    case WalletType.STANDARD_WALLET:
      return 0;
    default:
      return 1;
  }
}

function getTypeOrder(item: ListItem) {
  switch (item.type) {
    case 'WALLET':
      return 0;
    case 'CAT_LIST':
      return 1;
    case 'STRAY_CAT':
      return 2;
    default:
      return 3;
  }
}

export default function useWalletsList(
  search: string,
  walletTypes: WalletType[],
): {
  list?: ListItem[];
  isLoading: boolean;
  hide: (walletId: number) => void;
  show: (id: number | string) => Promise<void>;
} {
  const { data: wallets, isLoading: isLoadingGetWallets } = useGetWalletsQuery(undefined, {
    pollingInterval: 10_000,
  });
  const { data: catList, isLoading: isLoadingGetCatList } = useGetCatListQuery(undefined, {
    pollingInterval: 10_000,
  });

  const { data: strayCats, isLoading: isLoadingGetStrayCats } = useGetStrayCatsQuery(undefined, {
    pollingInterval: 10_000,
  });

  const { isHidden, show, hide, isLoading: isLoadingHiddenWallet } = useHiddenWallet();
  const [addCATToken] = useAddCATTokenMutation();
  const showError = useShowError();

  const isLoading = isLoadingGetWallets || isLoadingGetStrayCats || isLoadingGetCatList || isLoadingHiddenWallet;

  const walletAssetIds = useMemo(() => {
    const ids = new Map<string, number>();
    if (wallets) {
      wallets.forEach((wallet) => {
        if ([WalletType.CAT, WalletType.RCAT, WalletType.CRCAT].includes(wallet.type)) {
          ids.set(wallet.meta?.assetId, wallet.id);
        }
      });
    }
    return ids;
  }, [wallets]);

  const knownCatAssetIds = useMemo(() => {
    const ids = new Set<string>();
    if (catList) {
      catList.forEach((cat) => ids.add(cat.assetId));
    }

    return ids;
  }, [catList]);

  const list = useMemo(() => {
    if (isLoading) {
      return undefined;
    }

    function hasCatAssignedWallet(assetId: string) {
      return walletAssetIds.has(assetId);
    }

    function isHiddenCAT(assetId: string) {
      if (!walletAssetIds.has(assetId)) {
        return true;
      }

      const walletId = walletAssetIds.get(assetId);
      return isHidden(walletId);
    }

    function getCATName(assetId: string) {
      if (walletAssetIds.has(assetId)) {
        const walletId = walletAssetIds.get(assetId);
        const wallet = wallets?.find((walletItem: Wallet) => walletItem.id === walletId);

        return wallet?.meta?.name ?? wallet?.name ?? assetId;
      }

      const catKnown = catList?.find((cat) => cat.assetId === assetId);
      const strayCAT = strayCats?.find((cat) => cat.assetId === assetId);

      return catKnown?.name ?? strayCAT?.name ?? assetId;
    }

    const baseWallets =
      wallets?.filter(
        (wallet: Wallet) => ![WalletType.CAT, WalletType.RCAT, WalletType.POOLING_WALLET].includes(wallet.type),
      ) ?? [];
    const catBaseWallets =
      wallets?.filter((wallet: Wallet) => [WalletType.CAT, WalletType.RCAT, WalletType.CRCAT].includes(wallet.type)) ??
      [];

    // hidden by default because they are not known
    const nonAddedKnownCats = catList?.filter((cat) => !hasCatAssignedWallet(cat.assetId)) ?? [];

    // hidden by default
    const nonAddedStrayCats = strayCats?.filter((strayCat) => !hasCatAssignedWallet(strayCat.assetId)) ?? [];

    let tokens = [
      ...baseWallets.map((wallet: Wallet) => ({
        id: wallet.id,
        type: 'WALLET',
        walletType: wallet.type,
        hidden: isHidden(wallet.id),
        walletId: wallet.id,
        assetId: wallet.meta?.assetId,
        name: wallet.type === WalletType.STANDARD_WALLET ? 'Chia' : (wallet.meta?.name ?? wallet.name),
      })),
      ...catBaseWallets.map((wallet: Wallet) => ({
        id: wallet.id,
        type: knownCatAssetIds.has(wallet.meta?.assetId) ? 'CAT_LIST' : 'STRAY_CAT',
        walletType: wallet.type,
        hidden: isHidden(wallet.id),
        walletId: wallet.id,
        assetId: wallet.meta?.assetId,
        name: wallet.meta?.name ?? wallet.name,
      })),
      ...nonAddedKnownCats.map((cat) => ({
        id: cat.assetId,
        type: 'CAT_LIST',
        walletType: WalletType.CAT,
        hidden: isHiddenCAT(cat.assetId),
        walletId: walletAssetIds.has(cat.assetId) ? walletAssetIds.get(cat.assetId) : undefined,
        assetId: cat.assetId,
        name: getCATName(cat.assetId),
      })),
      ...nonAddedStrayCats.map((strayCat) => ({
        id: strayCat.assetId,
        type: 'STRAY_CAT',
        walletType: WalletType.CAT,
        hidden: isHiddenCAT(strayCat.assetId),
        walletId: walletAssetIds.has(strayCat.assetId) ? walletAssetIds.get(strayCat.assetId) : undefined,
        assetId: strayCat.assetId,
        name: getCATName(strayCat.assetId),
      })),
    ];

    // Filter by requested wallet types
    tokens = tokens.filter((token) => walletTypes.includes(token.walletType as WalletType));

    if (search) {
      tokens = tokens.filter((token) => token.name.toLowerCase().includes(search.toLowerCase()));
    }

    return orderBy(tokens, [getWalletTypeOrder, getTypeOrder, 'name'], ['asc', 'asc', 'asc']);
  }, [isLoading, wallets, catList, strayCats, search, isHidden, knownCatAssetIds, walletAssetIds, walletTypes]);

  async function handleShow(id: number | string) {
    try {
      if (typeof id === 'number') {
        show(id);
        return id;
      }

      if (typeof id === 'string') {
        // assign wallet for CAT

        const cat = catList?.find((catItem) => catItem.assetId === id);
        if (cat) {
          return await addCATToken({
            name: cat.name,
            assetId: cat.assetId,
          }).unwrap();
        }

        // assign stray cat
        const strayCat = strayCats?.find((catItem) => catItem.assetId === id);
        if (strayCat) {
          return await addCATToken({
            name: strayCat.name,
            assetId: strayCat.assetId,
          }).unwrap();
        }
      }
      return undefined;
    } catch (error) {
      showError(error);
      return undefined;
    }
  }

  function handleHide(id: number) {
    if (id === null || id === undefined) {
      return;
    }

    if (typeof id === 'number') {
      hide(id);
    }
  }

  return {
    list,
    hide: handleHide,
    show: handleShow,
    isLoading,
  };
}
