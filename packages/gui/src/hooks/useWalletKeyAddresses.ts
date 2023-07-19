import { useGetWalletAddressesQuery } from '@chia-network/api-react';
import { useMemo } from 'react';

export default function useWalletKeyAddresses() {
  const { data: walletAddresses, isLoading: isLoadingWalletAddresses } = useGetWalletAddressesQuery({});

  const addresses = useMemo(() => {
    if (!walletAddresses || isLoadingWalletAddresses) {
      return [];
    }

    return Object.keys(walletAddresses).map((fingerprint) => ({
      fingerprint,
      address: walletAddresses[fingerprint][0].address,
    }));
  }, [walletAddresses, isLoadingWalletAddresses]);

  return { addresses, isLoading: isLoadingWalletAddresses };
}
