import { useGetLoggedInFingerprintQuery, usePrefs } from '@chia-network/api-react';
import { useCallback } from 'react';

export default function useHiddenWallet(): {
  hide: (walletId: number) => void;
  show: (walletId: number) => void;
  isHidden: (walletId: number) => boolean;
  hidden: number[];
  isLoading: boolean;
} {
  const { data: fingerprint, isLoading } = useGetLoggedInFingerprintQuery();
  const [hiddenWalletIds, setHiddenWalletIds] = usePrefs<{
    [key: string]: number[];
  }>('hiddenWalletsItems', {});

  const hide = useCallback(
    (walletId: number) => {
      if (isLoading) {
        throw new Error('Cannot hide wallet while loading');
      }

      setHiddenWalletIds((items) => {
        const listItems = items[fingerprint] ?? [];

        return {
          ...items,
          [fingerprint]: [...listItems, walletId],
        };
      });
    },
    [setHiddenWalletIds, fingerprint]
  );

  const show = useCallback(
    (walletId: number) => {
      if (isLoading) {
        throw new Error('Cannot hide wallet while loading');
      }

      setHiddenWalletIds((items) => {
        const listItems = items[fingerprint] ?? [];

        return {
          ...items,
          [fingerprint]: listItems.filter((id) => id !== walletId),
        };
      });
    },
    [setHiddenWalletIds, fingerprint]
  );

  const isHidden = useCallback(
    (walletId: number) => {
      if (isLoading) {
        return true;
      }

      const listItems = hiddenWalletIds[fingerprint] ?? [];
      return listItems.includes(walletId);
    },
    [hiddenWalletIds, fingerprint]
  );

  return {
    hidden: hiddenWalletIds,
    hide,
    show,
    isHidden,
    isLoading,
  };
}
